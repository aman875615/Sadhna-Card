'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Calendar, 
  Network, 
  Shield, 
  User, 
  LogOut, 
  Sparkles,
  Download,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  cardType: string;
  counsellor?: { id: string; name: string };
  preacher?: { id: string; name: string };
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSwitchDropdownOpen, setIsSwitchDropdownOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    fetchSession();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setAllUsers(data.allUsers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ impersonateUserId: userId }),
      });
      if (res.ok) {
        setIsSwitchDropdownOpen(false);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  let navLinks = [
    { href: '/', label: 'Fill My Sadhana', icon: BookOpen },
    { href: currentUser ? `/reports?userId=${currentUser.id}&from=2026-09-01&to=2026-09-15` : '/reports', label: 'My Report', icon: Calendar },
  ];

  if (currentUser?.role === 'STUDENT') {
    navLinks = [
      { href: '/', label: 'Fill My Sadhana', icon: BookOpen },
      { href: `/reports?userId=${currentUser.id}&from=2026-09-01&to=2026-09-15`, label: 'My Report', icon: Calendar },
    ];
  } else if (currentUser?.role === 'BRAHMACHARI') {
    navLinks = [
      { href: '/', label: 'Fill My Sadhana', icon: BookOpen },
      { href: `/reports?userId=${currentUser.id}&from=2026-09-01&to=2026-09-15`, label: 'My Report', icon: Calendar },
      { href: '/counsellor/tree', label: 'My Students & Tree', icon: Network },
    ];
  } else if (currentUser?.role === 'COUNSELLOR') {
    navLinks = [
      { href: '/counsellor/tree', label: 'Hierarchy Tree', icon: Network },
      { href: currentUser ? `/reports?userId=${currentUser.id}&from=2026-09-01&to=2026-09-15` : '/reports', label: 'Sadhana Reports', icon: Calendar },
    ];
  } else if (currentUser?.role === 'ADMIN') {
    navLinks = [
      { href: '/counsellor/tree', label: 'Hierarchy Tree', icon: Network },
      { href: '/reports', label: 'Reports', icon: Calendar },
      { href: '/admin', label: 'Admin Settings', icon: Shield },
    ];
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                  ISKCON Sadhana
                </span>
                <span className="text-[11px] font-medium text-amber-600 tracking-wider uppercase block">
                  Time-Based Card & Reports
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('?')[0]));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Controls & Demo Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                title="Install PWA to Home Screen"
              >
                <Download className="w-3.5 h-3.5" />
                Install PWA
              </button>
            )}

            {/* Quick Demo Role Switcher */}
            {allUsers.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsSwitchDropdownOpen(!isSwitchDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span className="max-w-[130px] truncate">{currentUser?.name || 'Switch Role'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                    {currentUser?.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isSwitchDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Switch Active User (Demo)
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleSwitchUser(u.id)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 transition-colors ${
                            u.id === currentUser?.id ? 'bg-amber-50/70 font-semibold text-amber-900' : 'text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            {u.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              href="/signup"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
            >
              <span>+ Sign Up</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-hidden"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <User className="w-4 h-4 text-amber-600" />
            <div className="text-xs">
              <p className="font-semibold text-slate-800">{currentUser?.name}</p>
              <p className="text-slate-500">{currentUser?.role} ({currentUser?.cardType})</p>
            </div>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-900"
                >
                  <Icon className="w-4 h-4 text-amber-600" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Install PWA
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
