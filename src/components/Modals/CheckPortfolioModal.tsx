'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  HelpCircle
} from 'lucide-react';
import { Asset, Investment, Snapshot } from '../../types';
import { AssetIcon } from '../AssetIcon';
import { 
  calculateAssetInvested, 
  formatIDR, 
  formatPercent 
} from '../../lib/calculations';

interface CheckPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  investments: Investment[];
  currentValuations: Record<string, number>;
  snapshots: Snapshot[];
  onSaveSnapshot: (data: {
    date: string;
    valuations: Record<string, number>;
    overwriteExisting: boolean;
  }) => void;
}

export const CheckPortfolioModal: React.FC<CheckPortfolioModalProps> = ({
  isOpen,
  onClose,
  assets,
  investments,
  currentValuations,
  snapshots,
  onSaveSnapshot,
}) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Initialize input values with existing valuations
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, assets, currentValuations]);

  if (!isOpen) return null;

  const handleInputChange = (assetId: string, val: string) => {
    const raw = val.replace(/\D/g, '');
    const formatted = raw ? new Intl.NumberFormat('id-ID').format(parseInt(raw, 10)) : '';
    setInputValues((prev) => ({
      ...prev,
      [assetId]: formatted,
    }));
  };

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

  const handleSave = () => {
    const numericValuations: Record<string, number> = {};
    Object.entries(inputValues).forEach(([assetId, strVal]) => {
      const clean = strVal.replace(/\D/g, '');
      if (clean) {
        numericValuations[assetId] = parseInt(clean, 10);
      }
    });

    const todayDate = new Date().toISOString().split('T')[0];

    onSaveSnapshot({
      date: todayDate,
      valuations: numericValuations,
      overwriteExisting: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-modal animate-in fade-in zoom-in-95 max-h-[90dvh] flex flex-col pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-brand-600" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Evaluasi Nilai Portfolio</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbarui estimasi nilai pasar instrumen aset Anda. Imbal hasil dan pertumbuhan dihitung otomatis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Asset Inputs List (Scrollable) */}
        <div className="mt-4 flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
          {assetCalculations.map(({ asset, invested, curVal, profit, returnPercent }) => {
            const isProfit = profit !== null && profit > 0;
            const isLoss = profit !== null && profit < 0;

            return (
              <div key={asset.id} className="py-3.5 first:pt-1 last:pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Asset Info & Modal */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <AssetIcon name={asset.name} category={asset.category} icon={asset.icon} color={asset.color} size={28} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{asset.name}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500 uppercase">
                            {asset.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Modal Tercatat: <span className="font-semibold text-slate-700 tabular-nums">{formatIDR(invested)}</span>
                    </p>
                  </div>

                  {/* Input Nilai Sekarang & Live P/L */}
                  <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
                    <div className="relative flex-1 sm:w-44 flex rounded-lg shadow-sm">
                      <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-2.5 text-xs font-bold text-slate-600 select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={inputValues[asset.id] || ''}
                        onChange={(e) => handleInputChange(asset.id, e.target.value)}
                        className="w-full rounded-r-lg border border-slate-300 bg-white px-2.5 py-2 text-sm sm:text-xs font-semibold text-slate-900 transition focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-500 tabular-nums placeholder:text-slate-300 min-h-[40px]"
                      />
                    </div>

                    {/* Live Calculated Return Badge */}
                    <div className="w-24 text-right flex-shrink-0">
                      {curVal === null ? (
                        <span className="text-[11px] text-slate-400 italic">Belum diisi</span>
                      ) : isProfit ? (
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-600 tabular-nums">
                            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                            {formatPercent(returnPercent)}
                          </span>
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            +{formatIDR(profit).replace('Rp ', '')}
                          </span>
                        </div>
                      ) : isLoss ? (
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-600 tabular-nums">
                            <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
                            {formatPercent(returnPercent)}
                          </span>
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            {formatIDR(profit)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-600 tabular-nums">
                            <Minus className="h-3 w-3" />
                            0,00%
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums">Rp0</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Calculation Summary Banner */}
        <div className="mt-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-3.5 flex-shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. Total Modal */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Modal
              </span>
              <span className="mt-1 text-xs sm:text-sm font-black text-slate-900 tabular-nums block truncate">
                {formatIDR(totalInvestedAll)}
              </span>
            </div>

            {/* 2. Total Nilai Sekarang */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Nilai Sekarang
              </span>
              <span className="mt-1 text-xs sm:text-sm font-black text-slate-900 tabular-nums block truncate">
                {formatIDR(totalValueAll)}
              </span>
            </div>

            {/* 3. Total Profit / Loss */}
            <div className={`rounded-xl border p-3 shadow-2xs transition-colors ${
              totalProfitAll > 0 
                ? 'border-emerald-200/90 bg-emerald-50/50' 
                : totalProfitAll < 0 
                ? 'border-rose-200/90 bg-rose-50/50' 
                : 'border-slate-200/80 bg-white'
            }`}>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Profit / Loss
              </span>
              <span className={`mt-1 text-xs sm:text-sm font-black tabular-nums block truncate ${
                totalProfitAll > 0 
                  ? 'text-emerald-700' 
                  : totalProfitAll < 0 
                  ? 'text-rose-600' 
                  : 'text-slate-900'
              }`}>
                {totalProfitAll > 0 
                  ? `+${formatIDR(totalProfitAll).replace('Rp ', 'Rp')}` 
                  : formatIDR(totalProfitAll)}
              </span>
            </div>

            {/* 4. Return Portfolio */}
            <div className={`rounded-xl border p-3 shadow-2xs transition-colors ${
              totalReturnPercentAll > 0 
                ? 'border-emerald-200/90 bg-emerald-50/50' 
                : totalReturnPercentAll < 0 
                ? 'border-rose-200/90 bg-rose-50/50' 
                : 'border-slate-200/80 bg-white'
            }`}>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Return Portofolio
              </span>
              <span className={`mt-1 text-xs sm:text-sm font-black tabular-nums block truncate ${
                totalReturnPercentAll > 0 
                  ? 'text-emerald-700' 
                  : totalReturnPercentAll < 0 
                  ? 'text-rose-600' 
                  : 'text-slate-900'
              }`}>
                {formatPercent(totalReturnPercentAll)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-100 flex-shrink-0">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span>Nilai valuasi akan langsung disimpan dan memperbarui performa portofolio.</span>
          </p>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 py-2.5 text-xs sm:text-[13px] font-bold text-white shadow-xs hover:shadow transition-all duration-200 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4 stroke-[2.2]" />
            <span>Simpan Snapshot</span>
          </button>
        </div>
      </div>
    </div>
  );
};

