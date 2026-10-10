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
  Image as ImageIcon
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
  { label: 'Emas / Bullion', value: '🪙' },
  { label: 'Bitcoin', value: '₿' },
  { label: 'S&P 500 / Saham', value: '📈' },
  { label: 'Perusahaan', value: '🏢' },
  { label: 'Bank / Deposito', value: '🏦' },
  { label: 'Uang Tunai / Kas', value: '💵' },
  { label: 'Crypto / Altcoin', value: '💎' },
  { label: 'Perak / Silver', value: '🥈' },
  { label: 'Komoditas / Minyak', value: '🛢️' },
  { label: 'Properti / Real Estate', value: '🏡' },
  { label: 'Teknologi / Web3', value: '🚀' },
  { label: 'Obligasi / SBN', value: '📜' },
];

/**
 * Resizes and compresses uploaded image file to max 160x160 square PNG data URL
 * to avoid exceeding browser localStorage storage limits.
 */
function compressImageFile(file: File, maxSize = 160): Promise<string> {
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
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png', 0.9));
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
  const [icon, setIcon] = useState<string>('');
  const [iconMode, setIconMode] = useState<'upload' | 'url' | 'emoji'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Edit Icon for existing asset state
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [confirmDeleteAssetId, setConfirmDeleteAssetId] = useState<string | null>(null);
  const [editIconValue, setEditIconValue] = useState<string>('');
  const [editUrlInput, setEditUrlInput] = useState('');
  const [editMode, setEditMode] = useState<'upload' | 'url' | 'emoji'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setIcon('');
      setUrlInput('');
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
      const dataUrl = await compressImageFile(file, 160);
      setIcon(dataUrl);
    } catch {
      alert('Gagal memproses gambar. Silakan coba file lain.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      setIsCompressing(true);
      const dataUrl = await compressImageFile(file, 160);
      setEditIconValue(dataUrl);
    } catch {
      alert('Gagal memproses gambar. Silakan coba file lain.');
    } finally {
      setIsCompressing(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  // Start editing icon for an asset
  const handleStartEditIcon = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setEditIconValue(asset.icon || '');
    setEditUrlInput(asset.icon?.startsWith('http') ? asset.icon : '');
    setEditMode('upload');
  };

  // Save edited icon for existing asset
  const handleSaveEditIcon = (asset: Asset) => {
    if (!onUpdateAsset) return;
    onUpdateAsset({
      ...asset,
      icon: editIconValue.trim() !== '' ? editIconValue.trim() : undefined,
    });
    setEditingAssetId(null);
  };

  // Reset icon to Stitch default
  const handleResetToDefault = (asset: Asset) => {
    let defaultIcon = '';
    const lower = asset.name.toLowerCase();
    if (lower.includes('btc') || lower.includes('bitcoin')) defaultIcon = '/icons/btc.png';
    else if (lower.includes('emas') || lower.includes('gold')) defaultIcon = '/icons/emas.png';
    else if (lower.includes('voo') || lower.includes('vanguard')) defaultIcon = '/icons/voo.png';

    setEditIconValue(defaultIcon);
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
                      <div className="relative group cursor-pointer" onClick={() => handleStartEditIcon(asset)} title="Klik untuk ubah ikon">
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
                            className="h-2 w-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: asset.color }} 
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 uppercase">
                            {asset.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {txCount} transaksi
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteAssetId(null);
                          if (isEditingThis) {
                            setEditingAssetId(null);
                          } else {
                            handleStartEditIcon(asset);
                          }
                        }}
                        className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition flex items-center gap-1.5 ${
                          isEditingThis 
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-emerald-700'
                        }`}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>{isEditingThis ? 'Tutup' : 'Ganti Ikon'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingAssetId(null);
                          setConfirmDeleteAssetId(confirmDeleteAssetId === asset.id ? null : asset.id);
                        }}
                        title={`Hapus aset ${asset.name}`}
                        className={`rounded-xl p-1.5 border transition ${
                          confirmDeleteAssetId === asset.id
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

                  {/* Inline Icon Editor Drawer */}
                  {isEditingThis && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 animate-in fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Pilih Ikon Baru untuk {asset.name}</span>
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
                      <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-slate-200 mb-3 text-xs">
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
                            type="file" 
                            ref={editFileInputRef} 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleEditFileUpload} 
                          />
                          <button
                            type="button"
                            disabled={isCompressing}
                            onClick={() => editFileInputRef.current?.click()}
                            className="w-full rounded-xl border border-dashed border-emerald-300 bg-white py-3 px-4 text-xs font-semibold text-emerald-800 hover:bg-emerald-50/80 transition flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            <span>{isCompressing ? 'Memproses gambar...' : 'Pilih File Gambar dari Komputer / HP'}</span>
                          </button>
                          <p className="text-[10px] text-slate-500 text-center">Format didukung: PNG, JPG, WebP, SVG (otomatis dioptimalkan)</p>
                        </div>
                      )}

                      {editMode === 'url' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            placeholder="https://... atau /icons/btc.png"
                            value={editUrlInput}
                            onChange={(e) => {
                              setEditUrlInput(e.target.value);
                              setEditIconValue(e.target.value);
                            }}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      )}

                      {editMode === 'emoji' && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                          {EMOJI_PRESETS.map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => setEditIconValue(item.value)}
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

                      {/* Preview & Save Bar */}
                      <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-600">Pratinjau:</span>
                          <AssetIcon 
                            name={asset.name} 
                            category={asset.category} 
                            icon={editIconValue} 
                            color={asset.color}
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
                            <span>Simpan Ikon</span>
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

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Aset</label>
              <input
                type="text"
                placeholder="Misal: SBN, BBCA, Emas"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none transition placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Asset['category'])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none transition"
              >
                <option value="Crypto">Crypto</option>
                <option value="Emas">Emas</option>
                <option value="Saham">Saham</option>
                <option value="ETF">ETF</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Icon Option for New Asset */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700">Ikon Aset</label>
              <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setIconMode('upload')}
                  className={`rounded-md px-2 py-0.5 font-bold transition ${
                    iconMode === 'upload' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setIconMode('url')}
                  className={`rounded-md px-2 py-0.5 font-bold transition ${
                    iconMode === 'url' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  URL Link
                </button>
                <button
                  type="button"
                  onClick={() => setIconMode('emoji')}
                  className={`rounded-md px-2 py-0.5 font-bold transition ${
                    iconMode === 'emoji' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Emoji
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Preview */}
              <div className="flex-shrink-0">
                <AssetIcon name={name || 'Aset'} category={category} icon={icon} color={color} size={36} />
              </div>

              {/* Selector according to mode */}
              <div className="flex-1 min-w-0">
                {iconMode === 'upload' && (
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      <span>{isCompressing ? 'Mengompres...' : icon ? 'Ganti File Gambar' : 'Pilih File Gambar'}</span>
                    </button>
                  </div>
                )}

                {iconMode === 'url' && (
                  <input
                    type="url"
                    placeholder="https://... atau /icons/btc.png"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setIcon(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none transition"
                  />
                )}

                {iconMode === 'emoji' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    {EMOJI_PRESETS.slice(0, 8).map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setIcon(item.value)}
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
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Warna Indikator Donut Alokasi
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-5 w-5 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-emerald-600 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
