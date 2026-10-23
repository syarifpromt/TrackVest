'use client';

import React, { useState } from 'react';
import { 
  PieChart, 
  Info, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  Wallet, 
  Sparkles,
  Calendar,
  Plus
} from 'lucide-react';
import { AssetSummary, Snapshot } from '../types';
import { 
  formatIDR, 
  formatCompactIDR, 
  formatRelativeUpdate, 
  formatDate,
  formatShortDate,
  formatPercent 
} from '../lib/calculations';
import { AssetIcon } from './AssetIcon';

interface AssetAllocationChartProps {
  summaries: AssetSummary[];
  totalInvested: number;
  totalValue: number;
  latestSnapshot?: Snapshot | null;
  lastValuationTime?: string | null;
  latestInvestmentDate?: string | null;
  onOpenCheckPortfolio?: () => void;
  onOpenAddInvestment?: () => void;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  summaries,
  totalInvested,
  totalValue,
  latestSnapshot,
  lastValuationTime,
  latestInvestmentDate,
  onOpenCheckPortfolio,
  onOpenAddInvestment,
}) => {
  // Mode: 'snapshot' (market value / valuation) vs 'modal' (invested capital)
  const [allocationMode, setAllocationMode] = useState<'snapshot' | 'modal'>('snapshot');
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);

  const isSnapshotMode = allocationMode === 'snapshot';
  const basisTotal = isSnapshotMode ? totalValue : totalInvested;

  // Filter evaluated or invested assets with value > 0 in this mode
  const validAssets = summaries.filter((s) => {
    if (isSnapshotMode) {
      return s.currentValue !== null && s.currentValue > 0;
    }
    return s.totalInvested > 0;
  });

  const hasData = validAssets.length > 0 && basisTotal > 0;

  // Calculate SVG donut segments
  const size = 170;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const segments = validAssets.map((asset) => {
    const rawVal = isSnapshotMode ? (asset.currentValue || 0) : asset.totalInvested;
    const percent = basisTotal > 0 ? (rawVal / basisTotal) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);

    // Calculate radial pop-out angle in the local coordinate space of rotate(-90)
    const startPercent = accumulatedPercent;
    const endPercent = accumulatedPercent + percent;
    const midPercent = (startPercent + endPercent) / 2;
    const midAngleRad = (midPercent / 100) * 2 * Math.PI;

    // Radial pop-out displacement distance in pixels
    const popDistance = 6;
    const dx = validAssets.length > 1 ? Math.cos(midAngleRad) * popDistance : 0;
    const dy = validAssets.length > 1 ? Math.sin(midAngleRad) * popDistance : 0;

    accumulatedPercent += percent;

    // Drift calculation: shift in portfolio weight between snapshot value and modal capital
    const modalPercent = totalInvested > 0 ? (asset.totalInvested / totalInvested) * 100 : 0;
    const snapshotPercent = totalValue > 0 && asset.currentValue !== null ? (asset.currentValue / totalValue) * 100 : 0;
    const drift = snapshotPercent - modalPercent;

    return {
      ...asset,
      displayValue: rawVal,
      percent,
      modalPercent,
      snapshotPercent,
      drift,
      strokeDasharray,
      strokeDashoffset,
      dx,
      dy,
    };
  });

  const activeAsset = hoveredAssetId
    ? segments.find((a) => a.assetId === hoveredAssetId)
    : null;

  // Last update caption
  const updateRelativeText = formatRelativeUpdate(lastValuationTime || latestSnapshot?.date);
  const snapshotDateText = latestSnapshot?.date ? formatShortDate(latestSnapshot.date) : null;
  const snapshotRawDate = latestSnapshot?.date || (lastValuationTime ? lastValuationTime.split('T')[0] : null);
  const snapshotDateFormatted = snapshotRawDate ? formatDate(snapshotRawDate) : 'Hari ini';
  const depositDateFormatted = latestInvestmentDate ? formatDate(latestInvestmentDate) : '15 Januari 2026';

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Alokasi Portfolio</h3>
            <p className="text-[11px] text-slate-400">Komposisi bobot instrumen investasi</p>
          </div>
        </div>
      </div>

      {/* 2. Mode Switcher Tabs: Alokasi Snapshot vs Alokasi Modal */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-bold">
        <button
          type="button"
          onClick={() => setAllocationMode('snapshot')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all active:scale-[0.98] ${
            isSnapshotMode
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Alokasi Snapshot</span>
        </button>
        <button
          type="button"
          onClick={() => setAllocationMode('modal')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all active:scale-[0.98] ${
            !isSnapshotMode
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="h-3.5 w-3.5 text-slate-600" />
          <span>Alokasi Modal</span>
        </button>
      </div>

      {/* 3. Contextual Subtitle Banner */}
      {isSnapshotMode ? (
        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-emerald-50/50 rounded-xl px-3 py-2 border border-emerald-100/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="truncate">
              Di update : <strong className="text-slate-900">{snapshotDateFormatted}</strong>
            </span>
          </div>
          {onOpenCheckPortfolio && (
            <button
              type="button"
              onClick={onOpenCheckPortfolio}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 text-[11px] flex-shrink-0 ml-2"
            >
              <span>Perbarui</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-emerald-50/50 rounded-xl px-3 py-2 border border-emerald-100/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="truncate">
              Di update : <strong className="text-slate-900">{depositDateFormatted}</strong>
            </span>
          </div>
          {onOpenAddInvestment && (
            <button
              type="button"
              onClick={onOpenAddInvestment}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-[11px] flex-shrink-0 ml-2"
            >
              <Plus className="h-3 w-3" />
              <span>Tambah Modal</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Donut Chart & Visual Progress Bar */}
      {!hasData ? (
        <div className="my-8 flex flex-col items-center justify-center text-center py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100 mb-3">
            <Info className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {isSnapshotMode ? 'Belum ada estimasi nilai snapshot' : 'Belum ada modal tercatat'}
          </p>
          <p className="mt-1 text-xs text-slate-400 max-w-xs">
            {isSnapshotMode
              ? 'Masukkan estimasi nilai terkini pada menu "Cek Portfolio" untuk mengaktifkan alokasi nilai snapshot.'
              : 'Catat transaksi investasi pertama Anda untuk melihat distribusi modal pokok.'}
          </p>
        </div>
      ) : (
        <div>
          <div className="my-3 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <svg
                width={size}
                height={size}
                viewBox={`-10 -10 ${size + 20} ${size + 20}`}
                className="overflow-visible select-none"
              >
                <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                  {/* Background track ring */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth={strokeWidth}
                  />

                  {/* 1. Visual Animated Segments (pointer-events-none prevents jitter & flickering) */}
                  {segments.map((seg) => {
                    const isHovered = hoveredAssetId === seg.assetId;
                    const isAnyHovered = Boolean(hoveredAssetId);

                    return (
                      <circle
                        key={`vis-${seg.assetId}`}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        style={{
                          transform: isHovered
                            ? validAssets.length === 1
                              ? 'scale(1.03)'
                              : `translate(${seg.dx.toFixed(2)}px, ${seg.dy.toFixed(2)}px)`
                            : 'none',
                          transformOrigin: `${size / 2}px ${size / 2}px`,
                          opacity: isAnyHovered && !isHovered ? 0.35 : 1,
                          filter: isHovered
                            ? 'drop-shadow(0px 3px 6px rgba(0,0,0,0.22))'
                            : 'none',
                          transition: 'all 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                        className="pointer-events-none"
                      />
                    );
                  })}

                  {/* 2. Stationary Rock-Solid Hit Targets (stroke-only, fill="none" prevents center hole hijacking) */}
                  {segments.map((seg) => (
                    <circle
                      key={`hit-${seg.assetId}`}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={strokeWidth + 4}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      style={{ pointerEvents: 'stroke' }}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredAssetId(seg.assetId)}
                      onMouseLeave={() => setHoveredAssetId(null)}
                    />
                  ))}

                  {/* 3. Center Hole Safe Zone (Moving to center immediately clears hovered segment) */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius - strokeWidth / 2}
                    fill="transparent"
                    style={{ pointerEvents: 'all' }}
                    onMouseEnter={() => setHoveredAssetId(null)}
                  />
                </g>
              </svg>

              {/* Center Display in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {activeAsset ? (
                  <>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[110px]">
                      {activeAsset.name}
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                      {activeAsset.percent.toFixed(1).replace('.', ',')}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 tabular-nums">
                      {formatCompactIDR(activeAsset.displayValue)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {isSnapshotMode ? 'NILAI SNAPSHOT' : 'TOTAL MODAL'}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      {formatCompactIDR(basisTotal)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Multi-segment Progress Bar from Stitch redesign */}
            <div className="w-full mt-4">
              <div className="h-2.5 w-full rounded-full bg-slate-100 flex overflow-hidden">
                {segments.map((seg) => (
                  <div
                    key={seg.assetId}
                    style={{
                      width: `${seg.percent}%`,
                      backgroundColor: seg.color,
                    }}
                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                    title={`${seg.name}: ${seg.percent.toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 5. Asset Breakdown List */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            {segments.map((seg) => {
              const isHovered = hoveredAssetId === seg.assetId;

              return (
                <div
                  key={seg.assetId}
                  onMouseEnter={() => setHoveredAssetId(seg.assetId)}
                  onMouseLeave={() => setHoveredAssetId(null)}
                  className={`flex items-center justify-between gap-2 rounded-xl p-2.5 transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-50 ring-1 ring-emerald-200'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AssetIcon name={seg.name} category={seg.category} icon={seg.icon} color={seg.color} size={28} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[130px] sm:max-w-none">
                          {seg.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <p className="text-[10px] text-slate-400 capitalize">
                          {seg.category}
                        </p>
                        {isSnapshotMode && seg.profit !== null && seg.returnPercent !== null && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded truncate max-w-[140px] ${
                              seg.profit > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : seg.profit < 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {seg.profit > 0
                              ? `+${seg.returnPercent.toFixed(1).replace('.', ',')}%`
                              : seg.profit < 0
                              ? `${seg.returnPercent.toFixed(1).replace('.', ',')}%`
                              : `0,0%`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-1">
                    <p className="text-xs font-bold text-slate-900 tabular-nums">
                      {seg.percent.toFixed(1).replace('.', ',')}%
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {formatIDR(seg.displayValue)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
