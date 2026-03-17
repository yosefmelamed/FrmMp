import { getSynagogues } from '@/lib/api';
import AmenityCard from '@/components/ui/AmenityCard';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';

export const metadata = { title: 'Synagogues — Jewish Denver' };

const DENOMS = ['All', 'Reform', 'Conservative', 'Orthodox', 'Chabad-Lubavitch', 'Pluralistic'];

export default async function SynagoguesPage({ searchParams }: { searchParams: { denomination?: string } }) {
  const synagogues = await getSynagogues();
  const denom = searchParams.denomination || 'All';
  const filtered = denom === 'All' ? synagogues : synagogues.filter(s => s.denomination?.includes(denom));
  const available = DENOMS.filter(d => d === 'All' || synagogues.some(s => s.denomination?.includes(d)));

  const denomCounts = available.reduce((acc, d) => {
    acc[d] = d === 'All' ? synagogues.length : synagogues.filter(s => s.denomination?.includes(d)).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-5 py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✡️</span>
                <h1 className="text-2xl font-bold text-zinc-900">Synagogues</h1>
              </div>
              <p className="text-zinc-500 text-sm">{synagogues.length} congregations across Denver & Boulder</p>
            </div>
            <Link href="/map?filter=synagogue"
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
              <MapPin className="w-4 h-4" />
              View on Map
            </Link>
          </div>

          {/* Denomination filter tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {available.map(d => (
              <Link key={d}
                href={d === 'All' ? '/synagogues' : `/synagogues?denomination=${encodeURIComponent(d)}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  denom === d
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-800'
                }`}>
                {d}
                <span className={`text-xs ${denom === d ? 'text-blue-200' : 'text-zinc-400'}`}>
                  {denomCounts[d]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        <p className="text-xs text-zinc-400 mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(synagogue => (
            <AmenityCard
              key={synagogue.id}
              amenity={synagogue}
              showDirectionsLink
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-400">No synagogues found for this filter.</div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 p-5 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-zinc-900">See all synagogues on the map</h3>
              <p className="text-sm text-zinc-500 mt-0.5">Interactive map with directions and itinerary planning.</p>
            </div>
            <Link href="/map" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shrink-0">
              Open Map →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
