/**
 * Unified TrackVest Data Repository
 * Acts as the single source of truth for all UI components.
 * Integrates IndexedDB local-first storage, sync queueing, fallback localStorage hydration,
 * and automatic cloud migration verification.
 */

import { Asset, Investment, Snapshot } from '../../types';
import {
  dbGetAssets,
  dbPutAsset,
  dbPutAssetsBatch,
  dbGetInvestments,
  dbPutInvestment,
  dbPutInvestmentsBatch,
  dbGetSnapshots,
  dbPutSnapshot,
  dbPutSnapshotsBatch,
  dbGetValuations,
  dbPutValuation,
  dbPutValuationsBatch,
  dbDeleteValuation,
  dbEnqueueSync,
  dbGetUserSettings,
  dbPutUserSettings,
  DBAsset,
  DBInvestment,
  DBSnapshot,
  DBValuation,
} from '../db/indexedDb';
import { syncService } from '../sync/syncService';
import { getSupabaseClient } from '../supabase/client';
import {
  getStoredAssets,
  getStoredInvestments,
  getStoredSnapshots,
  getStoredValuations,
  getStoredLastValuationTime,
  getStoredUserName,
  saveStoredAssets,
  saveStoredInvestments,
  saveStoredSnapshots,
  saveStoredValuations,
  saveStoredLastValuationTime,
  saveStoredUserName,
} from '../storage';

export interface RepositoryData {
  assets: Asset[];
  investments: Investment[];
  snapshots: Snapshot[];
  valuations: Record<string, number>;
  lastValuationTime: string | null;
  userName: string;
}

type RepositoryListener = () => void;

export class DataRepository {
  private currentUserId: string = 'local';
  private listeners: Set<RepositoryListener> = new Set();

  constructor() {
    // Whenever syncService pulls new cloud data, notify all repository listeners
    syncService.subscribeDataChange(() => {
      this.notifyListeners();
    });
  }

