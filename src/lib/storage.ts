import { Asset, Investment, Snapshot } from '../types';

const ASSETS_KEY = 'trackvest_assets_v4';
const INVESTMENTS_KEY = 'trackvest_investments_v4';
const SNAPSHOTS_KEY = 'trackvest_snapshots_v4';
const VALUATIONS_KEY = 'trackvest_latest_valuations_v4';
const LAST_VALUATION_TIME_KEY = 'trackvest_last_valuation_time_v4';
const USER_NAME_KEY = 'trackvest_user_name_v4';

// Pure production ready: Empty initial states
const INITIAL_ASSETS: Asset[] = [];
const INITIAL_INVESTMENTS: Investment[] = [];
const INITIAL_VALUATIONS: Record<string, number> = {};
const INITIAL_SNAPSHOTS: Snapshot[] = [];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function purgeLegacyKeys(): void {
  if (!isBrowser()) return;
  try {
    const legacyKeys = [
      'trackvest_assets',
      'trackvest_investments',
      'trackvest_snapshots',
      'trackvest_latest_valuations',
      'trackvest_assets_v2',
      'trackvest_investments_v2',
      'trackvest_snapshots_v2',
      'trackvest_latest_valuations_v2',
      'trackvest_assets_v3',
      'trackvest_investments_v3',
      'trackvest_snapshots_v3',
      'trackvest_latest_valuations_v3',
      'trackvest_last_valuation_time_v3',
      'trackvest_user_name_v3',
    ];
    for (const k of legacyKeys) {
      localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

export function getStoredAssets(): Asset[] {
  if (!isBrowser()) return INITIAL_ASSETS;
  try {
    purgeLegacyKeys();
    const raw = localStorage.getItem(ASSETS_KEY);
    if (!raw) {
      localStorage.setItem(ASSETS_KEY, JSON.stringify(INITIAL_ASSETS));
      return INITIAL_ASSETS;
    }
    const parsed: Asset[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_ASSETS;

    // Auto-heal data anomaly: e.g. BTC or Bitcoin accidentally set to 'ETF'
    let hasHealed = false;
    const healed = parsed.map((a) => {
      const lower = (a.name || '').trim().toLowerCase();
      if ((lower === 'btc' || lower === 'bitcoin' || lower.startsWith('btc ')) && a.category !== 'Crypto') {
        hasHealed = true;
        return { ...a, category: 'Crypto' as const };
      }
      return a;
    });

    if (hasHealed) {
      saveStoredAssets(healed);
      return healed;
    }

    return parsed;
  } catch {
    return INITIAL_ASSETS;
  }
}

export function saveStoredAssets(assets: Asset[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
}

export function getStoredInvestments(): Investment[] {
  if (!isBrowser()) return INITIAL_INVESTMENTS;
  try {
    const raw = localStorage.getItem(INVESTMENTS_KEY);
    if (!raw) {
      localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(INITIAL_INVESTMENTS));
      return INITIAL_INVESTMENTS;
    }
    const parsed: Investment[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_INVESTMENTS;
  } catch {
    return INITIAL_INVESTMENTS;
  }
}

export function saveStoredInvestments(investments: Investment[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
}

export function getStoredSnapshots(): Snapshot[] {
  if (!isBrowser()) return INITIAL_SNAPSHOTS;
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(INITIAL_SNAPSHOTS));
      return INITIAL_SNAPSHOTS;
    }
    const parsed: Snapshot[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SNAPSHOTS;
  } catch {
    return INITIAL_SNAPSHOTS;
  }
}

export function saveStoredSnapshots(snapshots: Snapshot[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

export function getStoredValuations(): Record<string, number> {
  if (!isBrowser()) return INITIAL_VALUATIONS;
  try {
    const raw = localStorage.getItem(VALUATIONS_KEY);
    if (!raw) {
      localStorage.setItem(VALUATIONS_KEY, JSON.stringify(INITIAL_VALUATIONS));
      return INITIAL_VALUATIONS;
    }
    const parsed: Record<string, number> = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : INITIAL_VALUATIONS;
  } catch {
    return INITIAL_VALUATIONS;
  }
}

export function saveStoredValuations(valuations: Record<string, number>): void {
  if (!isBrowser()) return;
  localStorage.setItem(VALUATIONS_KEY, JSON.stringify(valuations));
}

export function getStoredLastValuationTime(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(LAST_VALUATION_TIME_KEY);
  } catch {
    return null;
  }
}

export function saveStoredLastValuationTime(time: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_VALUATION_TIME_KEY, time);
}

export function getStoredUserName(): string {
  if (!isBrowser()) return 'Syarif Hidayatullah';
  try {
    const raw = localStorage.getItem(USER_NAME_KEY);
    return raw && raw.trim() ? raw.trim() : 'Syarif Hidayatullah';
  } catch {
    return 'Syarif Hidayatullah';
  }
}

export function saveStoredUserName(name: string): void {
  if (!isBrowser()) return;
  const clean = name.trim() || 'Syarif Hidayatullah';
  localStorage.setItem(USER_NAME_KEY, clean);
}

export function resetToDefaultData(): void {
  if (!isBrowser()) return;
  localStorage.setItem(ASSETS_KEY, JSON.stringify([]));
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify([]));
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify([]));
  localStorage.setItem(VALUATIONS_KEY, JSON.stringify({}));
  localStorage.removeItem(LAST_VALUATION_TIME_KEY);
}

export function exportAllData(): string {
  if (!isBrowser()) return '';
  const data = {
    userName: getStoredUserName(),
    assets: getStoredAssets(),
    investments: getStoredInvestments(),
    snapshots: getStoredSnapshots(),
    valuations: getStoredValuations(),
    lastValuationTime: getStoredLastValuationTime(),
    version: '4.0',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  if (!isBrowser()) return false;
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.assets) && Array.isArray(data.investments)) {
      if (typeof data.userName === 'string') saveStoredUserName(data.userName);
      saveStoredAssets(data.assets);
      saveStoredInvestments(data.investments);
      if (Array.isArray(data.snapshots)) saveStoredSnapshots(data.snapshots);
      if (data.valuations) saveStoredValuations(data.valuations);
      if (data.lastValuationTime) saveStoredLastValuationTime(data.lastValuationTime);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
