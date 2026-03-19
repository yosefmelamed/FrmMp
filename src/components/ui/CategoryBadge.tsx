import type { AmenityCategory } from '@/types';

export const CATEGORY_CONFIG: Record<
  AmenityCategory,
  { label: string; color: string; bg: string; border: string; dot: string; emoji: string }
> = {
  synagogue:         { label: 'Synagogue',     color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-100',   dot: 'bg-blue-500',   emoji: '\u2721\ufe0f' },
  kosher_restaurant: { label: 'Restaurant',    color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-100',dot: 'bg-emerald-500',emoji: '\uD83C\uDF7D\uFE0F' },
  kosher_grocery:    { label: 'Grocery',       color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-100',  dot: 'bg-green-500',  emoji: '\uD83D\uDED2' },
  jewish_school:     { label: 'School',        color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-100', dot: 'bg-violet-500', emoji: '\uD83D\uDCDA' },
  mikveh:            { label: 'Mikveh',        color: 'text-sky-700',    bg: 'bg-sky-50',     border: 'border-sky-100',    dot: 'bg-sky-500',    emoji: '\uD83D\uDCA7' },
  jewish_center:     { label: 'Jewish Center', color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-100',  dot: 'bg-amber-500',  emoji: '\uD83C\uDFDB\uFE0F' },
  accommodation:     { label: 'Accommodation', color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-100', dot: 'bg-indigo-500', emoji: '\uD83C\uDFE8' },
  cemetery:          { label: 'Cemetery',      color: 'text-zinc-600',   bg: 'bg-zinc-50',    border: 'border-zinc-100',   dot: 'bg-zinc-400',   emoji: '\uD83D\uDD4A\uFE0F' },
  bakery:            { label: 'Bakery',        color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-100', dot: 'bg-orange-500', emoji: '\uD83E\uDD50' },
  butcher:           { label: 'Butcher',       color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-100',    dot: 'bg-red-500',    emoji: '\uD83E\uDD69' },
};

export const ALL_CATEGORIES: AmenityCategory[] = [
  'synagogue',
  'kosher_restaurant',
  'kosher_grocery',
  'jewish_school',
  'mikveh',
  'jewish_center',
  'accommodation',
  'cemetery',
  'bakery',
  'butcher',
];

export function CategoryBadge({ category, size = 'sm' }: { category: AmenityCategory; size?: 'xs' | 'sm' }) {
  const cfg = CATEGORY_CONFIG[category];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border
      ${size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}
      ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function RatingStars({ rating, count }: { rating?: number; count?: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className="w-3 h-3" viewBox="0 0 20 20">
            <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
              fill={s <= Math.round(rating) ? '#f59e0b' : '#e4e4e7'} />
          </svg>
        ))}
      </div>
      <span className="text-xs text-zinc-400">{rating.toFixed(1)}{count ? ` (${count})` : ''}</span>
    </div>
  );
}