'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, Star, MapPin, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { href: '/map',        label: 'Map' },
  { href: '/synagogues', label: 'Synagogues' },
  { href: '/kosher',     label: 'Kosher Food' },
  { href: '/resources',  label: 'Resources' },
];

export default function Navbar() {
  const pathname           = usePathname();
  const router             = useRouter();
  const { user, logout, isAdmin, loading } = useAuth();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setAccountOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-white fill-white" strokeWidth={1} />
          </div>
          <span className="font-semibold text-zinc-900 text-sm">Jewish Denver</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={clsx('px-3 py-1.5 rounded-md text-sm transition-colors',
                  active ? 'text-blue-600 bg-blue-50 font-medium' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                )}>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Link href="/map"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <MapPin className="w-3.5 h-3.5" /> Explore Map
          </Link>

          {/* Account button */}
          {!loading && (
            user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAccountOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="max-w-[100px] truncate">{user.firstName}</span>
                  <ChevronDown className={clsx('w-3 h-3 transition-transform', accountOpen && 'rotate-180')} />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-zinc-100 shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-zinc-50">
                      <p className="text-xs font-medium text-zinc-900">{user.firstName} {user.lastName}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Admin</span>
                      )}
                    </div>

                    {isAdmin && (
                      <Link href="/dashboard"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                    )}

                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login"
                  className="px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/register"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors">
                  <User className="w-3.5 h-3.5" /> Register
                </Link>
              </div>
            )
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden ml-auto p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md"
          onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-2 space-y-0.5">
          {[{ href: '/', label: 'Home' }, ...NAV_LINKS].map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={clsx('block px-3 py-2 rounded-md text-sm transition-colors',
                  active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-zinc-600 hover:bg-zinc-50'
                )}>
                {label}
              </Link>
            );
          })}
          <div className="pt-1 border-t border-zinc-100 mt-1">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 rounded-md">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                )}
                <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 rounded-md">Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
