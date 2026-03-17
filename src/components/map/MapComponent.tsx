'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import type { Amenity, AmenityCategory } from '@/types';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';

// Map styles — typed as any[] to avoid needing @types/google.maps at module scope
const MAP_STYLES: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#f8f8f6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8f8f6' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#737373' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#efefeb' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f0e8' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f5f5f3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ede8e0' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e0d8cf' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8dde8' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e8e8e8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

const MARKER_COLORS: Record<AmenityCategory, string> = {
  synagogue: '#2563eb',
  kosher_restaurant: '#059669',
  kosher_grocery: '#16a34a',
  jewish_school: '#7c3aed',
  mikveh: '#0284c7',
  jewish_center: '#d97706',
  cemetery: '#71717a',
  bakery: '#ea580c',
  butcher: '#dc2626',
};

function buildMarkerSvg(category: AmenityCategory, selected: boolean): string {
  const fill = MARKER_COLORS[category] || '#2563eb';
  const cfg = CATEGORY_CONFIG[category];
  const size = selected ? 42 : 34;
  const r = size / 2 - 1.5;
  const sw = selected ? 2.5 : 2;
  const fs = selected ? 16 : 13;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 9}" viewBox="0 0 ${size} ${size + 9}">
  <defs>
    <filter id="s" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="${fill}" flood-opacity="0.35"/>
    </filter>
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="white" filter="url(#s)" stroke="${fill}" stroke-width="${sw}"/>
  <text x="${size / 2}" y="${size / 2 + fs * 0.38}" text-anchor="middle" font-size="${fs}">${cfg.emoji}</text>
  <path d="M${size / 2 - 4},${size - 1} L${size / 2 + 4},${size - 1} L${size / 2},${size + 8}Z" fill="${fill}"/>
</svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim());
}

interface MapProps {
  amenities: Amenity[];
  center: { lat: number; lng: number };
  selectedId?: string | null;
  onSelect: (amenity: Amenity | null) => void;
  onOpenDrawer: (amenity: Amenity) => void;
}

