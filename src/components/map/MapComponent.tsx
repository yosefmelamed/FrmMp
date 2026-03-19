'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import type { Amenity, AmenityCategory, NearbyPlace } from '@/types';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';

// ─── Map styles ───────────────────────────────────────────────────────────────
const MAP_STYLES: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#f8f8f6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8f8f6' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#737373' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f5f5f3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ede8e0' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e0d8cf' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8dde8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

// ─── Nearby POI types ─────────────────────────────────────────────────────────
const NEARBY_TYPES = {
  hotel:      { label: 'Hotels',      emoji: '🏨', color: '#0891b2', googleType: 'lodging' },
  attraction: { label: 'Attractions', emoji: '🎭', color: '#7c3aed', googleType: 'tourist_attraction' },
  shopping:   { label: 'Shopping',    emoji: '🛍️', color: '#be185d', googleType: 'shopping_mall' },
} as const;
type NearbyType = keyof typeof NEARBY_TYPES;

// ─── Eruv boundaries ──────────────────────────────────────────────────────────
const ERUV_BOUNDARIES: Record<string, { label: string; color: string; coords: { lat: number; lng: number }[] }> = {
  west: {
    label: 'West Denver Eruv',
    color: '#7c3aed',
    coords: [
      { lat: 39.7440, lng: -105.0532 },
      { lat: 39.7439, lng: -105.0395 },
      { lat: 39.7349, lng: -105.0394 },
      { lat: 39.7356, lng: -105.0520 },
    ],
  },
  east: {
    label: 'East Denver Eruv',
    color: '#0369a1',
    // Loaded dynamically from /east-eruv.geojson (denvereruv.org — Updated Checkers Map)
    coords: [],
  },
  southeast: {
    label: 'SE Denver Eruv',
    color: '#047857',
    // Loaded dynamically from /se-eruv.geojson
    coords: [],
  },
};
type EruvKey = 'west' | 'east' | 'southeast';

// ─── Community area overlays ──────────────────────────────────────────────────
const COMMUNITY_AREAS = {
  downtown_denver: {
    label: 'Downtown Denver', sublabel: 'Bais Menachem', color: '#b45309',
    center: { lat: 39.7280, lng: -104.9490 },
    coords: [
      { lat: 39.7580, lng: -105.0150 }, { lat: 39.7580, lng: -104.9200 },
      { lat: 39.7050, lng: -104.9200 }, { lat: 39.7050, lng: -104.9800 },
      { lat: 39.7200, lng: -105.0100 }, { lat: 39.7580, lng: -105.0150 },
    ],
  },
  south_metro: {
    label: 'South Metro', sublabel: 'Chabad Jewish Center', color: '#0e7490',
    center: { lat: 39.5500, lng: -104.8900 },
    coords: [
      { lat: 39.6400, lng: -105.0000 }, { lat: 39.6400, lng: -104.7800 },
      { lat: 39.4800, lng: -104.7800 }, { lat: 39.4800, lng: -105.0000 },
    ],
  },
  boulder: {
    label: 'Boulder', sublabel: 'Boulder County Center for Judaism', color: '#15803d',
    center: { lat: 40.0150, lng: -105.2705 },
    coords: [
      { lat: 40.0750, lng: -105.3800 }, { lat: 40.0750, lng: -105.1500 },
      { lat: 39.9500, lng: -105.1500 }, { lat: 39.9500, lng: -105.3800 },
    ],
  },
  longmont: {
    label: 'Longmont', sublabel: 'Chabad of Longmont', color: '#6d28d9',
    center: { lat: 40.1672, lng: -105.1019 },
    coords: [
      { lat: 40.2400, lng: -105.2000 }, { lat: 40.2400, lng: -105.0000 },
      { lat: 40.0900, lng: -105.0000 }, { lat: 40.0900, lng: -105.2000 },
    ],
  },
  colorado_springs: {
    label: 'Colorado Springs', sublabel: 'Chabad of Southern Colorado', color: '#be185d',
    center: { lat: 38.8850, lng: -104.8214 },
    coords: [
      { lat: 39.0500, lng: -104.9500 }, { lat: 39.0500, lng: -104.6500 },
      { lat: 38.7000, lng: -104.6500 }, { lat: 38.7000, lng: -104.9500 },
    ],
  },
  englewood: {
    label: 'Englewood / SE', sublabel: 'Chabad of SE Denver', color: '#9a3412',
    center: { lat: 39.6485, lng: -104.9878 },
    coords: [
      { lat: 39.7050, lng: -105.0200 }, { lat: 39.7050, lng: -104.9200 },
      { lat: 39.6000, lng: -104.9200 }, { lat: 39.6000, lng: -105.0200 },
    ],
  },
} as const;
type CommunityKey = keyof typeof COMMUNITY_AREAS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBounds(coords: readonly { lat: number; lng: number }[]) {
  const lats = coords.map(c => c.lat);
  const lngs = coords.map(c => c.lng);
  return { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) };
}

const MARKER_COLORS: Record<AmenityCategory, string> = {
  synagogue: '#2563eb', kosher_restaurant: '#059669', kosher_grocery: '#16a34a',
  jewish_school: '#7c3aed', mikveh: '#0284c7', jewish_center: '#d97706',
  cemetery: '#71717a', bakery: '#ea580c', butcher: '#dc2626',
};

function buildMarkerSvg(category: AmenityCategory, selected: boolean): string {
  const fill = MARKER_COLORS[category] || '#2563eb';
  const cfg = CATEGORY_CONFIG[category];
  const size = selected ? 42 : 34, r = size / 2 - 1.5, sw = selected ? 2.5 : 2, fs = selected ? 16 : 13;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+9}" viewBox="0 0 ${size} ${size+9}">
  <defs><filter id="s" x="-30%" y="-20%" width="160%" height="160%">
    <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="${fill}" flood-opacity="0.35"/>
  </filter></defs>
  <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="white" filter="url(#s)" stroke="${fill}" stroke-width="${sw}"/>
  <text x="${size/2}" y="${size/2+fs*0.38}" text-anchor="middle" font-size="${fs}">${cfg.emoji}</text>
  <path d="M${size/2-4},${size-1} L${size/2+4},${size-1} L${size/2},${size+8}Z" fill="${fill}"/>
