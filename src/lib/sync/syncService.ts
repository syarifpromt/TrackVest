/**
 * TrackVest Cross-Platform Synchronization Service
 * Handles two-way sync between local IndexedDB and Supabase PostgreSQL.
 * Supports offline mutations, persistent retry queue, conflict resolution, and user isolation.
 */

import { getSupabaseClient } from '../supabase/client';
import {
  dbGetAssets,
  dbPutAssetsBatch,
  dbGetInvestments,
  dbPutInvestmentsBatch,
  dbGetSnapshots,
  dbPutSnapshotsBatch,
  dbGetValuations,
  dbPutValuationsBatch,
  dbGetSyncQueue,
  dbRemoveSyncQueueItem,
  dbUpdateSyncQueueItem,
  dbGetUserSettings,
  dbPutUserSettings,
  DBAsset,
  DBInvestment,
  DBSnapshot,
  DBValuation,
  DBSyncQueueItem,
} from '../db/indexedDb';
import {
  assetToDbRow,
  dbRowToAsset,
  investmentToDbRow,
  dbRowToInvestment,
  snapshotToDbRow,
  dbRowToSnapshot,
  valuationToDbRow,
  dbRowToValuation,
} from './mappers';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'success';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage: string | null;
}

type SyncListener = (state: SyncState) => void;

