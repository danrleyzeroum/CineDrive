import React, { useState, useEffect } from 'react';
import {
  Play,
  Info,
  Star,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Sparkles,
  Flame,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { MediaItem } from '../types';
import { getTop1Brasil, TopBrasilItem } from '../services/topBrasilService';

interface Top1BrasilBannerProps {
  libraryItems: MediaItem[];
  onPlayMedia: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  favorites: string[];
  onToggleFavorite: (mediaId: string) => void;
}

export default function Top1BrasilBanner({
  libraryItems,
  onPlayMedia,
  onOpenDetails,
  favorites,
  onToggleFavorite,
}: Top1BrasilBannerProps) {
  const [topItem, setTopItem] = useState<TopBrasilItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getTop1Brasil(libraryItems).then((item) => {
      if (isMounted) {
        setTopItem(item);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [libraryItems]);

  if (loading || !topItem) {
    return (
      <div className="w-full h-72 sm:h-80 rounded-3xl bg-neutral-900/50 border border-neutral-800 animate-pulse flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 text-xs font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          Sincronizando o Top 1 do Brasil...
        </div>
      </div>
    );
  }

  const isMatchedInDrive = Boolean(topItem.matchedLibraryMedia);
  const targetMedia = topItem.matchedLibraryMedia;
  const isFavorite = targetMedia ? favorites.includes(targetMedia.id) : false;

  const handlePlayClick = () => {
    if (targetMedia) {
      onPlayMedia(targetMedia);
    } else if (libraryItems.length > 0) {
      // Fallback to playing the top item of library
      onPlayMedia(libraryItems[0]);
    }
  };

  const handleDetailsClick = () => {
    if (targetMedia) {
      onOpenDetails(targetMedia);
    }
  };

  return (
    <div
      id="top-1-brasil-section"
      className="relative w-full rounded-3xl overflow-hidden border border-amber-500/30 bg-neutral-950 shadow-2xl shadow-amber-950/20 group"
    >
      {/* Background Backdrop with Cinema Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src={topItem.backdropUrl || topItem.posterUrl}
          alt={topItem.title}
          className="w-full h-full object-cover object-top opacity-35 group-hover:scale-105 group-hover:opacity-40 transition-all duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        {/* Multilayer gradient masks */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-amber-950/30 via-transparent to-transparent" />
      </div>

      {/* Content Layout */}
      <div className="relative z-10 p-5 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6 lg:gap-10">
        {/* Left Side: Number 1 Giant + Info */}
        <div className="flex-1 flex flex-col justify-center space-y-4 max-w-2xl">
          {/* Top 1 Badge */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-black font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
              <span className="text-base leading-none">🇧🇷</span>
              <Flame className="w-4 h-4 text-black fill-black animate-bounce" />
              <span>TOP 1 NO BRASIL HOJE</span>
            </div>

            <div className="px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-700/80 text-neutral-300 text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Atualizado Automaticamente</span>
            </div>

            {isMatchedInDrive && (
              <div className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Disponível no Seu Drive</span>
              </div>
            )}
          </div>

          {/* Title with Giant #1 Display */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* The Stylized Giant Number 1 */}
            <div className="select-none font-black text-6xl sm:text-8xl lg:text-9xl leading-none text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-800 drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)] tracking-tighter shrink-0 -mt-2">
              1
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {topItem.title}
              </h2>

              {/* Meta Tags */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-300 font-semibold">
                <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {topItem.rating}
                </span>
                <span className="text-neutral-400">{topItem.year}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                  {topItem.mediaType === 'tv' ? 'Série' : 'Filme'}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">{topItem.genres.slice(0, 2).join(' / ')}</span>
                <span className="text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/40">
                  4K ULTRA HD
                </span>
              </div>
            </div>
          </div>

          {/* Sinopse */}
          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed drop-shadow">
            {topItem.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handlePlayClick}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-sm flex items-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>{isMatchedInDrive ? 'Assistir Agora' : 'Assistir no Drive'}</span>
            </button>

            {targetMedia && (
              <>
                <button
                  onClick={handleDetailsClick}
                  className="px-5 py-3 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Info className="w-4 h-4 text-neutral-300" />
                  <span>Mais Detalhes</span>
                </button>

                <button
                  onClick={() => onToggleFavorite(targetMedia.id)}
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all ${
                    isFavorite
                      ? 'bg-rose-950/70 border-rose-600 text-rose-400'
                      : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                  title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  {isFavorite ? (
                    <BookmarkCheck className="w-5 h-5 fill-rose-500" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: High Impact Poster Card */}
        <div className="shrink-0 hidden md:block">
          <div className="relative w-44 lg:w-52 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black border border-neutral-700/80 group-hover:border-amber-400/60 transition-colors">
            <img
              src={topItem.posterUrl}
              alt={topItem.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-black uppercase shadow-md">
              #1 BRASIL
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between">
              <span className="text-[11px] font-bold text-white truncate">{topItem.title}</span>
              <span className="text-[10px] font-black text-amber-400 flex items-center gap-0.5">
                ★ {topItem.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