export default function MapComponent({
  amenities,
  center,
  selectedId,
  onSelect,
  onOpenDrawer,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Use any for Google Maps instances to avoid @types/google.maps at module scope
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) { setError('no-key'); return; }
    if (typeof window === 'undefined') return;

    (async () => {
      try {
        if (!(window as any).google?.maps) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement('script');
            s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            s.async = true;
            s.defer = true;
            s.onload = () => res();
            s.onerror = () => rej(new Error('Maps load failed'));
            document.head.appendChild(s);
          });
        }
        if (!mapRef.current) return;
        const gm = (window as any).google.maps;
        mapInstance.current = new gm.Map(mapRef.current, {
          center,
          zoom: 12,
          styles: MAP_STYLES,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: gm.ControlPosition.RIGHT_BOTTOM },
        });
        infoWindowRef.current = new gm.InfoWindow({ disableAutoPan: false });
        setMapLoaded(true);
      } catch {
        setError('load-error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build info window HTML
  const buildInfoContent = useCallback(
    (amenity: Amenity) => {
      const cfg = CATEGORY_CONFIG[amenity.category];
      return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:220px;padding:14px 16px;border-radius:12px;">
  <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
    <div style="width:36px;height:36px;background:#f0f9ff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
      ${cfg.emoji}
    </div>
    <div style="flex:1;min-width:0;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#18181b;line-height:1.3;">${amenity.name}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#a1a1aa;">${cfg.label}</p>
    </div>
  </div>
  ${amenity.rating ? `<div style="margin-bottom:8px;font-size:11px;color:#d97706;">★ ${amenity.rating} <span style="color:#d4d4d8;">(${amenity.reviewCount ?? 0})</span></div>` : ''}
  <div style="font-size:11px;color:#71717a;margin-bottom:10px;line-height:1.5;">${amenity.address}</div>
  <div style="display:flex;gap:6px;">
    <button
      onclick="window.__mapOpenDrawer && window.__mapOpenDrawer('${amenity.id}')"
      style="flex:1;padding:6px 0;background:#2563eb;color:white;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">
      View Details
    </button>
    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(amenity.address)}" target="_blank"
      style="display:flex;align-items:center;justify-content:center;width:30px;height:28px;background:#f4f4f5;border-radius:8px;font-size:14px;text-decoration:none;">
      🗺️
    </a>
  </div>
</div>`;
    },
    []
  );

  // Expose drawer callback globally so info-window button can call it
  useEffect(() => {
    (window as any).__mapOpenDrawer = (id: string) => {
      const amenity = amenities.find((a) => a.id === id);
      if (amenity) {
        onOpenDrawer(amenity);
        infoWindowRef.current?.close();
      }
    };
    return () => {
      delete (window as any).__mapOpenDrawer;
    };
  }, [amenities, onOpenDrawer]);

  // Sync markers when amenities or selection changes
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const gm = (window as any).google.maps;
    const currentIds = new Set(amenities.map((a) => a.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    amenities.forEach((amenity) => {
      const isSel = amenity.id === selectedId;
      const iconOpts = {
        url: buildMarkerSvg(amenity.category, isSel),
        scaledSize: new gm.Size(isSel ? 42 : 34, isSel ? 51 : 43),
        anchor: new gm.Point(isSel ? 21 : 17, isSel ? 51 : 43),
      };

      const existing = markersRef.current.get(amenity.id);
      if (existing) {
        existing.setIcon(iconOpts);
        return;
      }

      const marker = new gm.Marker({
        position: { lat: amenity.lat, lng: amenity.lng },
        map: mapInstance.current,
        title: amenity.name,
        icon: iconOpts,
        animation: gm.Animation.DROP,
      });

      marker.addListener('click', () => {
        infoWindowRef.current.setContent(buildInfoContent(amenity));
        infoWindowRef.current.open(mapInstance.current, marker);
        onSelect(amenity);
      });

      markersRef.current.set(amenity.id, marker);
    });
  }, [amenities, mapLoaded, selectedId, onSelect, buildInfoContent]);

  // Pan to selected amenity
  useEffect(() => {
    if (!mapLoaded || !selectedId || !mapInstance.current) return;
    const a = amenities.find((x) => x.id === selectedId);
    if (a) {
      mapInstance.current.panTo({ lat: a.lat, lng: a.lng });
      mapInstance.current.setZoom(15);
    }
  }, [selectedId, mapLoaded, amenities]);

  // Close info window on blank map click
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const gm = (window as any).google.maps;
    const listener = mapInstance.current.addListener('click', () => {
      infoWindowRef.current?.close();
      onSelect(null);
    });
    return () => gm.event.removeListener(listener);
  }, [mapLoaded, onSelect]);

  if (error === 'no-key') {
    return (
      <MapPlaceholder
        amenities={amenities}
        onSelect={onSelect}
        onOpenDrawer={onOpenDrawer}
      />
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-400 text-sm">
          Failed to load Google Maps. Check your API key.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-zinc-50 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ─── Placeholder rendered when no Google Maps API key is configured ──────────

function MapPlaceholder({
  amenities,
  onSelect,
  onOpenDrawer,
}: {
  amenities: Amenity[];
  onSelect: (a: Amenity | null) => void;
  onOpenDrawer: (a: Amenity) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const positions = [
    [55, 55], [38, 45], [20, 35], [48, 28], [62, 40],
    [72, 60], [30, 68], [50, 72], [65, 25], [25, 58],
    [42, 80], [78, 45], [35, 20], [60, 78], [15, 50],
    [80, 30], [45, 62], [70, 15],
  ];

  return (
    <div className="relative w-full h-full bg-[#f8f8f6] overflow-hidden select-none">
      {/* Faux street grid */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="#eeeeea" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
        <line x1="0"   y1="40%" x2="100%" y2="40%" stroke="#ffffff" strokeWidth="6" />
        <line x1="0"   y1="60%" x2="100%" y2="60%" stroke="#ede8e0" strokeWidth="4" />
        <line x1="30%" y1="0"   x2="30%"  y2="100%" stroke="#ffffff" strokeWidth="5" />
        <line x1="60%" y1="0"   x2="60%"  y2="100%" stroke="#ffffff" strokeWidth="4" />
        <line x1="0"   y1="25%" x2="100%" y2="25%" stroke="#f5f5f3" strokeWidth="2.5" />
        <line x1="0"   y1="75%" x2="100%" y2="75%" stroke="#f5f5f3" strokeWidth="2.5" />
        <line x1="15%" y1="0"   x2="15%"  y2="100%" stroke="#f5f5f3" strokeWidth="2" />
        <line x1="80%" y1="0"   x2="80%"  y2="100%" stroke="#f5f5f3" strokeWidth="2" />
        {/* City Park */}
        <rect x="55%" y="30%" width="8%" height="12%" rx="3" fill="#e8f0e8" />
        {/* Cheesman */}
        <rect x="40%" y="50%" width="6%" height="8%" rx="2" fill="#edf4ed" />
      </svg>

      {/* Pins */}
      {amenities.slice(0, 16).map((amenity, i) => {
        const cfg = CATEGORY_CONFIG[amenity.category];
        const pos = positions[i] ?? [50, 50];
        const isHovered = hoveredId === amenity.id;
        return (
          <div
            key={amenity.id}
            className="absolute cursor-pointer"
            style={{
              left: `${pos[0]}%`,
              top: `${pos[1]}%`,
              transform: 'translate(-50%, -100%)',
            }}
            onMouseEnter={() => setHoveredId(amenity.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              onSelect(amenity);
              onOpenDrawer(amenity);
            }}
          >
            <div
              className={`transition-transform duration-150 ${
                isHovered ? 'scale-125' : 'scale-100'
              }`}
            >
              <div className="w-8 h-8 bg-white rounded-full shadow-md border-2 border-blue-400 flex items-center justify-center text-sm">
                {cfg.emoji}
              </div>
              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-blue-400 mx-auto" />
            </div>
            {isHovered && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-zinc-100 px-3 py-2 min-w-48 z-20 pointer-events-none">
                <p className="text-xs font-semibold text-zinc-900">{amenity.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{cfg.label}</p>
                <p className="text-xs text-zinc-300 mt-0.5 truncate">{amenity.address}</p>
                <p className="text-[10px] text-blue-500 mt-1.5 font-medium">
                  Click to view details →
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Warning banner */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-white/90 backdrop-blur-sm border border-amber-100 text-amber-700 px-4 py-2 rounded-xl shadow-sm text-xs font-medium flex items-center gap-2 whitespace-nowrap">
          <span>⚠️</span>
          <span>
            Add{' '}
            <code className="bg-amber-50 px-1 rounded font-mono">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>{' '}
            to enable the live map
          </span>
        </div>
      </div>
    </div>
  );
}
