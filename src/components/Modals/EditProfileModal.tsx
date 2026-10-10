'use client';

import React, { useState, useEffect } from 'react';
import { X, User, CheckCircle2 } from 'lucide-react';
import { getUserInitials } from '../../lib/calculations';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSave,
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  const initials = getUserInitials(name || 'Pengguna');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-modal animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ubah Nama Profil
              </h3>
              <p className="text-[11px] text-slate-400">
                Data tersimpan di perangkat lokal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Avatar Preview */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 text-white font-black text-xl ring-4 ring-emerald-100 shadow-sm transition-all duration-200">
            {initials}
          </div>
          <span className="mt-2 text-xs font-bold text-slate-900 truncate max-w-[200px]">
            {name.trim() || 'Nama Anda'}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
            Verified Investor
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Pemilik Portofolio
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={50}
              placeholder="Masukkan nama Anda..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-2xs focus:border-emerald-600 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-2/3 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan Nama</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

