'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, MapPin, Calendar, Users, LogOut, Star, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';

const LINKS = [
  { href: '/dashboard',           label: 'Overview',    icon: LayoutDashboard },
  { href: '/dashboard/amenities', label: 'Amenities',   icon: MapPin },
  { href: '/dashboard/events',    label: 'Events',      icon: Calendar },
  { href: '/dashboard/users',     label: 'Users',       icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname       = usePathname();
  const router         = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace('/login');
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleLogout = async () => { await logout(); router.push('/'); };

  return (
    <div className="min-h-[calc(100vh-56px)] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-zinc-900 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-white fill-white" strokeWidth={1} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Jewish Denver</p>
              <p className="text-[10px] text-zinc-400">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-white truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-zinc-50 overflow-auto">{children}</main>
    </div>
  );
}
