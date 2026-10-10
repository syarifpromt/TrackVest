'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock,
  Plus,
  Layers,
  RotateCcw
} from 'lucide-react';
import { Asset, Investment, Snapshot } from '../types';
import { 
  calculateAssetInvested, 
  formatIDR, 
  formatPercent,
  formatShortDate,
  formatDate,
  formatRelativeUpdate
} from '../lib/calculations';
import { AssetIcon } from './AssetIcon';

interface CekPortfolioViewProps {
  assets: Asset[];
  investments: Investment[];
  currentValuations: Record<string, number>;
  snapshots: Snapshot[];
  lastValuationTime?: string | null;
  onSaveSnapshot: (data: {
    date: string;
    valuations: Record<string, number>;
    overwriteExisting: boolean;
  }) => void;
  onOpenManageAssets: () => void;
  onCancel: () => void;
}

export const CekPortfolioView: React.FC<CekPortfolioViewProps> = ({
  assets,
  investments,
  currentValuations,
  snapshots,
  lastValuationTime,
  onSaveSnapshot,
  onOpenManageAssets,
  onCancel,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [snapshotWarning, setSnapshotWarning] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Initialize input values with existing valuations
  useEffect(() => {
    const initial: Record<string, string> = {};
    assets.forEach((asset) => {
      const val = currentValuations[asset.id];
      if (typeof val === 'number') {
        initial[asset.id] = new Intl.NumberFormat('id-ID').format(val);
      } else {
        initial[asset.id] = '';
      }
    });
    setInputValues(initial);
  }, [assets, currentValuations]);

  // Check if a snapshot already exists on chosen date
  useEffect(() => {
    const exists = snapshots.some((s) => s.date === date);
    setSnapshotWarning(exists);
  }, [date, snapshots]);

  const handleInputChange = (assetId: string, val: string) => {
    const raw = val.replace(/\D/g, '');
    const formatted = raw ? new Intl.NumberFormat('id-ID').format(parseInt(raw, 10)) : '';
    setInputValues((prev) => ({
      ...prev,
      [assetId]: formatted,
    }));
  };

  const setTodayDate = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Latest snapshot info for last updated status
  const latestSnapshot = [...snapshots].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  const lastUpdateDateStr = lastValuationTime || latestSnapshot?.date;

  // Live calculation of totals
  let totalInvestedAll = 0;
  let totalValueAll = 0;
  let hasValidInput = false;

  const assetCalculations = assets.map((asset) => {
    const invested = calculateAssetInvested(investments, asset.id);
    totalInvestedAll += invested;

    const rawStr = inputValues[asset.id]?.replace(/\D/g, '') || '';
    const curVal = rawStr ? parseInt(rawStr, 10) : null;

    let profit: number | null = null;
    let returnPercent: number | null = null;

    if (curVal !== null) {
      hasValidInput = true;
      totalValueAll += curVal;
      profit = curVal - invested;
      returnPercent = invested > 0 ? (profit / invested) * 100 : 0;
    }

    return {
      asset,
      invested,
      curVal,
      profit,
      returnPercent,
    };
  });

  const totalProfitAll = hasValidInput ? totalValueAll - totalInvestedAll : 0;
  const totalReturnPercentAll =
    hasValidInput && totalInvestedAll > 0
      ? (totalProfitAll / totalInvestedAll) * 100
      : 0;

  // Breakdown proportions
  const assetAllocations = assetCalculations.map((item) => {
    const proportion = totalValueAll > 0 && item.curVal ? (item.curVal / totalValueAll) * 100 : 0;
    return {
      ...item,
      proportion,
    };
  });

  const handleSave = () => {
    const numericValuations: Record<string, number> = {};
    Object.entries(inputValues).forEach(([assetId, strVal]) => {
      const clean = strVal.replace(/\D/g, '');
      if (clean) {
        numericValuations[assetId] = parseInt(clean, 10);
      }
    });

    onSaveSnapshot({
      date,
      valuations: numericValuations,
      overwriteExisting: snapshotWarning,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onCancel(); // return to dashboard
    }, 1200);
  };

  const handleReset = () => {
    const initial: Record<string, string> = {};
    assets.forEach((asset) => {
      initial[asset.id] = '';
    });
    setInputValues(initial);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Date Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Cek & Perbarui Nilai Portofolio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Perbarui nilai pasar terkini setiap aset untuk melihat performa dan menyimpan snapshot portofolio.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
            <Calendar className="h-4 w-4 text-emerald-700 flex-shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={setTodayDate}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Bar Info Terakhir Update */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs text-slate-600">
        <Clock className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0" />
        <span>
          Terakhir update : <strong className="text-slate-900 font-bold">{latestSnapshot ? formatDate(latestSnapshot.date) : 'Belum pernah'}</strong>
          {lastUpdateDateStr && (
            <span className="text-slate-400 font-normal ml-1.5">({formatRelativeUpdate(lastUpdateDateStr)})</span>
          )}
        </span>
      </div>

      {/* 2. Main 2-Column Valuation Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (7 of 12 cols): Input Nilai Sekarang Setiap Aset */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Daftar Valuasi Aset
                </h3>
                <p className="text-[11px] text-slate-400">
                  Masukkan nilai pasar aset saat ini untuk menghitung profit/loss secara otomatis.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                {assets.length} Aset
              </span>
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 px-1 border-b border-slate-100">
              <span className="col-span-4">Aset Portofolio</span>
              <span className="col-span-3 text-right">Modal Terdaftar</span>
              <span className="col-span-3 text-right">Nilai Sekarang</span>
              <span className="col-span-2 text-right">Profit / Loss</span>
            </div>

            {/* Asset Input Rows */}
            <div className="divide-y divide-slate-100">
              {assetCalculations.map(({ asset, invested, curVal, profit, returnPercent }) => {
                const isProfit = profit !== null && profit > 0;
                const isLoss = profit !== null && profit < 0;

                return (
                  <div key={asset.id} className="py-4 first:pt-2 last:pb-2">
                    <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-3">
                      {/* 1. Asset Name & Category (Col 4) */}
                      <div className="sm:col-span-4 flex items-center gap-3">
                        <AssetIcon name={asset.name} category={asset.category} icon={asset.icon} size={36} />
                        <div className="min-w-0">
                          <span className="block text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {asset.name}
                          </span>
                          <span className="block text-[10px] text-slate-400 capitalize">
                            {asset.category}
                          </span>
                        </div>
                      </div>

                      {/* 2. Modal Terdaftar (Col 3) */}
                      <div className="sm:col-span-3 text-left sm:text-right">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums block">
                          {formatIDR(invested)}
                        </span>
                      </div>

                      {/* 3. Input Nilai Sekarang (Col 3) */}
                      <div className="sm:col-span-3">
                        <div className="relative flex rounded-xl border border-slate-200 shadow-2xs focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-slate-50/50">
                          <span className="inline-flex items-center px-2.5 text-xs font-bold text-slate-400 select-none">
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={inputValues[asset.id] || ''}
                            onChange={(e) => handleInputChange(asset.id, e.target.value)}
                            className="w-full bg-transparent py-2 pr-2.5 text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums focus:outline-none placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      {/* 4. Live P/L Badge (Col 2) */}
                      <div className="sm:col-span-2 text-left sm:text-right">
                        {curVal === null ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : isProfit ? (
                          <div>
                            <span className="text-xs font-bold text-emerald-700 tabular-nums block">
                              +{formatIDR(profit!)}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 tabular-nums">
                              +{returnPercent?.toFixed(2).replace('.', ',')}%
                            </span>
                          </div>
                        ) : isLoss ? (
                          <div>
                            <span className="text-xs font-bold text-rose-700 tabular-nums block">
                              -{formatIDR(Math.abs(profit!))}
                            </span>
                            <span className="text-[10px] font-semibold text-rose-600 tabular-nums">
                              {returnPercent?.toFixed(2).replace('.', ',')}%
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-bold text-slate-600 tabular-nums block">
                              Rp 0
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                              0,00%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions in Card */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onOpenManageAssets}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Kelola & Tambah Aset</span>
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveSuccess}
                  className="w-full rounded-xl bg-emerald-700 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{saveSuccess ? 'Berhasil Disimpan!' : 'Simpan Snapshot Portofolio'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  <span>Reset Nilai Input</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12 cols): Ringkasan Hasil (Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-slate-900">Ringkasan Hasil</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                Real-time
              </span>
            </div>

            {/* Total Modal & Total Nilai Baru */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Total Modal Terdaftar</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatIDR(totalInvestedAll)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Total Nilai Terkini</span>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tabular-nums">
                  {formatIDR(totalValueAll)}
                </span>
              </div>
            </div>

            {/* Dynamic Highlight Card: TOTAL PROFIT / LOSS */}
            <div className={`rounded-2xl border p-4 shadow-2xs transition-colors ${
              totalProfitAll > 0
                ? 'border-emerald-200/80 bg-emerald-50/70 text-emerald-950'
                : totalProfitAll < 0
                ? 'border-rose-200/80 bg-rose-50/70 text-rose-950'
                : 'border-slate-200/80 bg-slate-50/70 text-slate-900'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Profit / Loss
              </span>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-xl sm:text-2xl font-black tabular-nums">
                  {totalProfitAll > 0
                    ? `+${formatIDR(totalProfitAll)}`
                    : totalProfitAll < 0
                    ? `-${formatIDR(Math.abs(totalProfitAll))}`
                    : 'Rp 0'}
                </span>
                <span className={`text-xs font-extrabold tabular-nums px-2.5 py-0.5 rounded-full ${
                  totalProfitAll > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : totalProfitAll < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {totalProfitAll > 0 ? `+${formatPercent(totalReturnPercentAll)}` : formatPercent(totalReturnPercentAll)}
                </span>
              </div>
            </div>

            {/* Alokasi Portfolio Aktual (Segmented bar & chips) */}
            {totalValueAll > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Alokasi Portofolio</span>
                  <span className="text-[10px] text-slate-400">Proporsi Nilai Baru</span>
                </div>

                {/* Multi-segment progress bar */}
                <div className="h-2.5 w-full rounded-full bg-slate-100 flex overflow-hidden">
                  {assetAllocations.map((a) => (
                    <div
                      key={a.asset.id}
                      style={{
                        width: `${a.proportion}%`,
                        backgroundColor: a.asset.color,
                      }}
                      className="h-full transition-all duration-500"
                      title={`${a.asset.name}: ${a.proportion.toFixed(1)}%`}
                    />
                  ))}
                </div>

                {/* Grid of proportion chips */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {assetAllocations.map((a) => (
                    <div
                      key={a.asset.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-center"
                    >
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <span 
                          className="h-2 w-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: a.asset.color }}
                        />
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[65px]">
                          {a.asset.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900 tabular-nums">
                        {a.proportion.toFixed(1).replace('.', ',')}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
