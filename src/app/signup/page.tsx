'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoImg from '@/assets/logo.png';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  GraduationCap, 
  BookOpen, 
  Network, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState<'STUDENT' | 'BRAHMACHARI' | 'COUNSELLOR'>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [counsellorId, setCounsellorId] = useState('');
  const [preacherId, setPreacherId] = useState('');

  const [counsellorsList, setCounsellorsList] = useState<any[]>([]);
  const [brahmacharisList, setBrahmacharisList] = useState<any[]>([]);
  const [filteredPreachers, setFilteredPreachers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHierarchyOptions();

    // Check for error query params from Google callback redirect
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setError(err);
      }
    }
  }, []);

  const fetchHierarchyOptions = async () => {
    try {
      const res = await fetch('/api/auth/hierarchy-options');
      const data = await res.json();
      if (data.counsellors) {
        setCounsellorsList(data.counsellors);
        if (data.counsellors.length > 0) {
          setCounsellorId(data.counsellors[0].id);
        }
      }
      if (data.brahmacharis) {
        setBrahmacharisList(data.brahmacharis);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (counsellorId) {
      const matching = brahmacharisList.filter((b) => !b.counsellorId || b.counsellorId === counsellorId);
      setFilteredPreachers(matching.length > 0 ? matching : brahmacharisList);
      if (matching.length > 0) {
        setPreacherId(matching[0].id);
      } else if (brahmacharisList.length > 0) {
        setPreacherId(brahmacharisList[0].id);
      }
    } else {
      setFilteredPreachers(brahmacharisList);
    }
  }, [counsellorId, brahmacharisList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        name,
        email,
        phone,
        password,
        role,
        counsellorId: role !== 'COUNSELLOR' ? counsellorId : null,
        preacherId: role === 'STUDENT' ? preacherId : null,
      };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success -> Redirect to Home dashboard
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/40 to-slate-100 py-10 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <Image
            src={logoImg}
            alt="Sadhana Card"
            width={64}
            height={64}
            priority
            unoptimized
            className="w-16 h-16 rounded-2xl mx-auto shadow-lg object-cover"
          />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Sadhana Card Account
          </h1>
          <p className="text-xs text-slate-500">
            Register as a Student, Brahmachari, or Counsellor
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. ROLE SELECTOR */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            1. Select Your Role / Devotional Service
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`py-2.5 px-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                role === 'STUDENT'
                  ? 'bg-blue-50 text-blue-900 border-blue-500 ring-2 ring-blue-400 font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold leading-tight">Student</span>
              <span className="text-[10px] text-slate-400">BACE Card (S2)</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('BRAHMACHARI')}
              className={`py-2.5 px-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                role === 'BRAHMACHARI'
                  ? 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-400 font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold leading-tight">Brahmachari</span>
              <span className="text-[10px] text-slate-400">Ashram Card (S1)</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('COUNSELLOR')}
              className={`py-2.5 px-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                role === 'COUNSELLOR'
                  ? 'bg-orange-50 text-orange-900 border-orange-500 ring-2 ring-orange-400 font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold leading-tight">Counsellor</span>
              <span className="text-[10px] text-slate-400">Monitoring</span>
            </button>
          </div>
        </div>

        {/* 2. HIERARCHY SELECTION */}
        {role !== 'COUNSELLOR' && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Network className="w-3 h-3 text-amber-600" />
                Select Your Assigned Counsellor
              </label>
              <select
                value={counsellorId}
                onChange={(e) => setCounsellorId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                {counsellorsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
                {counsellorsList.length === 0 && (
                  <option value="">No counsellors found</option>
                )}
              </select>
            </div>

            {role === 'STUDENT' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-600" />
                  Select Your Preacher / Brahmachari
                </label>
                <select
                  value={preacherId}
                  onChange={(e) => setPreacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  {filteredPreachers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                  {filteredPreachers.length === 0 && (
                    <option value="">No brahmacharis found</option>
                  )}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Fast 1-Click Google Sign-up with preselected role */}
        <div className="space-y-3">
          <GoogleSignInButton
            text={`Sign Up with Google (as ${role === 'STUDENT' ? 'Student' : role === 'BRAHMACHARI' ? 'Brahmachari' : 'Counsellor'})`}
            role={role}
            counsellorId={role !== 'COUNSELLOR' ? counsellorId : undefined}
            preacherId={role === 'STUDENT' ? preacherId : undefined}
          />
          
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              or create account with email
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>
        </div>

        {/* Manual Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Radheshyam Das / Gaurav Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@iskcon.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-hidden p-1 rounded-md transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-hidden p-1 rounded-md transition-colors"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading ? 'Creating Account...' : 'Register & Access Dashboard'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-amber-700 hover:text-amber-800 underline">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