  public subscribe(listener: RepositoryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('[DataRepository] Listener error:', err);
      }
    }
  }

  public setUserId(userId: string | null) {
    const cleanId = userId || 'local';
    if (this.currentUserId === cleanId) return;
    this.currentUserId = cleanId;
    syncService.setActiveUser(cleanId);
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  /**
   * Load complete portfolio dataset for active user
   */
  public async loadAllData(): Promise<RepositoryData> {
    if (typeof window === 'undefined') {
      return {
        assets: [],
        investments: [],
        snapshots: [],
        valuations: {},
        lastValuationTime: null,
        userName: 'Syarif Hidayatullah',
      };
    }

    try {
      // 1. Read from IndexedDB for the current user
      const dbAssets = await dbGetAssets(this.currentUserId);
      const dbInvestments = await dbGetInvestments(this.currentUserId);
      const dbSnapshots = await dbGetSnapshots(this.currentUserId);
      const dbValuations = await dbGetValuations(this.currentUserId);
      const userSettings = await dbGetUserSettings(this.currentUserId);

      // If user is guest/local or active user has no data in IndexedDB yet
      if (dbAssets.length === 0 && dbInvestments.length === 0) {
        // Check if there is data in localStorage or 'local' IndexedDB
        const localAssets = getStoredAssets();
        const localInvestments = getStoredInvestments();
        const localSnapshots = getStoredSnapshots();
        const localValuations = getStoredValuations();
        const localLastVal = getStoredLastValuationTime();
        const localUser = getStoredUserName();

        const hasLocalData = localAssets.length > 0 || localInvestments.length > 0;

        if (hasLocalData) {
          // If logged in as real user, migrate this local data immediately
          if (this.currentUserId !== 'local') {
            this.migrateLegacyDataToUser(this.currentUserId).catch(console.error);
          } else {
            // Seed to 'local' store in IndexedDB
            const toSeedAssets: DBAsset[] = localAssets.map((a) => ({
              ...a,
              userId: 'local',
              updatedAt: a.createdAt || new Date().toISOString(),
            }));
            await dbPutAssetsBatch(toSeedAssets);

            const toSeedInv: DBInvestment[] = localInvestments.map((i) => ({
              ...i,
              userId: 'local',
              updatedAt: i.createdAt || new Date().toISOString(),
            }));
            await dbPutInvestmentsBatch(toSeedInv);

            const toSeedSnap: DBSnapshot[] = localSnapshots.map((s) => ({
              ...s,
              userId: 'local',
              updatedAt: s.createdAt || new Date().toISOString(),
            }));
            await dbPutSnapshotsBatch(toSeedSnap);
          }

          // Return the non-empty local data to prevent showing Rp0 on the screen
          return {
            assets: localAssets,
            investments: localInvestments,
            snapshots: localSnapshots,
            valuations: localValuations,
            lastValuationTime: localLastVal,
            userName: localUser,
          };
        }
      }

      // If we have data in IndexedDB, clean it and mirror safely to localStorage
      const cleanAssets = dbAssets.map(({ userId, updatedAt, deletedAt, ...rest }) => rest);
      const cleanInvestments = dbInvestments.map(({ userId, updatedAt, deletedAt, ...rest }) => rest);
      const cleanSnapshots = dbSnapshots.map(({ userId, updatedAt, deletedAt, ...rest }) => rest);

      if (cleanAssets.length > 0 || cleanInvestments.length > 0) {
        saveStoredAssets(cleanAssets);
        saveStoredInvestments(cleanInvestments);
        saveStoredSnapshots(cleanSnapshots);
        saveStoredValuations(dbValuations);
      }

      if (userSettings?.lastValuationTime) {
        saveStoredLastValuationTime(userSettings.lastValuationTime);
      }
      if (userSettings?.fullName) {
        saveStoredUserName(userSettings.fullName);
      }

      return {
        assets: cleanAssets,
        investments: cleanInvestments,
        snapshots: cleanSnapshots,
        valuations: dbValuations,
        lastValuationTime: userSettings?.lastValuationTime || getStoredLastValuationTime(),
        userName: userSettings?.fullName || getStoredUserName(),
      };
    } catch (err) {
      console.warn('[DataRepository] Fallback to localStorage due to error:', err);
      return {
        assets: getStoredAssets(),
        investments: getStoredInvestments(),
        snapshots: getStoredSnapshots(),
        valuations: getStoredValuations(),
        lastValuationTime: getStoredLastValuationTime(),
        userName: getStoredUserName(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Assets
  // ---------------------------------------------------------------------------

  public async addAsset(assetData: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset> {
    const nowIso = new Date().toISOString();
    const newAsset: DBAsset = {
      ...assetData,
      id: `asset-${Date.now()}`,
      userId: this.currentUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await dbPutAsset(newAsset);

    if (this.currentUserId !== 'local') {
      await dbEnqueueSync({
        userId: this.currentUserId,
        table: 'assets',
        action: 'upsert',
        payload: newAsset,
        timestamp: nowIso,
        attempts: 0,
      });
      syncService.refreshPendingCount();
      syncService.triggerSync();
    }

    const current = getStoredAssets();
    const { userId, updatedAt, deletedAt, ...clean } = newAsset;
    saveStoredAssets([...current, clean]);
    this.notifyListeners();

    return clean;
  }

  public async updateAsset(asset: Asset): Promise<void> {
    const nowIso = new Date().toISOString();
    const dbAsset: DBAsset = {
      ...asset,
      userId: this.currentUserId,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await dbPutAsset(dbAsset);

    if (this.currentUserId !== 'local') {
      await dbEnqueueSync({
        userId: this.currentUserId,
        table: 'assets',
        action: 'upsert',
        payload: dbAsset,
        timestamp: nowIso,
        attempts: 0,
      });
      syncService.refreshPendingCount();
      syncService.triggerSync();
    }

    const current = getStoredAssets().map((a) => (a.id === asset.id ? asset : a));
    saveStoredAssets(current);
    this.notifyListeners();
  }

  public async deleteAsset(assetId: string): Promise<void> {
    const nowIso = new Date().toISOString();
    const assets = await dbGetAssets(this.currentUserId, true);
    const target = assets.find((a) => a.id === assetId);

    if (target) {
      const softDeleted: DBAsset = {
        ...target,
        updatedAt: nowIso,
        deletedAt: nowIso,
      };
      await dbPutAsset(softDeleted);

      if (this.currentUserId !== 'local') {
        await dbEnqueueSync({
          userId: this.currentUserId,
          table: 'assets',
          action: 'upsert',
          payload: softDeleted,
          timestamp: nowIso,
          attempts: 0,
        });
      }
    }

    // Also soft-delete associated investments
    const investments = await dbGetInvestments(this.currentUserId, true);
    for (const inv of investments) {
      if (inv.assetId === assetId) {
        const softDeletedInv: DBInvestment = {
          ...inv,
          updatedAt: nowIso,
          deletedAt: nowIso,
        };
        await dbPutInvestment(softDeletedInv);

        if (this.currentUserId !== 'local') {
          await dbEnqueueSync({
            userId: this.currentUserId,
            table: 'investments',
            action: 'upsert',
            payload: softDeletedInv,
            timestamp: nowIso,
            attempts: 0,
          });
        }
      }
    }

    // Remove valuation
    await dbDeleteValuation(this.currentUserId, assetId);
    if (this.currentUserId !== 'local') {
      await dbEnqueueSync({
        userId: this.currentUserId,
        table: 'latest_valuations',
        action: 'delete',
        payload: { assetId },
        timestamp: nowIso,
        attempts: 0,
      });
    }

    if (this.currentUserId !== 'local') {
      syncService.refreshPendingCount();
      syncService.triggerSync();
    }

    saveStoredAssets(getStoredAssets().filter((a) => a.id !== assetId));
    saveStoredInvestments(getStoredInvestments().filter((inv) => inv.assetId !== assetId));
    const vals = { ...getStoredValuations() };
    delete vals[assetId];
    saveStoredValuations(vals);
    this.notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Investments
  // ---------------------------------------------------------------------------

  public async addInvestment(data: {
    assetId: string;
    date: string;
    amount: number;
    note?: string;
  }): Promise<Investment> {
    const nowIso = new Date().toISOString();
    const newInv: DBInvestment = {
      id: `inv-${Date.now()}`,
      userId: this.currentUserId,
      assetId: data.assetId,
      date: data.date,
      amount: data.amount,
      note: data.note,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await dbPutInvestment(newInv);

    if (this.currentUserId !== 'local') {
      await dbEnqueueSync({
        userId: this.currentUserId,
        table: 'investments',
        action: 'upsert',
        payload: newInv,
        timestamp: nowIso,
        attempts: 0,
      });
      syncService.refreshPendingCount();
      syncService.triggerSync();
    }

    const current = getStoredInvestments();
    const { userId, updatedAt, deletedAt, ...clean } = newInv;
    saveStoredInvestments([clean, ...current]);
    this.notifyListeners();

    return clean;
  }

  public async deleteInvestment(id: string): Promise<void> {
    const nowIso = new Date().toISOString();
    const investments = await dbGetInvestments(this.currentUserId, true);
    const target = investments.find((i) => i.id === id);

    if (target) {
      const softDeleted: DBInvestment = {
        ...target,
        updatedAt: nowIso,
        deletedAt: nowIso,
      };
      await dbPutInvestment(softDeleted);

      if (this.currentUserId !== 'local') {
        await dbEnqueueSync({
          userId: this.currentUserId,
          table: 'investments',
          action: 'upsert',
          payload: softDeleted,
          timestamp: nowIso,
          attempts: 0,
        });
        syncService.refreshPendingCount();
        syncService.triggerSync();
      }
    }

    saveStoredInvestments(getStoredInvestments().filter((i) => i.id !== id));
    this.notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Snapshots & Valuations
  // ---------------------------------------------------------------------------

  public async saveSnapshotAndValuations(
    snapshot: Snapshot,
    newValuations: Record<string, number>,
    lastValuationTimeIso: string
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    // 1. Save Snapshot
    const dbSnap: DBSnapshot = {
      ...snapshot,
      userId: this.currentUserId,
      updatedAt: nowIso,
      deletedAt: null,
    };
    await dbPutSnapshot(dbSnap);

    if (this.currentUserId !== 'local') {
      await dbEnqueueSync({
        userId: this.currentUserId,
        table: 'snapshots',
        action: 'upsert',
        payload: dbSnap,
        timestamp: nowIso,
        attempts: 0,
      });
    }

    // 2. Save Valuations
    for (const [assetId, val] of Object.entries(newValuations)) {
      const dbVal: DBValuation = {
        userId: this.currentUserId,
        assetId,
        currentValue: val,
        updatedAt: nowIso,
      };
      await dbPutValuation(dbVal);

      if (this.currentUserId !== 'local') {
        await dbEnqueueSync({
          userId: this.currentUserId,
          table: 'latest_valuations',
          action: 'upsert',
          payload: dbVal,
          timestamp: nowIso,
          attempts: 0,
        });
      }
    }

    // 3. Save User Settings (lastValuationTime)
    const settings = (await dbGetUserSettings(this.currentUserId)) || { userId: this.currentUserId };
    await dbPutUserSettings({
      ...settings,
      lastValuationTime: lastValuationTimeIso,
    });

    if (this.currentUserId !== 'local') {
      await dbEnqueueSync({
        userId: this.currentUserId,
        table: 'profiles',
        action: 'upsert',
        payload: {
          fullName: settings.fullName,
          lastValuationTime: lastValuationTimeIso,
        },
        timestamp: nowIso,
        attempts: 0,
      });
      syncService.refreshPendingCount();
      syncService.triggerSync();
    }

    // Update localStorage cache
    const existingSnaps = getStoredSnapshots();
    const idx = existingSnaps.findIndex((s) => s.date === snapshot.date);
    if (idx >= 0) {
      existingSnaps[idx] = snapshot;
      saveStoredSnapshots([...existingSnaps]);
    } else {
      saveStoredSnapshots([snapshot, ...existingSnaps]);
    }

    const currentVals = { ...getStoredValuations(), ...newValuations };
    saveStoredValuations(currentVals);
    saveStoredLastValuationTime(lastValuationTimeIso);
    this.notifyListeners();
  }

  public async deleteSnapshot(id: string): Promise<void> {
    const nowIso = new Date().toISOString();
    const snapshots = await dbGetSnapshots(this.currentUserId, true);
    const target = snapshots.find((s) => s.id === id);

    if (target) {
      const softDeleted: DBSnapshot = {
        ...target,
        updatedAt: nowIso,
        deletedAt: nowIso,
      };
      await dbPutSnapshot(softDeleted);

      if (this.currentUserId !== 'local') {
        await dbEnqueueSync({
          userId: this.currentUserId,
          table: 'snapshots',
          action: 'upsert',
          payload: softDeleted,
          timestamp: nowIso,
          attempts: 0,
        });
        syncService.refreshPendingCount();
        syncService.triggerSync();
      }
    }

    saveStoredSnapshots(getStoredSnapshots().filter((s) => s.id !== id));
    this.notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------

  public async updateUserName(name: string): Promise<void> {
    const clean = name.trim() || 'TrackVest User';
    const nowIso = new Date().toISOString();

    const settings = (await dbGetUserSettings(this.currentUserId)) || { userId: this.currentUserId };
    await dbPutUserSettings({
      ...settings,
      fullName: clean,
    });

    if (this.currentUserId !== 'local') {
      await dbEnqueueSync({
        userId: this.currentUserId,
        table: 'profiles',
        action: 'upsert',
        payload: {
          fullName: clean,
          lastValuationTime: settings.lastValuationTime || null,
        },
        timestamp: nowIso,
        attempts: 0,
      });
      syncService.refreshPendingCount();
      syncService.triggerSync();
    }

    saveStoredUserName(clean);
    this.notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Safe Migration & Cloud Verification
  // ---------------------------------------------------------------------------

  public async migrateLegacyDataToUser(userId: string): Promise<number> {
    if (typeof window === 'undefined' || !userId || userId === 'local') return 0;

    // 1. Gather all potential local data sources
    const localAssets = getStoredAssets();
    const localInvestments = getStoredInvestments();
    const localSnapshots = getStoredSnapshots();
    const localValuations = getStoredValuations();
    const localLastVal = getStoredLastValuationTime();
    const localUserName = getStoredUserName();

    // Also check 'local' store in IndexedDB
    const indexedDbLocalAssets = await dbGetAssets('local');
    const indexedDbLocalInvestments = await dbGetInvestments('local');
    const indexedDbLocalSnapshots = await dbGetSnapshots('local');
    const indexedDbLocalValuations = await dbGetValuations('local');

    // Combine / prefer whichever has data
    const assetsToMigrate = localAssets.length > 0 ? localAssets : indexedDbLocalAssets;
    const investmentsToMigrate = localInvestments.length > 0 ? localInvestments : indexedDbLocalInvestments;
    const snapshotsToMigrate = localSnapshots.length > 0 ? localSnapshots : indexedDbLocalSnapshots;
    const valuationsToMigrate = Object.keys(localValuations).length > 0 ? localValuations : indexedDbLocalValuations;

    const totalItems = assetsToMigrate.length + investmentsToMigrate.length + snapshotsToMigrate.length;
    if (totalItems === 0) {
      return 0;
    }

    // 2. Create emergency safety backup before migration
    try {
      const backupPayload = {
        exportedAt: new Date().toISOString(),
        userId,
        assets: assetsToMigrate,
        investments: investmentsToMigrate,
        snapshots: snapshotsToMigrate,
        valuations: valuationsToMigrate,
        lastValuationTime: localLastVal,
        userName: localUserName,
      };
      localStorage.setItem('trackvest_backup_before_migration', JSON.stringify(backupPayload));
    } catch {
      // ignore
    }

    const nowIso = new Date().toISOString();

    // 3. Migrate Assets to user's IndexedDB and enqueue
    for (const a of assetsToMigrate) {
      const dbA: DBAsset = {
        ...a,
        userId,
        updatedAt: a.createdAt || nowIso,
        deletedAt: null,
      };
      await dbPutAsset(dbA);
      await dbEnqueueSync({
        userId,
        table: 'assets',
        action: 'upsert',
        payload: dbA,
        timestamp: nowIso,
        attempts: 0,
      });
    }

    // 4. Migrate Investments to user's IndexedDB and enqueue
    for (const inv of investmentsToMigrate) {
      const dbInv: DBInvestment = {
        ...inv,
        userId,
        updatedAt: inv.createdAt || nowIso,
        deletedAt: null,
      };
      await dbPutInvestment(dbInv);
      await dbEnqueueSync({
        userId,
        table: 'investments',
        action: 'upsert',
        payload: dbInv,
        timestamp: nowIso,
        attempts: 0,
      });
    }

    // 5. Migrate Snapshots to user's IndexedDB and enqueue
    for (const snap of snapshotsToMigrate) {
      const dbSnap: DBSnapshot = {
        ...snap,
        userId,
        updatedAt: snap.createdAt || nowIso,
        deletedAt: null,
      };
      await dbPutSnapshot(dbSnap);
      await dbEnqueueSync({
        userId,
        table: 'snapshots',
        action: 'upsert',
        payload: dbSnap,
        timestamp: nowIso,
        attempts: 0,
      });
    }

    // 6. Migrate Valuations
    for (const [assetId, val] of Object.entries(valuationsToMigrate)) {
      const dbVal: DBValuation = {
        userId,
        assetId,
        currentValue: val,
        updatedAt: nowIso,
      };
      await dbPutValuation(dbVal);
      await dbEnqueueSync({
        userId,
        table: 'latest_valuations',
        action: 'upsert',
        payload: dbVal,
        timestamp: nowIso,
        attempts: 0,
      });
    }

    // 7. Update User Settings
    const userSettings = (await dbGetUserSettings(userId)) || { userId };
    await dbPutUserSettings({
      ...userSettings,
      fullName: localUserName,
      lastValuationTime: localLastVal,
      migratedFromLocalStorage: true,
    });

    await dbEnqueueSync({
      userId,
      table: 'profiles',
      action: 'upsert',
      payload: {
        fullName: localUserName,
        lastValuationTime: localLastVal,
      },
      timestamp: nowIso,
      attempts: 0,
    });

    // Notify listeners so UI shows the migrated data immediately
    this.notifyListeners();

    // Trigger sync
    await syncService.refreshPendingCount();
    syncService.triggerSync();

    return totalItems;
  }

  /**
   * Verify whether the cloud database has this user's records.
   * If cloud is empty but local has data, re-enqueues local data to ensure it reaches Supabase.
   */
  public async ensureUserCloudSync(userId: string): Promise<void> {
    if (typeof window === 'undefined' || !userId || userId === 'local') return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // Check count of user assets in Supabase
      const { count, error } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.warn('[DataRepository] Cloud count check failed:', error);
        return;
      }

      // If Supabase has 0 assets, but this device has local assets, re-upload!
      if (count === 0 || count === null) {
        const userAssets = await dbGetAssets(userId);
        const userInvestments = await dbGetInvestments(userId);
        const userSnapshots = await dbGetSnapshots(userId);
        const userValuations = await dbGetValuations(userId);

        if (userAssets.length > 0 || userInvestments.length > 0) {
          console.log('[DataRepository] Cloud is empty but local has data. Re-uploading to Supabase...');
          const nowIso = new Date().toISOString();

          for (const a of userAssets) {
            await dbEnqueueSync({
              userId,
              table: 'assets',
              action: 'upsert',
              payload: a,
              timestamp: nowIso,
              attempts: 0,
            });
          }

          for (const inv of userInvestments) {
            await dbEnqueueSync({
              userId,
              table: 'investments',
              action: 'upsert',
              payload: inv,
              timestamp: nowIso,
              attempts: 0,
            });
          }

          for (const snap of userSnapshots) {
            await dbEnqueueSync({
              userId,
              table: 'snapshots',
              action: 'upsert',
              payload: snap,
              timestamp: nowIso,
              attempts: 0,
            });
          }

          for (const [assetId, val] of Object.entries(userValuations)) {
            await dbEnqueueSync({
              userId,
              table: 'latest_valuations',
              action: 'upsert',
              payload: { userId, assetId, currentValue: val, updatedAt: nowIso },
              timestamp: nowIso,
              attempts: 0,
            });
          }

          await syncService.refreshPendingCount();
          syncService.triggerSync();
        }
      }
    } catch (err) {
      console.warn('[DataRepository] ensureUserCloudSync error:', err);
    }
  }
}

export const dataRepository = new DataRepository();
