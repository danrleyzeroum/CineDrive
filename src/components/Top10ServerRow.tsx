import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Info,
  Star,
  Film,
  Tv,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { MediaItem } from '../types';

interface Top10ServerRowProps {
  id: string;
  title: string; // "TOP 10 FILMES DO SERVIDOR" or "TOP 10 SÉRIES DO SERVIDOR"
  type: 'movie' | 'series';
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem) => void;
  favorites: string[];
  onToggleFavorite: (mediaId: string) => void;
}

export default function Top10ServerRow({
  id,
  title,
  type,
  items,
  onSelectMedia,
  onPlayMedia,
  favorites,
  onToggleFavorite,
}: Top10ServerRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Take top 10 items sorted by rating / popularity (Strictly deduplicated)
  const top10Items = React.useMemo(() => {
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return unique
      .sort((a, b) => {
        const ra = parseFloat(a.rating || '0') || 0;
        const rb = parseFloat(b.rating || '0') || 0;
        return rb - ra;
      })
      .slice(0, 10);
  }, [items]);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -600 : 600;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  if (top10Items.length === 0) return null;

  return (
    <section id={id} className="space-y-3.5 relative group">
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              type === 'movie'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            }`}
          >
            {type === 'movie' ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-sm">
                TOP 10
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Os 10 conteúdos mais assistidos e bem avaliados da sua biblioteca
            </p>
          </div>
        </div>

        {/* Scroll Arrows on Desktop */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Rolar para a esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Rolar para a direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {top10Items.map((item, index) => {
          const rank = index + 1;
          const isFavorite = favorites.includes(item.id);

          return (
            <div
              key={`${item.id}_top10_${index}`}
              className="shrink-0 flex items-end select-none group/card cursor-pointer focus-visible:outline-none"
              onClick={() => onSelectMedia(item)}
            >
              {/* Giant Stylized Rank Number (1 to 10) */}
              <div
                className="font-black text-7xl sm:text-8xl lg:text-9xl leading-none select-none tracking-tighter shrink-0 -mr-4 sm:-mr-6 z-0 pointer-events-none transition-transform duration-300 group-hover/card:scale-110"
                style={{
                  WebkitTextStroke: '2px rgba(245, 158, 11, 0.9)',
                  color: 'transparent',
                  textShadow: '0 8px 24px rgba(0, 0, 0, 0.9)',
                  fontFamily: 'Impact, sans-serif, system-ui',
                }}
              >
                {rank}
              </div>

              {/* Media Poster Card */}
              <div className="relative w-32 sm:w-40 lg:w-44 aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 shadow-xl shadow-black/80 z-10 group-hover/card:border-amber-400/80 group-hover/card:scale-105 group-hover/card:shadow-amber-500/20 transition-all duration-300">
                <img
                  src={
                    item.posterUrl ||
                    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500'
                  }
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity" />

                {/* Top badges */}
                <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-black shadow-md">
                    TOP {rank}
                  </span>
                  {item.rating && (
                    <span className="text-[10px] font-bold text-amber-300 bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {item.rating}
                    </span>
                  )}
                </div>

                {/* Bottom details & quick actions */}
                <div className="absolute bottom-0 inset-x-0 p-2.5 space-y-1.5">
                  <p className="text-xs font-bold text-white truncate drop-shadow leading-tight">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-neutral-300">
                    <span>{item.year || '2026'}</span>
                    <span className="text-neutral-400 uppercase">
                      {type === 'movie' ? 'Filme' : `${item.seasons?.length || 1} Temp`}
                    </span>
                  </div>

                  {/* Hover Quick Action Buttons */}
                  <div className="pt-1 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayMedia(item);
                      }}
                      className="flex-1 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-md transition-all"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      Assistir
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`p-1 rounded-lg border flex items-center justify-center transition-all ${
                        isFavorite
                          ? 'bg-rose-950/80 border-rose-600 text-rose-400'
                          : 'bg-black/60 border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                      title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                    >
                      {isFavorite ? (
                        <BookmarkCheck className="w-3.5 h-3.5 fill-rose-500" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
