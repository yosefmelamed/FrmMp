import { getKosherResources, getEvents, getAmenities } from '@/lib/api';
import { ExternalLink, Calendar, Clock, MapPin, BookOpen, Heart, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Resources — Jewish Denver' };

const RES_CATS = ['All', 'Certification', 'Community', 'Education', 'News', 'Guides'];

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const [resources, events, institutions] = await Promise.all([
    getKosherResources(),
    getEvents(),
    getAmenities(['jewish_center', 'jewish_school']),
  ]);

  const activeCat = searchParams.category || 'All';
  const filteredRes =
    activeCat === 'All' ? resources : resources.filter(r => r.category === activeCat);

  const availableCats = RES_CATS.filter(
    c => c === 'All' || resources.some(r => r.category === c)
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-5 py-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📚</span>
            <h1 className="text-2xl font-bold text-zinc-900">Community Resources</h1>
          </div>
          <p className="text-zinc-500 text-sm">
            Links, events, schools, and organizations serving Denver's Jewish community
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Online Resources + Schools ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Online Resources */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-blue-500" />
                <h2 className="text-lg font-bold text-zinc-900">Online Resources</h2>
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {availableCats.map(c => (
                  <Link key={c}
                    href={c === 'All' ? '/resources' : `/resources?category=${encodeURIComponent(c)}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      activeCat === c
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-700'
                    }`}>
                    {c}
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredRes.map(r => (
                  <a key={r.id} href={r.url || '#'} target="_blank" rel="noopener noreferrer"
                    className="card card-interactive p-4 group block">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 bg-zinc-50 text-zinc-400 text-[10px] font-semibold rounded uppercase tracking-wide mb-2">
                          {r.category}
                        </span>
                        <h3 className="text-sm font-semibold text-zinc-800 group-hover:text-blue-600 transition-colors leading-snug">
                          {r.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{r.description}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* Schools & Centers */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-violet-500" />
                <h2 className="text-lg font-bold text-zinc-900">Schools & Community Centers</h2>
              </div>

              <div className="space-y-3">
                {institutions.map(a => (
                  <div key={a.id} className="card p-4 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-lg shrink-0">
                      {a.category === 'jewish_school' ? '📚' : '🏛️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-zinc-900 text-sm">{a.name}</h3>
                          {a.denomination && (
                            <span className="text-xs text-violet-600 font-medium">{a.denomination}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.website && (
                            <a href={a.website} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                              Website <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <Link href="/map"
                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-600 transition-colors">
                            <MapPin className="w-3 h-3" />
                            Map
                          </Link>
                        </div>
                      </div>
                      {a.description && (
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">{a.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{a.address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Community Organizations */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-red-400" />
                <h2 className="text-lg font-bold text-zinc-900">Community Organizations</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Jewish Colorado',          url: 'https://www.jewishcolorado.org',     desc: 'Denver\'s federated Jewish community' },
                  { label: 'Denver Jewish News',        url: 'https://www.jewishnews.net',         desc: 'Local Jewish news & events' },
                  { label: 'Hillel at CU Boulder',      url: 'https://www.hillel.org',             desc: 'Jewish life on campus' },
                  { label: 'ADL Mountain States',       url: 'https://www.adl.org',                desc: 'Anti-Defamation League, CO' },
                  { label: 'Jewish Family Service',     url: 'https://www.jewishfamilyservice.org',desc: 'Social services & counseling' },
                  { label: 'Rocky Mountain Rabbinical', url: '#',                                  desc: 'Rabbinical council of Colorado' },
                ].map(({ label, url, desc }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                    className="card p-3.5 flex items-start gap-3 group hover:border-zinc-200 transition-all card-interactive">
                    <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 text-zinc-300 group-hover:text-red-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 group-hover:text-blue-600 transition-colors">{label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-300 group-hover:text-blue-400 shrink-0 transition-colors mt-0.5" />
                  </a>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right: Events sidebar ── */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h2 className="text-lg font-bold text-zinc-900">Upcoming Events</h2>
              </div>

              <div className="space-y-3">
                {events.map(event => {
                  const d = new Date(event.date);
                  return (
                    <div key={event.id} className="card p-4">
                      <div className="flex items-start gap-3">
                        {/* Mini calendar chip */}
                        <div className="shrink-0 w-10 text-center">
                          <div className="bg-blue-600 text-white rounded-t-lg py-0.5 text-[9px] font-bold uppercase tracking-wide">
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
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{event.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-zinc-400">
                              <Clock className="w-3 h-3" />
                              {event.time}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-zinc-400 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>
                          {event.amenityId && (
                            <Link href="/map"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                              View on map <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-4">
              <h3 className="text-sm font-semibold text-zinc-800">Add a Resource</h3>
              <p className="text-xs text-zinc-500 mt-1 mb-3">Know of a link or event we should list?</p>
              <Link href="#"
                className="block text-center py-2 bg-zinc-800 text-white text-xs font-semibold rounded-lg hover:bg-zinc-900 transition-colors">
                Submit a Resource
              </Link>
            </div>

            {/* Shabbat info card */}
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
              <h3 className="text-sm font-semibold text-zinc-800 mb-1">Shabbat Times — Denver</h3>
              <p className="text-xs text-zinc-500 mb-3">
                Candle lighting and Havdalah times vary weekly. Check MyZmanim for accurate times.
              </p>
              <a href="https://www.myzmanim.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors">
                <ExternalLink className="w-3 h-3" />
                MyZmanim.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
