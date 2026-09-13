import React, { useState, FormEvent } from 'react';
import { X, Search, Image as ImageIcon, Check, Sparkles, RefreshCw, Upload, Film, Tv, ExternalLink } from 'lucide-react';
import { MediaItem } from '../types';
import { searchCoversOnline, CoverSearchResult, saveCustomCover } from '../services/coverService';

interface CoverEditorModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCover: (updatedItem: MediaItem) => void;
}

export default function CoverEditorModal({
  item,
  isOpen,
  onClose,
  onSaveCover,
}: CoverEditorModalProps) {
  if (!isOpen || !item) return null;

  const [activeTab, setActiveTab] = useState<'search' | 'url'>('search');
  const [searchQuery, setSearchQuery] = useState(item.cleanTitle || item.title);
  const [searchResults, setSearchResults] = useState<CoverSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<string>(item.posterUrl || '');
  const [selectedBackdrop, setSelectedBackdrop] = useState<string>(item.backdropUrl || '');
  const [customTitle, setCustomTitle] = useState(item.title);
  const [customOverview, setCustomOverview] = useState(item.overview || '');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchCoversOnline(searchQuery.trim(), item.type);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching covers:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyResult = (result: CoverSearchResult) => {
    if (result.posterUrl) setSelectedPoster(result.posterUrl);
    if (result.backdropUrl) setSelectedBackdrop(result.backdropUrl);
    if (result.title) setCustomTitle(result.title);
    if (result.overview) setCustomOverview(result.overview);
  };

  const handleSave = () => {
    const updated: MediaItem = {
      ...item,
      title: customTitle || item.title,
      posterUrl: selectedPoster || item.posterUrl,
      backdropUrl: selectedBackdrop || item.backdropUrl,
      overview: customOverview || item.overview,
    };

    // Save to storage
    saveCustomCover(item.id, {
      posterUrl: selectedPoster,
      backdropUrl: selectedBackdrop,
      title: customTitle,
      overview: customOverview,
    });

    onSaveCover(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Sistema de Capas & Banners
              </h3>
              <p className="text-[11px] text-neutral-400">
                Personalize ou busque a capa e banner oficial de <span className="text-neutral-200 font-semibold">{item.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Preview Side-by-Side: Poster vs Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
            {/* Poster Preview (2:3) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Capa Vertical (Pôster)
              </span>
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-md flex items-center justify-center">
                {selectedPoster ? (
                  <img
                    src={selectedPoster}
                    alt="Poster Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-3 text-neutral-600 text-xs">
                    Sem Capa Vertical
                  </div>
                )}
              </div>
            </div>

            {/* Banner/Backdrop Preview (16:9) */}
            <div className="sm:col-span-2 space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Banner Horizontal (Widescreen)
              </span>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-md flex items-center justify-center">
                {selectedBackdrop ? (
                  <img
                    src={selectedBackdrop}
                    alt="Backdrop Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-3 text-neutral-600 text-xs">
                    Sem Banner Horizontal
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-xs font-bold text-white drop-shadow truncate">
                    {customTitle}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'search'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Buscar Capas Online
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'url'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Inserir Link Manual (URL)
            </button>
          </div>

          {/* Tab 1: Search Online */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: Velozes e Furiosos 10, Resgate, Stranger Things..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
              </form>

              {/* Quick Suggestion buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                <span className="text-[11px] text-neutral-500">Sugestões:</span>
                {['Velozes e Furiosos 10', 'Resgate 2', 'Stranger Things', 'The Last of Us', 'Demon Slayer', 'Super Mario Bros'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setSearchQuery(sug);
                      searchCoversOnline(sug, item.type).then(setSearchResults);
                    }}
                    className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Search Results Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-300">
                  Resultados Encontrados ({searchResults.length})
                </h4>

                {searchResults.length === 0 && !isSearching && (
                  <div className="py-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                    Digite o nome do filme ou série e clique em "Buscar" para encontrar pôsteres oficiais em alta resolução.
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                  {searchResults.map((result) => {
                    const isSelected = selectedPoster === result.posterUrl;
                    return (
                      <div
                        key={result.id}
                        onClick={() => handleApplyResult(result)}
                        className={`group relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-400 shadow-md'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-neutral-900 mb-2 relative">
                          {result.posterUrl ? (
                            <img
                              src={result.posterUrl}
                              alt={result.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                              Sem Pôster
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-neutral-200 truncate group-hover:text-amber-400">
                            {result.title}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {result.year ? `${result.year} • ` : ''}
                            {result.type === 'series' ? 'Série' : 'Filme'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Manual URL & Info */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  URL da Capa Vertical (Pôster 2:3)
                </label>
                <input
                  type="text"
                  value={selectedPoster}
                  onChange={(e) => setSelectedPoster(e.target.value)}
                  placeholder="https://exemplo.com/poster.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  URL do Banner Widescreen (Horizontal 16:9)
                </label>
                <input
                  type="text"
                  value={selectedBackdrop}
                  onChange={(e) => setSelectedBackdrop(e.target.value)}
                  placeholder="https://exemplo.com/banner.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Título Exibido
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Sinopse / Descrição
                </label>
                <textarea
                  rows={3}
                  value={customOverview}
                  onChange={(e) => setCustomOverview(e.target.value)}
                  placeholder="Sinopse do filme ou série..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-950 transition-all hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Salvar Capa & Banner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
