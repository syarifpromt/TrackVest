/**
 * Mappers between Frontend TypeScript Models and Supabase PostgreSQL Rows
 */

import { DBAsset, DBInvestment, DBSnapshot, DBValuation } from '../db/indexedDb';

export function assetToDbRow(asset: DBAsset) {
  return {
    id: String(asset.id),
    user_id: asset.userId,
    name: String(asset.name || 'Aset'),
    category: String(asset.category || 'Lainnya'),
    color: String(asset.color || '#0F766E'),
    icon: asset.icon || null,
    created_at: asset.createdAt || new Date().toISOString(),
    updated_at: asset.updatedAt || new Date().toISOString(),
    deleted_at: asset.deletedAt || null,
  };
}

export function dbRowToAsset(row: any): DBAsset {
  return {
    id: String(row.id),
    userId: row.user_id,
    name: row.name,
    category: row.category,
    color: row.color,
    icon: row.icon || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
  };
}

export function investmentToDbRow(inv: DBInvestment) {
  return {
    id: String(inv.id),
    user_id: inv.userId,
    asset_id: String(inv.assetId),
    date: String(inv.date),
    amount: Number.isFinite(Number(inv.amount)) ? Number(inv.amount) : 0,
    note: inv.note || null,
    created_at: inv.createdAt || new Date().toISOString(),
    updated_at: inv.updatedAt || new Date().toISOString(),
    deleted_at: inv.deletedAt || null,
  };
}

export function dbRowToInvestment(row: any): DBInvestment {
  return {
    id: String(row.id),
    userId: row.user_id,
    assetId: String(row.asset_id),
    date: String(row.date),
    amount: Number(row.amount) || 0,
    note: row.note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
  };
}

export function snapshotToDbRow(snap: DBSnapshot) {
  const returnPct = Number.isFinite(Number(snap.totalReturnPercent))
    ? Number(Number(snap.totalReturnPercent).toFixed(4))
    : 0;

  return {
    id: String(snap.id),
    user_id: snap.userId,
    date: String(snap.date),
    total_invested: Number.isFinite(Number(snap.totalInvested)) ? Number(snap.totalInvested) : 0,
    total_value: Number.isFinite(Number(snap.totalValue)) ? Number(snap.totalValue) : 0,
    total_profit: Number.isFinite(Number(snap.totalProfit)) ? Number(snap.totalProfit) : 0,
    total_return_percent: returnPct,
    assets: Array.isArray(snap.assets) ? snap.assets : [],
    created_at: snap.createdAt || new Date().toISOString(),
    updated_at: snap.updatedAt || new Date().toISOString(),
    deleted_at: snap.deletedAt || null,
  };
}

export function dbRowToSnapshot(row: any): DBSnapshot {
  return {
    id: String(row.id),
    userId: row.user_id,
    date: String(row.date),
    totalInvested: Number(row.total_invested) || 0,
    totalValue: Number(row.total_value) || 0,
    totalProfit: Number(row.total_profit) || 0,
    totalReturnPercent: Number(row.total_return_percent) || 0,
    assets: Array.isArray(row.assets) ? row.assets : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
  };
}

export function valuationToDbRow(val: DBValuation) {
  return {
    user_id: val.userId,
    asset_id: String(val.assetId),
    current_value: Number.isFinite(Number(val.currentValue)) ? Number(val.currentValue) : 0,
    updated_at: val.updatedAt || new Date().toISOString(),
  };
}

export function dbRowToValuation(row: any): DBValuation {
  return {
    userId: row.user_id,
    assetId: String(row.asset_id),
    currentValue: Number(row.current_value) || 0,
    updatedAt: row.updated_at,
  };
}
