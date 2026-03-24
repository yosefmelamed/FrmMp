'use client';
 
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getKosherFood, getKosherResources } from '@/lib/api';
import type { Amenity, AmenityCategory, KosherResource } from '@/types';
import AmenityCard from '@/components/ui/AmenityCard';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import { Search, ExternalLink, ChevronRight, X, MapPin } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
 
const TABS: { id: string; label: string; emoji: string; cats: AmenityCategory[] }[] = [
  { id: 'all',         label: 'All',         emoji: '🍴', cats: ['kosher_restaurant','kosher_grocery','bakery','butcher'] },
  { id: 'restaurants', label: 'Restaurants', emoji: '🍽️', cats: ['kosher_restaurant'] },
  { id: 'grocery',     label: 'Grocery',     emoji: '🛒', cats: ['kosher_grocery'] },
  { id: 'bakery',      label: 'Bakeries',    emoji: '🥐', cats: ['bakery'] },
  { id: 'butcher',     label: 'Butchers',    emoji: '🥩', cats: ['butcher'] },
];
 
const CERTS = ['All', 'Scroll K', 'OU', 'Multiple'];
const PRICES = ['All', '$', '$$', '$$$', '$$$$'];
 
function KosherPageContent() {
  const searchParams = useSearchParams();
  const [amenities, setAmenities]   = useState<Amenity[]>([]);
  const [resources, setResources]   = useState<KosherResource[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState(() => searchParams.get('tab') ?? 'all');
  const [cert, setCert]             = useState('All');
  const [price, setPrice]           = useState('All');
  const [search, setSearch]         = useState('');
 
  useEffect(() => {
    Promise.all([getKosherFood(), getKosherResources()]).then(([food, res]) => {
      setAmenities(food);
      setResources(res);
      setLoading(false);
    });
  }, []);
 
  // Sync tab when navigating from home page links
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some(x => x.id === t)) setTab(t);
  }, [searchParams]);
 
  const activeTab = TABS.find(t => t.id === tab)!;
 
  const filtered = useMemo(() => {
    return amenities.filter(a => {
      if (!activeTab.cats.includes(a.category)) return false;
      if (cert  !== 'All' && a.certificationBody !== cert)  return false;
      if (price !== 'All' && a.priceRange        !== price) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.cuisine?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.address.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [amenities, activeTab, cert, price, search]);
 
  const cuisines = useMemo(
    () => Array.from(new Set(amenities.filter(a => a.cuisine).map(a => a.cuisine!))),
    [amenities]
  );
 
  const tabCount = (t: typeof TABS[0]) =>
    amenities.filter(a => t.cats.includes(a.category)).length;
 
  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-5 py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🍽️</span>
                <h1 className="text-2xl font-bold text-zinc-900">Kosher Food</h1>
              </div>
              <p className="text-zinc-500 text-sm">
                Certified restaurants, groceries, bakeries & butchers in Denver
              </p>
 
              {/* Info pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { emoji: '🏅', label: `${amenities.length} Certified venues` },
                  { emoji: '🥛', label: `${amenities.filter(a => a.certificationLevel === 'cholov_yisroel').length} Cholov Yisroel` },
                  { emoji: '✔️', label: `${amenities.filter(a => a.certificationLevel === 'glatt').length} Glatt Kosher` },
                ].map(p => (
                  <span key={p.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                    {p.emoji} {p.label}
                  </span>
                ))}
              </div>
            </div>
 
            <Link href="/map"
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors shrink-0">
              <MapPin className="w-4 h-4" />
              View on Map
            </Link>
          </div>
 
          {/* Tabs */}
          <div className="flex gap-0.5 mt-6 -mb-px overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                )}>
                {t.emoji} {t.label}
                <span className={clsx('text-xs', tab === t.id ? 'text-blue-400' : 'text-zinc-300')}>
                  ({tabCount(t)})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
 
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input type="text" placeholder="Search…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
 
              <select value={cert} onChange={e => setCert(e.target.value)}
                className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {CERTS.map(c => <option key={c} value={c}>{c === 'All' ? 'Any certification' : c}</option>)}
              </select>
 
              {tab === 'restaurants' && (
                <select value={price} onChange={e => setPrice(e.target.value)}
                  className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {PRICES.map(p => <option key={p} value={p}>{p === 'All' ? 'Any price' : p}</option>)}
                </select>
              )}
            </div>
 
            <p className="text-xs text-zinc-400 mb-4">
              {loading ? 'Loading…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            </p>
 
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(a => (
                  <AmenityCard key={a.id} amenity={a} showDirectionsLink />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-400 text-sm">
                No results — try adjusting your filters.
              </div>
            )}
          </div>
 
          {/* ── Sidebar ── */}
          <div className="w-full lg:w-64 shrink-0 space-y-4">
            {/* Resources card */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-zinc-800 mb-3">Kosher Resources</h3>
              <div className="space-y-1">
                {resources.slice(0, 5).map(r => (
                  <a key={r.id} href={r.url || '#'} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-zinc-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-700 group-hover:text-blue-600 transition-colors leading-snug">
                        {r.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{r.description}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-300 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
              <Link href="/resources"
                className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-50 text-xs text-blue-600 font-medium hover:text-blue-700">
                All resources <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
 
            {/* Cuisine chips */}
            {cuisines.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-zinc-800 mb-2.5">Browse by Cuisine</h3>
                <div className="flex flex-wrap gap-1.5">
                  {cuisines.map(c => (
                    <button key={c} onClick={() => { setSearch(c); setTab('restaurants'); }}
                      className="px-2.5 py-1 bg-zinc-50 text-zinc-600 text-xs rounded-lg border border-zinc-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors">
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
 
            {/* Certification guide */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-zinc-800 mb-3">Certification Guide</h3>
              <div className="space-y-2.5">
                {[
                  { name: 'Scroll K', desc: 'Colorado\'s local certification (Vaad Hakashrus)', color: 'bg-blue-100 text-blue-700' },
                  { name: 'Glatt',    desc: 'Higher standard for kosher meat',                color: 'bg-emerald-100 text-emerald-700' },
                  { name: 'Cholov Yisroel', desc: 'Stricter standard for dairy products',      color: 'bg-sky-100 text-sky-700' },
                  { name: 'Pas Yisroel',    desc: 'Higher standard for baked goods',           color: 'bg-amber-100 text-amber-700' },
                ].map(({ name, desc, color }) => (
                  <div key={name} className="flex items-start gap-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded shrink-0 mt-0.5 ${color}`}>{name}</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Map CTA */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <p className="text-sm font-semibold text-zinc-900">See on Map</p>
              <p className="text-xs text-zinc-500 mt-0.5 mb-3">View all locations with directions & itinerary.</p>
              <Link href="/map"
                className="block text-center py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Open Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default function KosherPage() {
  return (
    <Suspense>
      <KosherPageContent />
    </Suspense>
  );
}