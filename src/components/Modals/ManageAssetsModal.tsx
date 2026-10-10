'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Coins, 
  Trash2, 
  Upload, 
  Link as LinkIcon, 
  Smile, 
  Check, 
  RotateCcw,
  Sparkles,
  Palette
} from 'lucide-react';
import { Asset, Investment } from '../../types';
import { AssetIcon } from '../AssetIcon';

interface ManageAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  investments: Investment[];
  onAddAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  onUpdateAsset?: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
}

const COLOR_PRESETS = [
  '#059669', // Emerald
  '#10B981', // Teal
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EAB308', // Gold
  '#14B8A6', // Cyan
  '#64748B', // Slate
];

const EMOJI_PRESETS = [
  { label: 'Emas / Bullion', value: '🪙', color: '#EAB308' },
  { label: 'Bitcoin', value: '₿', color: '#F7931A' },
  { label: 'S&P 500 / Saham', value: '📈', color: '#3B82F6' },
  { label: 'Perusahaan', value: '🏢', color: '#6366F1' },
  { label: 'Bank / Deposito', value: '🏦', color: '#10B981' },
  { label: 'Uang Tunai / Kas', value: '💵', color: '#059669' },
  { label: 'Crypto / Altcoin', value: '💎', color: '#8B5CF6' },
  { label: 'Perak / Silver', value: '🥈', color: '#64748B' },
  { label: 'Komoditas / Minyak', value: '🛢️', color: '#334155' },
  { label: 'Properti / Real Estate', value: '🏡', color: '#F59E0B' },
  { label: 'Teknologi / Web3', value: '🚀', color: '#EC4899' },
  { label: 'Obligasi / SBN', value: '📜', color: '#14B8A6' },
];

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Extracts the most vibrant / dominant color from an HTMLCanvasElement or HTMLImageElement.
 * Ignores transparency and filters out neutral white/black backgrounds to prioritize vibrant logo colors.
 */
function extractDominantColor(source: HTMLCanvasElement | HTMLImageElement): string {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  if (source instanceof HTMLCanvasElement) {
    canvas = source;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  } else {
    canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#059669';
    ctx.drawImage(source, 0, 0, 64, 64);
  }

  if (!ctx) return '#059669';

  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return '#059669';
  }

  const data = imgData.data;
  const buckets = new Map<string, { r: number; g: number; b: number; count: number; score: number }>();
  let fallbackR = 0;
  let fallbackG = 0;
  let fallbackB = 0;
  let fallbackCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    // Ignore transparent pixels
    if (a < 100) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    fallbackR += r;
    fallbackG += g;
    fallbackB += b;
    fallbackCount++;

    // Ignore white / very light gray backgrounds (r, g, b all > 238)
    if (r > 238 && g > 238 && b > 238) continue;
    // Ignore pure black / very dark shadows (r, g, b all < 20)
    if (r < 20 && g < 20 && b < 20) continue;

    // Saturation calculation: (max - min) / max
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const saturation = max === 0 ? 0 : delta / max;

    // Quantize RGB in 16-step intervals (0, 16, 32, ..., 240)
    const qr = (r >> 4) << 4;
    const qg = (g >> 4) << 4;
    const qb = (b >> 4) << 4;
    const key = `${qr},${qg},${qb}`;

    // Score: give strong multiplier to saturated colors over dull grays
    const weight = 1 + saturation * 4;

    const existing = buckets.get(key);
    if (existing) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.count += 1;
      existing.score += weight;
    } else {
      buckets.set(key, { r, g, b, count: 1, score: weight });
    }
  }

  if (buckets.size === 0) {
    if (fallbackCount > 0) {
      return rgbToHex(fallbackR / fallbackCount, fallbackG / fallbackCount, fallbackB / fallbackCount);
    }
    return '#059669';
  }

  let best: { r: number; g: number; b: number; count: number; score: number } | null = null;
  for (const b of buckets.values()) {
    if (!best || b.score > best.score) {
      best = b;
    }
  }

  if (!best || best.count === 0) return '#059669';
  return rgbToHex(best.r / best.count, best.g / best.count, best.b / best.count);
}

