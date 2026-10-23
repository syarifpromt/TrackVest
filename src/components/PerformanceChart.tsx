'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, Compass } from 'lucide-react';
import { Snapshot, Asset } from '../types';
import { formatShortDate, formatDate, formatIDR } from '../lib/calculations';
import { AssetIcon } from './AssetIcon';

interface PerformanceChartProps {
  snapshots: Snapshot[];
  assets?: Asset[];
  onOpenCheckPortfolio?: () => void;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  snapshots,
  assets = [],
  onOpenCheckPortfolio 
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('all');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  // Sort snapshots chronologically
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const selectedAsset = selectedAssetId !== 'all' ? assets.find((a) => a.id === selectedAssetId) : null;
  const chartColor = selectedAsset?.color || '#10B981';

  // If no snapshots, show a clean placeholder
  if (sortedSnapshots.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Grafik Perkembangan Portfolio</h3>
              <p className="text-xs text-slate-500">Historis trajectory return berdasarkan milestone snapshot berkala</p>
            </div>
          </div>
        </div>
        <div className="py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">Belum ada snapshot tersimpan</p>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Klik tombol &quot;Cek Portfolio&quot; untuk mencatat evaluasi pertama Anda dan memulai grafik perkembangan.
          </p>
        </div>
      </div>
    );
  }

  // Create chart milestones:
  interface ChartMilestone {
    id: string;
    label: string;
    date: string;
    displayDate: string;
    shortDate: string;
    totalInvested: number;
    totalValue: number;
    profit: number;
    returnPercent: number;
    isBaseline?: boolean;
  }

  const milestones: ChartMilestone[] = [];
  const firstSnap = sortedSnapshots[0];

  if (!selectedAsset) {
    // 1. ALL PORTFOLIO
    milestones.push({
      id: 'baseline',
      label: 'Titik Awal (Baseline Modal)',
      date: 'Modal Awal',
      displayDate: 'Modal Awal',
      shortDate: 'Modal Awal',
      totalInvested: firstSnap.totalInvested,
      totalValue: firstSnap.totalInvested,
      profit: 0,
      returnPercent: 0,
      isBaseline: true,
    });

    sortedSnapshots.forEach((snap, idx) => {
      const isLatest = idx === sortedSnapshots.length - 1;
      milestones.push({
        id: snap.id,
        label: isLatest ? 'Status Terkini' : `Snapshot #${idx + 1}`,
        date: snap.date,
        displayDate: formatDate(snap.date),
        shortDate: formatShortDate(snap.date),
        totalInvested: snap.totalInvested,
        totalValue: snap.totalValue,
        profit: snap.totalProfit,
        returnPercent: snap.totalReturnPercent,
      });
    });
  } else {
    // 2. SPECIFIC ASSET
    const firstItem = firstSnap.assets?.find((a) => a.assetId === selectedAsset.id);
    const firstInvested = firstItem ? firstItem.investedAmount : 0;

    milestones.push({
      id: 'baseline',
      label: `Titik Awal ${selectedAsset.name}`,
      date: 'Modal Awal',
      displayDate: 'Modal Awal',
      shortDate: 'Modal Awal',
      totalInvested: firstInvested,
      totalValue: firstInvested,
      profit: 0,
      returnPercent: 0,
      isBaseline: true,
    });

    sortedSnapshots.forEach((snap, idx) => {
      const isLatest = idx === sortedSnapshots.length - 1;
      const item = snap.assets?.find((a) => a.assetId === selectedAsset.id);
      const invested = item ? item.investedAmount : 0;
      const value = item ? item.currentValue : 0;
      const profit = item ? item.profit : 0;
      const returnPercent = item ? item.returnPercent : 0;

      milestones.push({
        id: snap.id,
        label: isLatest ? `Status Terkini ${selectedAsset.name}` : `Snapshot #${idx + 1}`,
        date: snap.date,
        displayDate: formatDate(snap.date),
        shortDate: formatShortDate(snap.date),
        totalInvested: invested,
        totalValue: value,
        profit: profit,
        returnPercent: returnPercent,
      });
    });
  }

  // Check if asset has valid snapshot data
  const hasAssetData = selectedAsset
    ? milestones.some((m) => !m.isBaseline && (m.totalInvested > 0 || m.totalValue > 0))
    : true;

  // SVG Geometry
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 60;
  const paddingTop = 25;
  const paddingBottom = 45;

  const returnValues = milestones.map((m) => m.returnPercent);
  const minVal = Math.min(...returnValues, 0);
  const maxVal = Math.max(...returnValues, 1);
  const range = (maxVal - minVal) || 1;

  // Calculate coordinates
  const coords = milestones.map((m, i) => {
    const x = paddingX + (i / Math.max(1, milestones.length - 1)) * (svgWidth - 2 * paddingX);
    const normalizedY = (m.returnPercent - minVal) / range;
    const y = svgHeight - paddingBottom - normalizedY * (svgHeight - paddingTop - paddingBottom);
    return { x, y, milestone: m };
  });

  // Build smooth bezier curve
  let curveD = `M ${coords[0]?.x ?? paddingX} ${coords[0]?.y ?? (svgHeight - paddingBottom)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? i : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    curveD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // Area under curve
  const areaD = coords.length > 0 
    ? `${curveD} L ${coords[coords.length - 1].x} ${svgHeight - paddingBottom} L ${coords[0].x} ${svgHeight - paddingBottom} Z`
    : '';

  // Default active point is the latest actual snapshot
  const defaultPointIndex = milestones.length - 1;
  const currentPointIndex = hoveredPoint !== null
    ? hoveredPoint
    : selectedPoint !== null
    ? selectedPoint
    : defaultPointIndex;

  const activeMilestone = milestones[currentPointIndex] || milestones[defaultPointIndex] || milestones[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      {/* Header Bar with Title and Asset Dropdown Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-white font-bold transition-colors flex-shrink-0"
            style={{ 
              backgroundColor: selectedAsset ? selectedAsset.color : '#059669',
              borderColor: selectedAsset ? `${selectedAsset.color}40` : '#10b981'
            }}
          >
            {selectedAsset ? (
              <AssetIcon name={selectedAsset.name} category={selectedAsset.category} icon={selectedAsset.icon} size={20} />
            ) : (
              <TrendingUp className="h-4 w-4 stroke-[2.5]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {selectedAsset ? `Performa ${selectedAsset.name}` : 'Grafik Perkembangan Portfolio'}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {selectedAsset 
                ? `Historis trajectory return aset ${selectedAsset.name} per milestone`
                : 'Historis trajectory return berdasarkan milestone snapshot berkala'}
            </p>
          </div>
        </div>

        {/* Dropdown Pemilih Aset */}
        {assets.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setSelectedPoint(null);
                  setHoveredPoint(null);
                }}
                className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none cursor-pointer transition"
              >
                <option value="all">Semua Portofolio (Total)</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.category})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {!hasAssetData ? (
        <div className="py-14 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            {selectedAsset && (
              <AssetIcon name={selectedAsset.name} category={selectedAsset.category} icon={selectedAsset.icon} size={32} />
            )}
          </div>
          <p className="text-sm font-bold text-slate-800">
            Belum ada rekaman snapshot untuk {selectedAsset?.name}
          </p>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Aset ini belum pernah dicatat dalam snapshot evaluasi. Perbarui nilainya di tab Cek Portofolio untuk mulai melihat grafik tren.
          </p>
        </div>
      ) : (
        <>
          {/* Dynamic Live Price & Profit Indicator (Top-Left of Chart) */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mt-4 sm:mt-5 mb-1 sm:mb-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-400">
                  {activeMilestone.isBaseline ? `Modal Awal ${selectedAsset ? selectedAsset.name : ''}` : `Di update : ${activeMilestone.displayDate}`}
                </span>
                {activeMilestone.isBaseline && (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    Modal Awal
                  </span>
                )}
              </div>

              {/* Nilai Porto (Rp...) */}
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums truncate" title={formatIDR(activeMilestone.totalValue)}>
                {formatIDR(activeMilestone.totalValue)}
              </div>

              {/* Di bawahnya: +- Rp... (+-%) */}
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold tabular-nums px-2.5 py-1 rounded-md transition-colors ${
                    activeMilestone.profit > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                      : activeMilestone.profit < 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {activeMilestone.profit > 0 && <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />}
                  {activeMilestone.profit < 0 && <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />}
                  <span className="break-all">
                    {activeMilestone.profit > 0
                      ? `+${formatIDR(activeMilestone.profit)} (+${activeMilestone.returnPercent.toFixed(2).replace('.', ',')}%)`
                      : activeMilestone.profit < 0
                      ? `-${formatIDR(Math.abs(activeMilestone.profit))} (${activeMilestone.returnPercent.toFixed(2).replace('.', ',')}%)`
                      : `Rp 0 (0,00%)`}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Hero Graph Canvas directly underneath */}
          <div className="relative mt-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 sm:h-56 overflow-visible select-none"
            >
              <defs>
                {/* Dynamic Gradient based on asset color */}
                <linearGradient id="chartHeroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity="0.22" />
                  <stop offset="60%" stopColor={chartColor} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="strokeLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={chartColor} />
                  <stop offset="100%" stopColor={chartColor} />
                </linearGradient>
              </defs>

              {/* Baseline Grid Line */}
              <line
                x1={paddingX - 20}
                y1={svgHeight - paddingBottom}
                x2={svgWidth - paddingX + 20}
                y2={svgHeight - paddingBottom}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Soft Filled Area */}
              <path d={areaD} fill="url(#chartHeroGradient)" />

              {/* Smooth Trajectory Curve */}
              <path
                d={curveD}
                fill="none"
                stroke="url(#strokeLineGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Milestone Nodes & Vertical Drop Guides */}
              {coords.map((pt, idx) => {
                const isActive = idx === currentPointIndex;
                const isBase = pt.milestone.isBaseline;

                return (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => setSelectedPoint(idx)}
                  >
                    {/* Expanded Hit Target */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={22}
                      fill="transparent"
                      className="cursor-pointer"
                    />

                    {/* Vertical Drop Line */}
                    <line
                      x1={pt.x}
                      y1={pt.y}
                      x2={pt.x}
                      y2={svgHeight - paddingBottom}
                      stroke={isActive ? chartColor : '#CBD5E1'}
                      strokeDasharray={isActive ? 'none' : '3 3'}
                      strokeWidth={isActive ? 1.5 : 1}
                      opacity={isActive ? 0.9 : 0.4}
                      className="transition-all duration-200"
                    />

                    {/* Outer Glow Halo for Active Point */}
                    {isActive && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12}
                        fill={chartColor}
                        fillOpacity="0.2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node Center Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 7 : isBase ? 5 : 5.5}
                      fill={isBase ? '#0F172A' : '#FFFFFF'}
                      stroke={isBase ? '#0F172A' : chartColor}
                      strokeWidth={isActive ? 3 : 2}
                      className="transition-all duration-200"
                    />

                    {/* X-Axis Date / Milestone Label */}
                    <text
                      x={pt.x}
                      y={svgHeight - 14}
                      textAnchor="middle"
                      className={`text-[10px] tabular-nums select-none transition-all ${
                        isActive
                          ? 'font-extrabold fill-slate-900'
                          : 'font-medium fill-slate-400 group-hover:fill-slate-700'
                      }`}
                    >
                      {pt.milestone.shortDate}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend Row under the Chart */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-900 inline-block" />
                <span>Titik Awal (Baseline Modal)</span>
              </div>

              {milestones.length > 2 && (
                <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-medium">
                  <Compass className="h-3.5 w-3.5 text-slate-400" />
                  <span>Snapshot Menengah</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 font-bold" style={{ color: chartColor }}>
                <span 
                  className="h-2.5 w-2.5 rounded-full inline-block" 
                  style={{ backgroundColor: chartColor }}
                />
                <span>Status Terkini</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
