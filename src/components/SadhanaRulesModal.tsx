'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Sparkles, 
  RotateCcw, 
  X, 
  User, 
  ArrowRight,
  Info,
  ChevronRight,
  BookOpen,
  HelpCircle
} from 'lucide-react';

interface RuleItem {
  key: string;
  label: string;
  category: string;
  unit: string;
  description: string;
  isAllowed: boolean;
  defaultVal: string;
  allowedMin: string;
  allowedMax: string;
  maxDurationDays: number;
  currentEffectiveValue: string;
  activeOverride: {
    overrideId: string;
    originalValue: string;
    overrideValue: string;
    reason: string;
    effectiveFrom: string;
    effectiveUntil?: string | null;
    createdByName: string;
    createdByRole: string;
  } | null;
}

interface AuditLog {
  id: string;
  action: string;
  ruleKey: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  createdAt: string;
  performedBy: { id: string; name: string; role: string };
}

interface SadhanaRulesModalProps {
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  isOpen: boolean;
  onClose: () => void;
  onRuleUpdated?: () => void;
}

export function SadhanaRulesModal({
  targetUserId,
  targetUserName,
  targetUserRole,
  isOpen,
  onClose,
  onRuleUpdated,
}: SadhanaRulesModalProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'customize' | 'history'>('rules');
  const [availableRules, setAvailableRules] = useState<RuleItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedRuleKey, setSelectedRuleKey] = useState<string>('BED_TIME');
  const [overrideValue, setOverrideValue] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [effectiveUntil, setEffectiveUntil] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && targetUserId) {
      loadRulesData();
      loadHistoryData();
    }
  }, [isOpen, targetUserId]);

  const loadRulesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/sadhana-rules/user/${targetUserId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load rules');

      setAvailableRules(data.availableRules || []);
      if (data.availableRules && data.availableRules.length > 0) {
        const first = data.availableRules[0];
        setSelectedRuleKey(first.key);
        setOverrideValue(first.currentEffectiveValue);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryData = async () => {
    try {
      const res = await fetch(`/api/sadhana-rules/user/${targetUserId}/history`);
      const data = await res.json();
      if (res.ok && data.auditLogs) {
        setAuditLogs(data.auditLogs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectRuleForCustomize = (rule: RuleItem) => {
    setSelectedRuleKey(rule.key);
    setOverrideValue(rule.currentEffectiveValue);
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setEffectiveUntil('');
    setReason('');
    setError(null);
    setSuccessMessage(null);
    setActiveTab('customize');
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/sadhana-rules/user/${targetUserId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleKey: selectedRuleKey,
          overrideValue,
          effectiveFrom,
          effectiveUntil: effectiveUntil || null,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save rule override');

      setSuccessMessage(data.message || 'Rule override successfully applied!');
      await loadRulesData();
      await loadHistoryData();
      if (onRuleUpdated) onRuleUpdated();

      setTimeout(() => {
        setActiveTab('rules');
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeOverride = async (overrideId: string) => {
    if (!confirm('Are you sure you want to revert this rule back to standard default?')) return;
    try {
      setIsSaving(true);
      setError(null);
      const res = await fetch(`/api/sadhana-rules/override/${overrideId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke override');

      setSuccessMessage('Override revoked. Devotee restored to standard default rule.');
      await loadRulesData();
      await loadHistoryData();
      if (onRuleUpdated) onRuleUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentSelectedRule = availableRules.find((r) => r.key === selectedRuleKey);

  const quickReasons = [
    'Medical recovery schedule',
    'University / Exam preparation adjustment',
    'Preaching / Late night festival seva',
    'Temporary health condition',
    'Gradual devotional development step',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold uppercase tracking-wider border border-indigo-400/30">
                Rule Override Manager
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                {targetUserRole}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
              Sadhana Rules for {targetUserName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('rules'); setError(null); }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Current Rules & Overrides
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('customize'); setError(null); }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'customize'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Customize Rule
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('history'); setError(null); }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            Audit History ({auditLogs.length})
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading effective rules...</p>
            </div>
          ) : activeTab === 'rules' ? (
            /* Tab 1: Current Rules List */
            <div className="space-y-3">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Hierarchical Rule Resolution Principle:</span>
                  Standard rules remain active organization-wide. Custom overrides apply strictly to{' '}
                  <strong className="font-bold text-amber-900">{targetUserName}</strong> within allowed deviation bounds.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {availableRules.map((rule) => {
                  const hasOverride = Boolean(rule.activeOverride);
                  return (
                    <div
                      key={rule.key}
                      className={`p-4 rounded-2xl border transition-all ${
                        hasOverride
                          ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{rule.label}</span>
                            {hasOverride ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                                <Sparkles className="w-2.5 h-2.5" />
                                Custom Override Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{rule.description}</p>
                        </div>

                        {rule.isAllowed && (
                          <button
                            type="button"
                            onClick={() => handleSelectRuleForCustomize(rule)}
                            className="shrink-0 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Customize</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Standard Default:</span>
                            <span className="font-semibold text-slate-700">
                              {rule.defaultVal} {rule.unit === 'hours_per_week' ? 'hrs/wk' : rule.unit === 'minutes' ? 'min' : ''}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Current Effective:</span>
                            <span
                              className={`font-black ${
                                hasOverride ? 'text-amber-700 text-sm' : 'text-slate-900'
                              }`}
                            >
                              {rule.currentEffectiveValue}{' '}
                              {rule.unit === 'hours_per_week' ? 'hrs/wk' : rule.unit === 'minutes' ? 'min' : ''}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Allowed Range:</span>
                            <span className="text-slate-500 text-[11px]">
                              [{rule.allowedMin} – {rule.allowedMax}]
                            </span>
                          </div>
                        </div>

                        {hasOverride && rule.activeOverride && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 italic">
                              Set by {rule.activeOverride.createdByName} ({rule.activeOverride.reason})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRevokeOverride(rule.activeOverride!.overrideId)}
                              disabled={isSaving}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Revert back to standard default rule"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Revert
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'customize' ? (
            /* Tab 2: Customize Form */
            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Select Rule to Customize
                </label>
                <select
                  value={selectedRuleKey}
                  onChange={(e) => {
                    const rule = availableRules.find((r) => r.key === e.target.value);
                    if (rule) handleSelectRuleForCustomize(rule);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {availableRules
                    .filter((r) => r.isAllowed)
                    .map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label} (Current: {r.currentEffectiveValue})
                      </option>
                    ))}
                </select>
              </div>

              {currentSelectedRule && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-950 font-bold">{currentSelectedRule.label}</span>
                    <span className="text-[11px] font-semibold text-indigo-700">
                      Standard Default: {currentSelectedRule.defaultVal}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800">{currentSelectedRule.description}</p>
                  <div className="pt-1 text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-indigo-600" />
                    Admin Allowed Boundary Range:{' '}
                    <span className="underline">
                      {currentSelectedRule.allowedMin} to {currentSelectedRule.allowedMax}
                    </span>
                  </div>
                </div>
              )}

              {/* Input for custom value */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Custom Target Value
                </label>
                <input
                  type={currentSelectedRule?.unit === 'time' ? 'time' : 'text'}
                  required
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  placeholder={
                    currentSelectedRule?.unit === 'time'
                      ? 'HH:mm (e.g. 22:15)'
                      : currentSelectedRule?.unit === 'minutes'
                      ? 'e.g. 45'
                      : 'e.g. 4.0'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Must be within allowed deviation range [{currentSelectedRule?.allowedMin} – {currentSelectedRule?.allowedMax}]
                </p>
              </div>

              {/* Effective Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Effective From (Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Effective Until (Optional expiry)
                  </label>
                  <input
                    type="date"
                    value={effectiveUntil}
                    onChange={(e) => setEffectiveUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank for indefinite active override</span>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Reason for Override (Mandatory for Audit Trail)
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Medical recovery adjustment, College exam schedule"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />

                {/* Quick reason presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickReasons.map((qr) => (
                    <button
                      type="button"
                      key={qr}
                      onClick={() => setReason(qr)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[10px] font-medium border border-slate-200 transition-colors"
                    >
                      + {qr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('rules')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Personal Override'}
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            /* Tab 3: History */
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No rule override history recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{log.ruleKey}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <span>{log.oldValue || 'Default'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-indigo-700 font-bold">{log.newValue}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                          {log.action}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 italic">
                        Reason: {log.reason || 'No reason provided'} &bull; By {log.performedBy?.name} ({log.performedBy?.role})
                      </p>

                      {log.effectiveFrom && (
                        <p className="text-[10px] text-slate-400">
                          Period: {log.effectiveFrom} {log.effectiveUntil ? `to ${log.effectiveUntil}` : '(indefinite)'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
