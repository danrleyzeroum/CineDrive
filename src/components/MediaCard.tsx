import React, { useState } from 'react';
import { Play, Film, Tv, Bookmark, BookmarkCheck, Image as ImageIcon, Star, Sparkles } from 'lucide-react';
import { MediaItem, WatchProgress } from '../types';

interface MediaCardProps {
  key?: React.Key;
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  onOpenCoverEditor?: (item: MediaItem) => void;
  onOpenFixMatch?: (item: MediaItem) => void;
  watchProgress?: WatchProgress;
  isFavorite?: boolean;
  onToggleFavorite?: (mediaId: string) => void;
  isTvFocused?: boolean;
  onTvFocusChange?: (isFocused: boolean) => void;
}

/**
 * MediaCard: Refactored specifically for Android TV & Leanback 10-foot experience.
 * Prioritizes active focus states (focus-visible / focus-within / isFocused state)
 * eliminating mouse-only (hover) dependencies, with TV-grade zoom, high contrast ring,
 * and remote D-Pad controls.
 */
export default function MediaCard({
  item,
  onSelect,
  onPlay,
  onOpenCoverEditor,
  onOpenFixMatch,
  watchProgress,
  isFavorite,
  onToggleFavorite,
  isTvFocused = false,
  onTvFocusChange,
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [internalFocused, setInternalFocused] = useState(false);
  const coverImage = !imageError ? (item.posterUrl || item.backdropUrl) : null;

  const isCardActive = isTvFocused || internalFocused;

  const drive1 = item.accounts.some((a) => a.accountLabel.includes('1') || a.color === 'blue');
  const drive2 = item.accounts.some((a) => a.accountLabel.includes('2') || a.color === 'purple');

  const handleFocus = () => {
    setInternalFocused(true);
    onTvFocusChange?.(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only blur if focus moved outside the card completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setInternalFocused(false);
      onTvFocusChange?.(false);
    }
  };

  return (
    <div
      id={`media-card-${item.id}`}
      tabIndex={0}
      role="button"
      aria-label={`${item.title} (${item.year || (item.type === 'movie' ? 'Filme' : 'Série')})`}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        // Android TV D-Pad Center / Enter / Space initiates Play or Selection
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-neutral-900/80 transition-all duration-250 select-none cursor-pointer outline-none ${
        isCardActive
          ? 'scale-105 z-20 ring-4 ring-white border-transparent shadow-2xl shadow-rose-950/70 bg-neutral-900'
          : 'border border-neutral-800/80 hover:scale-105 hover:ring-2 hover:ring-white/80 focus-visible:scale-105 focus-visible:z-20 focus-visible:ring-4 focus-visible:ring-white focus-visible:shadow-2xl focus-visible:shadow-rose-950/70'
      }`}
    >
      {/* Poster / Thumbnail Area (Cinematic 2:3 Ratio) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
        {coverImage ? (
          <img
            src={coverImage}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out ${
              isCardActive ? 'scale-105' : 'group-hover:scale-105 group-focus-visible:scale-105'
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-neutral-600 text-center">
            {item.type === 'movie' ? (
              <Film className="w-10 h-10 stroke-1 mb-2 text-rose-500/40" />
            ) : (
              <Tv className="w-10 h-10 stroke-1 mb-2 text-amber-500/40" />
            )}
            <span className="text-xs font-bold text-neutral-300 line-clamp-2 px-1">
              {item.title}
            </span>
          </div>
        )}

        {/* Gradient shadow for contrast */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-black/40 transition-opacity ${
            isCardActive ? 'opacity-90' : 'opacity-70 group-hover:opacity-85 group-focus-visible:opacity-85'
          }`}
        />

        {/* Top Badges: Type, Rating & Drives */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/10">
              {item.type === 'movie' ? <Film className="w-2.5 h-2.5 text-rose-400" /> : <Tv className="w-2.5 h-2.5 text-amber-400" />}
              {item.type === 'movie' ? 'Filme' : `${item.seasons?.length || 1}T`}
            </span>

            {item.rating && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/90 text-black shadow-sm">
                <Star className="w-2.5 h-2.5 fill-black" />
                {item.rating}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {drive1 && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600/90 text-white shadow-sm"
                title="Google Drive 1"
              >
                D1
              </span>
            )}
            {drive2 && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-600/90 text-white shadow-sm"
                title="Google Drive 2"
              >
                D2
              </span>
            )}
          </div>
        </div>

        {/* Action icons: visible on active focus state or hover */}
        <div
          className={`absolute top-9 right-2 flex flex-col gap-1.5 z-20 transition-all duration-200 ${
            isCardActive
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-within:opacity-100'
          }`}
        >
          {onOpenFixMatch && (
            <button
              tabIndex={isCardActive ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                onOpenFixMatch(item);
              }}
              title="Identificar Conteúdo (pt-BR)"
              className="p-1.5 rounded-lg bg-black/85 hover:bg-rose-950 focus:bg-rose-950 focus:ring-2 focus:ring-white focus:outline-none text-rose-400 border border-rose-700/60 backdrop-blur-md shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenCoverEditor && (
            <button
              tabIndex={isCardActive ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                onOpenCoverEditor(item);
              }}
              title="Alterar Capa"
              className="p-1.5 rounded-lg bg-black/85 hover:bg-neutral-800 focus:bg-neutral-800 focus:ring-2 focus:ring-white focus:outline-none text-amber-400 border border-neutral-700/60 backdrop-blur-md shadow-md transition-all active:scale-95"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Play Center Button: Highly responsive to TV Active Focus */}
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 transition-all duration-200 pointer-events-none ${
            isCardActive
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-90 group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-within:opacity-100'
          }`}
        >
          <button
            tabIndex={isCardActive ? 0 : -1}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white hover:bg-neutral-200 focus:bg-amber-400 focus:ring-4 focus:ring-white focus:outline-none text-black flex items-center justify-center shadow-2xl shadow-black/90 transform scale-100 active:scale-95 transition-all"
            title="Assistir agora"
          >
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </button>
        </div>

        {/* Watch Progress Bar */}
        {watchProgress && watchProgress.progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800 z-10">
            <div
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${Math.min(watchProgress.progressPercent, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5 bg-neutral-900/90">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3
              className={`text-xs sm:text-sm font-bold line-clamp-1 transition-colors ${
                isCardActive ? 'text-amber-400' : 'text-neutral-100 group-hover:text-amber-400'
              }`}
              title={item.title}
            >
              {item.title}
            </h3>

            {onToggleFavorite && (
              <button
                tabIndex={isCardActive ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
                className={`text-neutral-500 hover:text-rose-400 focus:text-rose-400 focus:outline-none transition-colors shrink-0 p-0.5 ${
                  isFavorite ? 'text-rose-500' : ''
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
              >
                {isFavorite ? (
                  <BookmarkCheck className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
            {item.year && <span>{item.year}</span>}
            {item.year && <span>•</span>}
            {item.type === 'movie' ? (
              <span>{item.duration || 'Filme'}</span>
            ) : (
              <span>{item.totalEpisodes ? `${item.totalEpisodes} eps` : 'Série'}</span>
            )}
            {item.quality && (
              <>
                <span>•</span>
                <span className="text-[10px] font-semibold text-amber-400">{item.quality}</span>
              </>
            )}
          </div>
        </div>

        {/* Watch progress status */}
        {watchProgress && (
          <div className="text-[10px] text-rose-400 font-medium">
            {watchProgress.episodeInfo || `Parou em ${Math.round(watchProgress.progressPercent)}%`}
          </div>
        )}
      </div>
    </div>
  );
}
