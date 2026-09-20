'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Sparkles, 
  BookOpen, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Network, 
  Award, 
  ShieldCheck,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import { StudentSadhanaForm } from '@/components/StudentSadhanaForm';
import { BrahmachariSadhanaForm } from '@/components/BrahmachariSadhanaForm';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initialEntry, setInitialEntry] = useState<any>(null);
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMyEntry(selectedDate);
    }
  }, [selectedDate, currentUser]);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        if (data.user.role === 'BRAHMACHARI') {
          // Fetch their assigned students
          const treeRes = await fetch('/api/users/tree');
          const treeData = await treeRes.json();
          setMyStudents(treeData.students || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyEntry = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/sadhana/my?date=${dateStr}`);
      const data = await res.json();
      if (data.entry) {
        setInitialEntry(data.entry);
      } else {
        setInitialEntry(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const changeDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        Loading user dashboard...
      </div>
    );
  }

  // Counsellor View
  if (currentUser?.role === 'COUNSELLOR') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
              Counsellor Portal & Monitoring
            </span>
            <h1 className="text-3xl font-black">{currentUser.name}</h1>
            <p className="text-amber-100 text-sm max-w-xl">
              As a Counsellor, your role is to guide and monitor the Sadhana of your assigned Brahmacharis and Students.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/counsellor/tree"
              className="px-5 py-3 bg-white text-amber-900 rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Network className="w-4 h-4 text-amber-600" />
              Open Hierarchy Tree Explorer
            </Link>
            <Link
              href={`/reports?userId=${currentUser.id}&from=2026-09-01&to=2026-09-15`}
              className="px-5 py-3 bg-amber-900/60 hover:bg-amber-900 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              Inspect Sadhana Reports
            </Link>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Counsellor Guidelines
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            &bull; Sadhana Cards are strictly filled by the respective devotees (Brahmacharis and Students).<br />
            &bull; You can inspect date-range reports for any complete or partial interval with dynamic target calculations.<br />
            &bull; Use the <Link href="/counsellor/tree" className="text-amber-700 font-bold underline">Hierarchy Tree</Link> to drill down into any Brahmachari or Student.
          </p>
        </div>
      </div>
    );
  }

  // Admin View
  if (currentUser?.role === 'ADMIN') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
              Temple Administrator
            </span>
            <h1 className="text-3xl font-black">{currentUser.name}</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              System-wide management of scoring rules, users, tree assignments, and interval reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/counsellor/tree"
              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-extrabold shadow-md flex items-center gap-2"
            >
              <Network className="w-4 h-4" />
              Hierarchy Tree
            </Link>
            <Link
              href="/admin"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              Rules & Config
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Student & Brahmachari Self Sadhana Card Entry View
  const isBrahmachari = currentUser?.role === 'BRAHMACHARI';
  const isStudent = currentUser?.role === 'STUDENT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner with Self Role Badge */}
      <div
        className={`rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isBrahmachari
            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold uppercase tracking-wider">
              {isBrahmachari ? 'Brahmachari / Preacher Panel' : 'Student BACE Panel'}
            </span>
            <span className="text-white/80 text-xs">| {currentUser?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isBrahmachari ? 'Fill My Brahmachari Sadhana (Card-1)' : 'Fill My Student Sadhana (Card-2)'}
          </h1>
          <p className="text-white/90 text-xs sm:text-sm max-w-xl">
            {isBrahmachari
              ? 'Enter your daily Ashram timing and devotional service. 42h weekly seva target.'
              : 'Enter your daily BACE timing, office hours, and study. 6h weekly seva target.'}
          </p>
        </div>

        {/* Date Selector & My Report Link */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/reports?userId=${currentUser?.id}&from=2026-09-01&to=2026-09-15`}
            className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Award className="w-4 h-4" />
            My Sadhana Report
          </Link>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-1.5 border border-white/20 flex items-center gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => changeDay(-1)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl text-slate-900 font-bold text-xs shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-xs focus:outline-hidden text-slate-900 cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => changeDay(1)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Brahmachari specific: My Students summary widget */}
      {isBrahmachari && myStudents.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-slate-800">
              My Assigned Students ({myStudents.length}):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {myStudents.map((s) => (
              <Link
                key={s.id}
                href={`/reports?userId=${s.id}&from=2026-09-01&to=2026-09-15`}
                className="px-3 py-1 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-900 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>{s.name}</span>
                <ExternalLink className="w-3 h-3 text-orange-600" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Role-Specific Form Container */}
      {isBrahmachari ? (
        <BrahmachariSadhanaForm
          selectedDate={selectedDate}
          initialEntry={initialEntry}
          onSaved={() => fetchMyEntry(selectedDate)}
        />
      ) : (
        <StudentSadhanaForm
          selectedDate={selectedDate}
          initialEntry={initialEntry}
          onSaved={() => fetchMyEntry(selectedDate)}
        />
      )}
    </div>
  );
}
