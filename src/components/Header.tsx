import { useState } from 'react';
import { Film, Tv, Search, HardDrive, RefreshCw, X, FolderKanban, Bookmark, Sparkles, Compass } from 'lucide-react';
import { DriveAccount } from '../types';

export type AppTab = 'all' | 'movies' | 'series' | 'kids' | 'anime' | 'explore' | 'favorites' | 'folders';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  accounts: DriveAccount[];
  onOpenAccountsModal: () => void;
  isScanning: boolean;
  onRefresh: () => void;
  selectedAccountFilter: string | null; // null for all, or accountId
  onSelectAccountFilter: (accountId: string | null) => void;
  onOpenMetadataSettings?: () => void;
}

export default function Header({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  accounts,
  onOpenAccountsModal,
  isScanning,
  onRefresh,
  selectedAccountFilter,
  onSelectAccountFilter,
  onOpenMetadataSettings,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const totalFiles = accounts.reduce((acc, curr) => acc + (curr.fileCount || 0), 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <div
            id="brand-logo"
            onClick={() => onSelectTab('all')}
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50 group-hover:scale-105 transition-transform shrink-0">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-neutral-100 flex items-center">
                DRIVE<span className="text-rose-500">CINEMA</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 -mt-1 hidden sm:block">
                2 Drives Unificados
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Bar matching the user's screenshot! */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
          {/* INICIO (Pill with golden/amber border as in the print) */}
          <button
            id="tab-all"
            onClick={() => onSelectTab('all')}
            className={`px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
              currentTab === 'all'
                ? 'border border-amber-400 text-white bg-neutral-900/80 shadow-md shadow-amber-500/10 scale-105'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            INICIO
          </button>

          {/* FILMES */}
          <button
            id="tab-movies"
            onClick={() => onSelectTab('movies')}
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
              currentTab === 'movies'
                ? 'border border-amber-400 text-white bg-neutral-900/80 shadow-md scale-105'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900/40'
            }`}
          >
            FILMES
          </button>

          {/* SÉRIES */}
          <button
            id="tab-series"
            onClick={() => onSelectTab('series')}
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
              currentTab === 'series'
                ? 'border border-amber-400 text-white bg-neutral-900/80 shadow-md scale-105'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900/40'
            }`}
          >
            SÉRIES
          </button>

          {/* KIDS (Fun cartoon colored letters from the screenshot!) */}
          <button
            id="tab-kids"
            onClick={() => onSelectTab('kids')}
            className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase transition-all flex items-center gap-0.5 ${
              currentTab === 'kids'
                ? 'border border-amber-400 bg-neutral-900/80 shadow-md scale-105'
                : 'hover:bg-neutral-900/40'
            }`}
          >
            <span className="text-pink-500 font-extrabold">K</span>
            <span className="text-amber-400 font-extrabold">I</span>
            <span className="text-emerald-400 font-extrabold">D</span>
            <span className="text-sky-400 font-extrabold">S</span>
          </button>

          {/* ANIME */}
          <button
            id="tab-anime"
            onClick={() => onSelectTab('anime')}
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
              currentTab === 'anime'
                ? 'border border-amber-400 text-white bg-neutral-900/80 shadow-md scale-105'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900/40'
            }`}
          >
            ANIME
          </button>

          {/* EXPLORAR */}
          <button
            id="tab-explore"
            onClick={() => onSelectTab('explore')}
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
              currentTab === 'explore'
                ? 'border border-amber-400 text-white bg-neutral-900/80 shadow-md scale-105'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900/40'
            }`}
          >
            EXPLORAR
          </button>

          {/* PASTAS DO DRIVE */}
          <button
            id="tab-folders"
            onClick={() => onSelectTab('folders')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
              currentTab === 'folders'
                ? 'bg-neutral-800 text-rose-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Navegar por Pastas"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Pastas</span>
          </button>

          {/* MINHA LISTA */}
          <button
            id="tab-favorites"
            onClick={() => onSelectTab('favorites')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
              currentTab === 'favorites'
                ? 'bg-neutral-800 text-rose-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Minha Lista de Favoritos"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Minha Lista</span>
          </button>
        </nav>

        {/* Right: Search, Drive Filter & Accounts */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative">
            <div className={`flex items-center bg-neutral-900/90 border border-neutral-800 rounded-xl px-2.5 sm:px-3 py-1.5 transition-all ${
              isSearchOpen ? 'w-44 sm:w-56 ring-1 ring-amber-400/60' : 'w-32 sm:w-44'
            }`}>
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <input
                id="search-input"
                type="text"
                placeholder="Buscar títulos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => !searchQuery && setIsSearchOpen(false)}
                className="w-full bg-transparent px-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="text-neutral-500 hover:text-neutral-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Drive Source Filter Pills (if 2 accounts connected) */}
          {accounts.length > 1 && (
            <div className="hidden lg:flex items-center gap-1 bg-neutral-900/80 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
              <button
                id="filter-all-drives"
                onClick={() => onSelectAccountFilter(null)}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  selectedAccountFilter === null
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Ambos
              </button>
              {accounts.map((acc, index) => (
                <button
                  key={acc.id}
                  id={`filter-drive-${index}`}
                  onClick={() => onSelectAccountFilter(acc.id)}
                  className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                    selectedAccountFilter === acc.id
                      ? index === 0
                        ? 'bg-blue-600/80 text-white'
                        : 'bg-purple-600/80 text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-blue-400' : 'bg-purple-400'}`} />
                  {index === 0 ? 'Drive 1' : 'Drive 2'}
                </button>
              ))}
            </div>
          )}

          {/* Metadata / Scrapers Button (Jellyfin/Plex style) */}
          {onOpenMetadataSettings && (
            <button
              id="metadata-settings-btn"
              onClick={onOpenMetadataSettings}
              title="Configurações de Metadados & Scrapers (TMDb pt-BR)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all text-xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden lg:inline text-[11px] font-semibold">Scraper pt-BR</span>
            </button>
          )}

          {/* Sync / Refresh Button */}
          <button
            id="refresh-drives-btn"
            onClick={onRefresh}
            disabled={isScanning || accounts.length === 0}
            title="Sincronizar arquivos do Google Drive"
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Drives Status / Accounts Button */}
          <button
            id="drives-manager-btn"
            onClick={onOpenAccountsModal}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 text-neutral-200 transition-all hover:border-neutral-700 shrink-0"
          >
            <HardDrive className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-[11px] font-bold leading-tight text-neutral-200">
                {accounts.length === 0
                  ? 'Conectar Drives'
                  : accounts.length === 1
                  ? '1/2 Drive Ativo'
                  : '2/2 Drives Ativos'}
              </span>
              <span className="text-[9px] text-neutral-400 leading-tight">
                {totalFiles > 0 ? `${totalFiles} vídeos` : 'Gerenciar'}
              </span>
            </div>
            <div className="flex -space-x-1">
              <div
                className={`w-2 h-2 rounded-full border border-neutral-950 ${
                  accounts[0] ? 'bg-blue-400 ring-2 ring-blue-500/20' : 'bg-neutral-700'
                }`}
                title="Drive 1"
              />
              <div
                className={`w-2 h-2 rounded-full border border-neutral-950 ${
                  accounts[1] ? 'bg-purple-400 ring-2 ring-purple-500/20' : 'bg-neutral-700'
                }`}
                title="Drive 2"
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile TV Navigation Bar */}
      <div className="md:hidden flex items-center justify-between overflow-x-auto border-t border-neutral-800/50 bg-neutral-950/95 px-3 py-2 text-xs gap-1.5">
        <button
          onClick={() => onSelectTab('all')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 ${
            currentTab === 'all' ? 'border border-amber-400 text-white bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          INICIO
        </button>
        <button
          onClick={() => onSelectTab('movies')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 ${
            currentTab === 'movies' ? 'border border-amber-400 text-white bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          FILMES
        </button>
        <button
          onClick={() => onSelectTab('series')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 ${
            currentTab === 'series' ? 'border border-amber-400 text-white bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          SÉRIES
        </button>
        <button
          onClick={() => onSelectTab('kids')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 ${
            currentTab === 'kids' ? 'border border-amber-400 bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          <span className="text-pink-500">K</span>
          <span className="text-amber-400">I</span>
          <span className="text-emerald-400">D</span>
          <span className="text-sky-400">S</span>
        </button>
        <button
          onClick={() => onSelectTab('anime')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 ${
            currentTab === 'anime' ? 'border border-amber-400 text-white bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          ANIME
        </button>
        <button
          onClick={() => onSelectTab('explore')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 ${
            currentTab === 'explore' ? 'border border-amber-400 text-white bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          EXPLORAR
        </button>
        <button
          onClick={() => onSelectTab('favorites')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 ${
            currentTab === 'favorites' ? 'border border-amber-400 text-white bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          LISTA
        </button>
      </div>
    </header>
  );
}
