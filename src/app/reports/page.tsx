'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calendar, 
  Award, 
  Clock, 
  BookOpen, 
  Headphones, 
  Sparkles, 
  HeartHandshake, 
  TrendingUp, 
  Printer, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { DailyBreakdownTable } from '@/components/DailyBreakdownTable';
import { PeriodReport } from '@/lib/scoring-engine';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userIdParam = searchParams.get('userId');
  const fromParam = searchParams.get('from') || '2026-09-01';
  const toParam = searchParams.get('to') || '2026-09-15';

  const [report, setReport] = useState<PeriodReport | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(userIdParam || '');
  const [fromDate, setFromDate] = useState<string>(fromParam);
  const [toDate, setToDate] = useState<string>(toParam);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (selectedUserId && fromDate && toDate) {
      fetchReport(selectedUserId, fromDate, toDate);
    }
  }, [selectedUserId, fromDate, toDate]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setAllUsers(data.allUsers || []);
        const targetId = userIdParam || data.user.id || data.allUsers?.[0]?.id;
        if (targetId) {
          setSelectedUserId(targetId);
        }
      } else if (data.allUsers && data.allUsers.length > 0) {
        setAllUsers(data.allUsers);
        setSelectedUserId(userIdParam || data.allUsers[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReport = async (userId: string, from: string, to: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/reports/${userId}?from=${from}&to=${to}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch report');
      }
      const data: PeriodReport = await res.json();
      setReport(data);

      // Update URL silently without full reload
      router.replace(`/reports?userId=${userId}&from=${from}&to=${to}`, { scroll: false });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRangeChange = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
  };

  const handleUserSelect = (uid: string) => {
    setSelectedUserId(uid);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 print-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider border border-amber-200">
              Dynamic Date-Range Report
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-600" />
            Sadhana Evaluation & Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Raw activity data evaluated dynamically over any custom date interval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* User selector for Admin/Counsellor */}
          {allUsers.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Devotee:</span>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="no-print">
        <DateRangeSelector
          fromDate={fromDate}
          toDate={toDate}
          onChange={handleRangeChange}
          isLoading={isLoading}
        />
      </div>

      {error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Unable to load report</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        </div>
      ) : isLoading && !report ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          Calculating Sadhana scores across interval...
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Devotee Info & Overall Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Devotee Identity */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                    {report.user.role} ({report.user.cardType === 'BRAHMACHARI_S1' ? 'Card S1' : 'Card S2'})
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur">
                    {report.period.from} &rarr; {report.period.to} ({report.period.totalDays} Days)
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black">{report.user.name}</h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {report.user.counsellorName ? `Counselor: ${report.user.counsellorName}` : ''} 
                    {report.user.preacherName ? ` | Preacher: ${report.user.preacherName}` : ''}
                  </p>
                </div>

                {/* Submission stats */}
                <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-slate-300">Days Expected:</span>
                    <span className="font-bold text-white">{report.period.totalDays}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-300">
                    <span>Submitted:</span>
                    <span className="font-bold">{report.period.submittedDays}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-300">
                    <span>Missing:</span>
                    <span className="font-bold">{report.period.missingDays}</span>
                  </div>
                </div>
              </div>

              {/* Overall Score Radial / Badge */}
              <div className="md:col-span-5 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/15 text-center space-y-2">
                <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                  Overall Sadhana Score
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {report.overall.overallPercentage}%
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      report.overall.gradeBand === 'High Honors' || report.overall.gradeBand === 'Honors'
                        ? 'bg-amber-400 text-amber-950 shadow-md'
                        : report.overall.gradeBand === 'Distinction'
                        ? 'bg-emerald-400 text-emerald-950 shadow-md'
                        : report.overall.gradeBand === 'First Class'
                        ? 'bg-blue-400 text-blue-950 shadow-md'
                        : report.overall.gradeBand === 'Pass'
                        ? 'bg-slate-200 text-slate-900'
                        : 'bg-rose-400 text-rose-950'
                    }`}
                  >
                    {report.overall.gradeBand}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 pt-1">
                  Pass: 80% &bull; First Class: 85% &bull; Distinction: 90% &bull; Honors: 95%
                </p>
              </div>
            </div>
          </div>

          {/* Section Performance Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                Section-by-Section Performance
              </h3>
              <span className="text-xs text-slate-500">Interval: {report.period.totalDays} days</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. NIDRA */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Nidra (Sleep)
                  </div>
                  <span className="text-lg font-black text-amber-600">
                    {report.sections.nidra.percentage}%
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="flex justify-between">
                    <span>Obtained Marks:</span>
                    <span className="font-bold text-slate-900">
                      {report.sections.nidra.obtainedMarks} / {report.sections.nidra.maximumMarks} pts
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Performance Band:</span>
                    <span className="font-semibold text-amber-700">{report.sections.nidra.statusGrade}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Evaluates bed time, wake up & day sleep for {report.period.totalDays} days
                  </p>
                </div>
              </div>

              {/* 2. JAPA */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Japa Meditation
                  </div>
                  <span className="text-lg font-black text-amber-600">
                    {report.sections.japa.percentage}%
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="flex justify-between">
                    <span>Obtained Marks:</span>
                    <span className="font-bold text-slate-900">
                      {report.sections.japa.obtainedMarks} / {report.sections.japa.maximumMarks} pts
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Performance Band:</span>
                    <span className="font-semibold text-amber-700">{report.sections.japa.statusGrade}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    16 rounds completion timing evaluated daily
                  </p>
                </div>
              </div>

              {/* 3. ATTENDANCE */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <CheckCircle className="w-4 h-4 text-amber-600" />
                    Attendance
                  </div>
                  <span className="text-lg font-black text-amber-600">
                    {report.sections.attendance.percentage}%
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="flex justify-between">
                    <span>Obtained Marks:</span>
                    <span className="font-bold text-slate-900">
                      {report.sections.attendance.obtainedMarks} / {report.sections.attendance.maximumMarks} pts
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Status Band:</span>
                    <span className="font-semibold text-amber-700">{report.sections.attendance.statusGrade}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Temple morning & evening program attendance
                  </p>
                </div>
              </div>

              {/* 4. PATHAN */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    Pathan (Reading)
                  </div>
                  <span className="text-lg font-black text-amber-600">
                    {report.sections.pathan.percentage}%
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="flex justify-between">
                    <span>Actual Reading:</span>
                    <span className="font-bold text-slate-900">
                      {report.sections.pathan.actualMinutes} min ({Math.round(((report.sections.pathan.actualMinutes || 0) / 60) * 10) / 10} hrs)
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Interval Target:</span>
                    <span className="font-semibold text-slate-800">
                      {report.sections.pathan.targetMinutes} min ({Math.round(((report.sections.pathan.targetMinutes || 0) / 60) * 10) / 10} hrs)
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Proportional to {report.period.totalDays} days interval
                  </p>
                </div>
              </div>

              {/* 5. SRAVAN */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Headphones className="w-4 h-4 text-amber-600" />
                    Sravan (Hearing)
                  </div>
                  <span className="text-lg font-black text-amber-600">
                    {report.sections.sravan.percentage}%
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="flex justify-between">
                    <span>Actual Hearing:</span>
                    <span className="font-bold text-slate-900">
                      {report.sections.sravan.actualMinutes} min ({Math.round(((report.sections.sravan.actualMinutes || 0) / 60) * 10) / 10} hrs)
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Interval Target:</span>
                    <span className="font-semibold text-slate-800">
                      {report.sections.sravan.targetMinutes} min ({Math.round(((report.sections.sravan.targetMinutes || 0) / 60) * 10) / 10} hrs)
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Lectures and kirtan hearing duration
                  </p>
                </div>
              </div>

              {/* 6. SEVA */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <HeartHandshake className="w-4 h-4 text-amber-600" />
                    Seva (Devotional Service)
                  </div>
                  <span className="text-lg font-black text-amber-600">
                    {report.sections.seva.percentage}%
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="flex justify-between">
                    <span>Actual Seva:</span>
                    <span className="font-bold text-slate-900">
                      {report.sections.seva.actualMinutes} min ({Math.round(((report.sections.seva.actualMinutes || 0) / 60) * 10) / 10} hrs)
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Interval Target:</span>
                    <span className="font-semibold text-slate-800">
                      {report.sections.seva.targetMinutes} min ({Math.round(((report.sections.seva.targetMinutes || 0) / 60) * 10) / 10} hrs)
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Preaching, management, menial, harinam seva
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seva Bhavana Barometer Summary */}
          {report.sections.sevaBhavana && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Seva Bhavana Attitude Barometer Analysis ({report.sections.sevaBhavana.daysWithLogs} days logged)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 space-y-2">
                  <p className="font-bold text-emerald-900">Top Positive Virtues Cultivated:</p>
                  {report.sections.sevaBhavana.topPositiveTags.length === 0 ? (
                    <p className="text-slate-400">None logged in this interval</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {report.sections.sevaBhavana.topPositiveTags.map((item) => (
                        <span key={item.tag} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-xs">
                          +{item.tag} ({item.count}x)
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 space-y-2">
                  <p className="font-bold text-rose-900">Obstacles / Anarthas Monitored:</p>
                  {report.sections.sevaBhavana.topNegativeTags.length === 0 ? (
                    <p className="text-slate-400">None logged in this interval</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {report.sections.sevaBhavana.topNegativeTags.map((item) => (
                        <span key={item.tag} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-xs">
                          -{item.tag} ({item.count}x)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Daily Breakdown Table */}
          <DailyBreakdownTable days={report.dailyBreakdown} />
        </div>
      ) : null}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Reports Engine...</div>}>
      <ReportContent />
    </Suspense>
  );
}
