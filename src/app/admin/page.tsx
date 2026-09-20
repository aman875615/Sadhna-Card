'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Award, CheckCircle, FileSpreadsheet, Sparkles } from 'lucide-react';
import { TARGET_CONFIG } from '@/lib/scoring-engine';

export default function AdminPage() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.allUsers) {
        setAllUsers(data.allUsers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
              Admin Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-indigo-400" />
            System Rules & User Management
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Inspect raw time rules extracted from Excel sheets and manage temple hierarchy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Rules Extracted from Excel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              Active Excel Scoring Rules (S1 & S2)
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-800">Nidra - Bed Time (Max 25 pts)</h3>
              <p className="text-slate-600">
                &le; 10:00 PM (25) &bull; &le; 10:05 PM (20) &bull; &le; 10:10 PM (15) &bull; &le; 10:15 PM (10) &bull; &le; 10:20 PM (5) &bull; &le; 10:25 PM (0) &bull; &gt; 10:25 PM (-5)
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-800">Nidra - Wake Up Time (Max 25 pts)</h3>
              <p className="text-slate-600">
                &le; 3:45 AM (25) &bull; &le; 3:50 AM (20) &bull; &le; 3:55 AM (15) &bull; &le; 4:00 AM (10) &bull; &le; 4:05 AM (5) &bull; &le; 4:10 AM (0) &bull; &gt; 4:10 AM (-5)
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-800">Nidra - Day Sleep (Max 25 pts)</h3>
              <p className="text-slate-600">
                &le; 60 minutes = 25 pts. Reduce 1 mark for every 2 minutes beyond 60 min.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-800">Japa Completion (Max 25 pts)</h3>
              <p className="text-slate-600">
                &le; 7:15 AM (25) &bull; Before Breakfast (20) &bull; &le; 11:00 AM (15) &bull; &le; 2:30 PM (10) &bull; &le; 5:00 PM (5) &bull; &le; 7:00 PM (0) &bull; &le; 9:00 PM (-5)
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-800">Weekly Target Configurations</h3>
              <p className="text-slate-600">
                Brahmachari: Pathan = 7h/week, Sravan = 7h/week, Seva = 42h/week.<br />
                Student BACE: Pathan = 3.5h/week, Sravan = 3.5h/week, Seva = 6h/week.
              </p>
            </div>
          </div>
        </div>

        {/* User Directory */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Registered Users & Roles ({allUsers.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {allUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{u.name}</p>
                  <p className="text-slate-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md font-bold uppercase text-[9px] bg-slate-100 text-slate-700 border border-slate-200">
                    {u.role}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold uppercase text-[9px] bg-amber-100 text-amber-800">
                    {u.cardType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
