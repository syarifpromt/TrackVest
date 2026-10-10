'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Asset, Investment } from '../../types';
import { calculateAssetInvested, formatIDR } from '../../lib/calculations';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  investments?: Investment[];
  defaultAssetId?: string;
  onSave: (data: { assetId: string; date: string; amount: number; note?: string }) => void;
  onOpenManageAssets: () => void;
}

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  assets,
  investments = [],
  defaultAssetId,
  onSave,
  onOpenManageAssets,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (defaultAssetId && assets.some((a) => a.id === defaultAssetId)) {
      setSelectedAssetId(defaultAssetId);
    } else if (assets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(assets[0].id);
    }
  }, [defaultAssetId, assets, selectedAssetId]);

  if (!isOpen) return null;

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const currentAssetInvested = selectedAssetId 
    ? calculateAssetInvested(investments, selectedAssetId) 
    : 0;

  // Quick increment buttons
  const addAmount = (increment: number) => {
    const current = parseInt(amountRaw.replace(/\D/g, ''), 10) || 0;
    const nextVal = current + increment;
    setAmountRaw(nextVal.toString());
    setError('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setAmountRaw(rawDigits);
    setError('');
  };

  const numericAmount = parseInt(amountRaw.replace(/\D/g, ''), 10) || 0;
  const newTotalInvested = currentAssetInvested + numericAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssetId) {
      setError('Silakan pilih instrumen aset investasi.');
      return;
    }
    if (numericAmount <= 0) {
      setError('Masukkan nominal investasi yang valid.');
      return;
    }

    onSave({
      assetId: selectedAssetId,
      date,
      amount: numericAmount,
      note: note.trim() || undefined,
    });

    // Reset and close
    setAmountRaw('');
    setNote('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 sm:right-5 sm:top-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Tambah Modal Investasi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Catat setoran dana atau pembelian instrumen portofolio Anda.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Pilih Aset */}
          {assets.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-center space-y-2">
              <p className="text-xs font-bold text-amber-900">Belum ada aset terdaftar</p>
              <p className="text-[11px] text-amber-700">Silakan tambahkan instrumen aset terlebih dahulu sebelum mencatat modal investasi.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManageAssets();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition active:scale-95 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Tambah Aset Sekarang</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Pilih Aset</label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenManageAssets();
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 transition"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Tambah Aset Baru</span>
                </button>
              </div>
              <div className="relative">
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-emerald-600 focus:bg-white focus:outline-none transition pr-10"
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.category})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}

          {/* 2. Nominal Investasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nominal Investasi (Rupiah)
            </label>
            <div className="relative flex rounded-xl border border-slate-200 shadow-2xs focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-slate-50/60 transition">
              <span className="inline-flex items-center px-3.5 text-xs sm:text-sm font-black text-slate-400 select-none">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountRaw ? new Intl.NumberFormat('id-ID').format(parseInt(amountRaw, 10)) : ''}
                onChange={handleAmountChange}
                required
                disabled={assets.length === 0}
                className="w-full bg-transparent py-2.5 pr-3 text-base sm:text-lg font-black text-slate-900 tabular-nums focus:outline-none placeholder:text-slate-300 disabled:opacity-50"
              />
            </div>

            {/* Quick Add Chips */}
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[
                { label: '+100rb', val: 100000 },
                { label: '+500rb', val: 500000 },
                { label: '+1Jt', val: 1000000 },
                { label: '+5Jt', val: 5000000 },
              ].map((chip) => (
                <button
                  type="button"
                  key={chip.val}
                  onClick={() => addAmount(chip.val)}
                  disabled={assets.length === 0}
                  className="rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-600 shadow-2xs hover:bg-emerald-50/40 hover:border-emerald-300 hover:text-emerald-800 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Live Estimasi Modal Aset Baru */}
            {assets.length > 0 && (
              <div className="mt-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/35 p-4 sm:p-4.5 transition-all">
                {/* Rincian Modal Sebelum & Tambahan */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">
                      Modal {selectedAsset?.name || 'Aset'} Sebelumnya:
                    </span>
                    <span className="font-bold text-slate-700 tabular-nums">
                      {formatIDR(currentAssetInvested)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-700">
                      + Tambahan Sekarang:
                    </span>
                    <span className="font-extrabold text-emerald-700 tabular-nums">
                      {numericAmount > 0 ? `+${formatIDR(numericAmount)}` : '+Rp 0'}
                    </span>
                  </div>
                </div>

                {/* Garis Pemisah Proporsional */}
                <div className="my-3 border-t border-emerald-200/70" />

                {/* Total Akhir */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      Total Modal {selectedAsset?.name || 'Aset'} Menjadi:
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Akumulasi seluruh modal yang disetor
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-base sm:text-lg font-black text-emerald-800 tabular-nums tracking-tight">
                      {formatIDR(newTotalInvested)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Tanggal Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tanggal Transaksi
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-emerald-600 focus:bg-white focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setDate(new Date().toISOString().split('T')[0])}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-95"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* 4. Catatan Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Transaksi <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Misal: Nabung rutin bulanan, bonus kerja, dll."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-600 focus:bg-white focus:outline-none transition placeholder:text-slate-400"
            />
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={assets.length === 0 || numericAmount <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-xs sm:text-[13px] font-bold text-white shadow-xs hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4 stroke-[2.2]" />
              <span>Simpan Investasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
