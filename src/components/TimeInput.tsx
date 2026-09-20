'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  quickPresets?: { label: string; time: string }[];
  helperText?: string;
  badgeScore?: { marks: number; maxMarks: number };
}

export function TimeInput({
  label,
  value,
  onChange,
  quickPresets = [],
  helperText,
  badgeScore,
}: TimeInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          {label}
        </label>
        {badgeScore !== undefined && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              badgeScore.marks >= 25
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : badgeScore.marks >= 15
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : badgeScore.marks >= 5
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {badgeScore.marks} / {badgeScore.maxMarks} Marks
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="time"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-2xs"
        />
      </div>

      {quickPresets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickPresets.map((preset) => (
            <button
              type="button"
              key={preset.time}
              onClick={() => onChange(preset.time)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                value === preset.time
                  ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {helperText && <p className="text-[11px] text-slate-500 leading-tight">{helperText}</p>}
    </div>
  );
}
