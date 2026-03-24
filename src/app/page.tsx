import Link from 'next/link';
import { getAmenities, getEvents } from '@/lib/api';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import { MapPin, ArrowRight, Calendar, Clock, ChevronRight, Star } from 'lucide-react';
import type { AmenityCategory } from '@/types';
 
export default async function HomePage() {
  const [amenities, events] = await Promise.all([getAmenities(), getEvents()]);
 
  const topRated = amenities.filter(a => a.rating && a.rating >= 4.6).slice(0, 3);
 
  const categoryLinks: { href: string; label: string; desc: string; cat: AmenityCategory }[] = [
    { href: '/synagogues',                                    label: 'Synagogues',         desc: 'Find your community',    cat: 'synagogue' },
    { href: '/kosher?tab=restaurants',                        label: 'Kosher Restaurants', desc: 'Certified dining',       cat: 'kosher_restaurant' },
    { href: '/kosher?tab=grocery',                            label: 'Grocery & Markets',  desc: 'Kosher food shopping',   cat: 'kosher_grocery' },
    { href: '/resources?category=Education',     label: 'Jewish Schools',     desc: 'Day schools & yeshivas', cat: 'jewish_school' },
    { href: '/resources?category=Community',     label: 'Community Centers',  desc: 'JCCs & organizations',   cat: 'jewish_center' },
    { href: '/resources',                                     label: 'Resources',          desc: 'Guides & links',         cat: 'mikveh' },
  ];
 
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-700 mb-6">
              <MapPin className="w-3.5 h-3.5" />
              Denver, Colorado
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 leading-tight tracking-tight mb-4">
              Denver's Jewish<br />
              <span className="text-blue-600">Community Hub</span>
            </h1>
            <p className="text-lg text-zinc-500 leading-relaxed mb-8">
              Find synagogues, kosher restaurants, Jewish schools, and community resources across Denver and Boulder.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/map"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm">
                <MapPin className="w-4 h-4" />
                Explore the Map
              </Link>
              <Link href="/synagogues"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-700 font-semibold rounded-xl hover:bg-zinc-50 transition-colors border border-zinc-200 text-sm">
                Find a Synagogue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
 
      {/* Category grid */}
      <section className="border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900">Browse by Category</h2>
            <Link href="/map" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categoryLinks.map(link => {
              const cfg = CATEGORY_CONFIG[link.cat];
              return (
                <Link key={link.href + link.label} href={link.href}
                  className="card card-interactive p-4 group block transition-all">
                  <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center text-base mb-3 group-hover:scale-110 transition-transform`}>
                    {cfg.emoji}
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-sm">{link.label}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{link.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* Featured */}
      <section className="border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Highly Rated</h2>
              <p className="text-sm text-zinc-400 mt-0.5">Loved by the Denver community</p>
            </div>
            <Link href="/map" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRated.map(amenity => {
              const cfg = CATEGORY_CONFIG[amenity.category];
              return (
                <Link key={amenity.id} href="/map"
                  className="card card-interactive p-4 block">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 ${cfg.bg} rounded-lg flex items-center justify-center text-lg shrink-0`}>
                      {cfg.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm leading-tight">{amenity.name}</p>
                      <p className={`text-xs ${cfg.color} font-medium mt-0.5`}>{cfg.label}</p>
                    </div>
                  </div>
                  {amenity.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">{amenity.description}</p>
                  )}
                  {amenity.rating && (
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className="w-3 h-3" viewBox="0 0 20 20">
                            <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
                              fill={s <= Math.round(amenity.rating!) ? '#f59e0b' : '#e4e4e7'} />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-zinc-400">{amenity.rating} ({amenity.reviewCount})</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* Events */}
      <section className="border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.slice(0, 6).map(event => {
              const d = new Date(event.date);
              return (
                <div key={event.id} className="card p-4 flex items-start gap-3">
                  <div className="shrink-0 w-10 text-center">
                    <div className="bg-blue-600 text-white rounded-t-lg py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      {d.toLocaleString('default', { month: 'short' })}
                    </div>
                    <div className="bg-blue-50 text-blue-800 rounded-b-lg py-1 text-base font-bold border border-blue-100 border-t-0">
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded uppercase tracking-wide mb-1">
                      {event.category}
                    </span>
                    <h3 className="font-semibold text-zinc-900 text-sm leading-snug">{event.title}</h3>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-400">
                      <Clock className="w-3 h-3" />
                      {event.time} · {event.location}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* CTA */}
      <section className="bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-5 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Know a place we're missing?</h2>
            <p className="text-sm text-zinc-500 mt-1">Help grow the community directory by submitting a listing.</p>
          </div>
          <Link href="#"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors text-sm shrink-0">
            Add a Listing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}