'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  Trash2, 
  Calendar, 
  FileText, 
  Search, 
  Download, 
  CheckCircle2, 
  Plus, 
  Layers,
  Coins,
  ChevronRight
} from 'lucide-react';
import { Asset, Investment, Snapshot } from '../types';
import { formatDate, formatShortDate, formatIDR, formatPercent } from '../lib/calculations';
import { AssetIcon } from './AssetIcon';

interface RiwayatViewProps {
  assets: Asset[];
  investments: Investment[];
  snapshots: Snapshot[];
  onDeleteInvestment: (id: string) => void;
  onDeleteSnapshot?: (id: string) => void;
  onSelectSnapshot?: (snapshot: Snapshot) => void;
  onOpenAddInvestment: () => void;
  onOpenCheckPortfolio: () => void;
}

export const RiwayatView: React.FC<RiwayatViewProps> = ({
  assets,
  investments,
  snapshots,
  onDeleteInvestment,
  onDeleteSnapshot,
  onOpenAddInvestment,
  onOpenCheckPortfolio,
}) => {
  const [subTab, setSubTab] = useState<'snapshot' | 'investasi'>('snapshot');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map asset lookup for quick metadata
  const assetMap = new Map<string, Asset>();
  assets.forEach((a) => assetMap.set(a.id, a));

  // Sort snapshots newest first
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Active selected snapshot (default to latest or first)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    sortedSnapshots[0]?.id || ''
  );

  // Fallback if selected snapshot was deleted
  const activeSnapshot = sortedSnapshots.find((s) => s.id === selectedSnapshotId) || sortedSnapshots[0];

  // Sort investments newest first
  const sortedInvestments = [...investments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Filtered investments
  const filteredInvestments = sortedInvestments.filter((inv) => {
    if (selectedAssetFilter !== 'all' && inv.assetId !== selectedAssetFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const assetName = assetMap.get(inv.assetId)?.name.toLowerCase() || '';
      const note = (inv.note || '').toLowerCase();
      return assetName.includes(q) || note.includes(q);
    }
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (subTab === 'snapshot') {
      csvContent += 'Tanggal,Total Investasi,Total Nilai,Total Profit,Return Persen,Jumlah Aset\n';
      sortedSnapshots.forEach((s) => {
        csvContent += `"${s.date}","${s.totalInvested}","${s.totalValue}","${s.totalProfit}","${s.totalReturnPercent}%","${s.assets.length}"\n`;
      });
    } else {
      csvContent += 'Tanggal,Aset,Kategori,Nominal,Catatan\n';
      sortedInvestments.forEach((i) => {
        const asset = assetMap.get(i.assetId);
        csvContent += `"${i.date}","${asset?.name || ''}","${asset?.category || ''}","${i.amount}","${i.note || ''}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trackvest-${subTab}-ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDeleteSnapshot = (id: string, date: string) => {
    if (confirm(`Hapus snapshot tanggal ${formatDate(date)}? Tindakan ini tidak dapat dibatalkan.`)) {
      if (onDeleteSnapshot) {
        onDeleteSnapshot(id);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header with Title & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat & Histori Portofolio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lihat arsip rekam jejak evaluasi snapshot portofolio dan riwayat penambahan modal.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export {subTab === 'snapshot' ? 'Snapshot' : 'Modal'} (.CSV)</span>
        </button>
      </div>

      {/* 2. Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setSubTab('snapshot')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            subTab === 'snapshot'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Snapshot Portofolio</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
            subTab === 'snapshot' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {snapshots.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('investasi')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            subTab === 'investasi'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Coins className="h-3.5 w-3.5" />
          <span>Riwayat Tambah Modal</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
            subTab === 'investasi' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {investments.length}
          </span>
        </button>
      </div>

      {/* 3. TAB 1: SNAPSHOT PORTOFOLIO */}
      {subTab === 'snapshot' && (
        sortedSnapshots.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-4">
              <Camera className="h-7 w-7" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Belum Ada Snapshot Tersimpan</h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Simpan snapshot evaluasi pertama Anda melalui menu Cek Portofolio untuk merekam kondisi nilai portofolio.
            </p>
            <button
              onClick={onOpenCheckPortfolio}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Cek Portofolio Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left Column (5 of 12 cols): Snapshot Cards List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Daftar Snapshot ({sortedSnapshots.length})</span>
                </span>
                <span className="text-slate-400 text-[11px]">Terbaru di atas</span>
              </div>

              <div className="space-y-2.5">
                {sortedSnapshots.map((snap, index) => {
                  const isSelected = activeSnapshot?.id === snap.id;
                  const isLatest = index === 0;
                  const isProfit = snap.totalProfit >= 0;

                  return (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshotId(snap.id)}
                      className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/20 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0 ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-slate-900">
                                {formatDate(snap.date)}
                              </span>
                              {isLatest && (
                                <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-bold">
                                  Terbaru
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {snap.assets.length} Aset Portofolio
                            </span>
                          </div>
                        </div>

                        <ChevronRight className={`h-4 w-4 transition-colors ${
                          isSelected ? 'text-emerald-700' : 'text-slate-300'
                        }`} />
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total Nilai</span>
                          <span className="font-extrabold text-slate-900 tabular-nums">
                            {formatIDR(snap.totalValue)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Profit / Loss</span>
                          <span className={`font-bold tabular-nums ${
                            isProfit ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {isProfit ? `+${formatIDR(snap.totalProfit)}` : formatIDR(snap.totalProfit)} ({formatPercent(snap.totalReturnPercent)})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (7 of 12 cols, Sticky): DETAIL SNAPSHOT TERPILIH */}
            {activeSnapshot && (
              <div className="lg:col-span-7 lg:sticky lg:top-6 space-y-4">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                  {/* Panel Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-emerald-700" />
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          Detail Snapshot: {formatDate(activeSnapshot.date)}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Rekaman evaluasi portofolio per {formatShortDate(activeSnapshot.date)}
                      </p>
                    </div>

                    {/* Hapus Snapshot Button */}
                    {onDeleteSnapshot && (
                      <button
                        onClick={() => confirmDeleteSnapshot(activeSnapshot.id, activeSnapshot.date)}
                        title="Hapus Snapshot Ini"
                        className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* 4-Card Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Total Modal
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums block mt-0.5">
                        {formatIDR(activeSnapshot.totalInvested)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Nilai Porto
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums block mt-0.5">
                        {formatIDR(activeSnapshot.totalValue)}
                      </span>
                    </div>

                    <div className={`rounded-xl p-3 border ${
                      activeSnapshot.totalProfit >= 0
                        ? 'bg-emerald-50/70 border-emerald-200/70'
                        : 'bg-rose-50/70 border-rose-200/70'
                    }`}>
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">
                        Profit / Loss
                      </span>
                      <span className={`text-xs sm:text-sm font-extrabold tabular-nums block mt-0.5 ${
                        activeSnapshot.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {activeSnapshot.totalProfit >= 0 ? `+${formatIDR(activeSnapshot.totalProfit)}` : formatIDR(activeSnapshot.totalProfit)}
                      </span>
                    </div>

                    <div className={`rounded-xl p-3 border ${
                      activeSnapshot.totalReturnPercent >= 0
                        ? 'bg-emerald-50/70 border-emerald-200/70'
                        : 'bg-rose-50/70 border-rose-200/70'
                    }`}>
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">
                        Return
                      </span>
                      <span className={`text-xs sm:text-sm font-extrabold tabular-nums block mt-0.5 ${
                        activeSnapshot.totalReturnPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {formatPercent(activeSnapshot.totalReturnPercent)}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Alokasi Aset */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        Komposisi Aset ({activeSnapshot.assets.length})
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">Nilai & Return</span>
                    </div>

                    <div className="space-y-2.5">
                      {activeSnapshot.assets.map((item) => {
                        const assetMeta = assetMap.get(item.assetId);
                        const isProfit = item.profit >= 0;

                        return (
                          <div
                            key={item.assetId}
                            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <AssetIcon name={item.assetName} category={item.category} icon={item.icon} size={32} />
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block">
                                    {item.assetName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 capitalize block">
                                    {item.category}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-900 tabular-nums block">
                                  {formatIDR(item.currentValue)}
                                </span>
                                <span className={`text-[10px] font-semibold tabular-nums ${
                                  isProfit ? 'text-emerald-700' : 'text-rose-700'
                                }`}>
                                  {formatPercent(item.returnPercent)} ({isProfit ? `+${formatIDR(item.profit)}` : formatIDR(item.profit)})
                                </span>
                              </div>
                            </div>

                            {/* Allocation Bar */}
                            <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                              <div
                                style={{
                                  width: `${item.allocationPercent}%`,
                                  backgroundColor: assetMeta?.color || '#059669',
                                }}
                                className="h-full rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* 4. TAB 2: RIWAYAT TAMBAH MODAL */}
      {subTab === 'investasi' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filter, and Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi atau catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none w-56 font-medium"
                />
              </div>

              <select
                value={selectedAssetFilter}
                onChange={(e) => setSelectedAssetFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Aset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenAddInvestment}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition active:scale-95 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Tambah Modal</span>
            </button>
          </div>

          {/* List of Investments */}
          {filteredInvestments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3">
                <Coins className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Tidak ada riwayat setoran ditemukan</h4>
              <p className="mt-1 text-xs text-slate-400">
                Belum ada penambahan modal atau tidak ada yang sesuai dengan pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
              {filteredInvestments.map((inv) => {
                const asset = assetMap.get(inv.assetId);
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <AssetIcon name={asset?.name || 'Aset'} category={asset?.category} icon={asset?.icon} size={36} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {asset?.name || 'Aset'}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 uppercase">
                            {asset?.category || 'Umum'}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(inv.date)}
                          </span>
                        </div>
                        {inv.note && (
                          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span>{inv.note}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-800 tabular-nums">
                        +{formatIDR(inv.amount)}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus transaksi ${asset?.name} sebesar ${formatIDR(inv.amount)}?`)) {
                            onDeleteInvestment(inv.id);
                          }
                        }}
                        title="Hapus transaksi"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
