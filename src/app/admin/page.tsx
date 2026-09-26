'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Settings, 
  Award, 
  CheckCircle, 
  FileSpreadsheet, 
  Sparkles, 
  Clock, 
  Save, 
  History, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { SadhanaRulesModal } from '@/components/SadhanaRulesModal';

export default function AdminPage() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [ruleConfigs, setRuleConfigs] = useState<Record<string, any>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'limits' | 'users' | 'audit'>('limits');
  
  // Rule customization modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, configRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/rule-configs'),
      ]);

      const usersData = await usersRes.json();
      if (usersData.allUsers) {
        setAllUsers(usersData.allUsers);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.configs) {
          setRuleConfigs(configData.configs);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLimit = async (ruleKey: string, field: string, value: any) => {
    try {
      setIsSavingConfig(true);
      setMessage(null);

      const updates = { [field]: value };
      const res = await fetch('/api/admin/rule-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: ruleKey, updates }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update limit');

      setRuleConfigs(data.configs);
      setMessage({ text: `Updated ${ruleKey} ${field} successfully`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const openUserRules = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
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
            System Rules & Hierarchical Override Controls
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Control allowed deviation boundaries, customize devotee rules, and inspect temple audit trails.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-4 pt-3 shadow-xs gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('limits')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'limits'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Override Deviation Limits
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Devotee Rule Manager ({allUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Master Excel Rules (S1 & S2)
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab 1: Override Deviation Boundaries */}
      {activeTab === 'limits' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Configurable Personal Override Limits & Tolerances
              </h2>
              <p className="text-xs text-slate-500">
                Define the maximum allowed deviation higher authorities (Counsellors & Preachers) can grant.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(ruleConfigs).map((cfg: any) => (
              <div
                key={cfg.key}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{cfg.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase">
                    {cfg.category}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">{cfg.description}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {cfg.unit === 'time' || cfg.unit === 'minutes' ? 'Max Deviation (Minutes)' : 'Max Deviation (Hours/Wk)'}
                    </span>
                    <input
                      type="number"
                      defaultValue={cfg.maxDeviationMinutes || cfg.maxDeviationHours || 30}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          if (cfg.unit === 'time' || cfg.unit === 'minutes') {
                            handleUpdateLimit(cfg.key, 'maxDeviationMinutes', Math.round(val));
                          } else {
                            handleUpdateLimit(cfg.key, 'maxDeviationHours', val);
                          }
                        }
                      }}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      Max Duration (Days)
                    </span>
                    <input
                      type="number"
                      defaultValue={cfg.maxDurationDays || 60}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          handleUpdateLimit(cfg.key, 'maxDurationDays', val);
                        }
                      }}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Brahmachari Default: <strong>{cfg.brahmachariDefault}</strong></span>
                  <span>Student Default: <strong>{cfg.studentDefault}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Devotee Rule Manager */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Devotee Directory & Personal Rule Overrides
              </h2>
              <p className="text-xs text-slate-500">
                Inspect and modify personal Sadhana rules for any devotee across the hierarchy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-200 text-slate-800">
                      {u.role}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{u.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => openUserRules(u)}
                  className="w-full py-2 px-3 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Manage Devotee Rules
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Master Excel Rules */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              Active Master Excel Scoring Rules (S1 & S2)
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              Master Source
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {selectedUser && (
        <SadhanaRulesModal
          targetUserId={selectedUser.id}
          targetUserName={selectedUser.name}
          targetUserRole={selectedUser.role}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRuleUpdated={loadAdminData}
        />
      )}
    </div>
  );
}
