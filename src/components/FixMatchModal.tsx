import React, { useState } from 'react';
import {
  X,
  Search,
  Check,
  Film,
  Tv,
  Star,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { MediaItem } from '../types';
import {
  searchMultipleMetadataMatches,
  ScrapedMetadata,
} from '../services/metadataScraper';
import { saveCustomCover } from '../services/coverService';

interface FixMatchModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyMatch?: (updatedItem: MediaItem) => void;
  onSaveMatch?: (updatedItem: MediaItem) => void;
  onOpenSettings?: () => void;
}

export default function FixMatchModal({
  item,
  isOpen,
  onClose,
  onApplyMatch,
  onSaveMatch,
  onOpenSettings,
}: FixMatchModalProps) {
  if (!isOpen || !item) return null;

  const handleNotifySave = (updated: MediaItem) => {
    if (onApplyMatch) onApplyMatch(updated);
    if (onSaveMatch) onSaveMatch(updated);
  };

  const [searchTitle, setSearchTitle] = useState(item.cleanTitle || item.title);
  const [searchYear, setSearchYear] = useState(item.year || '');
  const [results, setResults] = useState<ScrapedMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Manual fields
  const [manualTitle, setManualTitle] = useState(item.title);
  const [manualPoster, setManualPoster] = useState(item.posterUrl || '');
  const [manualBackdrop, setManualBackdrop] = useState(item.backdropUrl || '');
  const [manualOverview, setManualOverview] = useState(item.overview || '');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTitle.trim()) return;

    setIsLoading(true);
    setSearched(true);
    try {
      const matches = await searchMultipleMetadataMatches(
        searchTitle.trim(),
        item.type,
        searchYear.trim() || undefined
      );
      setResults(matches);
    } catch (err) {
      console.error('Error searching matches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectResult = (result: ScrapedMetadata) => {
    const updated: MediaItem = {
      ...item,
      title: result.title || item.title,
      originalTitle: result.originalTitle || item.originalTitle,
      posterUrl: result.posterUrl || item.posterUrl,
      backdropUrl: result.backdropUrl || item.backdropUrl,
      overview: result.overview || item.overview,
      year: result.year || item.year,
      rating: result.rating || item.rating,
      director: result.director || item.director,
      cast: result.cast || item.cast,
      genre: result.genres && result.genres.length > 0 ? result.genres : item.genre,
      contentRating: result.contentRating || item.contentRating,
      tagline: result.tagline || item.tagline,
      imdbId: result.imdbId || item.imdbId,
      tmdbId: result.tmdbId || item.tmdbId,
    };

    // Save to persistent custom cover storage
    saveCustomCover(item.id, {
      title: updated.title,
      posterUrl: updated.posterUrl,
      backdropUrl: updated.backdropUrl,
      overview: updated.overview,
    });

    handleNotifySave(updated);
    onClose();
  };

  const handleSaveManual = () => {
    const updated: MediaItem = {
      ...item,
      title: manualTitle || item.title,
      posterUrl: manualPoster || item.posterUrl,
      backdropUrl: manualBackdrop || item.backdropUrl,
      overview: manualOverview || item.overview,
    };

    saveCustomCover(item.id, {
      title: updated.title,
      posterUrl: updated.posterUrl,
      backdropUrl: updated.backdropUrl,
      overview: updated.overview,
    });

    handleNotifySave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-100">
                  Identificar Conteúdo (Scraper pt-BR)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  🇧🇷 TMDb / pt-BR
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Plex & Jellyfin Matcher: Pesquise capas oficiais, sinopse em português e detalhes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1"
                title="Configurar Provedores"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Provedores</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="px-6 pt-3 pb-0 flex items-center gap-4 border-b border-neutral-800/80 text-xs font-semibold">
          <button
            onClick={() => setManualMode(false)}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              !manualMode
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Busca Automática nos Scrapers
          </button>
          <button
            onClick={() => setManualMode(true)}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              manualMode
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Edição Manual / URLs
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!manualMode ? (
            <>
              {/* Search Form */}
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTitle}
                      onChange={(e) => setSearchTitle(e.target.value)}
                      placeholder="Título do filme ou série (ex: Oppenheimer, Velozes e Furiosos)..."
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <input
                      type="text"
                      value={searchYear}
                      onChange={(e) => setSearchYear(e.target.value)}
                      placeholder="Ano (ex: 2023)"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 text-center focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !searchTitle.trim()}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Pesquisar
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                  <span>
                    Arquivo original: <strong className="text-neutral-400 font-mono">{item.movieFile?.name || item.cleanTitle}</strong>
                  </span>
                  <span>Provedores: TMDb (pt-BR), Cinemeta (IMDb), Wikipédia pt-BR</span>
                </div>
              </form>

              {/* Search Results */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  Resultados Encontrados ({results.length})
                </h4>

                {isLoading && (
                  <div className="py-12 flex flex-col items-center justify-center text-neutral-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
                    <p className="text-xs font-medium">Consultando The Movie Database e bases pt-BR...</p>
                  </div>
                )}

                {!isLoading && searched && results.length === 0 && (
                  <div className="py-10 text-center bg-neutral-950/40 rounded-2xl border border-neutral-800 p-6 space-y-2">
                    <p className="text-sm font-semibold text-neutral-300">
                      Nenhum resultado correspondente encontrado.
                    </p>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      Tente simplificar o título ou buscar pelo nome original. Você também pode preencher os dados manualmente na aba "Edição Manual".
                    </p>
                  </div>
                )}

                {!isLoading && results.length > 0 && (
                  <div className="grid grid-cols-1 gap-3">
                    {results.map((res) => (
                      <div
                        key={res.id}
                        className="p-3.5 rounded-2xl bg-neutral-950/80 hover:bg-neutral-800/90 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col sm:flex-row gap-4 items-start group"
                      >
                        {/* Poster */}
                        <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0 shadow-md">
                          {res.posterUrl ? (
                            <img
                              src={res.posterUrl}
                              alt={res.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                              <Film className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                              {res.title}
                            </span>
                            {res.year && (
                              <span className="text-xs text-neutral-400 font-semibold">
                                ({res.year})
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-neutral-800 text-neutral-300 border border-neutral-700">
                              {res.type === 'movie' ? 'Filme' : 'Série'}
                            </span>
                            {res.rating && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                {res.rating}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/60">
                              {res.provider.toUpperCase()}
                            </span>
                          </div>

                          {res.originalTitle && res.originalTitle !== res.title && (
                            <p className="text-[11px] text-neutral-400 italic">
                              Título original: {res.originalTitle}
                            </p>
                          )}

                          <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">
                            {res.overview || 'Sinopse não disponível na fonte.'}
                          </p>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => handleSelectResult(res)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-800 hover:bg-rose-600 text-neutral-200 hover:text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 self-center sm:self-auto shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aplicar Metadados
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Manual Mode */
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">
                  Título em Português:
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">
                  URL da Capa Vertical (Pôster 2:3):
                </label>
                <input
                  type="url"
                  value={manualPoster}
                  onChange={(e) => setManualPoster(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/w780/..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">
                  URL do Banner Horizontal (Backdrop 16:9):
                </label>
                <input
                  type="url"
                  value={manualBackdrop}
                  onChange={(e) => setManualBackdrop(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/original/..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">
                  Sinopse em Português Brasileiro:
                </label>
                <textarea
                  rows={4}
                  value={manualOverview}
                  onChange={(e) => setManualOverview(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveManual}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition-all"
                >
                  Salvar Alterações Manuais
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