class SyncService {
  private activeUserId: string | null = null;
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private state: SyncState = {
    status: 'idle',
    lastSyncedAt: null,
    pendingCount: 0,
    errorMessage: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateState({ status: 'idle', errorMessage: null });
        if (this.activeUserId) {
          this.triggerSync();
        }
      });

      window.addEventListener('offline', () => {
        this.updateState({ status: 'offline' });
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<SyncState>) {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public getState(): SyncState {
    return this.state;
  }

  public setActiveUser(userId: string | null) {
    if (this.activeUserId === userId) return;
    this.activeUserId = userId;

    if (!userId) {
      this.updateState({
        status: 'idle',
        lastSyncedAt: null,
        pendingCount: 0,
        errorMessage: null,
      });
      return;
    }

    // Refresh pending count for the active user
    this.refreshPendingCount();
    // Trigger initial sync
    this.triggerSync();
  }

  public async refreshPendingCount() {
    if (!this.activeUserId) return;
    try {
      const queue = await dbGetSyncQueue(this.activeUserId);
      this.updateState({ pendingCount: queue.length });
    } catch {
      // ignore
    }
  }

  public async triggerSync(): Promise<boolean> {
    if (this.isSyncing) return false;
    if (!this.activeUserId) return false;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState({ status: 'offline' });
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      this.updateState({ status: 'idle' });
      return false;
    }

    // Check active session before making cloud requests
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== this.activeUserId) {
      return false;
    }

    this.isSyncing = true;
    this.updateState({ status: 'syncing', errorMessage: null });

    try {
      // 1. Push local changes from sync queue to Supabase
      await this.pushSyncQueue(session.user.id);

      // 2. Pull remote changes from Supabase to IndexedDB
      await this.pullRemoteChanges(session.user.id);

      // 3. Update user sync timestamp
      const nowIso = new Date().toISOString();
      const userSettings = (await dbGetUserSettings(session.user.id)) || { userId: session.user.id };
      await dbPutUserSettings({
        ...userSettings,
        lastSyncedAt: nowIso,
      });

      const queue = await dbGetSyncQueue(session.user.id);
      this.updateState({
        status: 'success',
        lastSyncedAt: nowIso,
        pendingCount: queue.length,
        errorMessage: null,
      });

      return true;
    } catch (err: any) {
      console.error('[SyncService] Sync error:', err);
      const queue = await dbGetSyncQueue(this.activeUserId);
      this.updateState({
        status: 'error',
        pendingCount: queue.length,
        errorMessage: err?.message || 'Gagal menyinkronkan data dengan cloud.',
      });
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push pending mutations from sync_queue to Supabase
   */
  private async pushSyncQueue(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const queue = await dbGetSyncQueue(userId);
    if (queue.length === 0) return;

    for (const item of queue) {
      if (!item.id) continue;
      try {
        let error: any = null;

        if (item.table === 'assets') {
          const row = assetToDbRow(item.payload);
          const res = await supabase.from('assets').upsert(row, { onConflict: 'user_id,id' });
          error = res.error;
        } else if (item.table === 'investments') {
          const row = investmentToDbRow(item.payload);
          const res = await supabase.from('investments').upsert(row, { onConflict: 'user_id,id' });
          error = res.error;
        } else if (item.table === 'snapshots') {
          const row = snapshotToDbRow(item.payload);
          const res = await supabase.from('snapshots').upsert(row, { onConflict: 'user_id,id' });
          error = res.error;
        } else if (item.table === 'latest_valuations') {
          if (item.action === 'delete') {
            const res = await supabase
              .from('latest_valuations')
              .delete()
              .eq('user_id', userId)
              .eq('asset_id', item.payload.assetId);
            error = res.error;
          } else {
            const row = valuationToDbRow(item.payload);
            const res = await supabase
              .from('latest_valuations')
              .upsert(row, { onConflict: 'user_id,asset_id' });
            error = res.error;
          }
        } else if (item.table === 'profiles') {
          const res = await supabase.from('profiles').upsert(
            {
              id: userId,
              full_name: item.payload.fullName,
              last_valuation_time: item.payload.lastValuationTime || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
          error = res.error;
        }

        if (error) {
          console.warn('[SyncService] Failed to push item:', item.id, error);
          await dbUpdateSyncQueueItem({
            ...item,
            attempts: (item.attempts || 0) + 1,
            lastError: error.message,
          });
        } else {
          // Success: Remove confirmed item from local queue
          await dbRemoveSyncQueueItem(item.id);
        }
      } catch (err: any) {
        await dbUpdateSyncQueueItem({
          ...item,
          attempts: (item.attempts || 0) + 1,
          lastError: err?.message,
        });
      }
    }
  }

  /**
   * Pull remote changes from Supabase into IndexedDB
   */
  private async pullRemoteChanges(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // 1. Fetch Remote Profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileData) {
      const userSettings = (await dbGetUserSettings(userId)) || { userId };
      await dbPutUserSettings({
        ...userSettings,
        fullName: profileData.full_name || userSettings.fullName,
        lastValuationTime: profileData.last_valuation_time || userSettings.lastValuationTime,
      });
    }

    // 2. Fetch Remote Assets
    const { data: remoteAssets, error: assetErr } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId);

    if (!assetErr && remoteAssets) {
      const mappedAssets: DBAsset[] = remoteAssets.map(dbRowToAsset);
      await dbPutAssetsBatch(mappedAssets);
    }

    // 3. Fetch Remote Investments
    const { data: remoteInvestments, error: invErr } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId);

    if (!invErr && remoteInvestments) {
      const mappedInv: DBInvestment[] = remoteInvestments.map(dbRowToInvestment);
      await dbPutInvestmentsBatch(mappedInv);
    }

    // 4. Fetch Remote Snapshots
    const { data: remoteSnapshots, error: snapErr } = await supabase
      .from('snapshots')
      .select('*')
      .eq('user_id', userId);

    if (!snapErr && remoteSnapshots) {
      const mappedSnap: DBSnapshot[] = remoteSnapshots.map(dbRowToSnapshot);
      await dbPutSnapshotsBatch(mappedSnap);
    }

    // 5. Fetch Remote Valuations
    const { data: remoteValuations, error: valErr } = await supabase
      .from('latest_valuations')
      .select('*')
      .eq('user_id', userId);

    if (!valErr && remoteValuations) {
      const mappedVal: DBValuation[] = remoteValuations.map(dbRowToValuation);
      await dbPutValuationsBatch(mappedVal);
    }
  }
}

export const syncService = new SyncService();

