import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { MediaItem } from '../types';
import MediaCard from './MediaCard';

interface TvMediaRowProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  items: MediaItem[];
  badgeText?: string;
  actionText?: string;
  onActionClick?: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem) => void;
  onOpenCoverEditor: (item: MediaItem) => void;
  onOpenFixMatch: (item: MediaItem) => void;
  favorites: string[];
  onToggleFavorite: (mediaId: string) => void;
}

/**
 * TvMediaRow: A horizontal, focus-navigable row engineered for Android TV & Leanback navigation.
 * Each item is focusable with D-Pad arrow keys (Left/Right) and scrolls into view automatically.
 */
export default function TvMediaRow({
  id,
  title,
  icon: Icon,
  iconColor = 'text-amber-400',
  items,
  badgeText,
  actionText,
  onActionClick,
  onSelectMedia,
  onPlayMedia,
  onOpenCoverEditor,
  onOpenFixMatch,
  favorites,
  onToggleFavorite,
}: TvMediaRowProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Deduplicate items to guarantee completely unique keys and avoid React key collisions
  const uniqueItems = React.useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (uniqueItems.length === 0) return null;

  return (
    <section
      id={`tv-row-${id}`}
      aria-label={title}
      className="space-y-3.5 relative"
    >
      {/* Row Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
          <h3 className="text-base sm:text-lg xl:text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>{title}</span>
            {badgeText && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                {badgeText}
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {actionText && onActionClick && (
            <button
              onClick={onActionClick}
              tabIndex={0}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 focus-visible:text-amber-300 focus-visible:underline focus-visible:outline-none transition-colors"
            >
              {actionText} &rarr;
            </button>
          )}

          {/* D-Pad / Remote Helper Scroll Buttons (also click-friendly for mouse/touch) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              tabIndex={-1}
              aria-label={`Rolar ${title} para esquerda`}
              className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              tabIndex={-1}
              aria-label={`Rolar ${title} para direita`}
              className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal TV Row Container with snap scrolling and overflow padding so focused cards don't clip */}
      <div
        ref={rowRef}
        role="region"
        aria-label={`Carrossel de ${title}`}
        className="flex items-stretch gap-3.5 sm:gap-4.5 overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-none snap-x snap-mandatory focus-within:ring-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {uniqueItems.map((item, idx) => (
          <div
            key={`${item.id}_${idx}`}
            className="shrink-0 w-[145px] sm:w-[170px] md:w-[195px] lg:w-[210px] xl:w-[220px] snap-start"
          >
            <MediaCard
              item={item}
              isTvFocused={focusedId === item.id}
              onTvFocusChange={(focused) => {
                if (focused) setFocusedId(item.id);
                else if (focusedId === item.id) setFocusedId(null);
              }}
              onSelect={onSelectMedia}
              onPlay={onPlayMedia}
              onOpenCoverEditor={onOpenCoverEditor}
              onOpenFixMatch={onOpenFixMatch}
              isFavorite={favorites.includes(item.id)}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
