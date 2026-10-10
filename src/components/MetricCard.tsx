'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Clock, Calendar } from 'lucide-react';
import { formatPercent } from '../lib/calculations';

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  subtitle?: string;
  lastUpdated?: string;
  headerBadge?: string;
  headerBadgeVariant?: 'emerald' | 'slate' | 'neutral';
  variant?: 'default' | 'profit' | 'loss' | 'neutral';
  badgeType?: 'profit' | 'loss' | 'neutral' | 'none';
  badgeValue?: string;
  badgePercent?: number | null;
  comparisonText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  icon,
  value,
  subtitle,
  lastUpdated,
  headerBadge,
  headerBadgeVariant = 'slate',
  variant = 'default',
  badgeType = 'none',
  badgeValue,
  badgePercent,
  comparisonText,
}) => {
  const valueColor =
    variant === 'profit'
      ? 'text-emerald-700'
      : variant === 'loss'
      ? 'text-rose-600'
      : 'text-slate-900';

  const iconStyle =
    variant === 'profit'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-100/80'
      : variant === 'loss'
      ? 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100/80'
      : 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-slate-100/80 group-hover:text-slate-900';

  return (
    <div className="group relative rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
      {/* Tier 1: Top Row (Title, Badges, & Icon) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="text-[12px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </span>
          {headerBadge && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] tracking-tight ${
                headerBadgeVariant === 'emerald'
                  ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/80'
                  : 'text-slate-600 bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Calendar className="h-2.5 w-2.5 text-slate-500" />
              <span>{headerBadge}</span>
            </span>
          )}
          {lastUpdated && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] tracking-tight">
              <Clock className="h-2.5 w-2.5 text-emerald-600" />
              <span>{lastUpdated}</span>
            </span>
          )}
        </div>
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${iconStyle}`}>
          {icon}
        </div>
      </div>

      {/* Tier 2: Middle Row (Primary Metric Value) */}
      <div className="mt-3">
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${valueColor}`}>
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-slate-500">
            {subtitle}
          </div>
        )}
      </div>

      {/* Tier 3: Bottom Row (Badge & Comparison Context) */}
      {(badgeType !== 'none' || comparisonText) && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100/80">
          {badgeType === 'profit' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200/60 tabular-nums">
              <ArrowUpRight className="h-3 w-3 stroke-[2.5] text-brand-600" />
              <span>{badgeValue || (badgePercent !== undefined ? formatPercent(badgePercent) : '')}</span>
            </span>
          )}

          {badgeType === 'loss' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60 tabular-nums">
              <ArrowDownRight className="h-3 w-3 stroke-[2.5] text-rose-600" />
              <span>{badgeValue || (badgePercent !== undefined ? formatPercent(badgePercent) : '')}</span>
            </span>
          )}

          {badgeType === 'neutral' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 tabular-nums">
              <Minus className="h-3 w-3 text-slate-500" />
              <span>{badgeValue || '0,00%'}</span>
            </span>
          )}

          {comparisonText && (
            <span className="text-xs text-slate-400 font-medium">
              {comparisonText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