/**
 * Extracts dominant color from an image URL (supports local public icons or CORS-enabled URLs).
 */
function extractColorFromImageUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const hex = extractDominantColor(img);
        resolve(hex);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Gagal memuat URL gambar'));
    img.src = src;
  });
}

/**
 * Resizes and compresses uploaded image file to max 160x160 square PNG data URL
 * and automatically extracts dominant color.
 */
function compressImageFile(file: File, maxSize = 160): Promise<{ dataUrl: string; dominantColor: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          }
        } else {
          if (h > maxSize) {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, dominantColor: '#059669' });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        const dominantColor = extractDominantColor(canvas);
        resolve({ dataUrl, dominantColor });
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

export const ManageAssetsModal: React.FC<ManageAssetsModalProps> = ({
  isOpen,
  onClose,
  assets,
  investments,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
}) => {
  // New Asset Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Asset['category']>('Crypto');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [detectedColor, setDetectedColor] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>('');
  const [iconMode, setIconMode] = useState<'upload' | 'url' | 'emoji'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Edit Icon & Color for existing asset state
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [confirmDeleteAssetId, setConfirmDeleteAssetId] = useState<string | null>(null);
  const [editIconValue, setEditIconValue] = useState<string>('');
  const [editColorValue, setEditColorValue] = useState<string>(COLOR_PRESETS[0]);
  const [editDetectedColor, setEditDetectedColor] = useState<string | null>(null);
  const [editUrlInput, setEditUrlInput] = useState('');
  const [editMode, setEditMode] = useState<'upload' | 'url' | 'emoji'>('upload');
  const [isEditCompressing, setIsEditCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setIcon('');
      setUrlInput('');
      setColor(COLOR_PRESETS[0]);
      setDetectedColor(null);
      setError('');
      setEditingAssetId(null);
      setConfirmDeleteAssetId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle image upload for New Asset
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }

    try {
      setIsCompressing(true);
      const { dataUrl, dominantColor } = await compressImageFile(file, 160);
      setIcon(dataUrl);
      if (dominantColor) {
        setColor(dominantColor);
        setDetectedColor(dominantColor);
      }
    } catch {
      alert('Gagal memproses gambar. Silakan coba file lain.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle URL change for New Asset
  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setIcon(val);
    const clean = val.trim();
    if (clean.length > 4 && (clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:'))) {
      extractColorFromImageUrl(clean)
        .then((domColor) => {
          if (domColor) {
            setColor(domColor);
            setDetectedColor(domColor);
          }
        })
        .catch(() => {});
    }
  };

  // Handle image upload for Editing Existing Asset
  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }

    try {
      setIsEditCompressing(true);
      const { dataUrl, dominantColor } = await compressImageFile(file, 160);
      setEditIconValue(dataUrl);
      if (dominantColor) {
        setEditColorValue(dominantColor);
        setEditDetectedColor(dominantColor);
      }
    } catch {
      alert('Gagal memproses gambar. Silakan coba file lain.');
    } finally {
      setIsEditCompressing(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  // Handle URL change for Editing Existing Asset
  const handleEditUrlChange = (val: string) => {
    setEditUrlInput(val);
    setEditIconValue(val);
    const clean = val.trim();
    if (clean.length > 4 && (clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:'))) {
      extractColorFromImageUrl(clean)
        .then((domColor) => {
          if (domColor) {
            setEditColorValue(domColor);
            setEditDetectedColor(domColor);
          }
        })
        .catch(() => {});
    }
  };

  // Start editing an asset
  const handleStartEditIcon = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setEditIconValue(asset.icon || '');
    setEditUrlInput(asset.icon?.startsWith('http') || asset.icon?.startsWith('/') ? asset.icon : '');
    setEditColorValue(asset.color || COLOR_PRESETS[0]);
    setEditDetectedColor(null);
    setEditMode(asset.icon?.startsWith('data:') ? 'upload' : asset.icon?.startsWith('http') || asset.icon?.startsWith('/') ? 'url' : 'emoji');
  };

  // Save edited asset (icon + color)
  const handleSaveEditIcon = (asset: Asset) => {
    if (!onUpdateAsset) return;
    onUpdateAsset({
      ...asset,
      color: editColorValue,
      icon: editIconValue.trim() !== '' ? editIconValue.trim() : undefined,
    });
    setEditingAssetId(null);
  };

  // Reset icon to Stitch default
  const handleResetToDefault = (asset: Asset) => {
    let defaultIcon = '';
    let defaultColor = COLOR_PRESETS[0];
    const lower = asset.name.toLowerCase();
    if (lower.includes('btc') || lower.includes('bitcoin')) {
      defaultIcon = '/icons/btc.png';
      defaultColor = '#F7931A';
    } else if (lower.includes('emas') || lower.includes('gold')) {
      defaultIcon = '/icons/emas.png';
      defaultColor = '#EAB308';
    } else if (lower.includes('voo') || lower.includes('vanguard')) {
      defaultIcon = '/icons/voo.png';
      defaultColor = '#991B1B';
    }

    setEditIconValue(defaultIcon);
    setEditColorValue(defaultColor);
    if (!defaultIcon) setEditUrlInput('');
  };

  // Handle Add New Asset
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Nama aset tidak boleh kosong.');
      return;
    }
    if (assets.some((a) => a.name.toLowerCase() === cleanName.toLowerCase())) {
      setError('Aset dengan nama ini sudah ada.');
      return;
    }

    onAddAsset({
      name: cleanName,
      category,
      color,
      icon: icon.trim() !== '' ? icon.trim() : undefined,
    });

    setName('');
    setIcon('');
    setUrlInput('');
    setDetectedColor(null);
    setColor(COLOR_PRESETS[0]);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-modal animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Coins className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Kelola Daftar Aset</h3>
              <p className="text-xs text-slate-400">Atur instrumen investasi, kategori, warna alokasi, dan ikon portofolio Anda.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing Assets List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Daftar Aset Aktif ({assets.length})
            </h4>
          </div>

          {assets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <p className="text-xs font-bold text-slate-700">Belum ada aset terdaftar</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tambahkan instrumen aset pertama Anda menggunakan formulir di bawah ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            {assets.map((asset) => {
              const txCount = investments.filter((inv) => inv.assetId === asset.id).length;
              const isEditingThis = editingAssetId === asset.id;

              return (
                <div key={asset.id} className="p-3 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Icon, Name & Category */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative group cursor-pointer" onClick={() => handleStartEditIcon(asset)} title="Klik untuk ubah ikon & warna">
                        <AssetIcon 
                          name={asset.name} 
                          category={asset.category} 
                          icon={asset.icon} 
                          color={asset.color}
                          size={36} 
                        />
                        <div className="absolute inset-0 rounded-full bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Upload className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900 truncate">{asset.name}</span>
                          <span 
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: asset.color }}
                            title={`Warna alokasi: ${asset.color}`}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="capitalize">{asset.category}</span>
                          <span>•</span>
                          <span>{txCount} transaksi</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditIcon(asset)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold transition"
                        title="Ubah ikon & warna aset"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAssetId(asset.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Hapus aset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation */}
                  {confirmDeleteAssetId === asset.id && (
                    <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                      <div className="text-xs text-rose-800 font-medium">
                        <span>Hapus aset <strong>{asset.name}</strong>? {txCount > 0 ? `(${txCount} transaksi terkait akan ikut dihapus)` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAssetId(null)}
                          className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteAsset(asset.id);
                            setConfirmDeleteAssetId(null);
                          }}
                          className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 transition shadow-2xs"
                        >
                          Ya, Hapus
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Icon & Color Editor Drawer */}
                  {isEditingThis && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 animate-in fade-in space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Pilih Ikon & Warna untuk {asset.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResetToDefault(asset)}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reset Default</span>
                        </button>
                      </div>

                      {/* Mode Tabs */}
                      <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditMode('upload')}
                          className={`flex-1 py-1 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
                            editMode === 'upload' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload File</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode('url')}
                          className={`flex-1 py-1 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
                            editMode === 'url' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span>URL Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode('emoji')}
                          className={`flex-1 py-1 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
                            editMode === 'emoji' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Smile className="h-3.5 w-3.5" />
                          <span>Emoji</span>
                        </button>
                      </div>

                      {/* Tab Content */}
                      {editMode === 'upload' && (
                        <div className="space-y-2">
                          <input 
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleEditFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            disabled={isEditCompressing}
                            className="w-full rounded-xl border border-dashed border-emerald-400 bg-white py-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            <span>{isEditCompressing ? 'Memproses gambar & warna dominan...' : 'Pilih Gambar Baru dari Komputer'}</span>
                          </button>
                          <p className="text-[10px] text-slate-500 text-center">
                            Warna dominan gambar otomatis diekstrak sebagai warna indikator.
                          </p>
                        </div>
                      )}

                      {editMode === 'url' && (
                        <div className="space-y-1.5">
                          <input 
                            type="url"
                            placeholder="https://... atau /icons/btc.png"
                            value={editUrlInput}
                            onChange={(e) => handleEditUrlChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-400">
                            Masukkan URL gambar atau path ikon lokal.
                          </p>
                        </div>
                      )}

                      {editMode === 'emoji' && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                          {EMOJI_PRESETS.map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => {
                                setEditIconValue(item.value);
                                if (item.color) setEditColorValue(item.color);
                              }}
                              title={item.label}
                              className={`p-2 rounded-lg text-lg hover:bg-emerald-50 transition border ${
                                editIconValue === item.value 
                                  ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' 
                                  : 'border-transparent'
                              }`}
                            >
                              {item.value}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Color Selector in Edit Drawer */}
                      <div className="pt-2 border-t border-emerald-200/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-700">
                            Warna Indikator Aset
                          </label>
                          {editDetectedColor && (
                            <button
                              type="button"
                              onClick={() => setEditColorValue(editDetectedColor)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 transition bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200"
                              title="Gunakan warna otomatis dari gambar"
                            >
                              <Sparkles className="h-3 w-3 text-emerald-700" />
                              <span>Warna Gambar: {editDetectedColor}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {COLOR_PRESETS.map((c) => (
                            <button
                              key={`edit-${c}`}
                              type="button"
                              onClick={() => setEditColorValue(c)}
                              className={`h-5 w-5 rounded-full transition-transform ${
                                editColorValue.toUpperCase() === c.toUpperCase()
                                  ? 'scale-125 ring-2 ring-emerald-600 ring-offset-2'
                                  : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}

                          <div className="h-4 w-px bg-slate-200 mx-0.5" />

                          {/* Custom Color Input Pill */}
                          <label 
                            className={`relative flex items-center gap-1.5 rounded-lg border px-2 py-0.5 cursor-pointer transition shadow-2xs ${
                              !COLOR_PRESETS.some((c) => c.toUpperCase() === editColorValue.toUpperCase())
                                ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                            title="Pilih warna kustom bebas"
                          >
                            <div 
                              className="h-3.5 w-3.5 rounded-full border border-black/10 flex-shrink-0"
                              style={{ backgroundColor: editColorValue }}
                            />
                            <span className="text-[10px] font-mono font-bold text-slate-800 uppercase">
                              {editColorValue}
                            </span>
                            <Palette className="h-3 w-3 text-slate-400" />
                            <input
                              type="color"
                              value={editColorValue.startsWith('#') && editColorValue.length === 7 ? editColorValue : '#059669'}
                              onChange={(e) => setEditColorValue(e.target.value.toUpperCase())}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Preview & Save Bar */}
                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-600">Pratinjau:</span>
                          <AssetIcon 
                            name={asset.name} 
                            category={asset.category} 
                            icon={editIconValue} 
                            color={editColorValue} 
                            size={32} 
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingAssetId(null)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditIcon(asset)}
                            className="rounded-lg bg-emerald-800 px-3.5 py-1 text-xs font-bold text-white hover:bg-emerald-900 transition flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Simpan Perubahan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Form Tambah Aset Baru */}
        <form onSubmit={handleAdd} className="mt-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 flex-shrink-0 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-[13px] font-extrabold text-slate-900 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-emerald-700 stroke-[2.5]" />
              <span>Tambah Aset Baru</span>
            </h4>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nama Aset */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Aset (Ticker / Kode)
              </label>
              <input
                type="text"
                placeholder="Contoh: BBCA, ETH, SBN, Properti"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none transition placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Kategori Instrumen
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Asset['category'])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none transition cursor-pointer"
              >
                <option value="Crypto">Crypto (Mata Uang Kripto)</option>
                <option value="Emas">Emas (Logam Mulia / Bullion)</option>
                <option value="ETF">ETF / Reksadana Saham</option>
                <option value="Saham">Saham Individual (IDX / US)</option>
                <option value="Properti">Properti / Real Estate</option>
                <option value="Obligasi">Obligasi / SBN / Sukuk</option>
                <option value="Kas">Kas / Deposito / Tabungan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">
                Pilih Ikon Aset
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setIconMode('upload')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    iconMode === 'upload' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload File
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIconMode('url')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    iconMode === 'url' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  URL Gambar
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIconMode('emoji')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    iconMode === 'emoji' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Emoji
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <AssetIcon name={name || 'A'} category={category} icon={icon} color={color} size={36} />
              </div>

              <div className="flex-1">
                {iconMode === 'upload' && (
                  <div>
                    <input 
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                      className="w-full rounded-xl border border-dashed border-slate-300 bg-white py-2 px-3 text-xs font-semibold text-slate-600 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/20 transition flex items-center justify-center gap-2"
                    >
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      <span>{isCompressing ? 'Mengekstrak warna dominan...' : icon ? 'Ganti File Gambar' : 'Pilih File Gambar'}</span>
                    </button>
                  </div>
                )}

                {iconMode === 'url' && (
                  <input
                    type="url"
                    placeholder="https://... atau /icons/btc.png"
                    value={urlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none transition"
                  />
                )}

                {iconMode === 'emoji' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    {EMOJI_PRESETS.slice(0, 8).map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setIcon(item.value);
                          if (item.color) {
                            setColor(item.color);
                            setDetectedColor(null);
                          }
                        }}
                        className={`h-7 w-7 rounded-lg text-sm flex items-center justify-center transition border flex-shrink-0 ${
                          icon === item.value 
                            ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' 
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {item.value}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {icon && (
                <button
                  type="button"
                  onClick={() => {
                    setIcon('');
                    setUrlInput('');
                    setDetectedColor(null);
                  }}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-xs transition"
                  title="Hapus ikon kustom"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Color Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700">
                Warna Indikator Donut Alokasi
              </label>
              {detectedColor && (
                <button
                  type="button"
                  onClick={() => setColor(detectedColor)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 transition bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200"
                  title="Klik untuk menggunakan warna dominan yang diekstrak dari gambar"
                >
                  <Sparkles className="h-3 w-3 text-emerald-700" />
                  <span>Warna Gambar: {detectedColor}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Presets */}
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-5 w-5 rounded-full transition-transform ${
                    color.toUpperCase() === c.toUpperCase()
                      ? 'scale-125 ring-2 ring-emerald-600 ring-offset-2'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={`Warna preset: ${c}`}
                />
              ))}

              <div className="h-4 w-px bg-slate-200 mx-0.5" />

              {/* Custom Color Input Pill */}
              <label 
                className={`relative flex items-center gap-1.5 rounded-xl border px-2.5 py-1 cursor-pointer transition shadow-2xs ${
                  !COLOR_PRESETS.some((c) => c.toUpperCase() === color.toUpperCase())
                    ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                title="Pilih warna kustom bebas (Color Picker)"
              >
                <div 
                  className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-2xs flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] font-mono font-bold text-slate-800 uppercase">
                  {color}
                </span>
                <Palette className="h-3 w-3 text-slate-400" />
                <input
                  type="color"
                  value={color.startsWith('#') && color.length === 7 ? color : '#059669'}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs sm:text-[13px] font-bold text-white shadow-xs hover:shadow transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Simpan Aset Baru</span>
          </button>
        </form>
      </div>
    </div>
  );
};
