'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Clock, BookOpen, Heart, Moon, Sun, Info, Calendar } from 'lucide-react';

interface EffectiveRulesData {
  bedTime: string;
  wakeUpTime: string;
  daySleepLimit: number;
  japaTargetTime: string;
  weeklyPathanHours: number;
  weeklySravanHours: number;
  weeklySevaHours: number;
  activeOverrides: Record<string, {
    overrideId: string;
    originalValue: string;
    overrideValue: string;
    reason: string;
    effectiveFrom: string;
    effectiveUntil?: string | null;
    createdByName: string;
    createdByRole: string;
  }>;
}

export function MyEffectiveRulesCard() {
  const [data, setData] = useState<{
    user: any;
    effectiveRules: EffectiveRulesData;
    date: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchMyRules();
  }, []);

  const fetchMyRules = async () => {
    try {
      const res = await fetch('/api/sadhana-rules/my');
      const json = await res.json();
      if (res.ok && json.effectiveRules) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) return null;

  const overrides = data.effectiveRules.activeOverrides || {};
  const overrideCount = Object.keys(overrides).length;
  const hasOverrides = overrideCount > 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100/70 text-amber-800">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                My Sadhana Targets & Effective Rules
              </h3>
              {hasOverrides ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-300">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  {overrideCount} Custom Rule{overrideCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  Standard Rules
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Resolved daily targets for scoring & report generation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          {isExpanded ? 'Hide Targets' : 'View Targets'}
        </button>
      </div>

      {hasOverrides && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-950 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Personalized Rule Adjustment Applied by Your Authority</span>
          </div>
          {Object.entries(overrides).map(([key, ov]) => (
            <p key={key} className="text-[11px] text-amber-800 pl-5">
              &bull; <strong>{key.replace(/_/g, ' ')}</strong>: Adjusted to <strong>{ov.overrideValue}</strong> by{' '}
              {ov.createdByName} ({ov.reason})
            </p>
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs animate-in fade-in slide-in-from-top-1">
          <div className={`p-3 rounded-2xl border ${overrides['BED_TIME'] ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold">
              <Moon className="w-3 h-3 text-indigo-500" />
              <span>Bed Time</span>
            </div>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">
              {data.effectiveRules.bedTime}
            </span>
            {overrides['BED_TIME'] && (
              <span className="text-[9px] font-bold text-amber-700 block">Customized</span>
            )}
          </div>

          <div className={`p-3 rounded-2xl border ${overrides['WAKE_UP_TIME'] ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold">
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Wake Up</span>
            </div>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">
              {data.effectiveRules.wakeUpTime}
            </span>
            {overrides['WAKE_UP_TIME'] && (
              <span className="text-[9px] font-bold text-amber-700 block">Customized</span>
            )}
          </div>

          <div className={`p-3 rounded-2xl border ${overrides['PATHAN_WEEKLY_HOURS'] ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold">
              <BookOpen className="w-3 h-3 text-emerald-500" />
              <span>Pathan Target</span>
            </div>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">
              {data.effectiveRules.weeklyPathanHours} hrs/wk
            </span>
            {overrides['PATHAN_WEEKLY_HOURS'] && (
              <span className="text-[9px] font-bold text-amber-700 block">Customized</span>
            )}
          </div>

          <div className={`p-3 rounded-2xl border ${overrides['SEVA_WEEKLY_HOURS'] ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold">
              <Heart className="w-3 h-3 text-rose-500" />
              <span>Seva Target</span>
            </div>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">
              {data.effectiveRules.weeklySevaHours} hrs/wk
            </span>
            {overrides['SEVA_WEEKLY_HOURS'] && (
              <span className="text-[9px] font-bold text-amber-700 block">Customized</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
