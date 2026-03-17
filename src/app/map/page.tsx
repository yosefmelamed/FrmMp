'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Amenity, AmenityCategory, ItineraryStop } from '@/types';
import { getAmenities, getMapCenter } from '@/lib/api';
import { ALL_CATEGORIES, CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import MapFilters from '@/components/map/MapFilters';
import AmenityCard from '@/components/ui/AmenityCard';
import AmenityDrawer from '@/components/map/AmenityDrawer';
import ItineraryPanel from '@/components/map/ItineraryPanel';
import { Search, Route, X, SlidersHorizontal, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

type SidebarMode = 'list' | 'detail' | 'itinerary';

export default function MapPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<AmenityCategory>>(new Set(ALL_CATEGORIES));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [itineraryStops, setItineraryStops] = useState<ItineraryStop[]>([]);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('list');
  const [detailAmenity, setDetailAmenity] = useState<Amenity | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 39.7392, lng: -104.9903 });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    Promise.all([getAmenities(), Promise.resolve(getMapCenter())]).then(([data, center]) => {
      setAmenities(data);
      setMapCenter(center);
      setLoading(false);
    });
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<AmenityCategory, number>;
    ALL_CATEGORIES.forEach(c => (counts[c] = 0));
    amenities.forEach(a => counts[a.category]++);
    return counts;
  }, [amenities]);

  const filtered = useMemo(() => {
    return amenities.filter(a => {
      if (!activeCategories.has(a.category)) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) ||
          a.address.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.tags?.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [amenities, activeCategories, search]);

  const handleOpenDrawer = useCallback((amenity: Amenity) => {
    setDetailAmenity(amenity);
    setSelectedId(amenity.id);
    setSidebarMode('detail');
  }, []);

  const handleSelect = useCallback((amenity: Amenity | null) => {
    setSelectedId(amenity?.id ?? null);
    if (amenity && sidebarMode !== 'itinerary') {
      setSidebarMode('detail');
      setDetailAmenity(amenity);
    }
  }, [sidebarMode]);

  const handleCardClick = useCallback((amenity: Amenity) => {
    handleOpenDrawer(amenity);
  }, [handleOpenDrawer]);

  const addToItinerary = useCallback((amenity: Amenity) => {
    setItineraryStops(prev => {
      if (prev.find(s => s.amenityId === amenity.id)) return prev;
      return [...prev, { amenityId: amenity.id, amenity }];
    });
    setSidebarMode('itinerary');
  }, []);

  const removeFromItinerary = useCallback((id: string) => {
    setItineraryStops(prev => prev.filter(s => s.amenityId !== id));
  }, []);

  const backToList = useCallback(() => {
    setSidebarMode('list');
    setDetailAmenity(null);
    setSelectedId(null);
  }, []);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-zinc-50">
      {/* ── Sidebar ── */}
      <div className="w-80 shrink-0 flex flex-col bg-white border-r border-zinc-100 shadow-sm z-10">
        {/* Sidebar header */}
        {sidebarMode === 'list' && (
          <>
            {/* Search */}
            <div className="p-3 border-b border-zinc-100">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Denver…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-400 focus:bg-white transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 text-zinc-400 hover:text-zinc-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={clsx(
                  'flex items-center gap-1.5 mt-2 text-xs px-2.5 py-1.5 rounded-lg transition-colors w-full',
                  filtersOpen ? 'bg-blue-50 text-blue-600 font-medium' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                <span className={clsx('ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5',
                  activeCategories.size < ALL_CATEGORIES.length
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-zinc-100 text-zinc-400'
                )}>
                  {activeCategories.size}/{ALL_CATEGORIES.length}
                </span>
              </button>
            </div>

            {/* Filters (collapsible) */}
            {filtersOpen && (
              <MapFilters active={activeCategories} onChange={setActiveCategories} counts={categoryCounts} />
            )}

            {/* Count */}
            <div className="px-4 py-1.5 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {loading ? 'Loading…' : `${filtered.length} places`}
              </span>
              {itineraryStops.length > 0 && (
                <button
                  onClick={() => setSidebarMode('itinerary')}
                  className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <Route className="w-3.5 h-3.5" />
                  Itinerary ({itineraryStops.length})
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {sidebarMode === 'list' && (
            <div className="p-2.5 space-y-2">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
                : filtered.map(amenity => (
                  <AmenityCard
                    key={amenity.id}
                    amenity={amenity}
                    compact
                    selected={amenity.id === selectedId}
                    onSelect={handleCardClick}
                    onAddToItinerary={addToItinerary}
                    onViewDetail={handleOpenDrawer}
                    showActions={amenity.id === selectedId}
                  />
                ))
              }
              {!loading && filtered.length === 0 && (
                <div className="text-center py-12 text-zinc-400 text-sm">No results found</div>
              )}
            </div>
          )}

          {sidebarMode === 'detail' && detailAmenity && (
            <AmenityDrawer
              amenity={detailAmenity}
              onClose={backToList}
              onAddToItinerary={addToItinerary}
              itineraryStops={itineraryStops}
            />
          )}

          {sidebarMode === 'itinerary' && (
            <ItineraryPanel
              stops={itineraryStops}
              onRemoveStop={removeFromItinerary}
              onClearAll={() => setItineraryStops([])}
              onClose={backToList}
              allAmenities={amenities}
            />
          )}
        </div>

        {/* Itinerary FAB at bottom (only in list mode) */}
        {sidebarMode === 'list' && (
          <div className="p-3 border-t border-zinc-100">
            <button
              onClick={() => setSidebarMode('itinerary')}
              className={clsx(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
                itineraryStops.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-zinc-50 text-zinc-400 border border-zinc-100'
              )}
            >
              <Route className="w-4 h-4" />
              {itineraryStops.length > 0 ? `Plan Visit · ${itineraryStops.length} stop${itineraryStops.length > 1 ? 's' : ''}` : 'Plan a Visit'}
            </button>
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <MapComponent
          amenities={filtered}
          center={mapCenter}
          selectedId={selectedId}
          onSelect={handleSelect}
          onOpenDrawer={handleOpenDrawer}
        />
      </div>
    </div>
  );
}
