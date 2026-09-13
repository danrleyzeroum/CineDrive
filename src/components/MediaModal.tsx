import { useState, useMemo } from 'react';
import {
  X,
  Play,
  Film,
  Tv,
  HardDrive,
  Calendar,
  FileVideo,
  Bookmark,
  BookmarkCheck,
  Image as ImageIcon,
  Star,
  Sparkles,
  Users,
  Clapperboard,
} from 'lucide-react';
import { MediaItem, Episode, DriveAccount } from '../types';
import { isVideoFile } from '../services/mediaParser';

interface MediaModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onPlayMovie: (item: MediaItem) => void;
  onPlayEpisode: (episode: Episode, series: MediaItem) => void;
  onOpenCoverEditor?: (item: MediaItem) => void;
  onOpenFixMatch?: (item: MediaItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (mediaId: string) => void;
  accounts: DriveAccount[];
}

export default function MediaModal({
  item,
  onClose,
  onPlayMovie,
  onPlayEpisode,
  onOpenCoverEditor,
  onOpenFixMatch,
  isFavorite,
  onToggleFavorite,
}: MediaModalProps) {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  if (!item) return null;

  // Filter out any non-video files (.nfo, .txt, etc.) from displayed seasons & episodes
  const seasons = useMemo(() => {
    return (item.seasons || [])
      .map((s) => ({
        ...s,
        episodes: s.episodes.filter((ep) => isVideoFile(ep.rawFileName)),
      }))
      .filter((s) => s.episodes.length > 0);
  }, [item]);

  const currentSeason = seasons.find((s) => s.seasonNumber === selectedSeason) || seasons[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          id="close-media-modal-btn"
          tabIndex={0}
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/70 hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none text-white backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner Header */}
        <div className="relative w-full h-64 sm:h-84 bg-neutral-950 shrink-0 overflow-hidden">
          {item.backdropUrl || item.posterUrl ? (
            <img
              src={item.backdropUrl || item.posterUrl}
              alt={item.title}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-950 via-neutral-900 to-black">
              {item.type === 'movie' ? (
                <Film className="w-20 h-20 text-rose-500/30" />
              ) : (
                <Tv className="w-20 h-20 text-amber-500/30" />
              )}
            </div>
          )}

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 via-neutral-900/40 to-transparent" />

          {/* Scraper / Cover Buttons (Top Left) */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            {onOpenFixMatch && (
              <button
                id="modal-fix-match-btn"
                tabIndex={0}
                onClick={() => onOpenFixMatch(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-rose-950 focus-visible:bg-rose-950 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none text-rose-300 border border-rose-500/40 text-xs font-semibold backdrop-blur-md transition-all shadow-lg hover:scale-105 focus-visible:scale-105"
                title="Identificar automaticamente no TMDb / Plex / Jellyfin Scraper"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Identificar Conteúdo (pt-BR)
              </button>
            )}

            {onOpenCoverEditor && (
              <button
                id="modal-change-cover-btn"
                tabIndex={0}
                onClick={() => onOpenCoverEditor(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none text-amber-300 border border-amber-500/40 text-xs font-semibold backdrop-blur-md transition-all shadow-lg hover:scale-105 focus-visible:scale-105"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                Alterar Capa
              </button>
            )}
          </div>

          {/* Header Overlay Content */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-4 z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                  {item.type === 'movie' ? 'Filme' : 'Série'}
                </span>
                {item.year && (
                  <span className="text-xs font-semibold text-neutral-300">
                    {item.year}
                  </span>
                )}
                {item.rating && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {item.rating}/10
                  </span>
                )}
                {item.contentRating && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-200 border border-neutral-700">
                    {item.contentRating}
                  </span>
                )}
                {item.quality && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.quality}
                  </span>
                )}
                {item.accounts.map((acc) => (
                  <span
                    key={acc.accountId}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      acc.color === 'blue'
                        ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                        : 'bg-purple-950/80 text-purple-300 border-purple-800'
                    }`}
                  >
                    {acc.accountLabel}
                  </span>
                ))}
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                {item.title}
              </h2>

              {item.tagline && (
                <p className="text-xs sm:text-sm text-neutral-400 italic">
                  "{item.tagline}"
                </p>
              )}

              {/* Genre Pills */}
              {item.genre && item.genre.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {item.genre.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/60"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              {item.type === 'movie' && (
                <button
                  id="play-movie-btn"
                  tabIndex={0}
                  onClick={() => onPlayMovie(item)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 focus-visible:bg-amber-400 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none text-black font-black text-xs sm:text-sm shadow-xl hover:scale-105 focus-visible:scale-105 transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Assistir Filme
                </button>
              )}

              {item.type === 'series' && currentSeason?.episodes[0] && (
                <button
                  id="play-first-episode-btn"
                  tabIndex={0}
                  onClick={() => onPlayEpisode(currentSeason.episodes[0], item)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 focus-visible:bg-amber-400 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none text-black font-black text-xs sm:text-sm shadow-xl hover:scale-105 focus-visible:scale-105 transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Assistir T{currentSeason.seasonNumber}:E{currentSeason.episodes[0].episodeNumber}
                </button>
              )}

              <button
                id="modal-favorite-btn"
                tabIndex={0}
                onClick={() => onToggleFavorite(item.id)}
                className={`p-2.5 rounded-xl border focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:outline-none transition-all ${
                  isFavorite
                    ? 'bg-rose-600/30 border-rose-500 text-rose-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white focus-visible:text-white'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                {isFavorite ? <BookmarkCheck className="w-4 h-4 fill-rose-500 text-rose-500" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Synopsis with Poster Card Side-by-Side */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {item.posterUrl && (
              <div className="w-28 sm:w-36 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0 shadow-lg hidden sm:block">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="space-y-3 flex-1 min-w-0">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Sinopse em Português (pt-BR)
                  </h4>
                  {item.originalTitle && item.originalTitle !== item.title && (
                    <span className="text-[11px] text-neutral-500">
                      Original: <strong className="text-neutral-400">{item.originalTitle}</strong>
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                  {item.overview || 'Vídeo catalogado a partir do seu armazenamento unificado no Google Drive.'}
                </p>
              </div>

              {/* Director & Crew info */}
              {item.director && (
                <div className="pt-2 flex items-center gap-2 text-xs">
                  <Clapperboard className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-neutral-400">Direção:</span>
                  <span className="text-neutral-200 font-semibold">{item.director}</span>
                </div>
              )}

              {/* Cast Chips */}
              {item.cast && item.cast.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Elenco Principal:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.cast.map((actor) => (
                      <span
                        key={actor}
                        className="px-2 py-0.5 rounded-lg text-xs font-medium bg-neutral-950 border border-neutral-800 text-neutral-300"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Series Episodes Explorer */}
          {item.type === 'series' && seasons.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-amber-500" />
                  Episódios & Temporadas
                </h4>

                {/* Season Tabs */}
                {seasons.length > 1 && (
                  <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                    {seasons.map((s) => (
                      <button
                        key={s.seasonNumber}
                        id={`season-tab-${s.seasonNumber}`}
                        onClick={() => setSelectedSeason(s.seasonNumber)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                          selectedSeason === s.seasonNumber
                            ? 'bg-amber-500 text-black font-bold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        Temp {s.seasonNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Episodes List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentSeason?.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    id={`episode-row-${ep.id}`}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPlayEpisode(ep, item);
                      }
                    }}
                    onClick={() => onPlayEpisode(ep, item)}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/80 focus-visible:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none border border-neutral-800/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 group-hover:bg-amber-500 group-focus-visible:bg-amber-500 flex items-center justify-center text-neutral-400 group-hover:text-black group-focus-visible:text-black transition-colors shrink-0">
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-200 group-hover:text-amber-400 group-focus-visible:text-amber-400 transition-colors">
                            Ep. {ep.episodeNumber} - {ep.title}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                              ep.accountLabel.includes('1')
                                ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                                : 'bg-purple-950/60 text-purple-400 border-purple-800/60'
                            }`}
                          >
                            {ep.accountLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {ep.rawFileName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400 shrink-0">
                      {ep.size && <span>{ep.size}</span>}
                      {ep.durationFormatted && (
                        <>
                          <span>•</span>
                          <span>{ep.durationFormatted}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical File Info (for Movies) */}
          {item.type === 'movie' && item.movieFile && (
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-rose-500" />
                Informações do Arquivo no Google Drive
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                  <span className="text-neutral-500 text-[11px]">Nome Original:</span>
                  <p className="text-neutral-200 font-mono break-all">{item.movieFile.name}</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                  <span className="text-neutral-500 text-[11px]">Drive de Origem:</span>
                  <div className="flex items-center gap-1.5 text-neutral-200 font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-rose-500" />
                    <span>{item.movieFile.accountLabel}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                  <span className="text-neutral-500 text-[11px]">Formato / MIME:</span>
                  <p className="text-neutral-200">{item.movieFile.mimeType}</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                  <span className="text-neutral-500 text-[11px]">Última Modificação:</span>
                  <div className="flex items-center gap-1.5 text-neutral-200">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {item.movieFile.modifiedTime
                        ? new Date(item.movieFile.modifiedTime).toLocaleDateString('pt-BR')
                        : 'Desconhecida'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
