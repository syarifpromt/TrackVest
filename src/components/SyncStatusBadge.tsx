'use client';

import React from 'react';
import { 
  Cloud, 
  CheckCircle2, 
  CloudOff, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SyncStatusBadge: React.FC = () => {
  const { syncState, isAuthenticated, triggerSync } = useAuth();
  const { status, pendingCount, errorMessage } = syncState;

  if (!isAuthenticated) {
    return (
      <div 
        title="Mode offline lokal aktif. Masuk untuk mengaktifkan sinkronisasi cloud."
        className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500"
      >
        <Cloud className="h-3.5 w-3.5 text-slate-400" />
        <span className="hidden sm:inline">Penyimpanan Lokal</span>
      </div>
    );
  }

  if (status === 'syncing') {
    return (
      <div 
        title="Sedang menyinkronkan data dengan Supabase..."
        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800 animate-pulse"
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
        <span className="hidden sm:inline">Menyinkronkan...</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div 
        title="Perangkat offline. Perubahan tersimpan di IndexedDB dan akan disinkronkan saat terhubung kembali."
        className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800"
      >
        <CloudOff className="h-3.5 w-3.5 text-amber-600" />
        <span className="hidden sm:inline">Offline</span>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-200 px-1 text-[9px] font-black text-amber-900">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={() => triggerSync()}
        title={`Gagal sync: ${errorMessage || 'Klik untuk mencoba ulang'}`}
        className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100 transition cursor-pointer"
      >
        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
        <span className="hidden sm:inline">Sync Gagal (Ulangi)</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => triggerSync()}
      title="Semua data tersinkronisasi aman dengan Supabase. Klik untuk refresh."
      className="group flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/70 transition cursor-pointer"
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">Tersinkron</span>
      {pendingCount > 0 && (
        <span className="rounded-full bg-emerald-200 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-900">
          +{pendingCount}
        </span>
      )}
    </button>
  );
};
