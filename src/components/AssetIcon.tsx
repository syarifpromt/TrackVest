'use client';

import React from 'react';

interface AssetIconProps {
  name: string;
  category?: string;
  icon?: string; // Manual icon: base64, URL, path, or emoji
  color?: string; // Asset color
  size?: number;
  className?: string;
}

const DEFAULT_COLORS = [
  '#059669', // Emerald
  '#2563EB', // Blue
  '#7C3AED', // Purple
  '#D97706', // Amber
  '#E11D48', // Rose
  '#0D9488', // Teal
  '#4F46E5', // Indigo
  '#64748B', // Slate
];

function getFallbackColor(str: string): string {
  if (!str) return DEFAULT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length];
}

function getAssetInitials(rawName: string): string {
  if (!rawName || !rawName.trim()) return '•';
  const clean = rawName.trim();
  const words = clean.split(/\s+/).filter(Boolean);

  // If multi-word (e.g. "Bank Mandiri" -> "BM", "Reksa Dana" -> "RD", "Surat Berharga" -> "SB")
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // If short ticker up to 4 chars (e.g. "BTC", "ETH", "VOO", "SBN", "BBCA", "BMRI")
  if (clean.length <= 4) {
    return clean.toUpperCase();
  }

  // If single long word (e.g. "Solana" -> "S", "Ethereum" -> "E")
  return clean.charAt(0).toUpperCase();
}

function getInitialsFontSize(length: number, size: number): number {
  if (length <= 1) return Math.round(size * 0.45);
  if (length === 2) return Math.round(size * 0.38);
  if (length === 3) return Math.round(size * 0.30);
  return Math.round(size * 0.25);
}

export const AssetIcon: React.FC<AssetIconProps> = ({
  name,
  category = '',
  icon,
  color,
  size = 36,
  className = '',
}) => {
  // 1. Prioritas Utama: Jika aset sudah memiliki gambar kustom / emoji / path icon tersimpan
  if (icon && icon.trim() !== '') {
    const trimmed = icon.trim();
    // Gambar: Base64 data URL, HTTP/HTTPS URL, atau local path
    if (
      trimmed.startsWith('data:image') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/')
    ) {
      return (
        <img
          src={trimmed}
          alt={name}
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className={`rounded-full object-cover shadow-2xs flex-shrink-0 bg-slate-50 border border-slate-100 ${className}`}
        />
      );
    }

    // Emoji atau simbol teks kustom (misal: 🚀, 🪙, 💎, dll.)
    return (
      <div
        style={{ width: size, height: size, fontSize: Math.round(size * 0.52) }}
        className={`flex items-center justify-center rounded-full bg-slate-100/90 shadow-2xs flex-shrink-0 select-none border border-slate-200/50 ${className}`}
      >
        {trimmed}
      </div>
    );
  }

  const lower = (name || '').trim().toLowerCase();

  // 2. Aset Bawaan Sistem yang Sudah Memiliki Gambar Resmi (BTC, Emas, VOO)
  if (lower === 'btc' || lower === 'bitcoin' || lower.startsWith('btc ')) {
    return (
      <img
        src="/icons/btc.png"
        alt="BTC"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`rounded-full object-contain shadow-2xs flex-shrink-0 ${className}`}
      />
    );
  }

  if (lower === 'emas' || lower === 'gold' || lower === 'antam' || lower.startsWith('emas ')) {
    return (
      <img
        src="/icons/emas.png"
        alt="Emas"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`rounded-full object-contain shadow-2xs flex-shrink-0 ${className}`}
      />
    );
  }

  if (lower === 'voo' || lower === 'vanguard' || lower.startsWith('voo ')) {
    return (
      <img
        src="/icons/voo.png"
        alt="VOO"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`rounded-full object-contain shadow-2xs flex-shrink-0 ${className}`}
      />
    );
  }

  // 3. Khusus Aset Baru Tanpa Ikon Kustom:
  // Otomatis gunakan nama depan / inisial aset sebagai default emblem
  const initials = getAssetInitials(name);
  const fontSize = getInitialsFontSize(initials.length, size);
  const bgColor = color || getFallbackColor(name);

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize,
      }}
      className={`flex items-center justify-center rounded-full text-white font-black leading-none shadow-2xs flex-shrink-0 select-none tracking-tight ${className}`}
    >
      {initials}
    </div>
  );
};
