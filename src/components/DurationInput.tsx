'use client';

import React from 'react';
import { Timer, Plus } from 'lucide-react';

interface DurationInputProps {
  label: string;
  totalMinutes: number;
  onChange: (minutes: number) => void;
  targetDailyMinutes?: number;
  helperText?: string;
}

export function DurationInput({
  label,
  totalMinutes = 0,
  onChange,
  targetDailyMinutes,
  helperText,
}: DurationInputProps) {
  const hours = Math.floor((totalMinutes || 0) / 60);
  const minutes = (totalMinutes || 0) % 60;

  const handleHoursChange = (h: number) => {
    const validH = Math.max(0, isNaN(h) ? 0 : h);
    onChange(validH * 60 + minutes);
  };

  const handleMinutesChange = (m: number) => {
    const validM = Math.max(0, Math.min(59, isNaN(m) ? 0 : m));
    onChange(hours * 60 + validM);
  };

  const addMinutes = (inc: number) => {
    onChange(Math.max(0, (totalMinutes || 0) + inc));
  };

  const pct = targetDailyMinutes && targetDailyMinutes > 0 ? Math.round((totalMinutes / targetDailyMinutes) * 100) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-amber-600" />
          {label}
        </label>
        {targetDailyMinutes !== undefined && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              pct !== null && pct >= 100
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : pct !== null && pct >= 75
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {totalMinutes}m / {targetDailyMinutes}m ({pct}%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white shadow-2xs">
          <input
            type="number"
            min="0"
            max="24"
            value={hours === 0 && totalMinutes === 0 ? '' : hours}
            placeholder="0"
            onChange={(e) => handleHoursChange(parseInt(e.target.value, 10))}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-hidden"
          />
          <span className="text-xs font-medium text-slate-500">hrs</span>
        </div>

        <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white shadow-2xs">
          <input
            type="number"
            min="0"
            max="59"
            step="5"
            value={minutes === 0 && totalMinutes === 0 ? '' : minutes}
            placeholder="0"
            onChange={(e) => handleMinutesChange(parseInt(e.target.value, 10))}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-hidden"
          />
          <span className="text-xs font-medium text-slate-500">mins</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] text-slate-400 font-medium">Quick add:</span>
        {[15, 30, 45, 60].map((mins) => (
          <button
            type="button"
            key={mins}
            onClick={() => addMinutes(mins)}
            className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-700 rounded-md transition-colors"
          >
            <Plus className="w-2.5 h-2.5 text-amber-600" />
            {mins}m
          </button>
        ))}
        {totalMinutes > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-[10px] font-medium px-1.5 py-0.5 text-slate-400 hover:text-red-500 transition-colors ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {helperText && <p className="text-[11px] text-slate-500 leading-tight">{helperText}</p>}
    </div>
  );
}
