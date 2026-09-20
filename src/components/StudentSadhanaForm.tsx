'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  BookOpen, 
  Headphones, 
  HeartHandshake, 
  Sparkles, 
  Save, 
  Check, 
  Building2, 
  Award,
  AlertCircle 
} from 'lucide-react';
import { TimeInput } from '@/components/TimeInput';
import { DurationInput } from '@/components/DurationInput';
import { evaluateDailyEntry, DailyScoredResult, TARGET_CONFIG } from '@/lib/scoring-engine';

interface StudentSadhanaFormProps {
  selectedDate: string;
  currentUser?: any;
  initialEntry?: any;
  onSaved?: () => void;
}

export function StudentSadhanaForm({
  selectedDate,
  currentUser,
  initialEntry,
  onSaved,
}: StudentSadhanaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sleepBedTime: '22:00',
    wakeUpTime: '04:40',
    daySleepMinutes: 15,
    japaCompletionTime: '07:10',
    japaRoundsCount: 16,
    mangalAarti: 'ON_TIME',
    sbClass: 'ON_TIME',
    prasadam: 'ON_TIME',
    officeOutTime: '09:00',
    officeInTime: '18:30',
    pathanMinutes: 30,
    pathanBookName: 'Bhagavad-gita As It Is',
    sravanMinutes: 30,
    sravanLectureTopic: 'Srila Prabhupada Lecture',
    sevaPreaching: 30,
    sevaMenial: 30,
    sevaHarinamBook: 0,
    sevaMisc: 0,
    sevaNotes: '',
    bhavanaNegativeTags: [] as string[],
    bhavanaPositiveTags: ['NTU', 'D'] as string[],
    personalNotes: '',
  });

  const [evaluatedScore, setEvaluatedScore] = useState<DailyScoredResult | null>(null);

  useEffect(() => {
    if (initialEntry) {
      let neg: string[] = [];
      let pos: string[] = [];
      try {
        if (initialEntry.bhavanaNegativeTags) neg = JSON.parse(initialEntry.bhavanaNegativeTags);
      } catch {}
      try {
        if (initialEntry.bhavanaPositiveTags) pos = JSON.parse(initialEntry.bhavanaPositiveTags);
      } catch {}

      setFormData({
        sleepBedTime: initialEntry.sleepBedTime || '',
        wakeUpTime: initialEntry.wakeUpTime || '',
        daySleepMinutes: initialEntry.daySleepMinutes || 0,
        japaCompletionTime: initialEntry.japaCompletionTime || '',
        japaRoundsCount: initialEntry.japaRoundsCount || 16,
        mangalAarti: initialEntry.mangalAarti || 'ON_TIME',
        sbClass: initialEntry.sbClass || 'ON_TIME',
        prasadam: initialEntry.prasadam || 'ON_TIME',
        officeOutTime: initialEntry.officeOutTime || '',
        officeInTime: initialEntry.officeInTime || '',
        pathanMinutes: initialEntry.pathanMinutes || 0,
        pathanBookName: initialEntry.pathanBookName || '',
        sravanMinutes: initialEntry.sravanMinutes || 0,
        sravanLectureTopic: initialEntry.sravanLectureTopic || '',
        sevaPreaching: initialEntry.sevaPreaching || 0,
        sevaMenial: initialEntry.sevaMenial || 0,
        sevaHarinamBook: initialEntry.sevaHarinamBook || 0,
        sevaMisc: initialEntry.sevaMisc || 0,
        sevaNotes: initialEntry.sevaNotes || '',
        bhavanaNegativeTags: neg,
        bhavanaPositiveTags: pos,
        personalNotes: initialEntry.personalNotes || '',
      });
    }
  }, [initialEntry]);

  useEffect(() => {
    const evalRes = evaluateDailyEntry(
      {
        ...formData,
        bhavanaNegativeTags: JSON.stringify(formData.bhavanaNegativeTags),
        bhavanaPositiveTags: JSON.stringify(formData.bhavanaPositiveTags),
      },
      'STUDENT_S2',
      selectedDate
    );
    setEvaluatedScore(evalRes);
  }, [formData, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      const res = await fetch('/api/sadhana/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: selectedDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save Sadhana entry');
      }

      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const positiveTagOptions = [
    { code: 'NTU', label: 'Enthusiastic (NTU)' },
    { code: 'D', label: 'Determined Accomplishment (D)' },
    { code: 'PT', label: 'Patient in Trying Situations (PT)' },
    { code: 'GS', label: 'Good Sanga over Bad Sanga (GS)' },
    { code: 'T', label: 'Tolerated Anger/Greed (T)' },
    { code: 'H', label: 'Humble Response (H)' },
    { code: 'F', label: 'Forgave (F)' },
  ];

  const negativeTagOptions = [
    { code: 'E', label: 'Overate (E)' },
    { code: 'U', label: 'Useless Endeavor (U)' },
    { code: 'P', label: 'Mundane Talk / Prajalpa (P)' },
    { code: 'M', label: 'Mechanical Sadhana (M)' },
    { code: 'C', label: 'Contamination by Bad Association (C)' },
    { code: 'G/J/A', label: 'Greed / Jealousy / Anger (G/J/A)' },
    { code: 'I', label: 'Irresponsible (I)' },
    { code: 'L', label: 'Lazy (L)' },
    { code: 'LU', label: 'Lust (LU)' },
    { code: 'IP', label: 'Impolite (IP)' },
    { code: 'SO', label: 'Spaced Out (SO)' },
    { code: 'FO', label: 'Fried Out (FO)' },
    { code: 'IC', label: 'Inferiority Complex (IC)' },
    { code: 'SC', label: 'Superiority Complex / Pride (SC)' },
  ];

  const toggleTag = (type: 'pos' | 'neg', code: string) => {
    if (type === 'pos') {
      setFormData((prev) => ({
        ...prev,
        bhavanaPositiveTags: prev.bhavanaPositiveTags.includes(code)
          ? prev.bhavanaPositiveTags.filter((t) => t !== code)
          : [...prev.bhavanaPositiveTags, code],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        bhavanaNegativeTags: prev.bhavanaNegativeTags.includes(code)
          ? prev.bhavanaNegativeTags.filter((t) => t !== code)
          : [...prev.bhavanaNegativeTags, code],
      }));
    }
  };

  const cfg = TARGET_CONFIG.STUDENT_S2;
  const targetDailyPathan = Math.round(cfg.weeklyPathanMinutes / 7); // 30 min
  const targetDailySravan = Math.round(cfg.weeklySravanMinutes / 7); // 30 min
  const targetDailySeva = Math.round(cfg.weeklySevaMinutes / 7); // 51 min

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Content (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Devotee Info Banner */}
        {currentUser && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100/50 border border-blue-200/80 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center shadow-md text-base">
                {currentUser.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-base text-slate-900">{currentUser.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-600 text-white shadow-xs">
                    Student (Card S2)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-700">{currentUser.email}</span>
                  {currentUser.preacher?.name && (
                    <span className="ml-2 text-indigo-700 font-medium">&bull; Preacher: {currentUser.preacher.name}</span>
                  )}
                  {currentUser.counsellor?.name && (
                    <span className="ml-2 text-amber-700 font-medium">&bull; Counsellor: {currentUser.counsellor.name}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur px-3.5 py-2 rounded-2xl border border-blue-200 shadow-2xs text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Entry Date</span>
              <span className="text-xs font-black text-blue-900">{selectedDate}</span>
            </div>
          </div>
        )}

        {/* 1. NIDRA & JAPA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              1. Nidra & Japa (Student Card-2)
            </h2>
            <span className="text-xs font-semibold text-slate-500">Time-of-day input</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TimeInput
              label="Bed Time (To Bed)"
              value={formData.sleepBedTime}
              onChange={(val) => setFormData((prev) => ({ ...prev, sleepBedTime: val }))}
              quickPresets={[
                { label: '9:50 PM', time: '21:50' },
                { label: '10:00 PM', time: '22:00' },
                { label: '10:05 PM', time: '22:05' },
                { label: '10:15 PM', time: '22:15' },
              ]}
              helperText="<= 10:00 PM (25 pts), reduce 5 pts every 5 min"
              badgeScore={
                evaluatedScore
                  ? { marks: evaluatedScore.scores.bedTime.marks, maxMarks: 25 }
                  : undefined
              }
            />

            <TimeInput
              label="Wake Up Time"
              value={formData.wakeUpTime}
              onChange={(val) => setFormData((prev) => ({ ...prev, wakeUpTime: val }))}
              quickPresets={[
                { label: '3:45 AM', time: '03:45' },
                { label: '4:00 AM', time: '04:00' },
                { label: '4:30 AM', time: '04:30' },
                { label: '4:45 AM', time: '04:45' },
              ]}
              helperText="<= 3:45 AM (25 pts), reduce 5 pts every 5 min"
              badgeScore={
                evaluatedScore
                  ? { marks: evaluatedScore.scores.wakeUp.marks, maxMarks: 25 }
                  : undefined
              }
            />

            <DurationInput
              label="Day Sleep Duration"
              totalMinutes={formData.daySleepMinutes}
              onChange={(mins) => setFormData((prev) => ({ ...prev, daySleepMinutes: mins }))}
              helperText="<= 60 min (25 pts). -1 pt per 2 min over 60 min"
            />

            <TimeInput
              label="Japa Completion Time (16 Rounds)"
              value={formData.japaCompletionTime}
              onChange={(val) => setFormData((prev) => ({ ...prev, japaCompletionTime: val }))}
              quickPresets={[
                { label: '7:10 AM', time: '07:10' },
                { label: '8:15 AM', time: '08:15' },
                { label: '11:00 AM', time: '11:00' },
                { label: '1:00 PM', time: '13:00' },
              ]}
              helperText="Before 7:15 AM (25 pts), before breakfast (20 pts), before 11:00 AM (15 pts)"
              badgeScore={
                evaluatedScore
                  ? { marks: evaluatedScore.scores.japa.marks, maxMarks: 25 }
                  : undefined
              }
            />
          </div>
        </div>

        {/* 2. OFFICE / COLLEGE TIMING */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              2. BACE Out / In Timing (Office / College)
            </h2>
            <span className="text-xs font-semibold text-slate-500">Student Card Specific</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TimeInput
              label="BACE Out Time (Leaving for Work/College)"
              value={formData.officeOutTime}
              onChange={(val) => setFormData((prev) => ({ ...prev, officeOutTime: val }))}
              quickPresets={[
                { label: '8:30 AM', time: '08:30' },
                { label: '9:00 AM', time: '09:00' },
                { label: '9:30 AM', time: '09:30' },
              ]}
            />

            <TimeInput
              label="BACE In Time (Returning to BACE)"
              value={formData.officeInTime}
              onChange={(val) => setFormData((prev) => ({ ...prev, officeInTime: val }))}
              quickPresets={[
                { label: '6:00 PM', time: '18:00' },
                { label: '6:30 PM', time: '18:30' },
                { label: '7:00 PM', time: '19:00' },
              ]}
            />
          </div>
        </div>

        {/* 3. BACE ATTENDANCE */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              3. Attendance (Mangal Aarti, SB Class, Prasadam)
            </h2>
            <span className="text-xs font-semibold text-slate-500">Max 15 pts/day</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'mangalAarti', label: 'Mangal Aarti' },
              { key: 'sbClass', label: 'Srimad Bhagavatam' },
              { key: 'prasadam', label: 'Prasadam' },
            ].map((item) => {
              const currentStatus = (formData as any)[item.key];
              return (
                <div key={item.key} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-800">{item.label}</p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-medium">
                    {[
                      { val: 'ON_TIME', label: 'On Time (5)' },
                      { val: 'LATE', label: 'Late (3)' },
                      { val: 'ABSENT', label: 'Absent (0)' },
                      { val: 'SEVA_EXCUSED', label: 'Excused (5)' },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.val}
                        onClick={() => setFormData((prev) => ({ ...prev, [item.key]: opt.val }))}
                        className={`py-1 px-1.5 rounded-lg border transition-colors ${
                          currentStatus === opt.val
                            ? 'bg-amber-600 text-white border-amber-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. PATHAN & SRAVAN */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              4. Pathan & Sravan (Weekly Target: 3.5 hrs / 210 min each)
            </h2>
            <span className="text-xs font-semibold text-slate-500">Daily ~30 min</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <DurationInput
                label="Pathan (Book Reading)"
                totalMinutes={formData.pathanMinutes}
                onChange={(m) => setFormData((prev) => ({ ...prev, pathanMinutes: m }))}
                targetDailyMinutes={targetDailyPathan}
              />
              <input
                type="text"
                placeholder="Prescribed Book Name / Chapter"
                value={formData.pathanBookName}
                onChange={(e) => setFormData((prev) => ({ ...prev, pathanBookName: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <DurationInput
                label="Sravan (Lecture Hearing)"
                totalMinutes={formData.sravanMinutes}
                onChange={(m) => setFormData((prev) => ({ ...prev, sravanMinutes: m }))}
                targetDailyMinutes={targetDailySravan}
              />
              <input
                type="text"
                placeholder="Prescribed Lecture / Topic"
                value={formData.sravanLectureTopic}
                onChange={(e) => setFormData((prev) => ({ ...prev, sravanLectureTopic: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 5. SEVA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-600" />
              5. Seva (Weekly Target: 6 hrs = 3h Preaching + 3h BACE Seva)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <DurationInput
              label="Preaching / Satsang"
              totalMinutes={formData.sevaPreaching}
              onChange={(m) => setFormData((prev) => ({ ...prev, sevaPreaching: m }))}
            />
            <DurationInput
              label="BACE Menial / Cleaning"
              totalMinutes={formData.sevaMenial}
              onChange={(m) => setFormData((prev) => ({ ...prev, sevaMenial: m }))}
            />
            <DurationInput
              label="Harinam / Book Table"
              totalMinutes={formData.sevaHarinamBook}
              onChange={(m) => setFormData((prev) => ({ ...prev, sevaHarinamBook: m }))}
            />
            <DurationInput
              label="Other Seva"
              totalMinutes={formData.sevaMisc}
              onChange={(m) => setFormData((prev) => ({ ...prev, sevaMisc: m }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Seva Notes</label>
            <input
              type="text"
              placeholder="Specific seva done today..."
              value={formData.sevaNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, sevaNotes: e.target.value }))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* 6. SEVA BHAVANA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              6. Seva Bhavana (Attitude Barometer)
            </h2>
            <span className="text-xs font-semibold text-slate-500">Student Self-Audit</span>
          </div>

          {/* Positive */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-800">Positive Virtues Cultivated Today:</p>
            <div className="flex flex-wrap gap-1.5">
              {positiveTagOptions.map((tag) => {
                const isChecked = formData.bhavanaPositiveTags.includes(tag.code);
                return (
                  <button
                    type="button"
                    key={tag.code}
                    onClick={() => toggleTag('pos', tag.code)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      isChecked
                        ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Negative */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-rose-800">Obstacles / Anarthas Observed:</p>
            <div className="flex flex-wrap gap-1.5">
              {negativeTagOptions.map((tag) => {
                const isChecked = formData.bhavanaNegativeTags.includes(tag.code);
                return (
                  <button
                    type="button"
                    key={tag.code}
                    onClick={() => toggleTag('neg', tag.code)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      isChecked
                        ? 'bg-rose-600 text-white border-rose-600 font-semibold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Realization / Prayer</label>
            <textarea
              rows={2}
              placeholder="Thoughts for preacher guidance..."
              value={formData.personalNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, personalNotes: e.target.value }))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Live Sidebar (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="sticky top-20 bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-600" />
                Scorecard
              </h3>
              <p className="text-xs font-bold text-blue-700 truncate max-w-[150px]">
                {currentUser?.name || 'Student BACE'}
              </p>
              <p className="text-[11px] text-slate-400">Date: {selectedDate}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-600 block leading-tight">
                {evaluatedScore?.scores.dailyOverallPercentage || 0}%
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Daily Score</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Nidra (Max 75)</span>
              <span className="font-bold text-slate-900">
                {evaluatedScore?.scores.nidraTotal.marks} pts ({evaluatedScore?.scores.nidraTotal.percentage}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Japa (Max 25)</span>
              <span className="font-bold text-slate-900">
                {evaluatedScore?.scores.japa.marks} pts ({evaluatedScore?.scores.japa.percentage}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Attendance (Max 15)</span>
              <span className="font-bold text-slate-900">
                {evaluatedScore?.scores.attendance.totalMarks} / 15 pts ({evaluatedScore?.scores.attendance.percentage}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Pathan (Reading)</span>
              <span className="font-bold text-slate-900">
                {evaluatedScore?.scores.pathan.actualMinutes}m / {targetDailyPathan}m
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Sravan (Hearing)</span>
              <span className="font-bold text-slate-900">
                {evaluatedScore?.scores.sravan.actualMinutes}m / {targetDailySravan}m
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Total Seva</span>
              <span className="font-bold text-slate-900">
                {evaluatedScore?.scores.seva.totalMinutes}m / {targetDailySeva}m
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving to Database...</span>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Student Sadhana Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save My Sadhana</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Submitted for your account. Preacher and Counsellor can view your report.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
