'use client';

import type { Amenity, ItineraryStop } from '@/types';
import { CATEGORY_CONFIG, CategoryBadge, RatingStars } from '@/components/ui/CategoryBadge';
import {
  X, MapPin, Phone, Globe, Clock, Plus, Navigation,
  Star, Tag, Users, Calendar, ChevronLeft, Route,
} from 'lucide-react';
import clsx from 'clsx';

interface AmenityDrawerProps {
  amenity: Amenity;
  onClose: () => void;
  onAddToItinerary: (a: Amenity) => void;
  itineraryStops: ItineraryStop[];
}

export default function AmenityDrawer({ amenity, onClose, onAddToItinerary, itineraryStops }: AmenityDrawerProps) {
  const cfg = CATEGORY_CONFIG[amenity.category];
  const inItinerary = itineraryStops.some(s => s.amenityId === amenity.id);

  const openDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(amenity.address)}`,
      '_blank'
    );
  };

  return (
    <div className="flex flex-col h-full animate-slide-right">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
        <button
          onClick={onClose}
          className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-zinc-400">Back to list</span>
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-md text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero area */}
        <div className={`px-4 pt-4 pb-3 ${cfg.bg}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CategoryBadge category={amenity.category} />
              <h2 className="font-semibold text-zinc-900 text-base mt-2 leading-snug">{amenity.name}</h2>
              {amenity.denomination && (
                <p className={`text-xs font-medium mt-0.5 ${cfg.color}`}>{amenity.denomination}</p>
              )}
            </div>
            <div className="text-3xl shrink-0">{cfg.emoji}</div>
          </div>

          {amenity.rating && (
            <div className="mt-2">
              <RatingStars rating={amenity.rating} count={amenity.reviewCount} />
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="px-4 py-3 space-y-2 border-b border-zinc-50">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
            <span className="text-zinc-600 leading-relaxed text-xs">{amenity.address}</span>
          </div>
          {amenity.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <a href={`tel:${amenity.phone}`} className="text-xs text-blue-600 hover:underline">{amenity.phone}</a>
            </div>
          )}
          {amenity.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <a href={amenity.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate">
                {amenity.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Hours */}
        {amenity.hours && (
          <div className="px-4 py-3 border-b border-zinc-50">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Hours</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(amenity.hours).map(([day, hrs]) => (
                <div key={day} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">{day}</span>
                  <span className="text-zinc-700">{hrs}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {amenity.description && (
          <div className="px-4 py-3 border-b border-zinc-50">
            <p className="text-xs text-zinc-500 leading-relaxed">{amenity.description}</p>
          </div>
        )}

        {/* Services (synagogues) */}
        {amenity.services && amenity.services.length > 0 && (
          <div className="px-4 py-3 border-b border-zinc-50">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Services</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {amenity.services.map(s => (
                <span key={s} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Rabbi */}
        {amenity.rabbi && (
          <div className="px-4 py-3 border-b border-zinc-50">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Rabbi</span>
            </div>
            <p className="text-xs text-zinc-700">{amenity.rabbi}</p>
          </div>
        )}

        {/* Kosher info */}
        {(amenity.certificationBody || amenity.cuisine || amenity.priceRange) && (
          <div className="px-4 py-3 border-b border-zinc-50">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Kosher Info</span>
            </div>
            <div className="space-y-1.5">
              {amenity.cuisine && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Cuisine</span>
                  <span className="text-zinc-700 font-medium">{amenity.cuisine}</span>
                </div>
              )}
              {amenity.certificationBody && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Certification</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[11px] border border-emerald-100">
                    {amenity.certificationBody}
                  </span>
                </div>
              )}
              {amenity.certificationLevel && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Level</span>
                  <span className="text-zinc-700 capitalize">{amenity.certificationLevel.replace(/_/g, ' ')}</span>
                </div>
              )}
              {amenity.priceRange && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Price</span>
                  <span className="text-zinc-700 font-semibold">{amenity.priceRange}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {amenity.tags && amenity.tags.length > 0 && (
          <div className="px-4 py-3 border-b border-zinc-50">
            <div className="flex flex-wrap gap-1.5">
              {amenity.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-zinc-50 text-zinc-500 text-xs rounded-full border border-zinc-100">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-zinc-100 space-y-2">
        <button
          onClick={() => onAddToItinerary(amenity)}
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
