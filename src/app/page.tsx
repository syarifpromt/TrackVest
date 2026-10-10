'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  Clock, 
  ChevronRight,
  Activity,
  Coins
} from 'lucide-react';
import { 
  Asset, 
  Investment, 
  Snapshot 
} from '../types';
import { 
  getStoredAssets, 
  saveStoredAssets, 
  getStoredInvestments, 
  saveStoredInvestments, 
  getStoredSnapshots, 
  saveStoredSnapshots, 
  getStoredValuations, 
  saveStoredValuations,
  getStoredLastValuationTime,
  saveStoredLastValuationTime,
  getStoredUserName,
  saveStoredUserName,
} from '../lib/storage';
import { 
  computeAssetSummaries, 
  computePortfolioSummary, 
  formatIDR, 
  formatPercent,
  formatShortDate,
  formatRelativeUpdate,
  formatDepositIndicator,
  getFirstName,
} from '../lib/calculations';
import { Navbar, NavTab } from '../components/Navbar';
import { MetricCard } from '../components/MetricCard';
import { AssetAllocationChart } from '../components/AssetAllocationChart';
import { AssetTable } from '../components/AssetTable';
import { PerformanceChart } from '../components/PerformanceChart';
import { RiwayatView } from '../components/RiwayatView';
import { CekPortfolioView } from '../components/CekPortfolioView';
import { AddInvestmentModal } from '../components/Modals/AddInvestmentModal';
import { SnapshotDetailModal } from '../components/Modals/SnapshotDetailModal';
import { ManageAssetsModal } from '../components/Modals/ManageAssetsModal';
import { CheckPortfolioModal } from '../components/Modals/CheckPortfolioModal';
import { EditProfileModal } from '../components/Modals/EditProfileModal';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [valuations, setValuations] = useState<Record<string, number>>({});
  const [lastValuationTime, setLastValuationTime] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Syarif Hidayatullah');

  // 3 Primary Tabs from Stitch
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [isCheckPortfolioOpen, setIsCheckPortfolioOpen] = useState(false);
  const [defaultAssetIdForAdd, setDefaultAssetIdForAdd] = useState<string | undefined>(undefined);
  const [isManageAssetsOpen, setIsManageAssetsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

  // Load state from localStorage on mount
  const refreshData = () => {
    setAssets(getStoredAssets());
    setInvestments(getStoredInvestments());
    setSnapshots(getStoredSnapshots());
    setValuations(getStoredValuations());
    setLastValuationTime(getStoredLastValuationTime());
    setUserName(getStoredUserName());
  };

  const handleSaveUserName = (newName: string) => {
    const clean = newName.trim() || 'Syarif Hidayatullah';
    setUserName(clean);
    saveStoredUserName(clean);
  };

  useEffect(() => {
    refreshData();
    setIsLoaded(true);
  }, []);

  // Compute live calculations
  const summaries = computeAssetSummaries(assets, investments, valuations);
  const portfolioSummary = computePortfolioSummary(summaries);

  // Handlers
  const handleSaveInvestment = (data: {
    assetId: string;
    date: string;
    amount: number;
    note?: string;
  }) => {
    const newInv: Investment = {
      id: `inv-${Date.now()}`,
      assetId: data.assetId,
      date: data.date,
      amount: data.amount,
      note: data.note,
      createdAt: new Date().toISOString(),
    };
    const updated = [newInv, ...investments];
    setInvestments(updated);
    saveStoredInvestments(updated);
  };

  const handleDeleteInvestment = (id: string) => {
    const updated = investments.filter((inv) => inv.id !== id);
    setInvestments(updated);
    saveStoredInvestments(updated);
  };

  const handleSaveSnapshot = (data: {
    date: string;
    valuations: Record<string, number>;
    overwriteExisting: boolean;
  }) => {
    // 1. Update active valuations & last valuation time
    const updatedValuations = { ...valuations, ...data.valuations };
    setValuations(updatedValuations);
    saveStoredValuations(updatedValuations);

    const nowIso = new Date().toISOString();
    saveStoredLastValuationTime(nowIso);
    setLastValuationTime(nowIso);

    // 2. Compute snapshot items per asset
    const snapAssetSummaries = computeAssetSummaries(assets, investments, updatedValuations);
    const snapPortfolio = computePortfolioSummary(snapAssetSummaries);

    const snapshotItems = snapAssetSummaries.map((s) => ({
      assetId: s.assetId,
      assetName: s.name,
      category: s.category,
      investedAmount: s.totalInvested,
      currentValue: s.currentValue || 0,
      profit: s.profit || 0,
      returnPercent: s.returnPercent || 0,
      allocationPercent: s.allocationPercent || 0,
    }));

    const newSnapshot: Snapshot = {
      id: `snapshot-${data.date}`,
      date: data.date,
      totalInvested: snapPortfolio.totalInvested,
      totalValue: snapPortfolio.totalValue,
      totalProfit: snapPortfolio.totalProfit,
      totalReturnPercent: snapPortfolio.totalReturnPercent,
      assets: snapshotItems,
      createdAt: new Date().toISOString(),
    };

    let updatedSnapshots = [...snapshots];
    const existingIndex = updatedSnapshots.findIndex((s) => s.date === data.date);
    if (existingIndex >= 0) {
      updatedSnapshots[existingIndex] = newSnapshot;
    } else {
      updatedSnapshots = [newSnapshot, ...updatedSnapshots];
    }

    setSnapshots(updatedSnapshots);
    saveStoredSnapshots(updatedSnapshots);
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    saveStoredSnapshots(updated);
  };

  const handleAddAsset = (assetData: Omit<Asset, 'id' | 'createdAt'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: `asset-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAssets((prev) => {
      const updated = [...prev, newAsset];
      saveStoredAssets(updated);
      return updated;
    });
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets((prev) => {
      const updated = prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a));
      saveStoredAssets(updated);
      return updated;
    });
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => {
      const updatedAssets = prev.filter((a) => a.id !== id);
      saveStoredAssets(updatedAssets);
      return updatedAssets;
    });

    setInvestments((prev) => {
      const updatedInvestments = prev.filter((inv) => inv.assetId !== id);
      saveStoredInvestments(updatedInvestments);
      return updatedInvestments;
    });

    setValuations((prev) => {
      const updatedValuations = { ...prev };
      delete updatedValuations[id];
      saveStoredValuations(updatedValuations);
      return updatedValuations;
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span>Memuat TrackVest...</span>
        </div>
      </div>
    );
  }

  // Get latest snapshot info for quick stats
  const latestSnapshot = [...snapshots].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  // Get latest investment info for deposit indicator
  const latestInvestment = [...investments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0] || null;
  const latestInvestmentDate = latestInvestment?.date || null;

  const isOverallProfit = portfolioSummary.totalProfit > 0;
  const isOverallLoss = portfolioSummary.totalProfit < 0;

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans">
      {/* Top App Bar Navigation (with Stitch emblem, tabs, and avatar) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={userName}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenAddInvestment={() => {
          setDefaultAssetIdForAdd(undefined);
          setIsAddInvestmentOpen(true);
        }}
        onOpenCheckPortfolio={() => setActiveTab('cek-portfolio')}
        onOpenManageAssets={() => setIsManageAssetsOpen(true)}
        onDataChanged={refreshData}
        transactionCount={investments.length}
        snapshotCount={snapshots.length}
      />

      {/* Main App Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* VIEW 1: DASHBOARD PORTFOLIO */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 1. Greeting Hero Banner */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Halo {getFirstName(userName)}, <span className="text-emerald-700">ringkasan portfolio</span> investasimu hari ini
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-xl font-normal">
                  Pantau pertumbuhan modal, evaluasi performa imbal hasil, dan analisis alokasi aset portofolio investasi Anda secara terstruktur dan presisi.
                </p>
              </div>
            </div>

            {/* Quick Action Shortcuts Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Shortcut 1: Tambah Modal */}
              <button
                type="button"
                onClick={() => {
                  setDefaultAssetIdForAdd(undefined);
                  setIsAddInvestmentOpen(true);
                }}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 text-left shadow-2xs transition-all duration-200 hover:border-emerald-300 hover:shadow-xs hover:bg-emerald-50/20 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Tambah Modal
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Catat setoran dana investasi
                  </div>
                </div>
              </button>

              {/* Shortcut 2: Evaluasi Investasi */}
              <button
                type="button"
                onClick={() => setIsCheckPortfolioOpen(true)}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 text-left shadow-2xs transition-all duration-200 hover:border-emerald-300 hover:shadow-xs hover:bg-emerald-50/20 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CheckCircle2 className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Evaluasi Investasi
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Update snapshot nilai terkini
                  </div>
                </div>
              </button>

              {/* Shortcut 3: Kelola & Tambah Aset */}
              <button
                type="button"
                onClick={() => setIsManageAssetsOpen(true)}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 text-left shadow-2xs transition-all duration-200 hover:border-emerald-300 hover:shadow-xs hover:bg-emerald-50/20 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Coins className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Tambah & Kelola Aset
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Daftar instrumen portofolio
                  </div>
                </div>
              </button>
            </div>

            {/* 2. Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Total Modal */}
              <MetricCard
                title="Total Modal"
                icon={<PiggyBank className="h-4 w-4" />}
                value={formatIDR(portfolioSummary.totalInvested)}
                headerBadge={
                  latestInvestmentDate
                    ? formatDepositIndicator(latestInvestmentDate)
                    : undefined
                }
              />

              {/* Card 2: Nilai Sekarang */}
              <MetricCard
                title="Nilai Sekarang"
                icon={<Wallet className="h-4 w-4" />}
                value={formatIDR(portfolioSummary.totalValue)}
                lastUpdated={
                  portfolioSummary.hasValuation
                    ? formatRelativeUpdate(lastValuationTime || latestSnapshot?.date)
                    : undefined
                }
              />

              {/* Card 3: Profit / Loss */}
              <MetricCard
                title="Profit / Loss"
                icon={<TrendingUp className="h-4 w-4" />}
                value={
                  portfolioSummary.hasValuation
                    ? isOverallProfit
                      ? `+${formatIDR(portfolioSummary.totalProfit)}`
                      : formatIDR(portfolioSummary.totalProfit)
                    : '-'
                }
                variant={
                  portfolioSummary.hasValuation
                    ? isOverallProfit
                      ? 'profit'
                      : isOverallLoss
                        ? 'loss'
                        : 'neutral'
                    : 'default'
                }
              />

              {/* Card 4: Return Portofolio */}
              <MetricCard
                title="Return Portofolio"
                icon={<Activity className="h-4 w-4" />}
                value={
                  portfolioSummary.hasValuation
                    ? formatPercent(portfolioSummary.totalReturnPercent)
                    : '-'
                }
                variant={
                  portfolioSummary.hasValuation
                    ? isOverallProfit
                      ? 'profit'
                      : isOverallLoss
                        ? 'loss'
                        : 'neutral'
                    : 'default'
                }
              />
            </div>

            {/* 3. Hero Trajectory Curve (Full Width 12-cols from Stitch redesign) */}
            <div className="w-full">
              <PerformanceChart snapshots={snapshots} assets={assets} />
            </div>

            {/* 4. Lower Section: 2 Columns (Alokasi Donut & Daftar Aset) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Column (5 of 12 cols): Donut Alokasi & Breakdown */}
              <div className="lg:col-span-5 space-y-6">
                <AssetAllocationChart
                  summaries={summaries}
                  totalInvested={portfolioSummary.totalInvested}
                  totalValue={portfolioSummary.totalValue}
                  latestSnapshot={latestSnapshot}
                  lastValuationTime={lastValuationTime}
                  latestInvestmentDate={latestInvestmentDate}
                  onOpenCheckPortfolio={() => setIsCheckPortfolioOpen(true)}
                  onOpenAddInvestment={() => {
                    setDefaultAssetIdForAdd(undefined);
                    setIsAddInvestmentOpen(true);
                  }}
                />


              </div>

              {/* Right Column (7 of 12 cols): Main Asset Table */}
              <div className="lg:col-span-7 space-y-6">
                <AssetTable
                  summaries={summaries}
                  onQuickUpdateValuation={() => setIsCheckPortfolioOpen(true)}
                  onAddInvestmentForAsset={(assetId) => {
                    setDefaultAssetIdForAdd(assetId);
                    setIsAddInvestmentOpen(true);
                  }}
                  onOpenManageAssets={() => setIsManageAssetsOpen(true)}
                />


              </div>
            </div>


          </div>
        )}

        {/* VIEW 2: CEK & PERBARUI NILAI PORTFOLIO (from Stitch cek_redesign.png) */}
        {activeTab === 'cek-portfolio' && (
          <CekPortfolioView
            assets={assets}
            investments={investments}
            currentValuations={valuations}
            snapshots={snapshots}
            lastValuationTime={lastValuationTime}
            onSaveSnapshot={handleSaveSnapshot}
            onOpenManageAssets={() => setIsManageAssetsOpen(true)}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {/* VIEW 3: RIWAYAT & CATATAN HISTORI */}
        {activeTab === 'riwayat' && (
          <RiwayatView
            assets={assets}
            investments={investments}
            snapshots={snapshots}
            onDeleteInvestment={handleDeleteInvestment}
            onDeleteSnapshot={handleDeleteSnapshot}
            onOpenAddInvestment={() => {
              setDefaultAssetIdForAdd(undefined);
              setIsAddInvestmentOpen(true);
            }}
            onOpenCheckPortfolio={() => setActiveTab('cek-portfolio')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-center">
          <p>© {new Date().getFullYear()} TrackVest — Buku Catatan Portfolio Pribadi • {userName}</p>
        </div>
      </footer>

      {/* Modals */}
      <AddInvestmentModal
        isOpen={isAddInvestmentOpen}
        onClose={() => setIsAddInvestmentOpen(false)}
        assets={assets}
        investments={investments}
        defaultAssetId={defaultAssetIdForAdd}
        onSave={handleSaveInvestment}
        onOpenManageAssets={() => {
          setIsAddInvestmentOpen(false);
          setIsManageAssetsOpen(true);
        }}
      />

      <SnapshotDetailModal
        snapshot={selectedSnapshot}
        onClose={() => setSelectedSnapshot(null)}
        onDelete={handleDeleteSnapshot}
      />

      <ManageAssetsModal
        isOpen={isManageAssetsOpen}
        onClose={() => setIsManageAssetsOpen(false)}
        assets={assets}
        investments={investments}
        onAddAsset={handleAddAsset}
        onUpdateAsset={handleUpdateAsset}
        onDeleteAsset={handleDeleteAsset}
      />

      <CheckPortfolioModal
        isOpen={isCheckPortfolioOpen}
        onClose={() => setIsCheckPortfolioOpen(false)}
        assets={assets}
        investments={investments}
        currentValuations={valuations}
        snapshots={snapshots}
        onSaveSnapshot={handleSaveSnapshot}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentName={userName}
        onSave={handleSaveUserName}
      />
    </div>
  );
}
