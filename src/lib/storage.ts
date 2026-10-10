import { Asset, Investment, Snapshot } from '../types';

const ASSETS_KEY = 'trackvest_assets_v3';
const INVESTMENTS_KEY = 'trackvest_investments_v3';
const SNAPSHOTS_KEY = 'trackvest_snapshots_v3';
const VALUATIONS_KEY = 'trackvest_latest_valuations_v3';
const LAST_VALUATION_TIME_KEY = 'trackvest_last_valuation_time_v3';
const USER_NAME_KEY = 'trackvest_user_name_v3';

// 3 Core Assets requested by user matching Stitch references: Emas, BTC, VOO
const INITIAL_ASSETS: Asset[] = [
  {
    id: 'asset-btc',
    name: 'BTC',
    category: 'Crypto',
    color: '#F7931A', // Bitcoin Orange
    icon: '/icons/btc.png',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'asset-emas',
    name: 'Emas',
    category: 'Emas',
    color: '#EAB308', // Gold Bullion
    icon: '/icons/emas.png',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'asset-voo',
    name: 'VOO',
    category: 'ETF',
    color: '#991B1B', // Vanguard Crimson
    icon: '/icons/voo.png',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// Initial seed investments (Total: Rp 37.000.000, matching Stitch Dashboard)
const INITIAL_INVESTMENTS: Investment[] = [
  {
    id: 'inv-1',
    assetId: 'asset-btc',
    date: '2026-01-10',
    amount: 18000000,
    note: 'Akumulasi Bitcoin (DCA Perdana)',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'inv-2',
    assetId: 'asset-emas',
    date: '2026-01-12',
    amount: 11000000,
    note: 'Pembelian Emas Batangan Logam Mulia',
    createdAt: '2026-01-12T09:30:00Z',
  },
  {
    id: 'inv-3',
    assetId: 'asset-voo',
    date: '2026-01-15',
    amount: 8000000,
    note: 'Injeksi modal Vanguard S&P 500 ETF',
    createdAt: '2026-01-15T14:20:00Z',
  },
];

// Initial latest valuations (Total: Rp 40.825.000, Profit: +Rp 3.825.000 / +10,34% matching Stitch Dashboard)
const INITIAL_VALUATIONS: Record<string, number> = {
  'asset-btc': 20500000, // +Rp 2.500.000 (+13,89%)
  'asset-emas': 11500000, // +Rp 500.000 (+4,55%)
  'asset-voo': 8825000,  // +Rp 825.000 (+10,31%)
};

// Initial seed snapshots matching Stitch milestone pills (+4,11%, +7,02%, +10,34%)
const INITIAL_SNAPSHOTS: Snapshot[] = [
  {
    id: 'snapshot-2026-02-20',
    date: '2026-02-20',
    totalInvested: 37000000,
    totalValue: 40825000,
    totalProfit: 3825000,
    totalReturnPercent: 10.34,
    createdAt: '2026-02-20T18:00:00Z',
    assets: [
      {
        assetId: 'asset-btc',
        assetName: 'BTC',
        category: 'Crypto',
        icon: '/icons/btc.png',
        investedAmount: 18000000,
        currentValue: 20500000,
        profit: 2500000,
        returnPercent: 13.89,
        allocationPercent: 50.21,
      },
      {
        assetId: 'asset-emas',
        assetName: 'Emas',
        category: 'Emas',
        icon: '/icons/emas.png',
        investedAmount: 11000000,
        currentValue: 11500000,
        profit: 500000,
        returnPercent: 4.55,
        allocationPercent: 28.17,
      },
      {
        assetId: 'asset-voo',
        assetName: 'VOO',
        category: 'ETF',
        icon: '/icons/voo.png',
        investedAmount: 8000000,
        currentValue: 8825000,
        profit: 825000,
        returnPercent: 10.31,
        allocationPercent: 21.62,
      },
    ],
  },
  {
    id: 'snapshot-2026-02-07',
    date: '2026-02-07',
    totalInvested: 37000000,
    totalValue: 39600000,
    totalProfit: 2600000,
    totalReturnPercent: 7.02,
    createdAt: '2026-02-07T16:30:00Z',
    assets: [
      {
        assetId: 'asset-btc',
        assetName: 'BTC',
        category: 'Crypto',
        icon: '/icons/btc.png',
        investedAmount: 18000000,
        currentValue: 19600000,
        profit: 1600000,
        returnPercent: 8.89,
        allocationPercent: 49.49,
      },
      {
        assetId: 'asset-emas',
        assetName: 'Emas',
        category: 'Emas',
        icon: '/icons/emas.png',
        investedAmount: 11000000,
        currentValue: 11400000,
        profit: 400000,
        returnPercent: 3.64,
        allocationPercent: 28.79,
      },
      {
        assetId: 'asset-voo',
        assetName: 'VOO',
        category: 'ETF',
        icon: '/icons/voo.png',
        investedAmount: 8000000,
        currentValue: 8600000,
        profit: 600000,
        returnPercent: 7.5,
        allocationPercent: 21.72,
      },
    ],
  },
  {
    id: 'snapshot-2026-01-30',
    date: '2026-01-30',
    totalInvested: 37000000,
    totalValue: 38520000,
    totalProfit: 1520000,
    totalReturnPercent: 4.11,
    createdAt: '2026-01-30T17:45:00Z',
    assets: [
      {
        assetId: 'asset-btc',
        assetName: 'BTC',
        category: 'Crypto',
        icon: '/icons/btc.png',
        investedAmount: 18000000,
        currentValue: 18900000,
        profit: 900000,
        returnPercent: 5.0,
        allocationPercent: 49.07,
      },
      {
        assetId: 'asset-emas',
        assetName: 'Emas',
        category: 'Emas',
        icon: '/icons/emas.png',
        investedAmount: 11000000,
        currentValue: 11300000,
        profit: 300000,
        returnPercent: 2.73,
        allocationPercent: 29.34,
      },
      {
        assetId: 'asset-voo',
        assetName: 'VOO',
        category: 'ETF',
        icon: '/icons/voo.png',
        investedAmount: 8000000,
        currentValue: 8320000,
        profit: 320000,
        returnPercent: 4.0,
        allocationPercent: 21.59,
      },
    ],
  },
];

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
    const hasLegacy = parsed.some(
      (a) =>
        a.id === 'asset-gold' ||
        a.id === 'asset-etf' ||
        a.name.toLowerCase() === 'gold' ||
        a.name.toLowerCase() === 'etf'
    );
    const hasEmas = parsed.some((a) => a.name.toLowerCase() === 'emas');
    const hasBtc = parsed.some((a) => a.name.toLowerCase() === 'btc');
    const hasVoo = parsed.some((a) => a.name.toLowerCase() === 'voo');

    if (hasLegacy || !hasEmas || !hasBtc || !hasVoo || parsed.length === 0) {
      localStorage.setItem(ASSETS_KEY, JSON.stringify(INITIAL_ASSETS));
      localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(INITIAL_INVESTMENTS));
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(INITIAL_SNAPSHOTS));
      localStorage.setItem(VALUATIONS_KEY, JSON.stringify(INITIAL_VALUATIONS));
      return INITIAL_ASSETS;
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
    const hasLegacy = parsed.some((i) => i.assetId === 'asset-gold' || i.assetId === 'asset-etf');
    if (hasLegacy || parsed.length === 0) {
      localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(INITIAL_INVESTMENTS));
      return INITIAL_INVESTMENTS;
    }
    return parsed;
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
    const hasLegacy = parsed.some((s) =>
      s.assets.some(
        (a) =>
          a.assetName === 'Gold' ||
          a.assetName === 'ETF' ||
          a.assetId === 'asset-gold' ||
          a.assetId === 'asset-etf'
      )
    );
    if (hasLegacy || parsed.length === 0) {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(INITIAL_SNAPSHOTS));
      return INITIAL_SNAPSHOTS;
    }
    return parsed;
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
    if (!parsed['asset-btc'] || !parsed['asset-emas'] || !parsed['asset-voo']) {
      localStorage.setItem(VALUATIONS_KEY, JSON.stringify(INITIAL_VALUATIONS));
      return INITIAL_VALUATIONS;
    }
    return parsed;
  } catch {
    return INITIAL_VALUATIONS;
  }
}

export function saveStoredValuations(valuations: Record<string, number>): void {
  if (!isBrowser()) return;
  localStorage.setItem(VALUATIONS_KEY, JSON.stringify(valuations));
}

export function getStoredLastValuationTime(): string | null {
  if (!isBrowser()) return new Date(Date.now() - 86400000).toISOString();
  try {
    const raw = localStorage.getItem(LAST_VALUATION_TIME_KEY);
    if (!raw) {
      const yesterdayIso = new Date(Date.now() - 86400000).toISOString();
      localStorage.setItem(LAST_VALUATION_TIME_KEY, yesterdayIso);
      return yesterdayIso;
    }
    return raw;
  } catch {
    return new Date(Date.now() - 86400000).toISOString();
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
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString();
  localStorage.setItem(ASSETS_KEY, JSON.stringify(INITIAL_ASSETS));
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(INITIAL_INVESTMENTS));
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(INITIAL_SNAPSHOTS));
  localStorage.setItem(VALUATIONS_KEY, JSON.stringify(INITIAL_VALUATIONS));
  localStorage.setItem(LAST_VALUATION_TIME_KEY, yesterdayIso);
  localStorage.setItem(USER_NAME_KEY, 'Syarif Hidayatullah');
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
    version: '2.0',
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
