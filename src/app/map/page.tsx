'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Amenity, AmenityCategory, ItineraryStop, NearbyPlace } from '@/types';
import { getAmenities, getMapCenter } from '@/lib/api';
import { ALL_CATEGORIES, CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import MapFilters from '@/components/map/MapFilters';
import AmenityCard from '@/components/ui/AmenityCard';
import AmenityDrawer from '@/components/map/AmenityDrawer';
import ItineraryPanel from '@/components/map/ItineraryPanel';
import {
  Search, Route, X, SlidersHorizontal, ChevronRight,
  ChevronDown, ChevronUp, MapPin, Phone, Globe, Clock,
  Star, ExternalLink, Navigation, Plus
} from 'lucide-react';
import clsx from 'clsx';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

type SidebarMode = 'list' | 'detail' | 'nearby_detail' | 'itinerary';

const SHEET_PEEK = 'calc(40vh)';
const SHEET_FULL = 'calc(88vh)';

// Nearby place type labels/emojis (mirrors MapComponent — kept in sync)
const NEARBY_DISPLAY: Record<string, { emoji: string; label: string }> = {
  hotel:      { emoji: '🏨', label: 'Hotel' },
  attraction: { emoji: '🎭', label: 'Attraction' },
  shopping:   { emoji: '🛍️', label: 'Shopping' },
  restaurant: { emoji: '🍴', label: 'Restaurant' },
};

// ── Nearby Place Drawer ──────────────────────────────────────────────────────
function NearbyDrawer({
  place,
  onClose,
  onAddToItinerary,
  itineraryStops,
}: {
  place: NearbyPlace;
  onClose: () => void;
  onAddToItinerary: (a: Amenity) => void;
  itineraryStops: ItineraryStop[];
}) {
  const display = NEARBY_DISPLAY[place.category] ?? { emoji: '📍', label: place.category };
  const inItinerary = itineraryStops.some(s => s.amenityId === place.id);

  const asAmenity: Amenity = {
    id: place.id,
    name: place.name,
    category: 'jewish_center', // fallback for display
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    rating: place.rating,
    reviewCount: place.reviewCount,
    description: `${display.label}${place.priceLevel ? ' · ' + '$'.repeat(place.priceLevel) : ''}`,
    tags: [display.label],
  };

  const openDirections = () =>
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`, '_blank');

  return (
    <div className="flex flex-col h-full animate-slide-right">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 shrink-0">
        <button onClick={onClose}
          className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-zinc-400 flex-1">Back to list</span>
        <button onClick={onClose} className="p-1 rounded-md text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Photo */}
        {place.photoUrl && (
          <div className="w-full h-36 overflow-hidden">
            <img src={place.photoUrl} alt={place.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Hero */}
        <div className="px-4 pt-4 pb-3 bg-zinc-50/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-zinc-600 text-xs font-medium rounded-full border border-zinc-200 mb-2">
                <span>{display.emoji}</span>
                {display.label}
              </span>
              <h2 className="font-semibold text-zinc-900 text-base leading-snug">{place.name}</h2>
            </div>
            <span className="text-3xl shrink-0">{display.emoji}</span>
          </div>

          {/* Rating */}
          {place.rating && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className="w-3 h-3" viewBox="0 0 20 20">
                    <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
                      fill={s <= Math.round(place.rating!) ? '#f59e0b' : '#e4e4e7'} />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-zinc-500">{place.rating.toFixed(1)}{place.reviewCount ? ` (${place.reviewCount})` : ''}</span>
              {place.priceLevel ? <span className="text-xs text-zinc-400 ml-1">{'$'.repeat(place.priceLevel)}</span> : null}
            </div>
          )}

          {/* Open status */}
          {place.isOpen !== undefined && (
            <div className={`mt-1.5 text-xs font-medium ${place.isOpen ? 'text-emerald-600' : 'text-red-500'}`}>
              {place.isOpen ? '● Open now' : '● Closed'}
            </div>
          )}
        </div>

        {/* Address */}
        <div className="px-4 py-3 border-b border-zinc-50">
          <div className="flex items-start gap-2 text-xs text-zinc-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
            <span className="leading-relaxed">{place.address}</span>
          </div>
          {place.phone && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
              <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
              <a href={`tel:${place.phone}`} className="hover:text-blue-600 transition-colors">{place.phone}</a>
            </div>
          )}
          {place.website && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
              <Globe className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
              <a href={place.website} target="_blank" rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors truncate">
                {place.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-zinc-100 space-y-2 shrink-0">
        <button
          onClick={() => onAddToItinerary(asAmenity)}
          disabled={inItinerary}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            inItinerary
              ? 'bg-zinc-50 text-zinc-400 border border-zinc-100 cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          )}
        >
          <Route className="w-3.5 h-3.5" />
          {inItinerary ? 'Added to itinerary' : 'Add to Itinerary'}
        </button>
        <button
          onClick={openDirections}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-zinc-600 hover:text-zinc-800 hover:bg-zinc-50 border border-zinc-100 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          Get Directions
        </button>
      </div>
    </div>
  );
}

// ── Map Page ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  const [amenities,        setAmenities]        = useState<Amenity[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<AmenityCategory>>(new Set(ALL_CATEGORIES ?? []));
  const [selectedId,       setSelectedId]       = useState<string | null>(null);
  const [search,           setSearch]           = useState('');
  const [debouncedSearch,  setDebouncedSearch]  = useState('');
  const [itineraryStops,   setItineraryStops]   = useState<ItineraryStop[]>([]);
  const [sidebarMode,      setSidebarMode]      = useState<SidebarMode>('list');
  const [detailAmenity,    setDetailAmenity]    = useState<Amenity | null>(null);
  const [detailNearby,     setDetailNearby]     = useState<NearbyPlace | null>(null);
  const [mapCenter,        setMapCenter]        = useState({ lat: 39.7392, lng: -104.9903 });
  const [filtersOpen,      setFiltersOpen]      = useState(false);
  const [sheetExpanded,    setSheetExpanded]    = useState(false);

  useEffect(() => {
    Promise.all([getAmenities(), Promise.resolve(getMapCenter())]).then(([data, center]) => {
      setAmenities(data); setMapCenter(center); setLoading(false);
    });
  }, []);

  // Debounce search input — only filter after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<AmenityCategory, number>;
    (ALL_CATEGORIES ?? []).forEach(c => (counts[c] = 0));
    amenities.forEach(a => { if (a.category) counts[a.category] = (counts[a.category] ?? 0) + 1; });
    return counts;
  }, [amenities]);

  const filtered = useMemo(() => {
    return amenities.filter(a => {
      if (!activeCategories.has(a.category)) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.address.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) || a.tags?.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [amenities, activeCategories, debouncedSearch]);

  const handleOpenDrawer = useCallback((amenity: Amenity) => {
    setDetailAmenity(amenity); setDetailNearby(null);
    setSelectedId(amenity.id);
    setSidebarMode('detail'); setSheetExpanded(true);
  }, []);

  const handleOpenNearbyDrawer = useCallback((place: NearbyPlace) => {
    setDetailNearby(place); setDetailAmenity(null);
    setSidebarMode('nearby_detail'); setSheetExpanded(true);
  }, []);

  const handleSelect = useCallback((amenity: Amenity | null) => {
    setSelectedId(amenity?.id ?? null);
    if (amenity && sidebarMode !== 'itinerary') {
      setDetailAmenity(amenity); setDetailNearby(null);
      setSidebarMode('detail'); setSheetExpanded(true);
    }
  }, [sidebarMode]);

  const addToItinerary = useCallback((amenity: Amenity) => {
    setItineraryStops(prev =>
      prev.find(s => s.amenityId === amenity.id) ? prev : [...prev, { amenityId: amenity.id, amenity }]
    );
    setSidebarMode('itinerary'); setSheetExpanded(true);
  }, []);

  const backToList = useCallback(() => {
    setSidebarMode('list'); setDetailAmenity(null); setDetailNearby(null); setSelectedId(null);
  }, []);

  const sidebarTitle = () => {
    if (sidebarMode === 'list')         return `${filtered.length} Places`;
    if (sidebarMode === 'detail')       return detailAmenity?.name ?? 'Details';
    if (sidebarMode === 'nearby_detail') return detailNearby?.name ?? 'Details';
    if (sidebarMode === 'itinerary')    return 'Plan Your Visit';
    return '';
  };

  const SidebarContent = () => (
    <>
      {sidebarMode === 'list' && (
        <>
          <div className="p-3 border-b border-zinc-100">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input type="text" placeholder="Search Denver…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 text-zinc-400 hover:text-zinc-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <button onClick={() => setFiltersOpen(v => !v)}
              className={clsx('flex items-center gap-1.5 mt-2 text-xs px-2.5 py-1.5 rounded-lg transition-colors w-full',
                filtersOpen ? 'bg-blue-50 text-blue-600 font-medium' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50')}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              <span className={clsx('ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5',
                activeCategories.size < (ALL_CATEGORIES?.length ?? 0) ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400')}>
                {activeCategories.size}/{ALL_CATEGORIES?.length ?? 0}
              </span>
            </button>
          </div>

          {filtersOpen && <MapFilters active={activeCategories} onChange={(cats) => setActiveCategories(new Set(cats))} counts={categoryCounts} />}

          <div className="px-4 py-1.5 flex items-center justify-between border-b border-zinc-50">
            <span className="text-xs text-zinc-400">{loading ? 'Loading…' : `${filtered.length} places`}</span>
            {itineraryStops.length > 0 && (
              <button onClick={() => { setSidebarMode('itinerary'); setSheetExpanded(true); }}
                className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors">
                <Route className="w-3.5 h-3.5" /> Itinerary ({itineraryStops.length}) <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
              : filtered.map(amenity => (
                <AmenityCard key={amenity.id} amenity={amenity} compact
                  selected={amenity.id === selectedId}
                  onSelect={handleOpenDrawer}
                  onAddToItinerary={addToItinerary}
                  onViewDetail={handleOpenDrawer}
                  showActions={amenity.id === selectedId} />
              ))}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-10 text-zinc-400 text-sm">No results found</div>
            )}
          </div>

          <div className="p-3 border-t border-zinc-100">
            <button onClick={() => { setSidebarMode('itinerary'); setSheetExpanded(true); }}
              className={clsx('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
                itineraryStops.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-zinc-50 text-zinc-400 border border-zinc-100')}>
              <Route className="w-4 h-4" />
              {itineraryStops.length > 0
                ? `Plan Visit · ${itineraryStops.length} stop${itineraryStops.length > 1 ? 's' : ''}`
                : 'Plan a Visit'}
            </button>
          </div>
        </>
      )}

      {sidebarMode === 'detail' && detailAmenity && (
        <AmenityDrawer
          amenity={detailAmenity}
          onClose={backToList}
          onAddToItinerary={addToItinerary}
          itineraryStops={itineraryStops}
        />
      )}

      {sidebarMode === 'nearby_detail' && detailNearby && (
        <NearbyDrawer
          place={detailNearby}
          onClose={backToList}
          onAddToItinerary={addToItinerary}
          itineraryStops={itineraryStops}
        />
      )}

      {sidebarMode === 'itinerary' && (
        <ItineraryPanel
          stops={itineraryStops}
          onRemoveStop={id => setItineraryStops(p => p.filter(s => s.amenityId !== id))}
          onClearAll={() => setItineraryStops([])}
          onClose={backToList}
          allAmenities={amenities}
        />
      )}
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] overflow-hidden bg-zinc-50 relative">

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-80 shrink-0 flex-col bg-white border-r border-zinc-100 shadow-sm z-10">
        <SidebarContent />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent
          amenities={filtered}
          center={mapCenter}
          selectedId={selectedId}
          onSelect={handleSelect}
          onOpenDrawer={handleOpenDrawer}
          onAddToItinerary={addToItinerary}
          onOpenNearbyDrawer={handleOpenNearbyDrawer}
        />
      </div>

      {/* Mobile bottom sheet */}
      <div
        className={clsx(
          'md:hidden absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl border-t border-zinc-100 flex flex-col transition-all duration-300 ease-out',
        )}
        style={{ height: sheetExpanded ? SHEET_FULL : SHEET_PEEK }}
      >
        <div className="flex flex-col items-center pt-2 pb-1 border-b border-zinc-100 shrink-0">
          <button className="w-10 h-1 bg-zinc-200 rounded-full mb-2"
            onClick={() => setSheetExpanded(v => !v)} aria-label="Toggle sheet" />
          <div className="flex items-center w-full px-4 pb-1.5">
            {sidebarMode !== 'list' && (
              <button onClick={backToList}
                className="mr-2 text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-0.5">
                <ChevronDown className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <span className="text-sm font-semibold text-zinc-800 flex-1">{sidebarTitle()}</span>
            <button onClick={() => setSheetExpanded(v => !v)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md">
              {sheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SidebarContent />
        </div>
      </div>
    </div>
  );
}