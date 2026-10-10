'use client';

import React from 'react';
import { X, Calendar, ArrowUpRight, ArrowDownRight, Minus, Trash2 } from 'lucide-react';
import { Snapshot } from '../../types';
import { formatDate, formatIDR, formatPercent } from '../../lib/calculations';
import { AssetIcon } from '../AssetIcon';

interface SnapshotDetailModalProps {
  snapshot: Snapshot | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const SnapshotDetailModal: React.FC<SnapshotDetailModalProps> = ({
  snapshot,
  onClose,
  onDelete,
}) => {
  if (!snapshot) return null;

  const isProfit = snapshot.totalProfit > 0;
  const isLoss = snapshot.totalProfit < 0;

  const handleDelete = () => {
    if (confirm(`Hapus snapshot tanggal ${formatDate(snapshot.date)}?`)) {
      onDelete(snapshot.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-modal animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 border border-brand-200">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Detail Snapshot Portfolio
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {formatDate(snapshot.date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Snapshot Summary Cards */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 flex-shrink-0 text-center">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Modal
            </span>
            <span className="text-xs font-bold text-slate-800 tabular-nums">
              {formatIDR(snapshot.totalInvested)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Nilai Portfolio
            </span>
            <span className="text-xs font-bold text-slate-900 tabular-nums">
              {formatIDR(snapshot.totalValue)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total P/L
            </span>
            <span className={`text-xs font-bold tabular-nums ${
              isProfit ? 'text-brand-600' : isLoss ? 'text-rose-600' : 'text-slate-600'
            }`}>
              {isProfit ? `+${formatIDR(snapshot.totalProfit).replace('Rp ', 'Rp')}` : formatIDR(snapshot.totalProfit)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Return Total
            </span>
            <span className={`text-xs font-extrabold tabular-nums ${
              isProfit ? 'text-brand-600' : isLoss ? 'text-rose-600' : 'text-slate-600'
            }`}>
              {formatPercent(snapshot.totalReturnPercent)}
            </span>
          </div>
        </div>

        {/* Asset Breakdown Table */}
        <div className="mt-4 flex-1 overflow-y-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Kondisi per Aset pada Tanggal Ini
          </h4>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5">Aset</th>
                  <th className="px-3 py-2.5 text-right">Modal</th>
                  <th className="px-3 py-2.5 text-right">Nilai</th>
                  <th className="px-3 py-2.5 text-right">Return</th>
                  <th className="px-3 py-2.5 text-right">Alokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {snapshot.assets.map((item) => {
                  const itemProfit = item.profit > 0;
                  const itemLoss = item.profit < 0;

                  return (
                    <tr key={item.assetId} className="hover:bg-slate-50/60">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <AssetIcon name={item.assetName} category={item.category} icon={item.icon} size={22} />
                          <span className="font-bold text-slate-900">{item.assetName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {formatIDR(item.investedAmount)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">
                        {formatIDR(item.currentValue)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-bold">
                        <span className={`inline-flex items-center gap-0.5 ${
                          itemProfit ? 'text-brand-600' : itemLoss ? 'text-rose-600' : 'text-slate-600'
                        }`}>
                          {itemProfit && <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />}
                          {itemLoss && <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />}
                          {!itemProfit && !itemLoss && <Minus className="h-3 w-3" />}
                          {formatPercent(item.returnPercent)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 font-medium">
                        {item.allocationPercent?.toFixed(1).replace('.', ',')}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Hapus Snapshot</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

