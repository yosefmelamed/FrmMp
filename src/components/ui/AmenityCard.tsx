'use client';

import type { Amenity } from '@/types';
import { CategoryBadge, RatingStars } from '@/components/ui/CategoryBadge';
import { MapPin, Phone, Clock, Plus, Navigation, ExternalLink, ChevronRight, Heart, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface AmenityCardProps {
  amenity: Amenity;
  compact?: boolean;
  selected?: boolean;
  /** Show a plain <a> directions link — safe to use from Server Components */
  showDirectionsLink?: boolean;
  onSelect?: (a: Amenity) => void;
  onAddToItinerary?: (a: Amenity) => void;
  onViewDetail?: (a: Amenity) => void;
  /** Client-side navigate callback — only pass from Client Components */
  onNavigate?: (a: Amenity) => void;
  showActions?: boolean;
  onSave?: (a: Amenity) => void;
  isSaved?: boolean;
  savingThis?: boolean;
}

export default function AmenityCard({
  amenity,
  compact = false,
  selected = false,
  showDirectionsLink = false,
  onSelect,
  onAddToItinerary,
  onViewDetail,
  onNavigate,
  showActions = true,
  onSave,
  isSaved = false,
  savingThis = false,
}: AmenityCardProps) {
  const firstHoursEntry = amenity.hours ? Object.entries(amenity.hours)[0] : null;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(amenity.address)}`;

  return (
    <div
      onClick={() => onSelect?.(amenity)}
      className={clsx(
        'card transition-all duration-150',
        compact ? 'p-3' : 'p-4',
        onSelect && 'cursor-pointer card-interactive',
        selected && '!border-blue-300 !shadow-md ring-1 ring-blue-200 ring-offset-0'
      )}
    >
      {/* Top row */}
      <div className="flex items-start gap-2.5 mb-2">
        <div className="flex-1 min-w-0">
          <CategoryBadge category={amenity.category} size="xs" />
          <h3 className="font-semibold text-zinc-900 mt-1 leading-snug text-sm">
            {amenity.name}
          </h3>
          {amenity.denomination && !compact && (
            <p className="text-xs text-zinc-400 mt-0.5">{amenity.denomination}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {amenity.rating && (
            <RatingStars rating={amenity.rating} count={compact ? undefined : amenity.reviewCount} />
          )}
          {onSave && (
            <button
              onClick={e => { e.stopPropagation(); onSave(amenity); }}
              className={clsx(
                'p-1 rounded-full transition-all',
                isSaved ? 'text-red-500' : 'text-zinc-300 hover:text-red-400'
              )}
            >
              {savingThis
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Heart className={clsx('w-3.5 h-3.5', isSaved && 'fill-red-400')} />
              }
            </button>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-xs text-zinc-400">
        <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
        <span className={clsx('leading-relaxed', compact && 'truncate')}>{amenity.address}</span>
      </div>

      {/* Extra details (non-compact) */}
      {!compact && (
        <div className="space-y-1 mt-1.5">
          {amenity.phone && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Phone className="w-3 h-3 shrink-0" />
              <a
                href={`tel:${amenity.phone}`}
                className="hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {amenity.phone}
              </a>
            </div>
          )}
          {firstHoursEntry && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock className="w-3 h-3 shrink-0" />
              <span>
                <span className="font-medium text-zinc-500">{firstHoursEntry[0]}:</span>{' '}
                {firstHoursEntry[1]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {!compact && amenity.description && (
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed line-clamp-2">
          {amenity.description}
        </p>
      )}

      {/* Tags */}
      {!compact && amenity.tags && amenity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {amenity.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 bg-zinc-50 text-zinc-400 text-[10px] rounded-full border border-zinc-100"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Kosher certifications */}
      {!compact && (amenity.certificationBody || amenity.priceRange) && (
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-zinc-50">
          {amenity.certificationBody && (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded border border-emerald-100">
              {amenity.certificationBody}
            </span>
          )}
          {amenity.certificationLevel && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded border border-green-100 capitalize">
              {amenity.certificationLevel.replace(/_/g, ' ')}
            </span>
          )}
          {amenity.priceRange && (
            <span className="ml-auto text-sm font-semibold text-zinc-500">{amenity.priceRange}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (showDirectionsLink || onAddToItinerary || onViewDetail || onNavigate || amenity.website) && (
        <div
          className="flex items-center gap-1 mt-3 pt-2.5 border-t border-zinc-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Plain anchor — works from Server Components */}
          {showDirectionsLink && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
            >
              <Navigation className="w-3 h-3" />
              Directions
            </a>
          )}

          {/* JS callback — only from Client Components */}
          {onNavigate && (
            <button
              onClick={() => onNavigate(amenity)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
            >
              <Navigation className="w-3 h-3" />
              Directions
            </button>
          )}

          {amenity.website && (
            <a
              href={amenity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </a>
          )}

          {onViewDetail && (
            <button
              onClick={() => onViewDetail(amenity)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
            >
              <ChevronRight className="w-3 h-3" />
              Details
            </button>
          )}

          {onAddToItinerary && (
            <button
              onClick={() => onAddToItinerary(amenity)}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-100"
            >
              <Plus className="w-3 h-3" />
              Itinerary
            </button>
          )}
        </div>
      )}
    </div>
  );
}