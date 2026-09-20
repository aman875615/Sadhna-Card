'use client';

import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface DateRangeSelectorProps {
  fromDate: string;
  toDate: string;
  onChange: (from: string, to: string) => void;
  onGenerate?: () => void;
  isLoading?: boolean;
}

export function DateRangeSelector({
  fromDate,
  toDate,
  onChange,
  onGenerate,
  isLoading = false,
}: DateRangeSelectorProps) {
  const today = new Date();

  const presets = [
    {
      label: 'Demo Interval (01-15 Sep)',
      from: '2026-09-01',
      to: '2026-09-15',
      badge: 'Test Data',
    },
    {
      label: 'Week 1 (01-07 Sep)',
      from: '2026-09-01',
      to: '2026-09-07',
    },
    {
      label: 'Week 2 (08-15 Sep)',
      from: '2026-09-08',
      to: '2026-09-15',
    },
    {
      label: 'Last 7 Days',
      from: format(subDays(today, 6), 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd'),
    },
    {
      label: 'Last 14 Days',
      from: format(subDays(today, 13), 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd'),
    },
    {
      label: 'This Month',
      from: format(startOfMonth(today), 'yyyy-MM-dd'),
      to: format(endOfMonth(today), 'yyyy-MM-dd'),
    },
    {
      label: 'Last Month',
      from: format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'),
      to: format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'),
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Select Date Range & Interval</span>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Interval: <span className="font-bold text-slate-900">{fromDate}</span> <span className="text-amber-600 font-bold">&rarr;</span> <span className="font-bold text-slate-900">{toDate}</span>
        </div>
      </div>

      {/* Quick Filter Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-400 mr-1">Presets:</span>
        {presets.map((p) => {
          const isSelected = fromDate === p.from && toDate === p.to;
          return (
            <button
              type="button"
              key={p.label}
              onClick={() => onChange(p.from, p.to)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-semibold'
                  : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-300'
              }`}
            >
              {p.label}
              {p.badge && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${isSelected ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800'}`}>
                  {p.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Date Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onChange(e.target.value, toDate)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">To Date (Inclusive)</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onChange(fromDate, e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {onGenerate && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? 'Calculating...' : 'Generate Report'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
