/**
 * TrackVest IndexedDB Offline Storage Layer
 * Native, zero-dependency, local-first persistent storage.
 * Supports multi-user isolation, offline CRUD, and persistent sync queue.
 */

import { Asset, Investment, Snapshot } from '../../types';

export interface DBAsset extends Asset {
  userId: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface DBInvestment extends Investment {
  userId: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface DBSnapshot extends Snapshot {
  userId: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface DBValuation {
  userId: string;
  assetId: string;
  currentValue: number;
  updatedAt: string;
}

export interface DBSyncQueueItem {
  id?: number;
  userId: string;
  table: 'profiles' | 'assets' | 'investments' | 'snapshots' | 'latest_valuations';
  action: 'insert' | 'update' | 'upsert' | 'delete';
  payload: any;
  timestamp: string;
  attempts: number;
  lastError?: string;
}

export interface DBUserSettings {
  userId: string;
  fullName?: string;
  lastValuationTime?: string | null;
  lastSyncedAt?: string | null;
  migratedFromLocalStorage?: boolean;
}

const DB_NAME = 'trackvest_local_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function openLocalDatabase(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error('IndexedDB is not available in non-browser environment.'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Assets Store
      if (!db.objectStoreNames.contains('assets')) {
        const store = db.createObjectStore('assets', { keyPath: ['userId', 'id'] });
        store.createIndex('by_user', 'userId', { unique: false });
        store.createIndex('by_user_updated', ['userId', 'updatedAt'], { unique: false });
      }

      // 2. Investments Store
      if (!db.objectStoreNames.contains('investments')) {
        const store = db.createObjectStore('investments', { keyPath: ['userId', 'id'] });
        store.createIndex('by_user', 'userId', { unique: false });
        store.createIndex('by_user_asset', ['userId', 'assetId'], { unique: false });
        store.createIndex('by_user_date', ['userId', 'date'], { unique: false });
      }

      // 3. Snapshots Store
      if (!db.objectStoreNames.contains('snapshots')) {
        const store = db.createObjectStore('snapshots', { keyPath: ['userId', 'id'] });
        store.createIndex('by_user', 'userId', { unique: false });
        store.createIndex('by_user_date', ['userId', 'date'], { unique: false });
      }

      // 4. Valuations Store
      if (!db.objectStoreNames.contains('valuations')) {
        const store = db.createObjectStore('valuations', { keyPath: ['userId', 'assetId'] });
        store.createIndex('by_user', 'userId', { unique: false });
      }

      // 5. Sync Queue Store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_user', 'userId', { unique: false });
        store.createIndex('by_user_timestamp', ['userId', 'timestamp'], { unique: false });
      }

      // 6. User Settings Store
      if (!db.objectStoreNames.contains('user_settings')) {
        db.createObjectStore('user_settings', { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// -----------------------------------------------------------------------------
// Generic Helpers
// -----------------------------------------------------------------------------

function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openLocalDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = operation(store);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getAllFromIndex<T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  return openLocalDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(query);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  });
}

// -----------------------------------------------------------------------------
// Assets Operations
// -----------------------------------------------------------------------------

export async function dbGetAssets(userId: string, includeDeleted = false): Promise<DBAsset[]> {
  const all = await getAllFromIndex<DBAsset>('assets', 'by_user', userId);
  return includeDeleted ? all : all.filter((a) => !a.deletedAt);
}

export async function dbPutAsset(asset: DBAsset): Promise<void> {
  await runTx('assets', 'readwrite', (store) => store.put(asset));
}

export async function dbPutAssetsBatch(assets: DBAsset[]): Promise<void> {
  if (assets.length === 0) return;
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('assets', 'readwrite');
    const store = tx.objectStore('assets');
    for (const a of assets) {
      store.put(a);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -----------------------------------------------------------------------------
// Investments Operations
// -----------------------------------------------------------------------------

export async function dbGetInvestments(userId: string, includeDeleted = false): Promise<DBInvestment[]> {
  const all = await getAllFromIndex<DBInvestment>('investments', 'by_user', userId);
  return includeDeleted ? all : all.filter((i) => !i.deletedAt);
}

export async function dbPutInvestment(inv: DBInvestment): Promise<void> {
  await runTx('investments', 'readwrite', (store) => store.put(inv));
}

export async function dbPutInvestmentsBatch(investments: DBInvestment[]): Promise<void> {
  if (investments.length === 0) return;
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('investments', 'readwrite');
    const store = tx.objectStore('investments');
    for (const inv of investments) {
      store.put(inv);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -----------------------------------------------------------------------------
// Snapshots Operations
// -----------------------------------------------------------------------------

export async function dbGetSnapshots(userId: string, includeDeleted = false): Promise<DBSnapshot[]> {
  const all = await getAllFromIndex<DBSnapshot>('snapshots', 'by_user', userId);
  return includeDeleted ? all : all.filter((s) => !s.deletedAt);
}

export async function dbPutSnapshot(snap: DBSnapshot): Promise<void> {
  await runTx('snapshots', 'readwrite', (store) => store.put(snap));
}

export async function dbPutSnapshotsBatch(snapshots: DBSnapshot[]): Promise<void> {
  if (snapshots.length === 0) return;
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('snapshots', 'readwrite');
    const store = tx.objectStore('snapshots');
    for (const snap of snapshots) {
      store.put(snap);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -----------------------------------------------------------------------------
// Valuations Operations
// -----------------------------------------------------------------------------

export async function dbGetValuations(userId: string): Promise<Record<string, number>> {
  const list = await getAllFromIndex<DBValuation>('valuations', 'by_user', userId);
  const result: Record<string, number> = {};
  for (const v of list) {
    result[v.assetId] = v.currentValue;
  }
  return result;
}

export async function dbPutValuation(val: DBValuation): Promise<void> {
  await runTx('valuations', 'readwrite', (store) => store.put(val));
}

export async function dbPutValuationsBatch(valuations: DBValuation[]): Promise<void> {
  if (valuations.length === 0) return;
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('valuations', 'readwrite');
    const store = tx.objectStore('valuations');
    for (const val of valuations) {
      store.put(val);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbDeleteValuation(userId: string, assetId: string): Promise<void> {
  await runTx('valuations', 'readwrite', (store) => store.delete([userId, assetId]));
}

// -----------------------------------------------------------------------------
// Sync Queue Operations
// -----------------------------------------------------------------------------

export async function dbGetSyncQueue(userId: string): Promise<DBSyncQueueItem[]> {
  return getAllFromIndex<DBSyncQueueItem>('sync_queue', 'by_user', userId);
}

export async function dbEnqueueSync(item: Omit<DBSyncQueueItem, 'id'>): Promise<number> {
  const res = await runTx<IDBValidKey>('sync_queue', 'readwrite', (store) => store.add(item as any));
  return Number(res);
}

export async function dbRemoveSyncQueueItem(id: number): Promise<void> {
  await runTx('sync_queue', 'readwrite', (store) => store.delete(id));
}

export async function dbUpdateSyncQueueItem(item: DBSyncQueueItem): Promise<void> {
  await runTx('sync_queue', 'readwrite', (store) => store.put(item));
}

// -----------------------------------------------------------------------------
// User Settings Operations
// -----------------------------------------------------------------------------

export async function dbGetUserSettings(userId: string): Promise<DBUserSettings | null> {
  return runTx<DBUserSettings | null>('user_settings', 'readonly', (store) => store.get(userId));
}

export async function dbPutUserSettings(settings: DBUserSettings): Promise<void> {
  await runTx('user_settings', 'readwrite', (store) => store.put(settings));
}
