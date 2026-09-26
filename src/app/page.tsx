'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ExternalLink,
  User,
  Layers,
  ArrowRight,
  Shield
} from 'lucide-react';
import { StudentSadhanaForm } from '@/components/StudentSadhanaForm';
import { BrahmachariSadhanaForm } from '@/components/BrahmachariSadhanaForm';
import { MyEffectiveRulesCard } from '@/components/MyEffectiveRulesCard';
import { SadhanaRulesModal } from '@/components/SadhanaRulesModal';

export default function HomePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initialEntry, setInitialEntry] = useState<any>(null);
  const [counsellorData, setCounsellorData] = useState<{
    brahmacharis: any[];
    students: any[];
  }>({ brahmacharis: [], students: [] });
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalTarget, setModalTarget] = useState<{ id: string; name: string; role: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultInterval = {
    from: '2026-09-01',
    to: '2026-09-15',
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'STUDENT' || currentUser.role === 'BRAHMACHARI')) {
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

        // If Counsellor, fetch their assigned Brahmacharis and Students
        if (data.user.role === 'COUNSELLOR') {
          const treeRes = await fetch('/api/users/tree');
          const treeData = await treeRes.json();
          if (treeData.tree && treeData.tree.length > 0) {
            const bList = treeData.tree[0].brahmacharis || [];
            const sList: any[] = [];
            bList.forEach((b: any) => {
              if (b.students) {
                b.students.forEach((s: any) => {
                  sList.push({ ...s, preacherName: b.name });
                });
              }
            });
            setCounsellorData({ brahmacharis: bList, students: sList });
          }
        } else if (data.user.role === 'BRAHMACHARI') {
          // Fetch their assigned students
          const treeRes = await fetch('/api/users/tree');
          const treeData = await treeRes.json();
          setMyStudents(treeData.students || []);
        }
      } else {
        router.replace('/login');
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
        Loading dashboard...
      </div>
    );
  }

  // ==========================================
  // 1. COUNSELLOR DASHBOARD (Monitoring & Reports ONLY)
  // ==========================================
  if (currentUser?.role === 'COUNSELLOR') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                Counsellor Portal
              </span>
              <span className="text-amber-200 text-xs">Monitoring & Guidance Role</span>
            </div>
            <h1 className="text-3xl font-black">{currentUser.name}</h1>
            <p className="text-amber-100 text-sm max-w-2xl">
              Inspect daily Sadhana performance, weekly target completion, and date-range reports for your Brahmacharis and Students.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/counsellor/tree"
              className="px-5 py-3 bg-white text-amber-900 hover:bg-amber-50 rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Network className="w-4 h-4 text-amber-600" />
              Hierarchy Tree Explorer
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-orange-600" />
              Assigned Brahmacharis
            </span>
            <p className="text-2xl font-black text-slate-900">{counsellorData.brahmacharis.length}</p>
            <p className="text-[11px] text-slate-400">Ashram Card-1 Devotees</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Assigned Students
            </span>
            <p className="text-2xl font-black text-slate-900">{counsellorData.students.length}</p>
            <p className="text-[11px] text-slate-400">BACE Card-2 Devotees</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              Active Reporting Interval
            </span>
            <p className="text-sm font-bold text-slate-900">{defaultInterval.from} &rarr; {defaultInterval.to}</p>
            <p className="text-[11px] text-slate-400">Dynamic 15-day scaling</p>
          </div>
        </div>

        {/* 1. BRAHMACHARIS MONITORING SECTION */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                Brahmacharis Under Your Guidance ({counsellorData.brahmacharis.length})
              </h2>
              <p className="text-xs text-slate-500">Brahmacharis fill Ashram Card S1 (42h Seva, 7h Pathan, 7h Sravan)</p>
            </div>
            <Link
              href="/counsellor/tree"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              View Full Tree <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {counsellorData.brahmacharis.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-slate-50 hover:bg-amber-50/50 rounded-2xl border border-slate-200 transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center shadow-xs text-xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{b.name}</h3>
                      <p className="text-[11px] text-slate-500">{b.email} &bull; {b.students?.length || 0} Students</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-200">
                    Card S1
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <Link
                    href={`/reports?userId=${b.id}&from=${defaultInterval.from}&to=${defaultInterval.to}`}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                  >
                    <span>Inspect Sadhana Report</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. STUDENTS MONITORING SECTION */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Students in Your Tree ({counsellorData.students.length})
              </h2>
              <p className="text-xs text-slate-500">Students fill BACE Card S2 (6h Seva, 3.5h Pathan, 3.5h Sravan)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {counsellorData.students.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center shadow-2xs text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">{s.name}</h3>
                      <p className="text-[10px] text-slate-500">{s.email}</p>
                      <p className="text-[10px] text-slate-400">Preacher: {s.preacherName}</p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-100 text-blue-800">
                    Card S2
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <Link
                    href={`/reports?userId=${s.id}&from=${defaultInterval.from}&to=${defaultInterval.to}`}
                    className="px-3 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <span>View Student Report</span>
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. ADMIN DASHBOARD
  // ==========================================
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

  // ==========================================
  // 3. STUDENT & BRAHMACHARI SELF SADHANA ENTRY DASHBOARDS
  // ==========================================
  const isBrahmachari = currentUser?.role === 'BRAHMACHARI';

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
            href={`/reports?userId=${currentUser?.id}&from=${defaultInterval.from}&to=${defaultInterval.to}`}
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-slate-800">
              My Assigned Students ({myStudents.length}):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {myStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 pr-2 shadow-2xs"
              >
                <Link
                  href={`/reports?userId=${s.id}&from=${defaultInterval.from}&to=${defaultInterval.to}`}
                  className="px-2 py-0.5 hover:bg-orange-50 text-slate-800 hover:text-orange-900 rounded-md text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>{s.name}</span>
                  <ExternalLink className="w-3 h-3 text-orange-600" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setModalTarget({ id: s.id, name: s.name, role: s.role || 'STUDENT' });
                    setIsModalOpen(true);
                  }}
                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Customize Student Rules"
                >
                  <Shield className="w-3 h-3 text-amber-700" />
                  <span>Customize Rules</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Effective Rules & Active Custom Overrides Card */}
      <MyEffectiveRulesCard />

      {/* Role-Specific Form Container */}
      {isBrahmachari ? (
        <BrahmachariSadhanaForm
          selectedDate={selectedDate}
          currentUser={currentUser}
          initialEntry={initialEntry}
          onSaved={() => fetchMyEntry(selectedDate)}
        />
      ) : (
        <StudentSadhanaForm
          selectedDate={selectedDate}
          currentUser={currentUser}
          initialEntry={initialEntry}
          onSaved={() => fetchMyEntry(selectedDate)}
        />
      )}

      {/* Rules Customization Modal */}
      {modalTarget && (
        <SadhanaRulesModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalTarget(null);
          }}
          targetUser={modalTarget}
        />
      )}
    </div>
  );
}