</svg>`.trim()
  );
}

function buildNearbyMarkerSvg(type: NearbyType): string {
  const cfg = NEARBY_TYPES[type];
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="41" viewBox="0 0 32 41">
  <defs><filter id="ds"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.2"/></filter></defs>
  <circle cx="16" cy="16" r="13" fill="white" filter="url(#ds)" stroke="${cfg.color}" stroke-width="2"/>
  <text x="16" y="21" text-anchor="middle" font-size="13">${cfg.emoji}</text>
  <path d="M12,29 L20,29 L16,38Z" fill="${cfg.color}"/>
</svg>`.trim()
  );
}

// ─── Component interface ──────────────────────────────────────────────────────
interface MapProps {
  amenities: Amenity[];
  center: { lat: number; lng: number };
  selectedId?: string | null;
  onSelect: (amenity: Amenity | null) => void;
  onOpenDrawer: (amenity: Amenity) => void;
  onAddToItinerary?: (amenity: Amenity) => void;
  onOpenNearbyDrawer?: (place: NearbyPlace) => void;
}

export default function MapComponent({
  amenities = [], center, selectedId, onSelect, onOpenDrawer, onAddToItinerary, onOpenNearbyDrawer,
}: MapProps) {
  const mapRef             = useRef<HTMLDivElement>(null);
  const mapInstance        = useRef<any>(null);
  const markersRef         = useRef<Map<string, any>>(new Map());
  const nearbyMarkersRef   = useRef<Map<string, any>>(new Map());
  const infoWindowRef      = useRef<any>(null);
  const eruvPolygonsRef    = useRef<Map<EruvKey, any>>(new Map());
  const eruvPolylinesRef   = useRef<Map<EruvKey, any>>(new Map());
  const communityPolysRef  = useRef<Map<CommunityKey, any>>(new Map());
  const idleListenerRef         = useRef<any>(null);
  const refetchTimerRef         = useRef<any>(null);
  const activeNearbyTypesRef    = useRef<Set<NearbyType>>(new Set());
  const fetchAllActiveNearbyRef = useRef<((t: NearbyType[]) => Promise<void>) | null>(null);

  const [mapLoaded,          setMapLoaded]          = useState(false);
  const [error,              setError]              = useState<string | null>(null);
  const [visibleEruvs,       setVisibleEruvs]       = useState<Set<EruvKey>>(new Set(['west','east','southeast'] as EruvKey[]));
  const [focusedEruv,        setFocusedEruv]        = useState<EruvKey | null>(null);
  const [showCommunities,    setShowCommunities]    = useState(true);
  const [focusedCommunity,   setFocusedCommunity]   = useState<CommunityKey | null>(null);
  const [legendTab,          setLegendTab]          = useState<'eruv'|'community'|'nearby'>('eruv');
  const [legendOpen,         setLegendOpen]         = useState(false);
  const [nearbyPlaces,       setNearbyPlaces]       = useState<NearbyPlace[]>([]);
  const [activeNearbyTypes,  setActiveNearbyTypes]  = useState<Set<NearbyType>>(new Set());
  const [loadingNearby,      setLoadingNearby]      = useState<Set<NearbyType>>(new Set());

  // ── fitBounds helper ─────────────────────────────────────────────────────
  const fitToBounds = useCallback((coords: readonly { lat: number; lng: number }[], padding = 60) => {
    if (!mapInstance.current) return;
    const gm = (window as any).google.maps;
    const b = getBounds(coords);
    mapInstance.current.fitBounds(
      new gm.LatLngBounds(new gm.LatLng(b.south, b.west), new gm.LatLng(b.north, b.east)),
      padding
    );
  }, []);

  const fitToEruv      = useCallback((k: EruvKey)      => fitToBounds(ERUV_BOUNDARIES[k].coords),      [fitToBounds]);
  const fitToCommunity = useCallback((k: CommunityKey) => fitToBounds(COMMUNITY_AREAS[k].coords, 80), [fitToBounds]);

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) { setError('no-key'); return; }
    if (typeof window === 'undefined') return;
    (async () => {
      try {
        if (!(window as any).google?.maps) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement('script');
            s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly`;
            s.async = true; s.defer = true; s.onload = () => res(); s.onerror = () => rej();
            document.head.appendChild(s);
          });
        }
        if (!mapRef.current) return;
        const gm = (window as any).google.maps;
        mapInstance.current = new gm.Map(mapRef.current, {
          center, zoom: 11, styles: MAP_STYLES,
          mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
          zoomControlOptions: { position: gm.ControlPosition.RIGHT_BOTTOM },
          gestureHandling: 'greedy',
        });
        infoWindowRef.current = new gm.InfoWindow({ disableAutoPan: false });
        setMapLoaded(true);
        // Load east eruv boundary from GeoJSON FeatureCollection.
        // The file has multiple LineString features (one per boundary segment).
        // We draw each segment as its own dashed Polyline — exactly matching the original map.
        // A transparent Polygon covering all points is used for the fill + click area.
        fetch('/east-eruv.geojson')
          .then(r => r.json())
          .then(data => {
            if (!mapInstance.current) return;
            const g = (window as any).google.maps;
            const eruv = ERUV_BOUNDARIES.east;
            const isVisible = visibleEruvs.has('east');
            const handler = () => { setFocusedEruv('east'); setLegendTab('eruv'); setLegendOpen(true); };

            const features: any[] = data?.features ?? [];
            const lineFeatures = features.filter((f: any) => f.geometry?.type === 'LineString');

            // Collect all coords across all segments for the fill polygon + fitBounds
            const allCoords: { lat: number; lng: number }[] = [];
            const polylines: any[] = [];

            lineFeatures.forEach((f: any) => {
              const segCoords = f.geometry.coordinates.map(([lng, lat]: number[]) => ({ lat, lng }));
              allCoords.push(...segCoords);

              // One dashed polyline per segment
              const pl = new g.Polyline({
                path: segCoords,
                map: mapInstance.current,
                visible: isVisible,
                strokeOpacity: 0,
                strokeWeight: 0,
                clickable: true,
                zIndex: 3,
                icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeWeight: 3, scale: 4, strokeColor: eruv.color }, offset: '0', repeat: '18px' }],
              });
              pl.addListener('click', handler);
              polylines.push(pl);
            });

            // Populate coords for fitToEruv / legend
            ERUV_BOUNDARIES.east.coords = allCoords;

            // Transparent fill polygon (convex hull approximation = just all coords)
            const fillPoly = new g.Polygon({
              paths: allCoords,
              map: mapInstance.current,
              visible: isVisible,
              strokeOpacity: 0, strokeWeight: 0,
              fillColor: eruv.color, fillOpacity: 0.05,
              clickable: true, zIndex: 2,
            });
            fillPoly.addListener('click', handler);

            // Store fill poly under 'east' for visibility toggling
            eruvPolygonsRef.current.set('east', fillPoly);
            // Store all polylines — we extend the ref with indexed keys
            polylines.forEach((pl, i) => {
              eruvPolylinesRef.current.set(`east_${i}` as any, pl);
            });
          })
          .catch(e => console.warn('[Eruv] east-eruv.geojson failed to load:', e));

        // Load SE eruv boundary from GeoJSON — same pattern as east
        fetch('/se-eruv.geojson')
          .then(r => r.json())
          .then(data => {
            if (!mapInstance.current) return;
            const g = (window as any).google.maps;
            const eruv = ERUV_BOUNDARIES.southeast;
            const isVisible = visibleEruvs.has('southeast');
            const handler = () => { setFocusedEruv('southeast'); setLegendTab('eruv'); setLegendOpen(true); };

            const features: any[] = data?.features ?? [];
            const lineFeatures = features.filter((f: any) => f.geometry?.type === 'LineString');
            const allCoords: { lat: number; lng: number }[] = [];

            lineFeatures.forEach((f: any) => {
              const segCoords = f.geometry.coordinates.map(([lng, lat]: number[]) => ({ lat, lng }));
              allCoords.push(...segCoords);

              const pl = new g.Polyline({
                path: segCoords,
                map: mapInstance.current,
                visible: isVisible,
                strokeOpacity: 0, strokeWeight: 0,
                clickable: true, zIndex: 3,
                icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeWeight: 3, scale: 4, strokeColor: eruv.color }, offset: '0', repeat: '18px' }],
              });
              pl.addListener('click', handler);
              eruvPolylinesRef.current.set(('southeast_' + allCoords.length) as any, pl);
            });

            ERUV_BOUNDARIES.southeast.coords = allCoords;

            const fillPoly = new g.Polygon({
              paths: allCoords, map: mapInstance.current,
              visible: isVisible,
              strokeOpacity: 0, strokeWeight: 0,
              fillColor: eruv.color, fillOpacity: 0.05,
              clickable: true, zIndex: 2,
            });
            fillPoly.addListener('click', handler);
            eruvPolygonsRef.current.set('southeast', fillPoly);
          })
          .catch(e => console.warn('[Eruv] se-eruv.geojson failed to load:', e));
      } catch { setError('load-error'); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draw eruv polygons ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const gm = (window as any).google.maps;
    (Object.keys(ERUV_BOUNDARIES) as EruvKey[]).forEach(key => {
      if (key === 'east' || key === 'southeast') return; // drawn after GeoJSON fetch
      if (eruvPolygonsRef.current.has(key)) return;
      const eruv = ERUV_BOUNDARIES[key];
      const poly = new gm.Polygon({
        paths: Array.from(eruv.coords),
        map: mapInstance.current,
        visible: visibleEruvs.has(key),
        strokeOpacity: 0,
        strokeWeight: 0,
        fillColor: eruv.color,
        fillOpacity: 0.05,   // very subtle fill — the dashed border is the main visual
        clickable: true,
        zIndex: 2,
      });
      const line = new gm.Polyline({
        path: Array.from(eruv.coords).concat([eruv.coords[0]]),
        map: mapInstance.current,
        visible: visibleEruvs.has(key),
        strokeOpacity: 0,
        strokeWeight: 0,
        clickable: true,
        zIndex: 3,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            strokeWeight: 3,
            scale: 4,
            strokeColor: eruv.color,
          },
          offset: '0',
          repeat: '18px',   // wider spacing = cleaner, less busy dash
        }],
      });
      const handler = () => { setFocusedEruv(key); fitToEruv(key); setLegendTab('eruv'); setLegendOpen(true); };
      poly.addListener('click', handler); line.addListener('click', handler);
      eruvPolygonsRef.current.set(key, poly); eruvPolylinesRef.current.set(key, line);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // ── Draw community polygons ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const gm = (window as any).google.maps;
    (Object.keys(COMMUNITY_AREAS) as CommunityKey[]).forEach(key => {
      if (communityPolysRef.current.has(key)) return;
      const area = COMMUNITY_AREAS[key];
      const poly = new gm.Polygon({
        paths: area.coords, map: mapInstance.current, visible: showCommunities,
        strokeColor: area.color, strokeOpacity: 0.45, strokeWeight: 1.5,
        fillColor: area.color, fillOpacity: 0.06, clickable: true, zIndex: 1,
      });
      poly.addListener('click', () => {
        setFocusedCommunity(key); setShowCommunities(true);
        fitToCommunity(key); setLegendTab('community'); setLegendOpen(true);
      });
      communityPolysRef.current.set(key, poly);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // ── Sync eruv visibility ──────────────────────────────────────────────────
  useEffect(() => {
    eruvPolygonsRef.current.forEach((p, k) => p.setVisible(visibleEruvs.has(k)));
    eruvPolylinesRef.current.forEach((p, k) => p.setVisible(visibleEruvs.has(k)));
  }, [visibleEruvs]);

  // ── Sync community visibility + focus style ───────────────────────────────
  useEffect(() => {
    communityPolysRef.current.forEach(p => p.setVisible(showCommunities));
  }, [showCommunities]);

  useEffect(() => {
    communityPolysRef.current.forEach((poly, key) => {
      const f = key === focusedCommunity;
      poly.setOptions({ strokeOpacity: f ? 0.9 : 0.45, strokeWeight: f ? 2.5 : 1.5, fillOpacity: f ? 0.14 : 0.06 });
    });
  }, [focusedCommunity]);


  // Fetch nearby places for ALL active types using current map viewport bounds
  const fetchAllActiveNearby = useCallback(async (typesToFetch: NearbyType[]) => {
    if (!mapInstance.current || typesToFetch.length === 0) return;
    const gm = (window as any).google.maps;
    const { Place } = await gm.importLibrary('places');

    // Use the actual visible map bounds as the search rectangle
    const bounds = mapInstance.current.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const mapCenter = mapInstance.current.getCenter();

    // Compute radius from viewport — haversine distance from center to NE corner
    // Places API (New) caps radius at 50,000m; we also cap at 25km to avoid huge searches
    const R = 6371000;
    const dLat = (ne.lat() - sw.lat()) * Math.PI / 180;
    const dLng = (ne.lng() - sw.lng()) * Math.PI / 180;
    const diagMeters = R * Math.sqrt(Math.pow(dLat, 2) + Math.pow(dLng * Math.cos(mapCenter.lat() * Math.PI / 180), 2));
    const radius = Math.min(Math.round(diagMeters / 2), 25000);

    // Clear existing markers for these types so stale out-of-viewport pins are removed
    nearbyMarkersRef.current.forEach((marker, id) => {
      const existingType = (marker as any).__nearbyType as NearbyType | undefined;
      if (existingType && typesToFetch.includes(existingType)) {
        marker.setMap(null);
        nearbyMarkersRef.current.delete(id);
      }
    });

    await Promise.all(typesToFetch.map(async (type) => {
      setLoadingNearby(prev => new Set(Array.from(prev).concat(type) as NearbyType[]));
      try {
        const request = {
          fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating',
                   'userRatingCount', 'priceLevel', 'regularOpeningHours', 'photos'],
          locationRestriction: new gm.Circle({
            center: mapCenter,
            radius,
          }),
          includedTypes: [NEARBY_TYPES[type].googleType],
          maxResultCount: 20,
        };

        const { places: results } = await Place.searchNearby(request);
        const mapped: NearbyPlace[] = (results || []).map((p: any) => ({
          id: p.id,
          name: p.displayName || '',
          category: type,
          address: p.formattedAddress || '',
          lat: p.location.lat(),
          lng: p.location.lng(),
          rating: p.rating,
          reviewCount: p.userRatingCount,
          priceLevel: p.priceLevel,
          isOpen: p.regularOpeningHours?.isOpen?.(),
          photoUrl: p.photos?.[0]?.getURI?.({ maxWidth: 400 }),
        }));

        setNearbyPlaces(prev => [...prev.filter(x => x.category !== type), ...mapped]);
      } catch (err) {
        console.error('[Nearby] error fetching', type, err);
      } finally {
        setLoadingNearby(prev => { const n = new Set(prev); n.delete(type); return n; });
      }
    }));
  }, []);

  // Keep refs in sync so idle listener always has latest values
  // Must be AFTER fetchAllActiveNearby is defined to avoid "before initialization" error
  useEffect(() => { activeNearbyTypesRef.current = activeNearbyTypes; }, [activeNearbyTypes]);
  useEffect(() => { fetchAllActiveNearbyRef.current = fetchAllActiveNearby; }, [fetchAllActiveNearby]);

  // Toggle a nearby type on/off
  const toggleNearbyType = useCallback((type: NearbyType) => {
    const isOn = activeNearbyTypes.has(type);
    if (isOn) {
      // Turn off — remove from active, clear its markers
      setActiveNearbyTypes(prev => { const n = new Set(prev); n.delete(type); return n; });
      nearbyMarkersRef.current.forEach((marker, id) => {
        if ((marker as any).__nearbyType === type) {
          marker.setMap(null);
          nearbyMarkersRef.current.delete(id);
        }
      });
      setNearbyPlaces(prev => prev.filter(p => p.category !== type));
    } else {
      // Turn on — add to active and fetch for current viewport
      setActiveNearbyTypes(prev => new Set(Array.from(prev).concat(type) as NearbyType[]));
      fetchAllActiveNearby([type]);
    }
  }, [activeNearbyTypes, fetchAllActiveNearby]);

  // Re-fetch all active types when map becomes idle after pan/zoom (debounced 600ms)
  // Uses refs so the listener never has a stale closure
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const gm = (window as any).google.maps;

    if (idleListenerRef.current) gm.event.removeListener(idleListenerRef.current);

    idleListenerRef.current = mapInstance.current.addListener('idle', () => {
      const activeTypes = activeNearbyTypesRef.current;
      if (activeTypes.size === 0) return;
      clearTimeout(refetchTimerRef.current);
      refetchTimerRef.current = setTimeout(() => {
        fetchAllActiveNearbyRef.current?.(Array.from(activeTypes) as NearbyType[]);
      }, 600);
    });

    return () => {
      if (idleListenerRef.current) gm.event.removeListener(idleListenerRef.current);
      clearTimeout(refetchTimerRef.current);
    };
  }, [mapLoaded]); // intentionally only depends on mapLoaded — uses refs for the rest


  // ── Sync nearby markers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const gm = (window as any).google.maps;

    // Remove hidden-type markers
    nearbyMarkersRef.current.forEach((marker, id) => {
      const place = nearbyPlaces.find(p => p.id === id);
      if (!place || !activeNearbyTypes.has(place.category as NearbyType)) {
        marker.setMap(null); nearbyMarkersRef.current.delete(id);
      }
    });

    // Add visible-type markers
    nearbyPlaces
      .filter(p => activeNearbyTypes.has(p.category as NearbyType))
      .forEach(place => {
        if (nearbyMarkersRef.current.has(place.id)) return;
        const type = place.category as NearbyType;
        const marker = new gm.Marker({
          position: { lat: place.lat, lng: place.lng },
          map: mapInstance.current,
          title: place.name,
          icon: {
            url: buildNearbyMarkerSvg(type),
            scaledSize: new gm.Size(32, 41),
            anchor: new gm.Point(16, 41),
          },
          zIndex: 5,
        });
        (marker as any).__nearbyType = type; // used for cleanup by type
        marker.addListener('click', () => {
          infoWindowRef.current.setContent(buildNearbyInfoContent(place));
          infoWindowRef.current.open(mapInstance.current, marker);
        });
        nearbyMarkersRef.current.set(place.id, marker);
      });
  }, [nearbyPlaces, activeNearbyTypes, mapLoaded]);

  // ── Info window: community amenity ────────────────────────────────────────
  const buildInfoContent = useCallback((amenity: Amenity) => {
    const cfg = CATEGORY_CONFIG[amenity.category];
    return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:210px;padding:12px 14px;border-radius:12px;">
  <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:9px;">
    <div style="width:32px;height:32px;background:#f0f9ff;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${cfg.emoji}</div>
    <div style="flex:1;min-width:0;">
      <p style="margin:0;font-size:12px;font-weight:600;color:#18181b;line-height:1.3;">${amenity.name}</p>
      <p style="margin:2px 0 0;font-size:10px;color:#a1a1aa;">${cfg.label}</p>
    </div>
  </div>
  ${amenity.rating ? `<div style="margin-bottom:7px;font-size:10px;color:#d97706;">★ ${amenity.rating} <span style="color:#d4d4d8;">(${amenity.reviewCount ?? 0})</span></div>` : ''}
  <div style="font-size:10px;color:#71717a;margin-bottom:9px;line-height:1.5;">${amenity.address}</div>
  <div style="display:flex;gap:5px;">
    <button onclick="window.__mapOpenDrawer && window.__mapOpenDrawer('${amenity.id}')"
      style="flex:1;padding:6px 0;background:#2563eb;color:white;border:none;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer;">View Details</button>
    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(amenity.address)}" target="_blank"
      style="display:flex;align-items:center;justify-content:center;width:28px;height:26px;background:#f4f4f5;border-radius:7px;font-size:13px;text-decoration:none;">🗺️</a>
  </div>
</div>`;
  }, []);

  // ── Info window: nearby place ─────────────────────────────────────────────
  const buildNearbyInfoContent = useCallback((place: NearbyPlace) => {
    const cfg = NEARBY_TYPES[place.category as NearbyType];
    const stars = place.rating ? '★'.repeat(Math.round(place.rating)) + '☆'.repeat(5 - Math.round(place.rating)) : '';
    return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:220px;padding:0;border-radius:12px;overflow:hidden;">
  ${place.photoUrl ? `<img src="${place.photoUrl}" style="width:100%;height:90px;object-fit:cover;display:block;" />` : ''}
  <div style="padding:12px 14px;">
    <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:9px;">
      <div style="width:32px;height:32px;background:#f9fafb;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${cfg.emoji}</div>
      <div>
        <p style="margin:0;font-size:12px;font-weight:600;color:#18181b;line-height:1.3;">${place.name}</p>
        <p style="margin:2px 0 0;font-size:10px;color:#a1a1aa;">${cfg.label}</p>
      </div>
    </div>
    ${place.rating ? `<div style="font-size:10px;color:#d97706;margin-bottom:6px;">${stars} ${place.rating}${place.reviewCount ? ` <span style="color:#d4d4d8;">(${place.reviewCount})</span>` : ''}${place.priceLevel ? ' · ' + '$'.repeat(place.priceLevel) : ''}</div>` : ''}
    ${place.isOpen !== undefined ? `<div style="font-size:10px;margin-bottom:6px;font-weight:500;color:${place.isOpen ? '#16a34a' : '#dc2626'};">${place.isOpen ? '● Open now' : '● Closed'}</div>` : ''}
    <div style="font-size:10px;color:#71717a;margin-bottom:10px;line-height:1.5;">${place.address}</div>
    <div style="display:flex;gap:5px;margin-bottom:5px;">
      <button onclick="window.__openNearbyDrawer && window.__openNearbyDrawer('${place.id}')"
        style="flex:1;padding:6px 0;background:#2563eb;color:white;border:none;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer;">View Details</button>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}" target="_blank"
        style="display:flex;align-items:center;justify-content:center;width:28px;height:26px;background:#f4f4f5;border-radius:7px;font-size:13px;text-decoration:none;">🗺️</a>
    </div>
    <button onclick="window.__addNearbyToItinerary && window.__addNearbyToItinerary('${place.id}')"
      style="width:100%;padding:5px 0;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer;">+ Add to Itinerary</button>
  </div>
</div>`;
  }, []);

  // ── Global callbacks ──────────────────────────────────────────────────────
  useEffect(() => {
    (window as any).__mapOpenDrawer = (id: string) => {
      const a = (amenities ?? []).find(x => x.id === id);
      if (a) { onOpenDrawer(a); infoWindowRef.current?.close(); }
    };
    return () => { delete (window as any).__mapOpenDrawer; };
  }, [amenities, onOpenDrawer]);

  useEffect(() => {
    (window as any).__addNearbyToItinerary = (placeId: string) => {
      const place = nearbyPlaces.find(p => p.id === placeId);
      if (!place || !onAddToItinerary) return;
      const cfg = NEARBY_TYPES[place.category as NearbyType];
      const asAmenity: Amenity = {
        id: place.id,
        name: place.name,
        category: 'jewish_center',
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        rating: place.rating,
        reviewCount: place.reviewCount,
        description: `${cfg.label}${place.priceLevel ? ' · ' + '$'.repeat(place.priceLevel) : ''}`,
        tags: [cfg.label],
      };
      onAddToItinerary(asAmenity);
      infoWindowRef.current?.close();
    };
    return () => { delete (window as any).__addNearbyToItinerary; };
  }, [nearbyPlaces, onAddToItinerary]);

  useEffect(() => {
    (window as any).__openNearbyDrawer = (placeId: string) => {
      const place = nearbyPlaces.find(p => p.id === placeId);
      if (place) { onOpenNearbyDrawer?.(place); infoWindowRef.current?.close(); }
    };
    return () => { delete (window as any).__openNearbyDrawer; };
  }, [nearbyPlaces, onOpenNearbyDrawer]);

  // ── Sync community amenity markers ────────────────────────────────────────
  useEffect(() => {
    if (!amenities || !Array.isArray(amenities) || amenities.length === 0) return;
    if (!mapLoaded || !mapInstance.current) return;
    const gm = (window as any).google.maps;
    const ids = new Set(amenities.map(a => a.id));
    markersRef.current.forEach((m, id) => { if (!ids.has(id)) { m.setMap(null); markersRef.current.delete(id); } });
    amenities.forEach(amenity => {
      const isSel = amenity.id === selectedId;
      const ico = { url: buildMarkerSvg(amenity.category, isSel), scaledSize: new gm.Size(isSel?42:34, isSel?51:43), anchor: new gm.Point(isSel?21:17, isSel?51:43) };
      const ex = markersRef.current.get(amenity.id);
      if (ex) { ex.setIcon(ico); return; }
      const m = new gm.Marker({ position: { lat: amenity.lat, lng: amenity.lng }, map: mapInstance.current, title: amenity.name, icon: ico, animation: gm.Animation.DROP, zIndex: 10 });
      m.addListener('click', () => { infoWindowRef.current.setContent(buildInfoContent(amenity)); infoWindowRef.current.open(mapInstance.current, m); onSelect(amenity); });
      markersRef.current.set(amenity.id, m);
    });
  }, [amenities, mapLoaded, selectedId, onSelect, buildInfoContent]);

  useEffect(() => {
    if (!mapLoaded || !selectedId || !mapInstance.current) return;
    const a = (amenities ?? []).find(x => x.id === selectedId);
    if (a) { mapInstance.current.panTo({ lat: a.lat, lng: a.lng }); mapInstance.current.setZoom(15); }
  }, [selectedId, mapLoaded, amenities]);

  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const gm = (window as any).google.maps;
    const l = mapInstance.current.addListener('click', () => {
      infoWindowRef.current?.close(); onSelect(null);
      setFocusedEruv(null); setFocusedCommunity(null);
    });
    return () => gm.event.removeListener(l);
  }, [mapLoaded, onSelect]);

  // ── Legend handlers ───────────────────────────────────────────────────────
  const handleEruvLegend = useCallback((key: EruvKey) => {
    const on = visibleEruvs.has(key);
    if (!on) { setVisibleEruvs(prev => new Set(Array.from(prev).concat(key) as EruvKey[])); setTimeout(() => { fitToEruv(key); setFocusedEruv(key); }, 50); }
    else if (focusedEruv === key) { setVisibleEruvs(prev => { const n = new Set(prev); n.delete(key); return n; }); setFocusedEruv(null); }
    else { fitToEruv(key); setFocusedEruv(key); }
  }, [visibleEruvs, focusedEruv, fitToEruv]);

  const handleCommunityLegend = useCallback((key: CommunityKey) => {
    if (!showCommunities) setShowCommunities(true);
    if (focusedCommunity === key) { setFocusedCommunity(null); fitToBounds([{ lat: 38.7, lng: -105.1 }, { lat: 40.3, lng: -104.65 }], 40); }
    else { setFocusedCommunity(key); fitToCommunity(key); }
  }, [showCommunities, focusedCommunity, fitToCommunity, fitToBounds]);

  if (error === 'no-key') return <MapPlaceholder amenities={amenities} onSelect={onSelect} onOpenDrawer={onOpenDrawer} onAddToItinerary={onAddToItinerary} />;
  if (error) return <div className="w-full h-full flex items-center justify-center bg-zinc-50"><p className="text-zinc-400 text-sm">Failed to load Google Maps.</p></div>;

  // ── Legend JSX (shared structure) ─────────────────────────────────────────
  const LegendPanel = () => (
    <div className={`mt-2 sm:mt-0 bg-white/96 backdrop-blur-sm rounded-xl border border-zinc-100 shadow-md overflow-hidden sm:block w-[196px] ${legendOpen ? 'block' : 'hidden sm:block'}`}>
      {/* Tabs */}
      <div className="flex border-b border-zinc-100">
        {(['eruv','community','nearby'] as const).map(t => (
          <button key={t} onClick={() => setLegendTab(t)}
            className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wide transition-colors ${legendTab===t ? 'text-blue-600 border-b-2 border-blue-600 -mb-px bg-blue-50/40' : 'text-zinc-400 hover:text-zinc-600'}`}>
            {t === 'eruv' ? 'Eruv' : t === 'community' ? 'Areas' : 'Nearby'}
          </button>
        ))}
      </div>

      {/* Eruv tab */}
      {legendTab === 'eruv' && (
        <div className="p-2 space-y-0.5">
          {(Object.keys(ERUV_BOUNDARIES) as EruvKey[]).map(key => {
            const eruv = ERUV_BOUNDARIES[key]; const on = visibleEruvs.has(key); const foc = focusedEruv === key;
            return (
              <button key={key} onClick={() => handleEruvLegend(key)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-all ${foc ? 'bg-zinc-50' : 'hover:bg-zinc-50'}`}>
                <div className="flex gap-0.5 shrink-0">{[0,1,2,3].map(i => <div key={i} className="h-0.5 w-2 rounded-full" style={{ backgroundColor: eruv.color, opacity: on ? 1 : 0.2 }}/>)}</div>
                <span className={`text-xs font-medium text-left flex-1 leading-tight ${on ? 'text-zinc-700' : 'text-zinc-300'}`}>{eruv.label}</span>
                <span className="text-[10px] shrink-0" style={{ color: eruv.color }}>{on && !foc && '→'}{on && foc && '✓'}</span>
              </button>
            );
          })}
          <p className="text-[9px] text-zinc-300 px-2 pt-1 pb-0.5">Approx. — verify with authority.</p>
        </div>
      )}

      {/* Community tab */}
      {legendTab === 'community' && (
        <div className="p-2">
          <button onClick={() => { setShowCommunities(v => !v); setFocusedCommunity(null); }}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-zinc-50 mb-1 pb-2 border-b border-zinc-50">
            <div className={`w-3 h-3 rounded-sm border-2 shrink-0 transition-colors ${showCommunities ? 'bg-zinc-700 border-zinc-700' : 'border-zinc-300'}`}/>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Show all areas</span>
          </button>
          <div className="space-y-0.5">
            {(Object.keys(COMMUNITY_AREAS) as CommunityKey[]).map(key => {
              const area = COMMUNITY_AREAS[key]; const foc = focusedCommunity === key;
              return (
                <button key={key} onClick={() => handleCommunityLegend(key)} disabled={!showCommunities}
                  className={`flex items-start gap-2 w-full px-2 py-1.5 rounded-lg text-left transition-all ${foc ? 'bg-zinc-50' : 'hover:bg-zinc-50'} ${!showCommunities ? 'opacity-40' : ''}`}>
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: area.color, opacity: 0.75 }}/>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-tight truncate ${foc ? 'text-zinc-800' : 'text-zinc-600'}`}>{area.label}</p>
                    <p className="text-[10px] text-zinc-400 truncate leading-tight">{area.sublabel}</p>
                  </div>
                  <span className="text-[10px] shrink-0 mt-0.5" style={{ color: area.color }}>{foc ? '✓' : '→'}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-zinc-300 px-2 pt-1.5">Click area or legend to zoom.</p>
        </div>
      )}

      {/* Nearby tab */}
      {legendTab === 'nearby' && (
        <div className="p-2 space-y-0.5">
          {(Object.keys(NEARBY_TYPES) as NearbyType[]).map(type => {
            const cfg = NEARBY_TYPES[type];
            const on = activeNearbyTypes.has(type);
            const loading = loadingNearby.has(type);
            const count = nearbyPlaces.filter(p => p.category === type).length;
            return (
              <button key={type} onClick={() => toggleNearbyType(type)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-all ${on ? 'bg-zinc-50' : 'hover:bg-zinc-50'}`}>
                <span className="text-base shrink-0">{cfg.emoji}</span>
                <span className={`text-xs font-medium flex-1 text-left leading-tight ${on ? 'text-zinc-700' : 'text-zinc-400'}`}>
                  {cfg.label}
                  {on && count > 0 && <span className="ml-1 text-zinc-300 text-[10px]">({count})</span>}
                </span>
                {loading
                  ? <div className="w-3.5 h-3.5 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin shrink-0"/>
                  : <div className={`w-3.5 h-3.5 rounded-sm border-2 shrink-0 transition-all ${on ? 'border-transparent' : 'border-zinc-200'}`}
                      style={on ? { backgroundColor: cfg.color } : {}}/>
                }
              </button>
            );
          })}
          <p className="text-[9px] text-zinc-300 px-2 pt-1 pb-0.5 leading-relaxed">Results within 5km of map center.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {mapLoaded && (
        <div className="absolute top-3 right-3 z-10">
          <button onClick={() => setLegendOpen(v => !v)}
            className="sm:hidden flex items-center gap-2 px-3 py-2 bg-white/96 backdrop-blur-sm rounded-xl border border-zinc-100 shadow-md text-xs font-semibold text-zinc-700">
            <span>🗺️</span> Layers
            <span className={`text-zinc-400 transition-transform duration-200 ${legendOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
          <LegendPanel />
        </div>
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 bg-zinc-50 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
        </div>
      )}
    </div>
  );
}

// ─── No-key placeholder ───────────────────────────────────────────────────────
function MapPlaceholder({ amenities = [], onSelect, onOpenDrawer, onAddToItinerary }: {
  amenities: Amenity[];
  onSelect: (a: Amenity | null) => void;
  onOpenDrawer: (a: Amenity) => void;
  onAddToItinerary?: (a: Amenity) => void;
}) {
  const [hoveredId,         setHoveredId]         = useState<string | null>(null);
  const [focusedEruv,       setFocusedEruv]       = useState<EruvKey | null>(null);
  const [visibleEruvs,      setVisibleEruvs]       = useState<Set<EruvKey>>(new Set(['west','east','southeast'] as EruvKey[]));
  const [showCommunities,   setShowCommunities]   = useState(true);
  const [focusedCommunity,  setFocusedCommunity]  = useState<CommunityKey | null>(null);
  const [legendTab,         setLegendTab]         = useState<'eruv'|'community'|'nearby'>('eruv');
  const [legendOpen,        setLegendOpen]        = useState(false);

  const positions = [[55,55],[38,45],[20,35],[48,28],[62,40],[72,60],[30,68],[50,72],[65,25],[25,58],[42,80],[78,45],[35,20],[60,78],[15,50],[80,30],[45,62],[70,15]];

  const handleEruvLegend = (k: EruvKey) => {
    const on = visibleEruvs.has(k);
    if (!on) { setVisibleEruvs(p => new Set(Array.from(p).concat(k) as EruvKey[])); setFocusedEruv(k); }
    else if (focusedEruv === k) { setVisibleEruvs(p => { const n = new Set(p); n.delete(k); return n; }); setFocusedEruv(null); }
    else setFocusedEruv(k);
  };
  const handleCommunityLegend = (k: CommunityKey) => {
    if (!showCommunities) setShowCommunities(true);
    setFocusedCommunity(p => p === k ? null : k);
  };

  const communityShapes = [
    { key: 'downtown_denver' as CommunityKey, points: '12%,22% 62%,22% 62%,58% 12%,58%',    color: '#b45309' },
    { key: 'south_metro'     as CommunityKey, points: '12%,58% 70%,58% 70%,90% 12%,90%',    color: '#0e7490' },
    { key: 'boulder'         as CommunityKey, points: '62%,15% 88%,15% 88%,42% 62%,42%',    color: '#15803d' },
    { key: 'longmont'        as CommunityKey, points: '62%,2% 88%,2% 88%,15% 62%,15%',      color: '#6d28d9' },
    { key: 'colorado_springs'as CommunityKey, points: '20%,90% 75%,90% 75%,100% 20%,100%',  color: '#be185d' },
    { key: 'englewood'       as CommunityKey, points: '12%,50% 55%,50% 55%,65% 12%,65%',    color: '#9a3412' },
  ];
  const eruvShapes = [
    { key: 'west'      as EruvKey, points: '15%,28% 40%,28% 40%,58% 15%,58%',         color: '#7c3aed' },
    { key: 'east'      as EruvKey, points: '42%,23% 72%,23% 72%,60% 42%,60%',         color: '#0369a1' },
    { key: 'southeast' as EruvKey, points: '50%,58% 75%,58% 75%,80% 50%,80%',         color: '#047857' },
  ];

  return (
    <div className="relative w-full h-full bg-[#f8f8f6] overflow-hidden select-none">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#eeeeea" strokeWidth="0.8"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#fff" strokeWidth="6"/>
        <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#ede8e0" strokeWidth="4"/>
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#fff" strokeWidth="5"/>
        <line x1="60%" y1="0" x2="60%" y2="100%" stroke="#fff" strokeWidth="4"/>
        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#f5f5f3" strokeWidth="2.5"/>
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#f5f5f3" strokeWidth="2.5"/>
        <rect x="55%" y="30%" width="8%" height="12%" rx="3" fill="#e8f0e8"/>
        {showCommunities && communityShapes.map(({ key, points, color }) => (
          <polygon key={key} points={points} fill={color} fillOpacity={focusedCommunity===key?0.15:0.06}
            stroke={color} strokeWidth={focusedCommunity===key?2:1} strokeOpacity={focusedCommunity===key?0.8:0.4}
            style={{ cursor:'pointer' }} onClick={() => handleCommunityLegend(key)}/>
        ))}
        {eruvShapes.map(({ key, points, color }) => !visibleEruvs.has(key) ? null : (
          <polygon key={key} points={points} fill={color} fillOpacity={focusedEruv===key?0.12:0.05}
            stroke={color} strokeWidth={focusedEruv===key?2.5:1.5} strokeDasharray="6,4" strokeOpacity={focusedEruv===key?1:0.65}
            style={{ cursor:'pointer' }} onClick={() => handleEruvLegend(key)}/>
        ))}
      </svg>

      {(amenities ?? []).slice(0, 16).map((amenity, i) => {
        const cfg = CATEGORY_CONFIG[amenity.category]; const pos = positions[i]??[50,50]; const isHov = hoveredId===amenity.id;
        return (
          <div key={amenity.id} className="absolute cursor-pointer" style={{ left:`${pos[0]}%`, top:`${pos[1]}%`, transform:'translate(-50%,-100%)' }}
            onMouseEnter={() => setHoveredId(amenity.id)} onMouseLeave={() => setHoveredId(null)}
            onClick={() => { onSelect(amenity); onOpenDrawer(amenity); }}>
            <div className={`transition-transform duration-150 ${isHov?'scale-125':'scale-100'}`}>
              <div className="w-8 h-8 bg-white rounded-full shadow-md border-2 border-blue-400 flex items-center justify-center text-sm">{cfg.emoji}</div>
              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-blue-400 mx-auto"/>
            </div>
            {isHov && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-zinc-100 px-3 py-2 min-w-48 z-20 pointer-events-none">
                <p className="text-xs font-semibold text-zinc-900">{amenity.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{cfg.label}</p>
                <p className="text-[10px] text-blue-500 mt-1.5 font-medium">Click to view details →</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute top-3 right-3 z-10">
        <button onClick={() => setLegendOpen(v => !v)}
          className="sm:hidden flex items-center gap-2 px-3 py-2 bg-white/96 rounded-xl border border-zinc-100 shadow-md text-xs font-semibold text-zinc-700">
          <span>🗺️</span> Layers <span className={`text-zinc-400 transition-transform ${legendOpen?'rotate-180':''}`}>▾</span>
        </button>
        <div className={`mt-2 sm:mt-0 bg-white/96 rounded-xl border border-zinc-100 shadow-md overflow-hidden sm:block w-[196px] ${legendOpen?'block':'hidden sm:block'}`}>
          <div className="flex border-b border-zinc-100">
            {(['eruv','community','nearby'] as const).map(t => (
              <button key={t} onClick={() => setLegendTab(t)}
                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wide transition-colors ${legendTab===t?'text-blue-600 border-b-2 border-blue-600 -mb-px bg-blue-50/40':'text-zinc-400 hover:text-zinc-600'}`}>
                {t==='eruv'?'Eruv':t==='community'?'Areas':'Nearby'}
              </button>
            ))}
          </div>
          {legendTab==='eruv' && (
            <div className="p-2 space-y-0.5">
              {(Object.keys(ERUV_BOUNDARIES) as EruvKey[]).map(key => {
                const eruv=ERUV_BOUNDARIES[key]; const on=visibleEruvs.has(key); const foc=focusedEruv===key;
                return (
                  <button key={key} onClick={()=>handleEruvLegend(key)} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg ${foc?'bg-zinc-50':'hover:bg-zinc-50'}`}>
                    <div className="flex gap-0.5 shrink-0">{[0,1,2,3].map(i=><div key={i} className="h-0.5 w-2 rounded-full" style={{backgroundColor:eruv.color,opacity:on?1:0.2}}/>)}</div>
                    <span className={`text-xs font-medium text-left flex-1 leading-tight ${on?'text-zinc-700':'text-zinc-300'}`}>{eruv.label}</span>
                    <span className="text-[10px] shrink-0" style={{color:eruv.color}}>{on&&!foc&&'→'}{on&&foc&&'✓'}</span>
                  </button>
                );
              })}
              <p className="text-[9px] text-zinc-300 px-2 pt-1 pb-0.5">Approx. — verify with authority.</p>
            </div>
          )}
          {legendTab==='community' && (
            <div className="p-2">
              <button onClick={()=>{setShowCommunities(v=>!v);setFocusedCommunity(null);}} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-zinc-50 mb-1 pb-2 border-b border-zinc-50">
                <div className={`w-3 h-3 rounded-sm border-2 shrink-0 ${showCommunities?'bg-zinc-700 border-zinc-700':'border-zinc-300'}`}/>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Show all areas</span>
              </button>
              <div className="space-y-0.5">
                {(Object.keys(COMMUNITY_AREAS) as CommunityKey[]).map(key => {
                  const area=COMMUNITY_AREAS[key]; const foc=focusedCommunity===key;
                  return (
                    <button key={key} onClick={()=>handleCommunityLegend(key)} disabled={!showCommunities}
                      className={`flex items-start gap-2 w-full px-2 py-1.5 rounded-lg text-left ${foc?'bg-zinc-50':'hover:bg-zinc-50'} ${!showCommunities?'opacity-40':''}`}>
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5" style={{backgroundColor:area.color,opacity:0.75}}/>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-tight truncate ${foc?'text-zinc-800':'text-zinc-600'}`}>{area.label}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{area.sublabel}</p>
                      </div>
                      <span className="text-[10px] shrink-0 mt-0.5" style={{color:area.color}}>{foc?'✓':'→'}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-zinc-300 px-2 pt-1.5">Click area or legend to zoom.</p>
            </div>
          )}
          {legendTab==='nearby' && (
            <div className="p-2 space-y-0.5">
              {(Object.keys(NEARBY_TYPES) as NearbyType[]).map(type => {
                const cfg=NEARBY_TYPES[type];
                return (
                  <div key={type} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-50">
                    <span className="text-base">{cfg.emoji}</span>
                    <span className="text-xs text-zinc-500 flex-1">{cfg.label}</span>
                    <div className="w-3.5 h-3.5 rounded-sm border-2 border-zinc-200 shrink-0"/>
                  </div>
                );
              })}
              <p className="text-[9px] text-zinc-300 px-2 pt-1 pb-0.5">Enable with a Google Maps API key.</p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm border border-amber-100 text-amber-700 px-4 py-2 rounded-xl shadow-sm text-xs font-medium flex items-center gap-2 whitespace-nowrap">
          ⚠️ Add <code className="bg-amber-50 px-1 rounded font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the live map
        </div>
      </div>
    </div>
  );
}