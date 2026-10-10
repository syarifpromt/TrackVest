'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Edit3, 
  PlusCircle, 
  Layers
} from 'lucide-react';
import { AssetSummary } from '../types';
import { formatIDR, formatPercent } from '../lib/calculations';
import { AssetIcon } from './AssetIcon';

interface AssetTableProps {
  summaries: AssetSummary[];
  onQuickUpdateValuation: (assetId: string) => void;
  onAddInvestmentForAsset: (assetId: string) => void;
  onOpenManageAssets?: () => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  summaries,
  onQuickUpdateValuation,
  onAddInvestmentForAsset,
  onOpenManageAssets,
}) => {
  if (summaries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-surface">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100 mb-3">
          <Layers className="h-6 w-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-800">Belum ada aset dalam portfolio</h4>
        <p className="mt-1 text-xs text-slate-400">
          Mulai dengan mencatat modal pertama Anda melalui tombol &quot;Tambah Investasi&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-surface overflow-hidden">
      {/* Table Header Container */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">Daftar Aset & Kinerja</h3>
        </div>
        <div className="flex items-center gap-3">
          {onOpenManageAssets && (
            <button
              onClick={onOpenManageAssets}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
            >
              + Kelola & Ubah Ikon Aset
            </button>
          )}
          <span className="text-xs text-slate-500 font-medium">
            {summaries.length} Aset Terdaftar
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3">Aset</th>
              <th scope="col" className="px-4 py-3 text-right">Modal Investasi</th>
              <th scope="col" className="px-4 py-3 text-right">Nilai Sekarang</th>
              <th scope="col" className="px-4 py-3 text-right">Profit / Loss (Rp)</th>
              <th scope="col" className="px-4 py-3 text-right">Return (%)</th>
              <th scope="col" className="px-4 py-3 text-right">Alokasi</th>
              <th scope="col" className="px-5 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {summaries.map((asset) => {
              const hasValuation = asset.currentValue !== null;
              const isProfit = asset.profit !== null && asset.profit > 0;
              const isLoss = asset.profit !== null && asset.profit < 0;

              return (
                <tr 
                  key={asset.assetId}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* Name & Category */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <AssetIcon name={asset.name} category={asset.category} icon={asset.icon} color={asset.color} size={36} />
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          {asset.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 uppercase">
                            {asset.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            • {asset.transactionCount} transaksi
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Modal Investasi */}
                  <td className="px-4 py-4 text-right font-medium text-slate-800 tabular-nums whitespace-nowrap">
                    {formatIDR(asset.totalInvested)}
                  </td>

                  {/* Nilai Sekarang */}
                  <td className="px-4 py-4 text-right tabular-nums whitespace-nowrap">
                    {hasValuation ? (
                      <span className="font-bold text-slate-900">
                        {formatIDR(asset.currentValue)}
                      </span>
                    ) : (
                      <span className="text-xs italic text-slate-400">
                        Belum diisi
                      </span>
                    )}
                  </td>

                  {/* Profit / Loss */}
                  <td className="px-4 py-4 text-right tabular-nums whitespace-nowrap">
                    {!hasValuation ? (
                      <span className="text-slate-400 text-xs">-</span>
                    ) : isProfit ? (
                      <span className="font-semibold text-brand-600 inline-flex items-center gap-1 justify-end">
                        <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>+{formatIDR(asset.profit).replace('Rp ', 'Rp')}</span>
                      </span>
                    ) : isLoss ? (
                      <span className="font-semibold text-rose-600 inline-flex items-center gap-1 justify-end">
                        <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>{formatIDR(asset.profit).replace('Rp ', 'Rp')}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 inline-flex items-center gap-1 justify-end">
                        <Minus className="h-3 w-3" />
                        <span>Rp0</span>
                      </span>
                    )}
                  </td>

                  {/* Return % */}
                  <td className="px-4 py-4 text-right tabular-nums whitespace-nowrap">
                    {!hasValuation ? (
                      <span className="text-slate-400 text-xs">-</span>
                    ) : isProfit ? (
                      <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 border border-brand-200">
                        {formatPercent(asset.returnPercent)}
                      </span>
                    ) : isLoss ? (
                      <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                        {formatPercent(asset.returnPercent)}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        0,00%
                      </span>
                    )}
                  </td>

                  {/* Alokasi */}
                  <td className="px-4 py-4 text-right font-medium text-slate-700 tabular-nums whitespace-nowrap">
                    {asset.allocationPercent !== null ? (
                      <span>{asset.allocationPercent.toFixed(1).replace('.', ',')}%</span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onQuickUpdateValuation(asset.assetId)}
                        title="Update Nilai Sekarang"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-700 transition"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onAddInvestmentForAsset(asset.assetId)}
                        title="Tambah Investasi Baru"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="divide-y divide-slate-100 md:hidden">
        {summaries.map((asset) => {
          const hasValuation = asset.currentValue !== null;
          const isProfit = asset.profit !== null && asset.profit > 0;
          const isLoss = asset.profit !== null && asset.profit < 0;

          return (
            <div key={asset.assetId} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AssetIcon name={asset.name} category={asset.category} icon={asset.icon} color={asset.color} size={30} />
                  <div>
                    <span className="font-bold text-slate-900">{asset.name}</span>
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 uppercase">
                      {asset.category}
                    </span>
                  </div>
                </div>
                {hasValuation && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                    isProfit 
                      ? 'bg-brand-50 text-brand-700 border border-brand-200' 
                      : isLoss 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {formatPercent(asset.returnPercent)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Modal Investasi</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {formatIDR(asset.totalInvested)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nilai Sekarang</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatIDR(asset.currentValue)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Profit / Loss</span>
                  <span className={`font-semibold tabular-nums ${
                    isProfit ? 'text-brand-600' : isLoss ? 'text-rose-600' : 'text-slate-600'
                  }`}>
                    {hasValuation ? formatIDR(asset.profit) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Alokasi Portfolio</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {asset.allocationPercent !== null ? `${asset.allocationPercent.toFixed(1).replace('.', ',')}%` : '-'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onQuickUpdateValuation(asset.assetId)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Update Nilai</span>
                </button>
                <button
                  onClick={() => onAddInvestmentForAsset(asset.assetId)}
                  className="flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  <PlusCircle className="h-3 w-3" />
                  <span>Tambah Modal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

