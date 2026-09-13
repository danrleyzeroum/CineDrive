import { Play, Info, Bookmark, BookmarkCheck, Film, Tv } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaHeroProps {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (mediaId: string) => void;
}

export default function MediaHero({
  item,
  onPlay,
  onOpenDetails,
  isFavorite,
  onToggleFavorite,
}: MediaHeroProps) {
  // Use backdrop or thumbnail if available, or generate a sleek gradient
  const hasBackdrop = Boolean(item.backdropUrl || item.posterUrl);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[520px] rounded-3xl overflow-hidden mb-10 border border-neutral-800/80 group">
      {/* Background Graphic */}
      {hasBackdrop ? (
        <img
          src={item.backdropUrl || item.posterUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-neutral-900 to-black" />
      )}

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent" />

      {/* Hero Content */}
      <div className="absolute inset-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-end max-w-2xl">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-600/90 text-white shadow-sm">
            {item.type === 'movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
            {item.type === 'movie' ? 'Filme em Destaque' : 'Série em Destaque'}
          </span>

          {item.year && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-900/80 text-neutral-300 border border-neutral-700/60">
              {item.year}
            </span>
          )}

          {item.quality && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {item.quality}
            </span>
          )}

          {/* Drive source badge */}
          {item.accounts.map((acc) => (
            <span
              key={acc.accountId}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                acc.color === 'blue'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                  : 'bg-purple-950/60 text-purple-300 border-purple-800/60'
              }`}
            >
              {acc.accountLabel}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-3 drop-shadow-md">
          {item.title}
        </h1>

        {/* Synopsis / Info */}
        <p className="text-sm text-neutral-300 line-clamp-3 mb-6 font-normal leading-relaxed max-w-xl drop-shadow">
          {item.overview ||
            (item.type === 'series'
              ? `${item.seasons?.length || 1} Temporada(s) disponível(is) para assistir diretamente do Google Drive.`
              : 'Filme pronto para streaming direto do seu Google Drive em alta definição.')}
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="hero-play-btn"
            onClick={() => onPlay(item)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-sm shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play className="w-4 h-4 fill-black" />
            Assistir Agora
          </button>

          <button
            id="hero-details-btn"
            onClick={() => onOpenDetails(item)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold text-sm backdrop-blur-sm transition-all"
          >
            <Info className="w-4 h-4" />
            Detalhes
          </button>

          <button
            id="hero-favorite-btn"
            onClick={() => onToggleFavorite(item.id)}
            className={`p-3 rounded-xl border backdrop-blur-sm transition-all ${
              isFavorite
                ? 'bg-rose-600/30 border-rose-500 text-rose-400'
                : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title={isFavorite ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
          >
            {isFavorite ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
