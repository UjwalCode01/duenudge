'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  FileText,
  LogOut,
  Menu,
  X,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  userEmail?: string | null;
  userName?: string | null;
  businessName?: string | null;
}

export function Navbar({ userEmail, userName, businessName }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    {
      name: 'Invoices',
      href: '/invoices',
      icon: FileText,
      active: pathname.startsWith('/invoices'),
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: Users,
      active: pathname.startsWith('/clients'),
    },
    {
      name: 'Business Profile',
      href: '/settings',
      icon: Building2,
      active: pathname === '/settings' || pathname === '/onboarding',
    },
    {
      name: 'Reminders',
      href: '/reminders',
      icon: Clock,
      badge: 'Auto',
      active: pathname === '/reminders',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform duration-200">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
                  DueNudge
                </span>
                <span className="text-[10px] font-medium tracking-wide uppercase text-indigo-600 -mt-1">
                  Invoices & Reminders
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 ml-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      link.active
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side: User & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {userEmail ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
                    {businessName || userName || 'Freelancer'}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[180px]">
                    {userEmail}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-medium flex items-center justify-center text-sm shadow-sm ring-2 ring-white">
                  {(businessName?.[0] || userName?.[0] || userEmail[0]).toUpperCase()}
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          {userEmail && (
            <div className="pb-3 border-b border-slate-100 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-medium flex items-center justify-center text-sm shadow-sm">
                {(businessName?.[0] || userName?.[0] || userEmail[0]).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold text-slate-800">
                  {businessName || userName || 'Freelancer'}
                </div>
                <div className="text-xs text-slate-500 truncate">{userEmail}</div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    link.active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-indigo-600" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {userEmail ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Sign In / Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
