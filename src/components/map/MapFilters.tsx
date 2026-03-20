'use client';

import { CATEGORY_CONFIG, ALL_CATEGORIES } from '@/components/ui/CategoryBadge';
import type { AmenityCategory } from '@/types';
import clsx from 'clsx';

interface MapFiltersProps {
  active: Set<AmenityCategory>;
  onChange: (cats: Set<AmenityCategory>) => void;
  counts: Record<AmenityCategory, number>;
}

export default function MapFilters({ active, onChange, counts }: MapFiltersProps) {
  const available = (ALL_CATEGORIES ?? []).filter(c => counts[c] > 0);
  // allOn = every available category is active
  const allOn = available.every(c => active.has(c));
  const noneOn = active.size === 0;

  const toggle = (cat: AmenityCategory) => {
    const next = new Set(active);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    onChange(next);
  };

  return (
    <div className="px-3 py-2.5 border-b border-zinc-100 flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange(allOn ? new Set<AmenityCategory>() : new Set(available))}
        className={clsx(
          'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
          allOn
            ? 'bg-zinc-800 text-white border-zinc-800'
            : noneOn
              ? 'bg-zinc-100 text-zinc-500 border-zinc-300'
              : 'text-zinc-400 border-zinc-200 hover:border-zinc-300 hover:text-zinc-600'
        )}
      >
        {allOn ? 'All ✓' : noneOn ? 'None' : 'All'}
      </button>
      {available.map(cat => {
        const cfg = CATEGORY_CONFIG[cat];
        const on = active.has(cat);
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={clsx(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
              on
                ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                : 'text-zinc-400 border-zinc-200 hover:border-zinc-300 bg-white hover:text-zinc-600'
            )}
          >
            {cfg.emoji} {cfg.label}
            <span className={clsx('text-[10px] font-bold', on ? 'opacity-60' : 'text-zinc-300')}>
              {counts[cat]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
