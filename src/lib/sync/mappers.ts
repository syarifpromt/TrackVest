/**
 * Mappers between Frontend TypeScript Models and Supabase PostgreSQL Rows
 */

import { DBAsset, DBInvestment, DBSnapshot, DBValuation } from '../db/indexedDb';

export function assetToDbRow(asset: DBAsset) {
  return {
    id: asset.id,
    user_id: asset.userId,
    name: asset.name,
    category: asset.category,
    color: asset.color,
    icon: asset.icon || null,
    created_at: asset.createdAt || new Date().toISOString(),
    updated_at: asset.updatedAt || new Date().toISOString(),
    deleted_at: asset.deletedAt || null,
  };
}

export function dbRowToAsset(row: any): DBAsset {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    color: row.color,
    icon: row.icon || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function investmentToDbRow(inv: DBInvestment) {
  return {
    id: inv.id,
    user_id: inv.userId,
    asset_id: inv.assetId,
    date: inv.date,
    amount: Number(inv.amount),
    note: inv.note || null,
    created_at: inv.createdAt || new Date().toISOString(),
    updated_at: inv.updatedAt || new Date().toISOString(),
    deleted_at: inv.deletedAt || null,
  };
}

export function dbRowToInvestment(row: any): DBInvestment {
  return {
    id: row.id,
    userId: row.user_id,
    assetId: row.asset_id,
    date: row.date,
    amount: Number(row.amount),
    note: row.note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function snapshotToDbRow(snap: DBSnapshot) {
  return {
    id: snap.id,
    user_id: snap.userId,
    date: snap.date,
    total_invested: Number(snap.totalInvested),
    total_value: Number(snap.totalValue),
    total_profit: Number(snap.totalProfit),
    total_return_percent: Number(snap.totalReturnPercent),
    assets: snap.assets || [],
    created_at: snap.createdAt || new Date().toISOString(),
    updated_at: snap.updatedAt || new Date().toISOString(),
    deleted_at: snap.deletedAt || null,
  };
}

export function dbRowToSnapshot(row: any): DBSnapshot {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    totalInvested: Number(row.total_invested),
    totalValue: Number(row.total_value),
    totalProfit: Number(row.total_profit),
    totalReturnPercent: Number(row.total_return_percent),
    assets: Array.isArray(row.assets) ? row.assets : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function valuationToDbRow(val: DBValuation) {
  return {
    user_id: val.userId,
    asset_id: val.assetId,
    current_value: Number(val.currentValue),
    updated_at: val.updatedAt || new Date().toISOString(),
  };
}

export function dbRowToValuation(row: any): DBValuation {
  return {
    userId: row.user_id,
    assetId: row.asset_id,
    currentValue: Number(row.current_value),
    updatedAt: row.updated_at,
  };
}

