'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Network, 
  User, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Search,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  cardType: string;
  phone?: string;
}

interface Brahmachari {
  id: string;
  name: string;
  email: string;
  role: string;
  cardType: string;
  phone?: string;
  students?: Student[];
}

interface Counsellor {
  id: string;
  name: string;
  email: string;
  role: string;
  cardType: string;
  phone?: string;
  brahmacharis?: Brahmachari[];
}

export default function CounsellorTreePage() {
  const [treeData, setTreeData] = useState<Counsellor[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Default interval for links
  const fromDate = '2026-09-01';
  const toDate = '2026-09-15';

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users/tree');
      const data = await res.json();
      if (data.tree) {
        setTreeData(data.tree);
        // Expand all by default
        const exp: Record<string, boolean> = {};
        data.tree.forEach((c: Counsellor) => {
          exp[c.id] = true;
          c.brahmacharis?.forEach((b) => {
            exp[b.id] = true;
          });
        });
        setExpandedNodes(exp);
      }
      if (data.currentUser) {
        setCurrentUser(data.currentUser);
      } else {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const matchesSearch = (name: string, email: string) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              Hierarchy Tree Explorer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Network className="w-7 h-7 text-amber-500" />
            Counsellor & Preacher Tree
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Navigate through Counsellors $\to$ Brahmacharis/Preachers $\to$ Students. View real-time Sadhana Cards & interval-aware reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/reports?userId=${currentUser?.id}&from=${fromDate}&to=${toDate}`}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            My Sadhana Report
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by devotee name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Reporting Interval:</span>
          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {fromDate} &rarr; {toDate}
          </span>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
            Loading hierarchy tree data...
          </div>
        ) : treeData.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
            No counsellors or users registered.
          </div>
        ) : (
          treeData.map((counsellor) => {
            const isCounsellorExpanded = Boolean(expandedNodes[counsellor.id]);
            const brahmacharis = counsellor.brahmacharis || [];

            return (
              <div
                key={counsellor.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Level 1: Counsellor Node */}
                <div className="p-5 bg-gradient-to-r from-amber-50 via-orange-50/50 to-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleNode(counsellor.id)}
                      className="p-1.5 hover:bg-amber-200/50 rounded-lg text-amber-900 transition-colors"
                    >
                      {isCounsellorExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-bold flex items-center justify-center shadow-md">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">{counsellor.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900">
                          Counsellor
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{counsellor.email} | {brahmacharis.length} Brahmacharis assigned</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/reports?userId=${counsellor.id}&from=${fromDate}&to=${toDate}`}
                      className="px-3.5 py-1.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <span>View Sadhana Report</span>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                    </Link>
                  </div>
                </div>

                {/* Level 2: Brahmacharis / Preachers */}
                {isCounsellorExpanded && (
                  <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50">
                    {brahmacharis.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-10">No brahmacharis assigned to this counsellor.</p>
                    ) : (
                      brahmacharis.map((brahmachari) => {
                        const isBrahmachariExpanded = Boolean(expandedNodes[brahmachari.id]);
                        const students = brahmachari.students || [];

                        return (
                          <div
                            key={brahmachari.id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ml-4 sm:ml-8"
                          >
                            {/* Brahmachari Card Header */}
                            <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleNode(brahmachari.id)}
                                  className="p-1 hover:bg-slate-200 rounded-md text-slate-700 transition-colors"
                                >
                                  {isBrahmachariExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white font-bold flex items-center justify-center shadow-xs">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-sm text-slate-900">{brahmachari.name}</h4>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-200">
                                      Brahmachari (S1)
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {brahmachari.email} &bull; {students.length} BACE Students
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/reports?userId=${brahmachari.id}&from=${fromDate}&to=${toDate}`}
                                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                  <span>Inspect S1 Report</span>
                                  <ExternalLink className="w-3 h-3 text-amber-700" />
                                </Link>
                              </div>
                            </div>

                            {/* Level 3: Students under Brahmachari */}
                            {isBrahmachariExpanded && (
                              <div className="p-3 sm:p-4 bg-white divide-y divide-slate-100">
                                {students.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic py-2 pl-6">
                                    No students assigned to this preacher yet.
                                  </p>
                                ) : (
                                  students.map((student) => (
                                    <div
                                      key={student.id}
                                      className="py-2.5 px-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors ml-4 sm:ml-6"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                                          <User className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                            {student.name}
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                              Student S2
                                            </span>
                                          </p>
                                          <p className="text-[11px] text-slate-400">{student.email}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Link
                                          href={`/reports?userId=${student.id}&from=${fromDate}&to=${toDate}`}
                                          className="px-3 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                                        >
                                          <span>View Student Report</span>
                                          <ExternalLink className="w-3 h-3 text-blue-600" />
                                        </Link>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
