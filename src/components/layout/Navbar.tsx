'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Star, MapPin } from 'lucide-react';
import clsx from 'clsx';

const NAV_LINKS = [
  { href: '/map', label: 'Map' },
  { href: '/synagogues', label: 'Synagogues' },
  { href: '/kosher', label: 'Kosher Food' },
  { href: '/resources', label: 'Resources' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-white fill-white" strokeWidth={1} />
          </div>
          <span className="font-semibold text-zinc-900 text-sm">Jewish Denver</span>
        </Link>

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

        <div className="hidden md:flex ml-auto">
          <Link href="/map" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <MapPin className="w-3.5 h-3.5" />
            Explore Map
          </Link>
        </div>

        <button className="md:hidden ml-auto p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-2 space-y-0.5">
          {[{ href: '/', label: 'Home' }, ...NAV_LINKS].map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={clsx('block px-3 py-2 rounded-md text-sm transition-colors',
                  active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-zinc-600 hover:bg-zinc-50'
                )}>
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
