import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Info,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  Film,
  Tv,
  Bookmark,
  BookmarkCheck,
  Star,
  Volume2,
  VolumeX,
  Clapperboard,
} from 'lucide-react';
import { MediaItem } from '../types';
import { getTrailerEmbedUrl } from '../services/trailerService';

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

  // Focus and hover states
  const [movieBannerFocused, setMovieBannerFocused] = useState(false);
  const [seriesBannerFocused, setSeriesBannerFocused] = useState(false);

  // Netflix-style 3-second Auto-Trailer preview states
  const [showMovieTrailer, setShowMovieTrailer] = useState(false);
  const [showSeriesTrailer, setShowSeriesTrailer] = useState(false);
  const [movieTrailerUrl, setMovieTrailerUrl] = useState<string>('');
  const [seriesTrailerUrl, setSeriesTrailerUrl] = useState<string>('');
  const [isMovieMuted, setIsMovieMuted] = useState(true);
  const [isSeriesMuted, setIsSeriesMuted] = useState(true);

  // Timers
  const movieTimerRef = useRef<NodeJS.Timeout | null>(null);
  const seriesTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeMovie = movies.length > 0 ? movies[movieIndex % movies.length] : null;
  const activeSeries = series.length > 0 ? series[seriesIndex % series.length] : null;

  // 1. AUTO-CYCLE BANNERS CONTINUOUSLY
  // Movie banner auto-cycles every 7s when not focused/playing trailer
  useEffect(() => {
    if (movies.length <= 1 || movieBannerFocused || showMovieTrailer) return;

    const interval = setInterval(() => {
      setMovieIndex((prev) => (prev + 1) % movies.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [movies.length, movieBannerFocused, showMovieTrailer]);

  // Series banner auto-cycles every 8.5s when not focused/playing trailer
  useEffect(() => {
    if (series.length <= 1 || seriesBannerFocused || showSeriesTrailer) return;

    const interval = setInterval(() => {
      setSeriesIndex((prev) => (prev + 1) % series.length);
    }, 8500);

    return () => clearInterval(interval);
  }, [series.length, seriesBannerFocused, showSeriesTrailer]);

  // 2. 3-SECOND TRAILER TRIGGER FOR MOVIE BANNER
  useEffect(() => {
    if (movieTimerRef.current) {
      clearTimeout(movieTimerRef.current);
      movieTimerRef.current = null;
    }

    if (movieBannerFocused && activeMovie) {
      movieTimerRef.current = setTimeout(async () => {
        try {
          const url = await getTrailerEmbedUrl(activeMovie, isMovieMuted);
          setMovieTrailerUrl(url);
          setShowMovieTrailer(true);
        } catch {
          setShowMovieTrailer(false);
        }
      }, 3000);
    } else {
      setShowMovieTrailer(false);
      setMovieTrailerUrl('');
    }

    return () => {
      if (movieTimerRef.current) {
        clearTimeout(movieTimerRef.current);
      }
    };
  }, [movieBannerFocused, activeMovie?.id, isMovieMuted]);

  // 3. 3-SECOND TRAILER TRIGGER FOR SERIES BANNER
  useEffect(() => {
    if (seriesTimerRef.current) {
      clearTimeout(seriesTimerRef.current);
      seriesTimerRef.current = null;
    }

    if (seriesBannerFocused && activeSeries) {
      seriesTimerRef.current = setTimeout(async () => {
        try {
          const url = await getTrailerEmbedUrl(activeSeries, isSeriesMuted);
          setSeriesTrailerUrl(url);
          setShowSeriesTrailer(true);
        } catch {
          setShowSeriesTrailer(false);
        }
      }, 3000);
    } else {
      setShowSeriesTrailer(false);
      setSeriesTrailerUrl('');
    }

    return () => {
      if (seriesTimerRef.current) {
        clearTimeout(seriesTimerRef.current);
      }
    };
  }, [seriesBannerFocused, activeSeries?.id, isSeriesMuted]);

  const handlePrevMovie = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowMovieTrailer(false);
    setMovieIndex((prev) => (prev > 0 ? prev - 1 : movies.length - 1));
  };

  const handleNextMovie = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowMovieTrailer(false);
    setMovieIndex((prev) => (prev + 1) % movies.length);
  };

  const handlePrevSeries = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowSeriesTrailer(false);
    setSeriesIndex((prev) => (prev > 0 ? prev - 1 : series.length - 1));
  };

  const handleNextSeries = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowSeriesTrailer(false);
    setSeriesIndex((prev) => (prev + 1) % series.length);
  };

  return (
    <div className="w-full mb-8 sm:mb-12">
      {/* Dual Banners Grid: Left = Movies, Right = Series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* ========================================================================= */}
        {/* BANNER 1: FILMES (ESQUERDA - SEMPRE FILMES) */}
        {/* ========================================================================= */}
        {activeMovie ? (
          <div
            id="hero-banner-movies"
            tabIndex={0}
            role="button"
            aria-label={`Filme em Destaque: ${activeMovie.title}`}
            onFocus={() => setMovieBannerFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setMovieBannerFocused(false);
              }
            }}
            onMouseEnter={() => setMovieBannerFocused(true)}
            onMouseLeave={() => setMovieBannerFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetails(activeMovie);
              }
            }}
            onClick={() => onOpenDetails(activeMovie)}
            className={`relative group rounded-3xl overflow-hidden h-[340px] sm:h-[400px] xl:h-[440px] bg-neutral-900 shadow-2xl transition-all duration-300 cursor-pointer select-none outline-none ${
              movieBannerFocused
                ? 'scale-[1.02] z-20 ring-4 ring-white border-transparent shadow-rose-950/80'
                : 'border border-neutral-800/80 hover:border-amber-400/80 hover:scale-[1.02] focus-visible:scale-[1.02] focus-visible:ring-4 focus-visible:ring-white focus-visible:z-20'
            }`}
          >
            {/* Auto-Play Trailer (Netflix Effect after 3 seconds of focus) */}
            {showMovieTrailer && movieTrailerUrl ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-700 pointer-events-none">
                <iframe
                  src={movieTrailerUrl}
                  className="absolute inset-0 w-full h-full scale-[1.35] object-cover pointer-events-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={`Trailer ${activeMovie.title}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/20" />
              </div>
            ) : (
              /* Banner Backdrop Image */
              (activeMovie.backdropUrl || activeMovie.posterUrl ? (
                <img
                  src={activeMovie.backdropUrl || activeMovie.posterUrl}
                  alt={activeMovie.title}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
                    movieBannerFocused ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-neutral-900 to-black flex items-center justify-center">
                  <Film className="w-20 h-20 text-rose-500/20" />
                </div>
              ))
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

              {/* Live Netflix Trailer Indicator */}
              {showMovieTrailer && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900/90 text-rose-400 border border-rose-500/40 backdrop-blur-md animate-pulse">
                  <Clapperboard className="w-3 h-3 text-rose-500" />
                  Trailer Ativo
                </span>
              )}

              {activeMovie.quality && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                  {activeMovie.quality}
                </span>
              )}
            </div>

            {/* Quick Actions (Top Right) */}
            <div
              className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 transition-opacity ${
                movieBannerFocused
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-within:opacity-100'
              }`}
            >
              {/* Sound Toggle for Trailer */}
              {showMovieTrailer && (
                <button
                  type="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMovieMuted(!isMovieMuted);
                  }}
                  title={isMovieMuted ? 'Ativar Som' : 'Mudo'}
                  className="p-1.5 rounded-lg bg-black/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs backdrop-blur-md transition-all active:scale-95"
                >
                  {isMovieMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              )}

              {onOpenFixMatch && (
                <button
                  type="button"
                  tabIndex={movieBannerFocused ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFixMatch(activeMovie);
                  }}
                  title="Identificar Conteúdo (pt-BR)"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-rose-950 focus:bg-rose-950 focus:ring-2 focus:ring-white focus:outline-none text-rose-300 border border-rose-500/40 text-[11px] font-semibold backdrop-blur-md transition-all shadow-md active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  Identificar
                </button>
              )}

              <button
                type="button"
                id="change-movie-cover-btn"
                tabIndex={movieBannerFocused ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCoverEditor(activeMovie);
                }}
                title="Trocar Capa / Banner"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-neutral-800 focus:bg-neutral-800 focus:ring-2 focus:ring-white focus:outline-none text-neutral-300 border border-neutral-700/60 text-[11px] font-semibold backdrop-blur-md transition-all active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                Trocar Capa
              </button>
            </div>

            {/* Content Details Area */}
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col justify-end z-10">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {activeMovie.year && (
                  <span className="text-xs font-semibold text-neutral-300">{activeMovie.year}</span>
                )}
                {activeMovie.rating && (
                  <>
                    <span className="text-neutral-500 text-xs">•</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {activeMovie.rating}
                    </span>
                  </>
                )}
                {activeMovie.duration && (
                  <>
                    <span className="text-neutral-500 text-xs">•</span>
                    <span className="text-xs text-neutral-400">{activeMovie.duration}</span>
                  </>
                )}
                {activeMovie.genre && activeMovie.genre.length > 0 && (
                  <>
                    <span className="text-neutral-500 text-xs">•</span>
                    <span className="text-xs text-neutral-400">{activeMovie.genre.slice(0, 2).join(', ')}</span>
                  </>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md line-clamp-1 mb-2">
                {activeMovie.title}
              </h2>

              {activeMovie.overview && (
                <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 max-w-xl mb-4 font-normal leading-relaxed drop-shadow">
                  {activeMovie.overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(activeMovie);
                    }}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-neutral-200 focus-visible:bg-neutral-200 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none text-neutral-950 font-bold text-xs sm:text-sm shadow-xl transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Assistir
                  </button>

                  <button
                    type="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(activeMovie);
                    }}
                    className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none text-white text-xs sm:text-sm font-semibold border border-neutral-700/80 backdrop-blur-md transition-all active:scale-95"
                  >
                    <Info className="w-4 h-4" />
                    Mais Detalhes
                  </button>

                  <button
                    type="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(activeMovie.id);
                    }}
                    className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:outline-none text-neutral-300 hover:text-rose-500 border border-neutral-700/80 backdrop-blur-md transition-all"
                    title={favorites.includes(activeMovie.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {favorites.includes(activeMovie.id) ? (
                      <BookmarkCheck className="w-4 h-4 text-rose-500 fill-rose-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Indicator dots */}
                {movies.length > 1 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-neutral-800 backdrop-blur-md">
                    {movies.slice(0, 5).map((_, idx) => (
                      <span
                        key={idx}
                        className={`transition-all rounded-full ${
                          idx === movieIndex % Math.min(5, movies.length)
                            ? 'w-4 h-1.5 bg-rose-500'
                            : 'w-1.5 h-1.5 bg-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Carousel Arrows */}
            {movies.length > 1 && (
              <>
                <button
                  type="button"
                  tabIndex={movieBannerFocused ? 0 : -1}
                  onClick={handlePrevMovie}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 focus:bg-black/90 focus:ring-2 focus:ring-white focus:outline-none text-white transition-opacity backdrop-blur-md ${
                    movieBannerFocused ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Filme Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  tabIndex={movieBannerFocused ? 0 : -1}
                  onClick={handleNextMovie}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 focus:bg-black/90 focus:ring-2 focus:ring-white focus:outline-none text-white transition-opacity backdrop-blur-md ${
                    movieBannerFocused ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Próximo Filme"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        ) : (
          /* Empty movies placeholder */
          <div className="relative rounded-3xl overflow-hidden h-[340px] sm:h-[400px] xl:h-[440px] bg-black border border-neutral-800/60 shadow-2xl flex flex-col items-center justify-center p-6 select-none">
            <span className="text-white/80 font-bold text-sm sm:text-base tracking-[0.3em] uppercase">
              EM BREVE
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BANNER 2: SÉRIES (DIREITA - SEMPRE SÉRIES) */}
        {/* Se não tiver nenhuma série: tela preta com EM BREVE branco no meio */}
        {/* ========================================================================= */}
        {activeSeries && series.length > 0 ? (
          <div
            id="hero-banner-series"
            tabIndex={0}
            role="button"
            aria-label={`Série em Destaque: ${activeSeries.title}`}
            onFocus={() => setSeriesBannerFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setSeriesBannerFocused(false);
              }
            }}
            onMouseEnter={() => setSeriesBannerFocused(true)}
            onMouseLeave={() => setSeriesBannerFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetails(activeSeries);
              }
            }}
            onClick={() => onOpenDetails(activeSeries)}
            className={`relative group rounded-3xl overflow-hidden h-[340px] sm:h-[400px] xl:h-[440px] bg-neutral-900 shadow-2xl transition-all duration-300 cursor-pointer select-none outline-none ${
              seriesBannerFocused
                ? 'scale-[1.02] z-20 ring-4 ring-white border-transparent shadow-amber-950/80'
                : 'border border-neutral-800/80 hover:border-amber-400/80 hover:scale-[1.02] focus-visible:scale-[1.02] focus-visible:ring-4 focus-visible:ring-white focus-visible:z-20'
            }`}
          >
            {/* Auto-Play Trailer (Netflix Effect after 3 seconds of focus) */}
            {showSeriesTrailer && seriesTrailerUrl ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-700 pointer-events-none">
                <iframe
                  src={seriesTrailerUrl}
                  className="absolute inset-0 w-full h-full scale-[1.35] object-cover pointer-events-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={`Trailer ${activeSeries.title}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/20" />
              </div>
            ) : (
              /* Banner Backdrop Image */
              (activeSeries.backdropUrl || activeSeries.posterUrl ? (
                <img
                  src={activeSeries.backdropUrl || activeSeries.posterUrl}
                  alt={activeSeries.title}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
                    seriesBannerFocused ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-neutral-900 to-black flex items-center justify-center">
                  <Tv className="w-20 h-20 text-indigo-500/20" />
                </div>
              ))
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

              {/* Live Netflix Trailer Indicator */}
              {showSeriesTrailer && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900/90 text-amber-400 border border-amber-500/40 backdrop-blur-md animate-pulse">
                  <Clapperboard className="w-3 h-3 text-amber-400" />
                  Trailer Ativo
                </span>
              )}

              {activeSeries.quality && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                  {activeSeries.quality}
                </span>
              )}
            </div>

            {/* Quick Actions (Top Right) */}
            <div
              className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 transition-opacity ${
                seriesBannerFocused
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-within:opacity-100'
              }`}
            >
              {/* Sound Toggle for Trailer */}
              {showSeriesTrailer && (
                <button
                  type="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSeriesMuted(!isSeriesMuted);
                  }}
                  title={isSeriesMuted ? 'Ativar Som' : 'Mudo'}
                  className="p-1.5 rounded-lg bg-black/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs backdrop-blur-md transition-all active:scale-95"
                >
                  {isSeriesMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              )}

              {onOpenFixMatch && (
                <button
                  type="button"
                  tabIndex={seriesBannerFocused ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFixMatch(activeSeries);
                  }}
                  title="Identificar Conteúdo (pt-BR)"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-amber-950 focus:bg-amber-950 focus:ring-2 focus:ring-white focus:outline-none text-amber-300 border border-amber-500/40 text-[11px] font-semibold backdrop-blur-md transition-all shadow-md active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Identificar
                </button>
              )}

              <button
                type="button"
                id="change-series-cover-btn"
                tabIndex={seriesBannerFocused ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCoverEditor(activeSeries);
                }}
                title="Trocar Capa / Banner"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-neutral-800 focus:bg-neutral-800 focus:ring-2 focus:ring-white focus:outline-none text-neutral-300 border border-neutral-700/60 text-[11px] font-semibold backdrop-blur-md transition-all active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                Trocar Capa
              </button>
            </div>

            {/* Content Details Area */}
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col justify-end z-10">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {activeSeries.year && (
                  <span className="text-xs font-semibold text-neutral-300">{activeSeries.year}</span>
                )}
                {activeSeries.rating && (
                  <>
                    <span className="text-neutral-500 text-xs">•</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {activeSeries.rating}
                    </span>
                  </>
                )}
                {activeSeries.seasons && (
                  <>
                    <span className="text-neutral-500 text-xs">•</span>
                    <span className="text-xs font-medium text-neutral-400">
                      {activeSeries.seasons.length} Temp{activeSeries.seasons.length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
                {activeSeries.genre && activeSeries.genre.length > 0 && (
                  <>
                    <span className="text-neutral-500 text-xs">•</span>
                    <span className="text-xs text-neutral-400">{activeSeries.genre.slice(0, 2).join(', ')}</span>
                  </>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md line-clamp-1 mb-2">
                {activeSeries.title}
              </h2>

              {activeSeries.overview && (
                <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 max-w-xl mb-4 font-normal leading-relaxed drop-shadow">
                  {activeSeries.overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(activeSeries);
                    }}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 focus-visible:bg-amber-300 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none text-neutral-950 font-bold text-xs sm:text-sm shadow-xl transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Assistir
                  </button>

                  <button
                    type="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(activeSeries);
                    }}
                    className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none text-white text-xs sm:text-sm font-semibold border border-neutral-700/80 backdrop-blur-md transition-all active:scale-95"
                  >
                    <Info className="w-4 h-4" />
                    Mais Detalhes
                  </button>

                  <button
                    type="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(activeSeries.id);
                    }}
                    className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:outline-none text-neutral-300 hover:text-rose-500 border border-neutral-700/80 backdrop-blur-md transition-all"
                    title={favorites.includes(activeSeries.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {favorites.includes(activeSeries.id) ? (
                      <BookmarkCheck className="w-4 h-4 text-rose-500 fill-rose-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Indicator dots */}
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

            {/* Carousel Arrows */}
            {series.length > 1 && (
              <>
                <button
                  type="button"
                  tabIndex={seriesBannerFocused ? 0 : -1}
                  onClick={handlePrevSeries}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 focus:bg-black/90 focus:ring-2 focus:ring-white focus:outline-none text-white transition-opacity backdrop-blur-md ${
                    seriesBannerFocused ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Série Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  tabIndex={seriesBannerFocused ? 0 : -1}
                  onClick={handleNextSeries}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 focus:bg-black/90 focus:ring-2 focus:ring-white focus:outline-none text-white transition-opacity backdrop-blur-md ${
                    seriesBannerFocused ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Próxima Série"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* BANNER 2 VAZIO: TELA PRETA COM 'EM BREVE' BRANCO NO MEIO (DISCRETO MAS VISÍVEL) */
          /* ========================================================================= */
          <div
            id="hero-banner-series-empty"
            tabIndex={0}
            aria-label="Séries: Em breve"
            className="relative rounded-3xl overflow-hidden h-[340px] sm:h-[400px] xl:h-[440px] bg-black border border-neutral-900 shadow-2xl flex flex-col items-center justify-center p-6 select-none group focus:ring-4 focus:ring-white/40 outline-none transition-all"
          >
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <span className="text-white/80 font-bold text-sm sm:text-base tracking-[0.35em] uppercase drop-shadow">
                EM BREVE
              </span>
              <span className="text-[11px] text-neutral-500 tracking-wider">
                Novas séries e temporadas serão exibidas aqui
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
