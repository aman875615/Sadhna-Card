'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, AlertCircle, Sparkles, Shield } from 'lucide-react';
import { DailyScoredResult } from '@/lib/scoring-engine';

interface DailyBreakdownTableProps {
  days: DailyScoredResult[];
}

export function DailyBreakdownTable({ days }: DailyBreakdownTableProps) {
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    days.forEach((d) => (all[d.date] = true));
    setExpandedDates(all);
  };

  const collapseAll = () => {
    setExpandedDates({});
  };

  if (!days || days.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <p className="text-sm text-slate-500">No records found for the selected interval.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Daily Breakdown & Raw Activity Audit
          </h3>
          <p className="text-xs text-slate-500">Click on any date to inspect raw input data, custom rule targets, and scoring calculations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold px-2 py-1 bg-amber-50 rounded-md cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2 py-1 bg-slate-100 rounded-md cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Nidra %</th>
              <th className="py-3 px-3">Japa %</th>
              <th className="py-3 px-3">Attendance %</th>
              <th className="py-3 px-3">Pathan</th>
              <th className="py-3 px-3">Sravan</th>
              <th className="py-3 px-3">Seva</th>
              <th className="py-3 px-3">Daily Score</th>
              <th className="py-3 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {days.map((item) => {
              const isExpanded = Boolean(expandedDates[item.date]);
              const s = item.scores;
              const hasDayOverride = Boolean(
                s.bedTime.isOverridden ||
                s.wakeUp.isOverridden ||
                s.daySleep.isOverridden ||
                s.japa.isOverridden ||
                s.pathan.isOverridden ||
                s.sravan.isOverridden ||
                s.seva.isOverridden
              );

              return (
                <React.Fragment key={item.date}>
                  <tr
                    onClick={() => toggleDate(item.date)}
                    className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>{item.date}</span>
                      {hasDayOverride && (
                        <span
                          className="p-0.5 rounded-full bg-amber-100 text-amber-800"
                          title="Custom rule override active on this date"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {item.isSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {item.isSubmitted ? `${s.nidraTotal.percentage}%` : '-'}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {item.isSubmitted ? `${s.japa.percentage}%` : '-'}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {item.isSubmitted ? `${s.attendance.percentage}%` : '-'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {item.isSubmitted ? `${s.pathan.actualMinutes}m` : '-'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {item.isSubmitted ? `${s.sravan.actualMinutes}m` : '-'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {item.isSubmitted ? `${s.seva.totalMinutes}m` : '-'}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-amber-700">
                      {item.isSubmitted ? (
                        <span className="px-2 py-1 bg-amber-100/70 text-amber-900 rounded-md font-bold">
                          {s.dailyOverallPercentage}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 inline text-amber-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 inline text-slate-400" />
                      )}
                    </td>
                  </tr>

                  {/* Expanded Raw Data Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50/90 border-t border-b border-amber-100">
                      <td colSpan={10} className="p-4 sm:p-5">
                        {hasDayOverride && (
                          <div className="mb-3 p-2 bg-amber-100/60 border border-amber-300/80 rounded-xl text-[11px] text-amber-950 flex items-center gap-1.5 font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Date-specific custom Sadhana rule override was active on this day. Targets adjusted accordingly.</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Nidra & Japa */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Nidra & Japa (Raw Input vs Target)
                            </h4>
                            <div className="space-y-1 text-slate-600">
                              <p className="flex justify-between items-center">
                                <span>
                                  Bed Time {s.bedTime.isOverridden ? '(Custom Target: ' + s.bedTime.target + ')' : '(Target: ' + s.bedTime.target + ')'}:
                                </span>
                                <span className="font-bold text-slate-900">
                                  {s.bedTime.raw || 'Not entered'} ({s.bedTime.marks} / 25 pts)
                                </span>
                              </p>
                              <p className="flex justify-between items-center">
                                <span>
                                  Wake Up {s.wakeUp.isOverridden ? '(Custom Target: ' + s.wakeUp.target + ')' : '(Target: ' + s.wakeUp.target + ')'}:
                                </span>
                                <span className="font-bold text-slate-900">
                                  {s.wakeUp.raw || 'Not entered'} ({s.wakeUp.marks} / 25 pts)
                                </span>
                              </p>
                              <p className="flex justify-between items-center">
                                <span>Day Sleep (Limit: {s.daySleep.targetLimit}m):</span>
                                <span className="font-bold text-slate-900">
                                  {s.daySleep.rawMinutes}m ({s.daySleep.marks} / 25 pts)
                                </span>
                              </p>
                              <p className="flex justify-between items-center border-t border-slate-100 pt-1">
                                <span>Japa ({s.japa.rounds} rds, Target: {s.japa.targetTime}):</span>
                                <span className="font-bold text-slate-900">
                                  {s.japa.rawTime || 'Not entered'} ({s.japa.marks} / 25 pts)
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Attendance & Reading/Hearing */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              Attendance & Study
                            </h4>
                            <div className="space-y-1 text-slate-600">
                              <p className="flex justify-between">
                                <span>Mangal Aarti:</span>
                                <span className="font-semibold">{s.attendance.mangalAarti.status}</span>
                              </p>
                              {s.attendance.guruPuja && (
                                <p className="flex justify-between">
                                  <span>Guru Puja:</span>
                                  <span className="font-semibold">{s.attendance.guruPuja.status}</span>
                                </p>
                              )}
                              <p className="flex justify-between">
                                <span>SB Class:</span>
                                <span className="font-semibold">{s.attendance.sbClass.status}</span>
                              </p>
                              <p className="flex justify-between">
                                <span>Prasadam:</span>
                                <span className="font-semibold">{s.attendance.prasadam.status}</span>
                              </p>
                              <p className="flex justify-between border-t border-slate-100 pt-1">
                                <span>Pathan ({s.pathan.actualMinutes}m / Target {s.pathan.targetDailyMinutes}m):</span>
                                <span className="text-slate-800 font-medium truncate max-w-[140px]">
                                  {s.pathan.bookName || 'General reading'}
                                </span>
                              </p>
                              <p className="flex justify-between">
                                <span>Sravan ({s.sravan.actualMinutes}m / Target {s.sravan.targetDailyMinutes}m):</span>
                                <span className="text-slate-800 font-medium truncate max-w-[140px]">
                                  {s.sravan.topic || 'General hearing'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Seva & Attitude */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              Seva & Bhavana Barometer
                            </h4>
                            <div className="space-y-1 text-slate-600">
                              <p className="font-semibold text-slate-800">
                                Total Seva: <span className="text-amber-700">{s.seva.totalMinutes} min</span> / Target {s.seva.targetDailyMinutes}m
                              </p>
                              {s.seva.notes && (
                                <p className="text-[11px] text-slate-500 italic truncate">
                                  Notes: {s.seva.notes}
                                </p>
                              )}
                              <div className="border-t border-slate-100 pt-1 space-y-1">
                                <p className="text-[11px] text-slate-500">
                                  Negative Tags:{' '}
                                  {s.sevaBhavana.negativeTags.length > 0
                                    ? s.sevaBhavana.negativeTags.join(', ')
                                    : 'None'}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Positive Tags:{' '}
                                  {s.sevaBhavana.positiveTags.length > 0
                                    ? s.sevaBhavana.positiveTags.join(', ')
                                    : 'None'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
