import { Asset, Investment, Snapshot, AssetSummary, PortfolioSummary } from '../types';

/**
 * Format number into Indonesian Rupiah (IDR)
 * Example: 1500000 -> "Rp 1.500.000", -15000 -> "-Rp 15.000"
 */
export function formatIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Belum diisi';
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID').format(absVal);
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format number into compact Indonesian Rupiah notation
 * Example: 40825000 -> "Rp40,8Jt", 1500000000 -> "Rp1,50M"
 */
export function formatCompactIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp0';
  }
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp${(abs / 1_000_000_000).toFixed(2).replace('.', ',')}M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp${(abs / 1_000_000).toFixed(1).replace('.', ',')}Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp${(abs / 1_000).toFixed(0)}Rb`;
  }
  return formatIDR(amount);
}

/**
 * Format percentage with explicit +/- sign
 * Example: 4.11 -> "+4,11%", -1 -> "-1,00%", 0 -> "0,00%"
 */
export function formatPercent(percent: number | null | undefined): string {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return '-';
  }
  const formatted = percent.toFixed(2).replace('.', ',');
  if (percent > 0) return `+${formatted}%`;
  return `${formatted}%`;
}

/**
 * Format ISO date string into Indonesian readable format
 * Example: "2026-01-30" -> "30 Januari 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const mIndex = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[mIndex] || month} ${year}`;
}

/**
 * Format ISO date string into short format
 * Example: "2026-01-30" -> "30 Jan 2026"
 */
export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const mIndex = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[mIndex] || month} ${year}`;
}

/**
 * Format date or timestamp into Indonesian relative update time
 * Example: "Diperbarui kemarin", "Diperbarui hari ini", "Diperbarui 3 hari lalu"
 */
export function formatRelativeUpdate(dateStrOrIso?: string | null): string {
  if (!dateStrOrIso) return 'Belum pernah diperbarui';

  const now = new Date();
  const date = new Date(dateStrOrIso.includes('T') ? dateStrOrIso : `${dateStrOrIso}T00:00:00`);
  if (isNaN(date.getTime())) return 'Belum pernah diperbarui';

  // Compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Diperbarui hari ini';
  } else if (diffDays === 1) {
    return 'Diperbarui kemarin';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `Diperbarui ${diffDays} hari lalu`;
  } else {
    return `Diperbarui ${formatShortDate(dateStrOrIso.split('T')[0])}`;
  }
}

/**
 * Format date or timestamp into Indonesian relative deposit time
 * Example: "Hari ini", "Kemarin", "3 hari lalu", "2 minggu lalu"
 */
export function formatRelativeDeposit(dateStr?: string | null): string {
  if (!dateStr) return '';

  const now = new Date();
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return '';

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Hari ini';
  } else if (diffDays === 1) {
    return 'Kemarin';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `${diffDays} hari lalu`;
  } else if (diffDays > 7 && diffDays <= 30) {
    const weeks = Math.round(diffDays / 7);
    return `${weeks} minggu lalu`;
  } else if (diffDays > 30 && diffDays < 365) {
    const months = Math.max(1, Math.round(diffDays / 30));
    return `${months} bulan lalu`;
  } else if (diffDays >= 365) {
    const years = Math.max(1, Math.round(diffDays / 365));
    return `${years} tahun lalu`;
  } else {
    return '';
  }
}

/**
 * Format deposit date into clean Indonesian indicator
 * Example: "Disetor hari ini", "Disetor kemarin", "Disetor: 15 Jan 2026"
 */
export function formatDepositIndicator(dateStr?: string | null): string {
  if (!dateStr) return '';

  const now = new Date();
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return '';

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Disetor hari ini';
  } else if (diffDays === 1) {
    return 'Disetor kemarin';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `Disetor ${diffDays} hari lalu`;
  } else {
    return `Disetor: ${formatShortDate(dateStr.split('T')[0])}`;
  }
}

/**
 * Calculate total invested per asset from list of transactions
 */
export function calculateAssetInvested(investments: Investment[], assetId: string): number {
  return investments
    .filter((inv) => inv.assetId === assetId)
    .reduce((sum, inv) => sum + inv.amount, 0);
}

/**
 * Calculate summaries for all assets given investments and current valuations
 */
export function computeAssetSummaries(
  assets: Asset[],
  investments: Investment[],
  currentValuations: Record<string, number>
): AssetSummary[] {
  // First calculate total current value of all evaluated assets for allocation
  let totalPortfolioValue = 0;
  assets.forEach((asset) => {
    const val = currentValuations[asset.id];
    if (typeof val === 'number') {
      totalPortfolioValue += val;
    }
  });

  return assets.map((asset) => {
    const totalInvested = calculateAssetInvested(investments, asset.id);
    const hasValue = typeof currentValuations[asset.id] === 'number';
    const currentValue = hasValue ? currentValuations[asset.id] : null;

    let profit: number | null = null;
    let returnPercent: number | null = null;
    let allocationPercent: number | null = null;

    if (currentValue !== null) {
      profit = currentValue - totalInvested;
      returnPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
      allocationPercent = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
    }

    const txCount = investments.filter((inv) => inv.assetId === asset.id).length;

    return {
      assetId: asset.id,
      name: asset.name,
      category: asset.category,
      color: asset.color,
      icon: asset.icon,
      totalInvested,
      currentValue,
      profit,
      returnPercent,
      allocationPercent,
      transactionCount: txCount,
    };
  });
}

/**
 * Compute high-level portfolio metrics
 */
export function computePortfolioSummary(summaries: AssetSummary[]): PortfolioSummary {
  let totalInvested = 0;
  let totalValue = 0;
  let hasAnyValuation = false;

  summaries.forEach((s) => {
    totalInvested += s.totalInvested;
    if (s.currentValue !== null) {
      totalValue += s.currentValue;
      hasAnyValuation = true;
    }
  });

  const totalProfit = hasAnyValuation ? totalValue - totalInvested : 0;
  const totalReturnPercent =
    hasAnyValuation && totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalValue,
    totalProfit,
    totalReturnPercent,
    hasValuation: hasAnyValuation,
    assetCount: summaries.length,
  };
}

/**
 * Get user initials from full name (e.g. "Syarif Hidayatullah" -> "SH")
 */
export function getUserInitials(name?: string | null): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'TV';
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Get first name for greetings (e.g. "Syarif Hidayatullah" -> "Syarif")
 */
export function getFirstName(name?: string | null): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Investor';
  return trimmed.split(/\s+/)[0];
}

