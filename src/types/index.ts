export interface Asset {
  id: string;
  name: string;
  category: 'Crypto' | 'Emas' | 'Saham' | 'ETF' | 'Lainnya';
  color: string;
  icon?: string; // Custom icon: base64 data URL, image URL, or emoji
  createdAt: string;
}

export interface Investment {
  id: string;
  assetId: string;
  date: string; // YYYY-MM-DD
  amount: number; // in IDR (Rupiah)
  note?: string;
  createdAt: string;
}

export interface SnapshotAssetItem {
  assetId: string;
  assetName: string;
  category: string;
  icon?: string;
  investedAmount: number;
  currentValue: number;
  profit: number;
  returnPercent: number;
  allocationPercent: number;
}

export interface Snapshot {
  id: string;
  date: string; // YYYY-MM-DD
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  totalReturnPercent: number;
  assets: SnapshotAssetItem[];
  createdAt: string;
}

export interface AssetSummary {
  assetId: string;
  name: string;
  category: string;
  color: string;
  icon?: string;
  totalInvested: number;
  currentValue: number | null;
  profit: number | null;
  returnPercent: number | null;
  allocationPercent: number | null;
  transactionCount: number;
  lastUpdated?: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  totalReturnPercent: number;
  hasValuation: boolean;
  assetCount: number;
}

