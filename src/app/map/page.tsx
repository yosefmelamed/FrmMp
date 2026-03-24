'use client';
 
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Amenity, AmenityCategory, ItineraryStop, NearbyPlace } from '@/types';
import { getAmenities, getMapCenter } from '@/lib/api';
import { ALL_CATEGORIES, CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import MapFilters from '@/components/map/MapFilters';
import AmenityCard from '@/components/ui/AmenityCard';
import AmenityDrawer from '@/components/map/AmenityDrawer';
import ItineraryPanel from '@/components/map/ItineraryPanel';
import { useAuth } from '@/context/AuthContext';
import { savedApi, itineraryApi, historyApi, type SavedItinerary } from '@/lib/auth/api';
import {
  Search, Route, X, SlidersHorizontal, ChevronRight, ChevronDown, ChevronUp,
  Phone, Globe, ExternalLink, Navigation, Plus, Heart, BookmarkCheck,
  History, Save, Loader2, FolderOpen, Trash2, Star
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
 
type SidebarMode = 'list' | 'detail' | 'nearby_detail' | 'itinerary' | 'saved' | 'my_itineraries';
// Sheet snap heights
const SHEET_COLLAPSED = 52;   // px — just the drag handle + title visible
const SHEET_HALF      = 0.45; // fraction of viewport
const SHEET_FULL      = 0.88; // fraction of viewport
 
const NEARBY_DISPLAY: Record<string, { emoji: string; label: string }> = {
  hotel:      { emoji: '\uD83C\uDFE8', label: 'Hotel' },
  attraction: { emoji: '\uD83C\uDFAD', label: 'Attraction' },
  shopping:   { emoji: '\uD83D\uDED2', label: 'Shopping' },
  restaurant: { emoji: '\uD83C\uDF74', label: 'Restaurant' },
};
 
// ── Stable search input — lives OUTSIDE SidebarContent to avoid remounting ──
function SearchInput({ value, onChange, onClear, onFocus, historyVisible, searchHistory, onApplyHistory, onRemoveHistory, onClearHistory }: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  onFocus: () => void;
  historyVisible: boolean;
  searchHistory: { id: string; query: string }[];
  onApplyHistory: (q: string) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative" ref={ref}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search Denver…"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          className="w-full pl-8 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
        />
        {value
          ? <button onClick={onClear} className="absolute right-2.5 text-zinc-400 hover:text-zinc-600"><X className="w-3.5 h-3.5" /></button>
          : searchHistory.length > 0 && <History className="absolute right-2.5 w-3.5 h-3.5 text-zinc-300 pointer-events-none" />
        }
      </div>
      {historyVisible && searchHistory.length > 0 && !value && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Recent searches</span>
            <button onClick={onClearHistory} className="text-[10px] text-zinc-400 hover:text-red-500">Clear all</button>
          </div>
          {searchHistory.slice(0, 8).map(h => (
            <div key={h.id} className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 group">
              <History className="w-3 h-3 text-zinc-300 shrink-0" />
              <button onClick={() => onApplyHistory(h.query)} className="flex-1 text-left text-sm text-zinc-600 truncate">{h.query}</button>
              <button onClick={() => onRemoveHistory(h.id)} className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-400"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
 
// ── Nearby Drawer ─────────────────────────────────────────────
function NearbyDrawer({ place, onClose, onAddToItinerary, itineraryStops }: {
  place: NearbyPlace; onClose: () => void;
  onAddToItinerary: (a: Amenity) => void; itineraryStops: ItineraryStop[];
}) {
  const display = NEARBY_DISPLAY[place.category] ?? { emoji: '\uD83D\uDCCD', label: place.category };
  const inItinerary = itineraryStops.some(s => s.amenityId === place.id);
  const asAmenity: Amenity = {
    id: place.id, name: place.name, category: 'jewish_center',
    address: place.address, lat: place.lat, lng: place.lng,
    phone: place.phone, website: place.website, rating: place.rating, reviewCount: place.reviewCount,
  };
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-zinc-100 flex items-start gap-3">
        <button onClick={onClose} className="mt-0.5 text-zinc-400 hover:text-zinc-600 shrink-0"><X className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-zinc-400">{display.emoji} {display.label}</span>
          <h2 className="font-semibold text-zinc-900 text-sm leading-tight mt-0.5">{place.name}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{place.address}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {place.rating && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
            {place.reviewCount && <span className="text-xs text-zinc-400">({place.reviewCount})</span>}
          </div>
        )}
        {place.isOpen !== undefined && (
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', place.isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
            {place.isOpen ? 'Open now' : 'Closed'}
          </span>
        )}
        {place.phone && <a href={`tel:${place.phone}`} className="flex items-center gap-2 text-sm text-zinc-600 hover:text-blue-600"><Phone className="w-3.5 h-3.5" />{place.phone}</a>}
        {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><Globe className="w-3.5 h-3.5" />Website<ExternalLink className="w-3 h-3" /></a>}
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><Navigation className="w-3.5 h-3.5" />Get Directions</a>
        <button onClick={() => onAddToItinerary(asAmenity)}
          className={clsx('w-full mt-2 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
            inItinerary ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-600 text-white hover:bg-blue-700')}>
          <Plus className="w-3.5 h-3.5" />
          {inItinerary ? 'Added to itinerary' : 'Add to Itinerary'}
        </button>
      </div>
    </div>
  );
}
 
// ── Main page ─────────────────────────────────────────────────
function MapPageContent() {
  const { user, token } = useAuth();
 
  const searchParams = useSearchParams();
  const [amenities,        setAmenities]        = useState<Amenity[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<AmenityCategory>>(() => {
    const filter = searchParams.get('filter');
    if (filter && (ALL_CATEGORIES ?? []).includes(filter as AmenityCategory)) {
      return new Set<AmenityCategory>([filter as AmenityCategory]);
    }
    return new Set(ALL_CATEGORIES ?? []);
  });
  const [selectedId,       setSelectedId]       = useState<string | null>(null);
  const [search,           setSearch]           = useState('');
  const [debouncedSearch,  setDebouncedSearch]  = useState('');
  const [itineraryStops,   setItineraryStops]   = useState<ItineraryStop[]>([]);
  const [sidebarMode,      setSidebarMode]      = useState<SidebarMode>('list');
  const [detailAmenity,    setDetailAmenity]    = useState<Amenity | null>(null);
  const [detailNearby,     setDetailNearby]     = useState<NearbyPlace | null>(null);
  const [mapCenter,        setMapCenter]        = useState({ lat: 39.7392, lng: -104.9903 });
  const [filtersOpen,      setFiltersOpen]      = useState(false);
  const [sheetSnap,        setSheetSnap]        = useState<'collapsed'|'half'|'full'>('collapsed');
  const sheetDragY        = useRef<number | null>(null);
  const sheetStartH       = useRef<number>(SHEET_COLLAPSED);
  const [sheetH,           setSheetH]           = useState(SHEET_COLLAPSED);
  const [savedIds,         setSavedIds]         = useState<Set<string>>(new Set());
  const [savingId,         setSavingId]         = useState<string | null>(null);
  const [itinerarySaving,  setItinerarySaving]  = useState(false);
  const [itinerarySaved,   setItinerarySaved]   = useState(false);
  const [searchHistory,    setSearchHistory]    = useState<{ id: string; query: string; category?: string }[]>([]);
  const [showHistory,      setShowHistory]      = useState(false);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);
  const [itinerariesLoading, setItinerariesLoading] = useState(false);
  const [deletingId,       setDeletingId]       = useState<string | null>(null);
  const snapSheet = useCallback((snap: 'collapsed'|'half'|'full') => {
    setSheetSnap(snap);
    const vh = window.innerHeight;
    setSheetH(snap === 'collapsed' ? SHEET_COLLAPSED : snap === 'half' ? Math.round(vh * SHEET_HALF) : Math.round(vh * SHEET_FULL));
  }, []);
 
  // Close history on outside click
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowHistory(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
 
  // Load amenities
  useEffect(() => {
    Promise.all([getAmenities(), Promise.resolve(getMapCenter())]).then(([data, center]) => {
      setAmenities(data); setMapCenter(center); setLoading(false);
    });
  }, []);
 
  // Load saved items
  useEffect(() => {
    if (!token) { setSavedIds(new Set()); return; }
    savedApi.list(token).then(r => setSavedIds(new Set(r.amenityIds))).catch(() => {});
  }, [token]);
 
  // Load search history
  useEffect(() => {
    if (!token) { setSearchHistory([]); return; }
    historyApi.list(token).then(setSearchHistory).catch(() => {});
  }, [token]);
 
  // Load saved itineraries when tab opens
  useEffect(() => {
    if (!token || sidebarMode !== 'my_itineraries') return;
    setItinerariesLoading(true);
    itineraryApi.list(token).then(setSavedItineraries).catch(() => {}).finally(() => setItinerariesLoading(false));
  }, [token, sidebarMode]);
 
  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);
 
  // Record search history
  useEffect(() => {
    if (!token || !debouncedSearch.trim()) return;
    if (historyDebounce.current) clearTimeout(historyDebounce.current);
    historyDebounce.current = setTimeout(() => {
      historyApi.record(token, debouncedSearch.trim())
        .then(() => historyApi.list(token).then(setSearchHistory).catch(() => {}))
        .catch(() => {});
    }, 1500);
    return () => { if (historyDebounce.current) clearTimeout(historyDebounce.current); };
  }, [debouncedSearch, token]);
 
  // Derived state
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
 
  const savedAmenities = useMemo(() => amenities.filter(a => savedIds.has(a.id)), [amenities, savedIds]);
 
  // Handlers
  const handleOpenDrawer = useCallback((amenity: Amenity) => {
    setDetailAmenity(amenity); setDetailNearby(null);
    setSelectedId(amenity.id); setSidebarMode('detail'); snapSheet('half');
  }, []);
 
  const handleOpenNearbyDrawer = useCallback((place: NearbyPlace) => {
    setDetailNearby(place); setDetailAmenity(null);
    setSidebarMode('nearby_detail'); snapSheet('half');
  }, []);
 
  const handleSelect = useCallback((amenity: Amenity | null) => {
    setSelectedId(amenity?.id ?? null);
    if (amenity && sidebarMode !== 'itinerary') {
      setDetailAmenity(amenity); setDetailNearby(null);
      setSidebarMode('detail'); snapSheet('half');
    }
  }, [sidebarMode]);
 
  const addToItinerary = useCallback((amenity: Amenity) => {
    setItineraryStops(prev => prev.find(s => s.amenityId === amenity.id) ? prev : [...prev, { amenityId: amenity.id, amenity }]);
    setSidebarMode('itinerary'); snapSheet('half');
  }, []);
 
  const backToList = useCallback(() => {
    setSidebarMode('list'); setDetailAmenity(null); setDetailNearby(null); setSelectedId(null);
  }, []);
 
  const toggleSave = useCallback(async (amenity: Amenity) => {
    if (!token) return;
    setSavingId(amenity.id);
    try {
      if (savedIds.has(amenity.id)) {
        await savedApi.unsave(token, amenity.id);
        setSavedIds(prev => { const n = new Set(prev); n.delete(amenity.id); return n; });
      } else {
        await savedApi.save(token, amenity.id);
        setSavedIds(prev => new Set([...prev, amenity.id]));
      }
    } catch { /* silent */ }
    finally { setSavingId(null); }
  }, [token, savedIds]);
 
  const saveItinerary = useCallback(async (name: string) => {
    if (!token || itineraryStops.length === 0) return;
    setItinerarySaving(true);
    try {
      await itineraryApi.create(token, {
        name,
        stops: itineraryStops.map((s, i) => ({ amenityId: s.amenityId, position: i, notes: s.notes, arrivalTime: s.arrivalTime, duration: s.duration })),
      });
      setItinerarySaved(true);
      setTimeout(() => setItinerarySaved(false), 3000);
    } catch { /* silent */ }
    finally { setItinerarySaving(false); }
  }, [token, itineraryStops]);
 
  const deleteItinerary = useCallback(async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await itineraryApi.delete(token, id);
      setSavedItineraries(prev => prev.filter(it => it.id !== id));
    } catch { /* silent */ }
    finally { setDeletingId(null); }
  }, [token]);
 
  const loadItinerary = useCallback((it: SavedItinerary) => {
    const stops: ItineraryStop[] = it.stops
      .map(s => { const amenity = amenities.find(a => a.id === s.amenityId); return amenity ? { amenityId: s.amenityId, amenity, notes: s.notes ?? undefined, arrivalTime: s.arrivalTime ?? undefined, duration: s.duration ?? undefined } : null; })
      .filter(Boolean) as ItineraryStop[];
    setItineraryStops(stops);
    setSidebarMode('itinerary'); snapSheet('half');
  }, [amenities]);
 
  const applyHistory   = (q: string) => { setSearch(q); setDebouncedSearch(q); setShowHistory(false); };
  const removeHistory  = async (id: string) => {
    if (!token) return;
    await historyApi.remove(token, id).catch(() => {});
    setSearchHistory(prev => prev.filter(h => h.id !== id));
  };
  const clearHistory   = async () => {
    if (!token) return;
    await historyApi.clearAll(token).catch(() => {});
    setSearchHistory([]);
  };
 
  const sidebarTitle = () => {
    if (sidebarMode === 'list')           return `${filtered.length} Places`;
    if (sidebarMode === 'saved')          return `Saved (${savedAmenities.length})`;
    if (sidebarMode === 'my_itineraries') return 'My Itineraries';
    if (sidebarMode === 'detail')         return detailAmenity?.name ?? 'Details';
    if (sidebarMode === 'nearby_detail')  return detailNearby?.name ?? 'Details';
    if (sidebarMode === 'itinerary')      return 'Plan Your Visit';
    return '';
  };
 
  // ── Render ────────────────────────────────────────────────────
  const isListMode = sidebarMode === 'list' || sidebarMode === 'saved' || sidebarMode === 'my_itineraries';
 
  const ListPanel = (
    <>
      {/* Search — stable component, never unmounts */}
      <div className="p-3 border-b border-zinc-100" ref={searchRef}>
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setShowHistory(true); if (sidebarMode !== 'list') setSidebarMode('list'); }}
          onClear={() => { setSearch(''); setDebouncedSearch(''); setShowHistory(false); }}
          onFocus={() => setShowHistory(true)}
          historyVisible={showHistory && !!token}
          searchHistory={searchHistory}
          onApplyHistory={applyHistory}
          onRemoveHistory={removeHistory}
          onClearHistory={clearHistory}
        />
 
        {/* Filters + Saved + Trips row */}
        <div className="flex items-center gap-1 mt-2">
          <button onClick={() => setFiltersOpen(v => !v)}
            className={clsx('flex items-center gap-1.5 flex-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors',
              filtersOpen ? 'bg-blue-50 text-blue-600 font-medium' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50')}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            <span className={clsx('ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5',
              activeCategories.size < (ALL_CATEGORIES?.length ?? 0) ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400')}>
              {activeCategories.size}/{ALL_CATEGORIES?.length ?? 0}
            </span>
          </button>
          {user && (
            <button onClick={() => setSidebarMode(m => m === 'saved' ? 'list' : 'saved')}
              className={clsx('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0',
                sidebarMode === 'saved' ? 'bg-red-50 text-red-500 font-medium' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50')}>
              <Heart className={clsx('w-3.5 h-3.5', sidebarMode === 'saved' && 'fill-red-400')} />
              Saved {savedIds.size > 0 && <span className="text-[10px] font-bold">{savedIds.size}</span>}
            </button>
          )}
          {user && (
            <button onClick={() => setSidebarMode(m => m === 'my_itineraries' ? 'list' : 'my_itineraries')}
              className={clsx('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0',
                sidebarMode === 'my_itineraries' ? 'bg-violet-50 text-violet-600 font-medium' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50')}>
              <FolderOpen className="w-3.5 h-3.5" /> Trips
            </button>
          )}
        </div>
      </div>
 
      {filtersOpen && <MapFilters active={activeCategories} onChange={(cats) => setActiveCategories(new Set(cats))} counts={categoryCounts} />}
 
      <div className="px-4 py-1.5 flex items-center justify-between border-b border-zinc-50">
        <span className="text-xs text-zinc-400">
          {loading ? 'Loading…' : sidebarMode === 'saved'
            ? `${savedAmenities.length} saved place${savedAmenities.length !== 1 ? 's' : ''}`
            : `${filtered.length} places`}
        </span>
        {itineraryStops.length > 0 && (
          <button onClick={() => { setSidebarMode('itinerary'); snapSheet('half'); }}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50">
            <Route className="w-3.5 h-3.5" /> Itinerary ({itineraryStops.length}) <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
 
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {/* Saved tab */}
        {sidebarMode === 'saved' && (
          savedAmenities.length === 0
            ? <div className="text-center py-10 text-zinc-400 text-sm">
                <Heart className="w-8 h-8 mx-auto mb-2 text-zinc-200" />
                No saved places yet.<br />
                <span className="text-xs">Tap the heart on any place to save it.</span>
              </div>
            : savedAmenities.map(amenity => (
                <AmenityCard key={amenity.id} amenity={amenity} compact
                  selected={amenity.id === selectedId}
                  onSelect={handleOpenDrawer}
                  onAddToItinerary={addToItinerary}
                  onViewDetail={handleOpenDrawer}
                  showActions={amenity.id === selectedId}
                  onSave={toggleSave}
                  isSaved={true}
                  savingThis={savingId === amenity.id} />
              ))
        )}
 
        {/* My Itineraries tab */}
        {sidebarMode === 'my_itineraries' && (
          itinerariesLoading
            ? <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
            : savedItineraries.length === 0
              ? <div className="text-center py-10 text-zinc-400 text-sm px-4">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 text-zinc-200" />
                  No saved itineraries yet.<br />
                  <span className="text-xs">Build a trip and save it to your account.</span>
                </div>
              : savedItineraries.map(it => (
                  <div key={it.id} className="mx-1 border border-zinc-100 rounded-xl p-3 hover:border-zinc-200 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{it.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{it.stops.length} stop{it.stops.length !== 1 ? 's' : ''} · {new Date(it.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => deleteItinerary(it.id)} className="text-zinc-300 hover:text-red-400 shrink-0 p-1">
                        {deletingId === it.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="space-y-1 mb-3">
                      {it.stops.slice(0, 3).map((stop, i) => {
                        const a = amenities.find(x => x.id === stop.amenityId);
                        return (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <span className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center text-[10px] shrink-0">{i + 1}</span>
                            <span className="truncate">{a?.name ?? 'Unknown place'}</span>
                          </div>
                        );
                      })}
                      {it.stops.length > 3 && <p className="text-[10px] text-zinc-400 pl-5">+{it.stops.length - 3} more</p>}
                    </div>
                    <button onClick={() => loadItinerary(it)}
                      className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center justify-center gap-1.5">
                      <Route className="w-3 h-3" /> Load Itinerary
                    </button>
                  </div>
                ))
        )}
 
        {/* List tab */}
        {sidebarMode === 'list' && (
          loading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-zinc-100 animate-pulse" />)
            : filtered.length === 0
              ? <div className="text-center py-10 text-zinc-400 text-sm">No results found</div>
              : filtered.map(amenity => (
                  <AmenityCard key={amenity.id} amenity={amenity} compact
                    selected={amenity.id === selectedId}
                    onSelect={handleOpenDrawer}
                    onAddToItinerary={addToItinerary}
                    onViewDetail={handleOpenDrawer}
                    showActions={amenity.id === selectedId}
                    onSave={user ? toggleSave : undefined}
                    isSaved={savedIds.has(amenity.id)}
                    savingThis={savingId === amenity.id} />
                ))
        )}
      </div>
 
      <div className="p-3 border-t border-zinc-100">
        <button onClick={() => { setSidebarMode('itinerary'); snapSheet('half'); }}
          className={clsx('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
            itineraryStops.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-zinc-50 text-zinc-400 border border-zinc-100')}>
          <Route className="w-4 h-4" />
          {itineraryStops.length > 0 ? `Plan Visit · ${itineraryStops.length} stop${itineraryStops.length > 1 ? 's' : ''}` : 'Plan a Visit'}
        </button>
      </div>
    </>
  );
 
  const DetailPanel = detailAmenity && (
    <div className="flex flex-col h-full">
      <AmenityDrawer amenity={detailAmenity} onClose={backToList} onAddToItinerary={addToItinerary} itineraryStops={itineraryStops} />
      {user && (
        <div className="px-4 pb-3 shrink-0 border-t border-zinc-100 pt-3">
          <button onClick={() => toggleSave(detailAmenity)}
            className={clsx('w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors border',
              savedIds.has(detailAmenity.id) ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100')}>
            {savingId === detailAmenity.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Heart className={clsx('w-3.5 h-3.5', savedIds.has(detailAmenity.id) && 'fill-red-400')} />}
            {savedIds.has(detailAmenity.id) ? 'Saved' : 'Save Place'}
          </button>
        </div>
      )}
    </div>
  );
 
  const ItineraryPanelEl = (
    <div className="flex flex-col h-full">
      <ItineraryPanel stops={itineraryStops}
        onRemoveStop={id => setItineraryStops(p => p.filter(s => s.amenityId !== id))}
        onClearAll={() => setItineraryStops([])}
        onClose={backToList}
        allAmenities={amenities} />
      {user && itineraryStops.length > 0 && (
        <div className="px-4 pb-3 shrink-0 border-t border-zinc-100 pt-3">
          <SaveItineraryButton onSave={saveItinerary} saving={itinerarySaving} saved={itinerarySaved} />
        </div>
      )}
      {!user && itineraryStops.length > 0 && (
        <div className="px-4 pb-3 shrink-0">
          <p className="text-center text-xs text-zinc-400"><a href="/login" className="text-blue-600 hover:underline">Sign in</a> to save your itinerary</p>
        </div>
      )}
    </div>
  );
 
  const SidebarInner = (
    <>
      {isListMode && ListPanel}
      {sidebarMode === 'detail' && DetailPanel}
      {sidebarMode === 'nearby_detail' && detailNearby && (
        <NearbyDrawer place={detailNearby} onClose={backToList} onAddToItinerary={addToItinerary} itineraryStops={itineraryStops} />
      )}
      {sidebarMode === 'itinerary' && ItineraryPanelEl}
    </>
  );
 
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] overflow-hidden bg-zinc-50 relative">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-80 shrink-0 flex-col bg-white border-r border-zinc-100 shadow-sm z-10">
        {SidebarInner}
      </div>
 
      {/* Map + filter chips */}
      <div className="flex-1 relative flex flex-col">
        {/* Filter chips — sticky bar above the map, not overlapping */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-zinc-100 shadow-sm z-20 shrink-0">
          <FilterChips activeCategories={activeCategories} onChange={cats => setActiveCategories(new Set(cats))} counts={categoryCounts} />
        </div>
        <div className="flex-1 relative">
          <MapComponent
            amenities={filtered}
            center={mapCenter}
            selectedId={selectedId}
            onSelect={handleSelect}
            onOpenDrawer={handleOpenDrawer}
            onAddToItinerary={addToItinerary}
            onOpenNearbyDrawer={handleOpenNearbyDrawer}
            onToggleSave={user ? toggleSave : undefined}
            savedIds={savedIds}
          />
        </div>
      </div>
 
      {/* Mobile: Layers button sits above the bottom sheet so it's never blocked */}
      <div
        className="md:hidden absolute z-40 right-3 pointer-events-auto"
        style={{ bottom: sheetH + 8 }}
      >
        <button
          onClick={() => {
            // Signal MapComponent to toggle legend — use a custom event
            window.dispatchEvent(new CustomEvent('toggleMapLegend'));
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/96 backdrop-blur-sm rounded-xl border border-zinc-100 shadow-md text-xs font-semibold text-zinc-700"
        >
          <span>🗺️</span> Layers
        </button>
      </div>
 
      {/* Mobile bottom sheet — 3 snap points: collapsed / half / full, draggable */}
      <div
        className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl border-t border-zinc-100 flex flex-col"
        style={{ height: sheetH, transition: sheetDragY.current !== null ? 'none' : 'height 0.3s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* Drag handle bar — touch here to drag or tap to cycle snaps */}
        <div
          className="shrink-0 flex flex-col items-center pt-2 cursor-grab active:cursor-grabbing select-none"
          onPointerDown={e => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            sheetDragY.current = e.clientY;
            sheetStartH.current = sheetH;
          }}
          onPointerMove={e => {
            if (sheetDragY.current === null) return;
            const delta = sheetDragY.current - e.clientY;
            const next = Math.max(SHEET_COLLAPSED, Math.min(window.innerHeight * 0.92, sheetStartH.current + delta));
            setSheetH(next);
          }}
          onPointerUp={e => {
            if (sheetDragY.current === null) return;
            sheetDragY.current = null;
            const vh = window.innerHeight;
            const half = vh * SHEET_HALF;
            const full = vh * SHEET_FULL;
            // Snap to nearest point
            const dCollapsed = Math.abs(sheetH - SHEET_COLLAPSED);
            const dHalf      = Math.abs(sheetH - half);
            const dFull      = Math.abs(sheetH - full);
            if (dCollapsed <= dHalf && dCollapsed <= dFull) snapSheet('collapsed');
            else if (dHalf <= dFull)                        snapSheet('half');
            else                                            snapSheet('full');
          }}
        >
          <div className="w-10 h-1 bg-zinc-200 rounded-full mb-2" />
          <div className="flex items-center w-full px-4 pb-2">
            {!isListMode && (
              <button onClick={backToList} className="mr-2 text-xs text-zinc-400 flex items-center gap-0.5">
                <ChevronDown className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <span className="text-sm font-semibold text-zinc-800 flex-1 truncate">{sidebarTitle()}</span>
            {/* Cycle through snaps on tap */}
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => snapSheet(sheetSnap === 'collapsed' ? 'half' : sheetSnap === 'half' ? 'full' : 'collapsed')}
              className="p-1 text-zinc-400 rounded-md"
            >
              {sheetSnap === 'full'
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
 
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {SidebarInner}
        </div>
      </div>
    </div>
  );
}
 
export default function MapPage() {
  return (
    <Suspense>
      <MapPageContent />
    </Suspense>
  );
}
 
// ── Filter chips (floating above map) ────────────────────────
function FilterChips({ activeCategories, onChange, counts }: {
  activeCategories: Set<AmenityCategory>;
  onChange: (cats: Set<AmenityCategory>) => void;
  counts: Record<AmenityCategory, number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const available = (ALL_CATEGORIES ?? []).filter(c => counts[c] > 0);
  const allOn = available.every(c => activeCategories.has(c));
  const MOBILE_LIMIT = 4;
  const visibleCats = expanded ? available : available.slice(0, MOBILE_LIMIT);
  const hiddenCount = available.length - MOBILE_LIMIT;
 
  const toggle = (cat: AmenityCategory) => {
    const next = new Set(activeCategories);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    onChange(next);
  };
 
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide">
      {/* All toggle */}
      <button onClick={() => onChange(allOn ? new Set<AmenityCategory>() : new Set(available))}
        className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0',
          allOn ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400')}>
        All
      </button>
 
      {/* Desktop: show all chips */}
      <div className="hidden md:flex items-center gap-1.5 flex-wrap">
        {available.map(cat => {
          const on  = activeCategories.has(cat);
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <button key={cat} onClick={() => toggle(cat)}
              className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap',
                on ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400')}>
              {cfg.label}
              <span className={clsx('ml-1 text-[10px]', on ? 'opacity-60' : 'text-zinc-400')}>{counts[cat]}</span>
            </button>
          );
        })}
      </div>
 
      {/* Mobile: scrollable, no expand button needed since row scrolls */}
      <div className="md:hidden flex items-center gap-1.5">
        {available.map(cat => {
          const on  = activeCategories.has(cat);
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <button key={cat} onClick={() => toggle(cat)}
              className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0',
                on ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-zinc-50 text-zinc-600 border-zinc-200')}>
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
 
// ── Save Itinerary Button ─────────────────────────────────────
function SaveItineraryButton({ onSave, saving, saved }: { onSave: (name: string) => Promise<void>; saving: boolean; saved: boolean; }) {
  const [naming, setNaming] = useState(false);
  const [name,   setName]   = useState('');
 
  if (saved) return (
    <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-600 font-medium">
      <BookmarkCheck className="w-4 h-4" /> Itinerary saved!
    </div>
  );
  if (naming) return (
    <div className="flex gap-2">
      <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onSave(name.trim()); setNaming(false); setName(''); } }}
        placeholder="Name this itinerary…"
        className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
      <button onClick={() => { if (name.trim()) { onSave(name.trim()); setNaming(false); setName(''); } }}
        disabled={!name.trim() || saving}
        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
      </button>
      <button onClick={() => { setNaming(false); setName(''); }} className="px-3 py-2 text-zinc-400 hover:text-zinc-600 rounded-lg">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
  return (
    <button onClick={() => setNaming(true)}
      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100 transition-colors">
      <Save className="w-3.5 h-3.5" /> Save Itinerary to Account
    </button>
  );
}