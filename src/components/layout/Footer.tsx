import Link from 'next/link';
import { Star } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <Star className="w-3 h-3 text-white fill-white" strokeWidth={1} />
              </div>
              <span className="font-semibold text-zinc-800 text-sm">Jewish Denver</span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-xs">Community hub for Denver's Jewish resources, synagogues, and kosher dining.</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {[
              { href: '/map', label: 'Community Map' },
              { href: '/synagogues', label: 'Synagogues' },
              { href: '/kosher', label: 'Kosher Food' },
              { href: '/resources', label: 'Resources' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-zinc-400 hover:text-blue-600 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-zinc-50">
          <p className="text-xs text-zinc-300">© {new Date().getFullYear()} Jewish Denver Community Hub</p>
        </div>
      </div>
    </footer>
  );
}
