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
}

export default function MediaCard({
  item,
  onSelect,
  onPlay,
  onOpenCoverEditor,
  onOpenFixMatch,
  watchProgress,
  isFavorite,
  onToggleFavorite,
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const coverImage = !imageError ? (item.posterUrl || item.backdropUrl) : null;

  const drive1 = item.accounts.some((a) => a.accountLabel.includes('1') || a.color === 'blue');
  const drive2 = item.accounts.some((a) => a.accountLabel.includes('2') || a.color === 'purple');

  return (
    <div
      id={`media-card-${item.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1.5 select-none"
    >
      {/* Poster / Thumbnail Area (2:3 Cinematic Ratio) */}
      <div
        onClick={() => onSelect(item)}
        className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950 cursor-pointer"
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
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

        {/* Gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-black/40 opacity-70 group-hover:opacity-85 transition-opacity" />

        {/* Top Badges: Type, Rating & Drives */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {/* Type Badge & Rating */}
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10">
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

          {/* Drive Badges */}
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

        {/* Action quick icons on hover (Fix Match & Cover) */}
        <div className="absolute top-9 right-2 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {onOpenFixMatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFixMatch(item);
              }}
              title="Identificar Conteúdo (pt-BR)"
              className="p-1.5 rounded-lg bg-black/75 hover:bg-rose-950 text-rose-400 border border-rose-700/60 backdrop-blur-md shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenCoverEditor && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCoverEditor(item);
              }}
              title="Alterar Capa"
              className="p-1.5 rounded-lg bg-black/75 hover:bg-neutral-800 text-amber-400 border border-neutral-700/60 backdrop-blur-md shadow-md"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Play Hover Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            className="w-12 h-12 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center shadow-xl shadow-black/80 transform scale-90 group-hover:scale-100 transition-all"
            title="Assistir agora"
          >
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </button>
        </div>

        {/* Watch Progress Bar (if watched previously) */}
        {watchProgress && watchProgress.progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
            <div
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${Math.min(watchProgress.progressPercent, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3
              onClick={() => onSelect(item)}
              className="text-xs sm:text-sm font-bold text-neutral-100 line-clamp-1 group-hover:text-amber-400 transition-colors cursor-pointer"
              title={item.title}
            >
              {item.title}
            </h3>

            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
                className={`text-neutral-500 hover:text-rose-400 transition-colors shrink-0 p-0.5 ${
                  isFavorite ? 'text-rose-500' : ''
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
              >
                {isFavorite ? <BookmarkCheck className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> : <Bookmark className="w-3.5 h-3.5" />}
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

        {/* Watch progress text if applicable */}
        {watchProgress && (
          <div className="text-[10px] text-rose-400/90 font-medium">
            {watchProgress.episodeInfo || 'Parou em ' + Math.round(watchProgress.progressPercent) + '%'}
          </div>
        )}
      </div>
    </div>
  );
}
