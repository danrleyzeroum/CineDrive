import React, { useState } from 'react';
import { Play, Info, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles, Film, Tv, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { MediaItem } from '../types';

interface DualHeroBannersProps {
  movies: MediaItem[];
  series: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  onOpenCoverEditor: (item: MediaItem) => void;
  onOpenFixMatch?: (item: MediaItem) => void;
  favorites: string[];
  onToggleFavorite: (mediaId: string) => void;
}

export default function DualHeroBanners({
  movies,
  series,
  onPlay,
  onOpenDetails,
  onOpenCoverEditor,
  onOpenFixMatch,
  favorites,
  onToggleFavorite,
}: DualHeroBannersProps) {
  const [movieIndex, setMovieIndex] = useState(0);
  const [seriesIndex, setSeriesIndex] = useState(0);

  const activeMovie = movies.length > 0 ? movies[movieIndex % movies.length] : null;
  const activeSeries = series.length > 0 ? series[seriesIndex % series.length] : null;

  const handlePrevMovie = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMovieIndex((prev) => (prev > 0 ? prev - 1 : movies.length - 1));
  };

  const handleNextMovie = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMovieIndex((prev) => (prev + 1) % movies.length);
  };

  const handlePrevSeries = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSeriesIndex((prev) => (prev > 0 ? prev - 1 : series.length - 1));
  };

  const handleNextSeries = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSeriesIndex((prev) => (prev + 1) % series.length);
  };

  return (
    <div className="w-full mb-8 sm:mb-12">
      {/* Dual Banners Grid - Side by Side on larger screens, exactly as in the print! */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* ========================================================================= */}
        {/* BANNER 1: FILMES (ESQUERDA) */}
        {/* ========================================================================= */}
        <div
          id="hero-banner-movies"
          onClick={() => activeMovie && onOpenDetails(activeMovie)}
          className="relative group rounded-3xl overflow-hidden h-[340px] sm:h-[400px] xl:h-[440px] border border-neutral-800/80 bg-neutral-900 shadow-2xl transition-all duration-300 hover:border-amber-400/50 cursor-pointer select-none"
        >
          {/* Banner Backdrop Image */}
          {activeMovie?.backdropUrl || activeMovie?.posterUrl ? (
            <img
              src={activeMovie.backdropUrl || activeMovie.posterUrl}
              alt={activeMovie.title}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-neutral-900 to-black flex items-center justify-center">
              <Film className="w-20 h-20 text-rose-500/20" />
            </div>
          )}

          {/* Cinematic Overlays & Vignettes */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent" />

          {/* Category Pill Top Left */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg shadow-rose-950/80">
              <Film className="w-3.5 h-3.5" />
              Filmes
            </span>

            {activeMovie?.quality && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                {activeMovie.quality}
              </span>
            )}
          </div>

          {/* Quick Actions (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {activeMovie && onOpenFixMatch && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFixMatch(activeMovie);
                }}
                title="Identificar Conteúdo (pt-BR)"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-rose-950 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-semibold backdrop-blur-md transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Identificar
              </button>
            )}

            {activeMovie && (
              <button
                id="change-movie-cover-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCoverEditor(activeMovie);
                }}
                title="Trocar Capa / Banner"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-[11px] font-semibold backdrop-blur-md transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                Trocar Capa
              </button>
            )}
          </div>

          {/* Content Details Area */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col justify-end z-10">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {activeMovie?.year && (
                <span className="text-xs font-semibold text-neutral-300">
                  {activeMovie.year}
                </span>
              )}
              {activeMovie?.rating && (
                <>
                  <span className="text-neutral-500 text-xs">•</span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {activeMovie.rating}
                  </span>
                </>
              )}
              {activeMovie?.duration && (
                <>
                  <span className="text-neutral-500 text-xs">•</span>
                  <span className="text-xs font-medium text-neutral-400">
                    {activeMovie.duration}
                  </span>
                </>
              )}
              {activeMovie?.genre && activeMovie.genre.length > 0 && (
                <>
                  <span className="text-neutral-500 text-xs">•</span>
                  <span className="text-xs text-neutral-400">
                    {activeMovie.genre.slice(0, 2).join(', ')}
                  </span>
                </>
              )}
              {activeMovie?.accounts?.map((acc) => (
                <span
                  key={acc.accountId}
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                    acc.color === 'blue'
                      ? 'bg-blue-950/70 border-blue-800/80 text-blue-300'
                      : 'bg-purple-950/70 border-purple-800/80 text-purple-300'
                  }`}
                >
                  {acc.accountLabel}
                </span>
              ))}
            </div>

            {/* Stylized Title (Large & Impactful like in the print) */}
            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight text-white drop-shadow-lg mb-2 line-clamp-1 group-hover:text-amber-300 transition-colors">
              {activeMovie?.title || 'Filme em Destaque'}
            </h2>

            {/* Brief Synopsis */}
            {activeMovie?.overview && (
              <p className="text-xs text-neutral-300 line-clamp-2 max-w-md font-normal leading-relaxed mb-4 drop-shadow">
                {activeMovie.overview}
              </p>
            )}

            {/* Action Buttons & Indicator row */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <button
                  id="banner-play-movie-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeMovie) onPlay(activeMovie);
                  }}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" />
                  Assistir
                </button>

                <button
                  id="banner-details-movie-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeMovie) onOpenDetails(activeMovie);
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs font-semibold backdrop-blur-md transition-all"
                >
                  <Info className="w-3.5 h-3.5" />
                  Detalhes
                </button>

                {activeMovie && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(activeMovie.id);
                    }}
                    className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-rose-500 border border-neutral-700/80 backdrop-blur-md transition-colors"
                    title={favorites.includes(activeMovie.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {favorites.includes(activeMovie.id) ? (
                      <BookmarkCheck className="w-4 h-4 text-rose-500 fill-rose-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Indicator dots pill (as shown in the print bottom-right!) */}
              {movies.length > 1 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-neutral-800 backdrop-blur-md">
                  {movies.slice(0, 5).map((_, idx) => (
                    <span
                      key={idx}
                      className={`transition-all rounded-full ${
                        idx === movieIndex % Math.min(5, movies.length)
                          ? 'w-4 h-1.5 bg-amber-400'
                          : 'w-1.5 h-1.5 bg-neutral-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Carousel Arrows on Hover */}
          {movies.length > 1 && (
            <>
              <button
                onClick={handlePrevMovie}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                title="Filme Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMovie}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                title="Próximo Filme"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BANNER 2: SÉRIES (DIREITA) */}
        {/* ========================================================================= */}
        <div
          id="hero-banner-series"
          onClick={() => activeSeries && onOpenDetails(activeSeries)}
          className="relative group rounded-3xl overflow-hidden h-[340px] sm:h-[400px] xl:h-[440px] border border-neutral-800/80 bg-neutral-900 shadow-2xl transition-all duration-300 hover:border-amber-400/50 cursor-pointer select-none"
        >
          {/* Banner Backdrop Image */}
          {activeSeries?.backdropUrl || activeSeries?.posterUrl ? (
            <img
              src={activeSeries.backdropUrl || activeSeries.posterUrl}
              alt={activeSeries.title}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-neutral-900 to-black flex items-center justify-center">
              <Tv className="w-20 h-20 text-indigo-500/20" />
            </div>
          )}

          {/* Cinematic Overlays & Vignettes */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent" />

          {/* Category Pill Top Left */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-black shadow-lg shadow-amber-950/80">
              <Tv className="w-3.5 h-3.5" />
              Séries
            </span>

            {activeSeries?.quality && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                {activeSeries.quality}
              </span>
            )}
          </div>

          {/* Quick Actions (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {activeSeries && onOpenFixMatch && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFixMatch(activeSeries);
                }}
                title="Identificar Conteúdo (pt-BR)"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-amber-950 text-amber-300 hover:text-white border border-amber-500/40 text-[11px] font-semibold backdrop-blur-md transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Identificar
              </button>
            )}

            {activeSeries && (
              <button
                id="change-series-cover-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCoverEditor(activeSeries);
                }}
                title="Trocar Capa / Banner"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-[11px] font-semibold backdrop-blur-md transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                Trocar Capa
              </button>
            )}
          </div>

          {/* Content Details Area */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col justify-end z-10">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {activeSeries?.year && (
                <span className="text-xs font-semibold text-neutral-300">
                  {activeSeries.year}
                </span>
              )}
              {activeSeries?.rating && (
                <>
                  <span className="text-neutral-500 text-xs">•</span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {activeSeries.rating}
                  </span>
                </>
              )}
              <span className="text-neutral-500 text-xs">•</span>
              <span className="text-xs font-medium text-neutral-400">
                {activeSeries?.seasons?.length || 1} Temporada(s)
              </span>
              {activeSeries?.genre && activeSeries.genre.length > 0 && (
                <>
                  <span className="text-neutral-500 text-xs">•</span>
                  <span className="text-xs text-neutral-400">
                    {activeSeries.genre.slice(0, 2).join(', ')}
                  </span>
                </>
              )}
              {activeSeries?.accounts?.map((acc) => (
                <span
                  key={acc.accountId}
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                    acc.color === 'blue'
                      ? 'bg-blue-950/70 border-blue-800/80 text-blue-300'
                      : 'bg-purple-950/70 border-purple-800/80 text-purple-300'
                  }`}
                >
                  {acc.accountLabel}
                </span>
              ))}
            </div>

            {/* Stylized Title */}
            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight text-white drop-shadow-lg mb-2 line-clamp-1 group-hover:text-amber-300 transition-colors">
              {activeSeries?.title || 'Série em Destaque'}
            </h2>

            {/* Brief Synopsis */}
            {activeSeries?.overview && (
              <p className="text-xs text-neutral-300 line-clamp-2 max-w-md font-normal leading-relaxed mb-4 drop-shadow">
                {activeSeries.overview}
              </p>
            )}

            {/* Action Buttons & Indicator row */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <button
                  id="banner-play-series-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeSeries) onPlay(activeSeries);
                  }}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" />
                  Assistir
                </button>

                <button
                  id="banner-details-series-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeSeries) onOpenDetails(activeSeries);
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs font-semibold backdrop-blur-md transition-all"
                >
                  <Info className="w-3.5 h-3.5" />
                  Detalhes
                </button>

                {activeSeries && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(activeSeries.id);
                    }}
                    className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-rose-500 border border-neutral-700/80 backdrop-blur-md transition-colors"
                    title={favorites.includes(activeSeries.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {favorites.includes(activeSeries.id) ? (
                      <BookmarkCheck className="w-4 h-4 text-rose-500 fill-rose-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Indicator dots pill (as in the screenshot!) */}
              {series.length > 1 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-neutral-800 backdrop-blur-md">
                  {series.slice(0, 5).map((_, idx) => (
                    <span
                      key={idx}
                      className={`transition-all rounded-full ${
                        idx === seriesIndex % Math.min(5, series.length)
                          ? 'w-4 h-1.5 bg-amber-400'
                          : 'w-1.5 h-1.5 bg-neutral-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Carousel Arrows on Hover */}
          {series.length > 1 && (
            <>
              <button
                onClick={handlePrevSeries}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                title="Série Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextSeries}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                title="Próxima Série"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
