'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  History, 
  LayoutDashboard, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw,
  Coins,
  User
} from 'lucide-react';
import { exportAllData, importAllData, resetToDefaultData } from '../lib/storage';
import { getUserInitials } from '../lib/calculations';

export type NavTab = 'dashboard' | 'cek-portfolio' | 'riwayat';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  userName?: string;
  onOpenEditProfile?: () => void;
  onOpenAddInvestment?: () => void;
  onOpenCheckPortfolio?: () => void;
  onOpenManageAssets: () => void;
  onDataChanged: () => void;
  transactionCount: number;
  snapshotCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userName,
  onOpenEditProfile,
  onOpenAddInvestment,
  onOpenCheckPortfolio,
  onOpenManageAssets,
  onDataChanged,
  transactionCount,
  snapshotCount,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleExport = () => {
    const dataStr = exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackvest-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowSettings(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text && importAllData(text)) {
          alert('Data berhasil diimpor!');
          onDataChanged();
        } else {
          alert('Gagal mengimpor file. Pastikan format JSON valid.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setShowSettings(false);
  };

  const handleReset = () => {
    if (confirm('Kosongkan seluruh data portofolio? Semua aset, transaksi, dan riwayat snapshot akan dihapus.')) {
      resetToDefaultData();
      onDataChanged();
      setShowSettings(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6">
          {/* Brand Logo & Title (matching Stitch emblem) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
            >
              {/* Stitch Minimalist Logo Reference */}
              <img
                src="/icons/logo-badge.png"
                alt="TrackVest"
                width={38}
                height={38}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl object-contain shadow-xs transition-transform group-hover:scale-105 flex-shrink-0"
              />
              <div>
                <div className="flex items-baseline">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Track</span>
                  <span className="text-lg sm:text-xl font-black tracking-tight text-[#0D6E5B]">Vest</span>
                </div>
                <p className="hidden text-[10px] font-semibold text-slate-400 sm:block leading-none -mt-0.5 tracking-tight">
                  Smart Portfolio Tracker
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Primary Navigation Tabs (Dashboard, Cek Portfolio, Riwayat & Snapshot) */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/70">
            {/* 1. Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            {/* 2. Cek Portfolio Tab (from Stitch redesign) */}
            <button
              onClick={() => setActiveTab('cek-portfolio')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'cek-portfolio'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Cek Portfolio</span>
            </button>

            {/* 3. Riwayat & Snapshot Tab */}
            <button
              onClick={() => setActiveTab('riwayat')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'riwayat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Riwayat & Snapshot</span>
              {snapshotCount > 0 && (
                <span className="hidden sm:inline-block rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                  {snapshotCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Section: User Profile & Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile Avatar (Clickable to edit name) */}
            <button
              type="button"
              onClick={onOpenEditProfile}
              title="Klik untuk ubah nama profil"
              className="group flex items-center gap-2 p-1 sm:p-1.5 -m-1 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-xs ring-2 ring-emerald-100 shadow-xs group-hover:ring-emerald-300 transition">
                {getUserInitials(userName || 'Syarif Hidayatullah')}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="block text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  {userName || 'Syarif Hidayatullah'}
                </span>
                <span className="block text-[10px] text-emerald-700 font-semibold">Verified Investor</span>
              </div>
            </button>

            {/* Settings / Local Storage Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Data & Pengaturan"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>

              {showSettings && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowSettings(false)} 
                  />
                  <div className="absolute right-0 top-10 z-50 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Penyimpanan Data Lokal
                    </div>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        onOpenEditProfile?.();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User className="h-4 w-4 text-emerald-600" />
                      <span>Ubah Nama Profil</span>
                    </button>
                    <button
                      onClick={() => {
                        onOpenManageAssets();
                        setShowSettings(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Coins className="h-4 w-4 text-emerald-600" />
                      <span>Daftar Aset ({transactionCount} tx)</span>
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4 text-slate-400" />
                      <span>Cadangkan Data (JSON)</span>
                    </button>
                    <button
                      onClick={handleImport}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Upload className="h-4 w-4 text-slate-400" />
                      <span>Pulihkan Data (JSON)</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={handleReset}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <RotateCcw className="h-4 w-4 text-rose-500" />
                      <span>Kosongkan Seluruh Data</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Android & Mobile Viewports) */}
      <nav 
        aria-label="Navigasi Bawah"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] md:hidden shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
      >
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto px-2">
          {/* 1. Dashboard Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-1 transition-all active:scale-95 ${
              activeTab === 'dashboard'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 font-medium hover:text-slate-900'
            }`}
          >
            <div className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              activeTab === 'dashboard' ? 'bg-emerald-100/80 text-emerald-800' : 'bg-transparent'
            }`}>
              <LayoutDashboard className={`h-4.5 w-4.5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className="text-[11px] leading-none tracking-tight">Dashboard</span>
          </button>

          {/* 2. Cek Portfolio Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('cek-portfolio')}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-1 transition-all active:scale-95 ${
              activeTab === 'cek-portfolio'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 font-medium hover:text-slate-900'
            }`}
          >
            <div className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              activeTab === 'cek-portfolio' ? 'bg-emerald-100/80 text-emerald-800' : 'bg-transparent'
            }`}>
              <CheckCircle2 className={`h-4.5 w-4.5 ${activeTab === 'cek-portfolio' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className="text-[11px] leading-none tracking-tight">Cek Portfolio</span>
          </button>

          {/* 3. Riwayat & Snapshot Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-1 transition-all active:scale-95 ${
              activeTab === 'riwayat'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 font-medium hover:text-slate-900'
            }`}
          >
            <div className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              activeTab === 'riwayat' ? 'bg-emerald-100/80 text-emerald-800' : 'bg-transparent'
            }`}>
              <History className={`h-4.5 w-4.5 ${activeTab === 'riwayat' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {snapshotCount > 0 && (
                <span className="absolute -top-0.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-extrabold text-white">
                  {snapshotCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-none tracking-tight">Riwayat</span>
          </button>
        </div>
      </nav>
    </>
  );
};
