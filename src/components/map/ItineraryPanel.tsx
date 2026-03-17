'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Amenity, ItineraryStop, DriveTimeResult } from '@/types';
import { getDriveTime } from '@/lib/api';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import { Route, Trash2, Clock, X, Navigation, ChevronLeft, Map as MapIcon, List, GripVertical, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface ItineraryPanelProps {
  stops: ItineraryStop[];
  onRemoveStop: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  allAmenities: Amenity[];
}

export default function ItineraryPanel({ stops, onRemoveStop, onClearAll, onClose, allAmenities }: ItineraryPanelProps) {
  const [legTimes, setLegTimes] = useState<Map<string, DriveTimeResult>>(new Map());
  const [calculating, setCalculating] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [driveOrigin, setDriveOrigin] = useState('');
  const [driveDest, setDriveDest] = useState('');
  const [singleResult, setSingleResult] = useState<DriveTimeResult | null>(null);
  const [singleCalc, setSingleCalc] = useState(false);

  // Auto-calculate when stops change if we already have results
  useEffect(() => {
    if (legTimes.size > 0) calculateLegTimes();
  }, [stops]);

  const calculateLegTimes = useCallback(async () => {
    if (stops.length < 2) return;
    setCalculating(true);
    const results = new Map<string, DriveTimeResult>();
    for (let i = 0; i < stops.length - 1; i++) {
      const key = `${stops[i].amenityId}→${stops[i + 1].amenityId}`;
      const result = await getDriveTime(stops[i].amenityId, stops[i + 1].amenityId);
      results.set(key, result);
    }
    setLegTimes(results);
    setCalculating(false);
  }, [stops]);

  const calcSingle = useCallback(async () => {
    if (!driveOrigin || !driveDest) return;
    setSingleCalc(true);
    setSingleResult(null);
    const r = await getDriveTime(driveOrigin, driveDest);
    setSingleResult(r);
    setSingleCalc(false);
  }, [driveOrigin, driveDest]);

  const totalMins = Array.from(legTimes.values()).reduce((a, r) => a + Math.round(r.duration / 60), 0);

  // Build Google Maps "Open route" URL for all stops
  const googleMapsRouteUrl = stops.length >= 2
    ? `https://www.google.com/maps/dir/${stops.map(s => encodeURIComponent(s.amenity.address)).join('/')}`
    : null;

  // Build embedded directions URL (first → last)
  const embedUrl = stops.length >= 2 && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    ? `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(stops[0].amenity.address)}&destination=${encodeURIComponent(stops[stops.length - 1].amenity.address)}${stops.length > 2 ? '&waypoints=' + stops.slice(1, -1).map(s => encodeURIComponent(s.amenity.address)).join('|') : ''}&mode=driving`
    : null;

  return (
    <div className="flex flex-col h-full animate-slide-right">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
        <button onClick={onClose} className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <Route className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-sm font-semibold text-zinc-800 flex-1">Plan Your Visit</span>
        {stops.length > 0 && (
          <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100">{stops.length} stops</span>
        )}
        <button onClick={onClose} className="p-1 rounded-md text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab row */}
      <div className="flex border-b border-zinc-100 px-2">
        <button
          onClick={() => setView('list')}
          className={clsx('flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors',
            view === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'
          )}
        >
          <List className="w-3.5 h-3.5" /> Itinerary
        </button>
        <button
          onClick={() => setView('map')}
          className={clsx('flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors',
            view === 'map' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'
          )}
        >
          <MapIcon className="w-3.5 h-3.5" /> Directions
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── ITINERARY LIST TAB ── */}
        {view === 'list' && (
          <div className="p-4 space-y-3">
            {stops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                  <Route className="w-5 h-5 text-zinc-300" />
                </div>
                <p className="text-sm font-medium text-zinc-400">No stops added yet</p>
                <p className="text-xs text-zinc-300 mt-1 max-w-48">Click "Add to Itinerary" on any location card</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                {legTimes.size > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 animate-scale-in">
                    <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Total drive time</p>
                      <p className="text-sm font-bold text-blue-800">
                        {totalMins < 60 ? `${totalMins} min` : `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`}
                      </p>
                    </div>
                    {googleMapsRouteUrl && (
                      <a href={googleMapsRouteUrl} target="_blank" rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0">
                        <ExternalLink className="w-3 h-3" />
                        Open in Maps
                      </a>
                    )}
                  </div>
                )}

                {/* Stops */}
                {stops.map((stop, i) => {
                  const cfg = CATEGORY_CONFIG[stop.amenity.category];
                  const nextStop = stops[i + 1];
                  const key = nextStop ? `${stop.amenityId}→${nextStop.amenityId}` : null;
                  const leg = key ? legTimes.get(key) : null;

                  return (
                    <div key={stop.amenityId}>
                      <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-zinc-100 group shadow-xs">
                        <div className="flex flex-col items-center gap-1">
                          <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-base shrink-0', cfg.bg)}>
                            {cfg.emoji}
                          </div>
                          <span className="text-[10px] text-zinc-300 font-bold">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 leading-tight">{stop.amenity.name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">{stop.amenity.address}</p>
                          {stop.amenity.hours && (
                            <p className="text-xs text-zinc-300 mt-0.5">{Object.entries(stop.amenity.hours)[0]?.join(': ')}</p>
                          )}
                        </div>
                        <button
                          onClick={() => onRemoveStop(stop.amenityId)}
                          className="shrink-0 p-1 text-zinc-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 rounded-md hover:bg-red-50"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Leg connector */}
                      {nextStop && (
                        <div className="flex items-center gap-2 px-3 py-1">
                          <div className="w-px h-3 bg-zinc-100 ml-3.5" />
                          {leg ? (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 ml-1">
                              <Clock className="w-3 h-3" />
                              <span>{leg.durationText} · {leg.distanceText}</span>
                            </div>
                          ) : <div className="h-3" />}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={calculateLegTimes}
                    disabled={calculating || stops.length < 2}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {calculating ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Calculating…</>
                    ) : (
                      <><Clock className="w-3.5 h-3.5" />Calculate Drive Times</>
                    )}
                  </button>
                  <button
                    onClick={onClearAll}
                    className="w-full py-2 text-xs text-zinc-400 hover:text-red-500 transition-colors font-medium flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear itinerary
                  </button>
                </div>

                {/* Drive time calculator */}
                <div className="mt-2 pt-4 border-t border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Quick Drive Time</p>
                  <div className="space-y-2">
                    <select value={driveOrigin} onChange={e => setDriveOrigin(e.target.value)}
                      className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">From…</option>
                      {allAmenities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select value={driveDest} onChange={e => setDriveDest(e.target.value)}
                      className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">To…</option>
                      {allAmenities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <button
                      onClick={calcSingle}
                      disabled={!driveOrigin || !driveDest || singleCalc}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 text-white text-xs font-medium rounded-lg hover:bg-zinc-900 transition-colors disabled:opacity-40"
                    >
                      {singleCalc ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Navigation className="w-3 h-3" />}
                      Calculate
                    </button>
                    {singleResult && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 animate-scale-in">
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1">
                            <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide">Drive Time</p>
                            <p className="text-base font-bold text-emerald-800">{singleResult.durationText}</p>
                          </div>
                          <div className="w-px h-8 bg-emerald-200" />
                          <div className="text-center flex-1">
                            <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide">Distance</p>
                            <p className="text-base font-bold text-emerald-800">{singleResult.distanceText}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MAP / DIRECTIONS TAB ── */}
        {view === 'map' && (
          <div className="flex flex-col h-full">
            {stops.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <MapIcon className="w-8 h-8 text-zinc-200 mb-3" />
                <p className="text-sm font-medium text-zinc-400">Add at least 2 stops</p>
                <p className="text-xs text-zinc-300 mt-1">Then see turn-by-turn directions here</p>
              </div>
            ) : embedUrl ? (
              <div className="flex-1 min-h-0">
                <iframe
                  src={embedUrl}
                  className="w-full h-full min-h-80 border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              /* No API key — show a stylized directions summary */
              <div className="p-4 space-y-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 mb-4">
                  Add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the embedded directions map.
                </div>
                {googleMapsRouteUrl && (
                  <a href={googleMapsRouteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                    <Navigation className="w-4 h-4" />
                    Open Route in Google Maps
                  </a>
                )}
                <div className="space-y-2">
                  {stops.map((stop, i) => {
                    const cfg = CATEGORY_CONFIG[stop.amenity.category];
                    return (
                      <div key={stop.amenityId} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded-full shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">{stop.amenity.name}</p>
                          <p className="text-xs text-zinc-400 truncate">{stop.amenity.address}</p>
                        </div>
                        <span className="text-base">{cfg.emoji}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
