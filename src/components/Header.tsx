import { useState } from 'react';
import { Film, Search, RefreshCw, X, Bookmark, Settings, HardDrive } from 'lucide-react';
import { DriveAccount } from '../types';

export type AppTab = 'all' | 'movies' | 'series' | 'kids' | 'anime' | 'explore' | 'favorites' | 'folders' | 'settings';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  accounts: DriveAccount[];
  onOpenAccountsModal: () => void;
  isScanning: boolean;
  isBackgroundSyncing?: boolean;
  onRefresh: () => void;
  selectedAccountFilter: string | null; // null for all, or accountId
  onSelectAccountFilter: (accountId: string | null) => void;
  onOpenMetadataSettings?: () => void;
  onOpenNetworkSettings?: () => void;
}

export default function Header({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  accounts,
  onOpenAccountsModal,
  isScanning,
  isBackgroundSyncing = false,
  onRefresh,
  selectedAccountFilter,
  onSelectAccountFilter,
  onOpenMetadataSettings,
  onOpenNetworkSettings,
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
                YOU<span className="text-amber-400">CINE</span>
                <span className="text-[9px] font-bold text-rose-400 ml-1.5 px-1 py-0.5 rounded bg-rose-950/60 border border-rose-800/40">DRIVE</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 -mt-1 hidden sm:block">
                2 Drives Unificados
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Bar matching the user's screenshot! */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
          {/* INICIO */}
          <button
            id="tab-all"
            onClick={() => onSelectTab('all')}
            className={`relative py-1.5 px-3 rounded-full text-xs lg:text-sm font-bold tracking-wider uppercase transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              currentTab === 'all'
                ? 'text-white font-extrabold bg-neutral-900/90 border border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40 border border-transparent'
            }`}
          >
            INICIO
          </button>

          {/* FILMES */}
          <button
            id="tab-movies"
            onClick={() => onSelectTab('movies')}
            className={`relative py-1.5 px-3 text-xs lg:text-sm font-bold tracking-wider uppercase transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              currentTab === 'movies'
                ? 'text-white font-black'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            FILMES
            {currentTab === 'movies' && (
              <span className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </button>

          {/* SÉRIES */}
          <button
            id="tab-series"
            onClick={() => onSelectTab('series')}
            className={`relative py-1.5 px-3 text-xs lg:text-sm font-bold tracking-wider uppercase transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              currentTab === 'series'
                ? 'text-white font-black'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            SÉRIES
            {currentTab === 'series' && (
              <span className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </button>

          {/* KIDS (Fun cartoon colored letters from the screenshot!) */}
          <button
            id="tab-kids"
            onClick={() => onSelectTab('kids')}
            className={`relative py-1.5 px-3 text-xs lg:text-sm font-black tracking-wider uppercase transition-all flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              currentTab === 'kids'
                ? 'scale-105'
                : 'hover:opacity-90'
            }`}
          >
            <span className="text-pink-500 font-extrabold">K</span>
            <span className="text-amber-400 font-extrabold">I</span>
            <span className="text-emerald-400 font-extrabold">D</span>
            <span className="text-sky-400 font-extrabold">S</span>
            {currentTab === 'kids' && (
              <span className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </button>

          {/* ANIME */}
          <button
            id="tab-anime"
            onClick={() => onSelectTab('anime')}
            className={`relative py-1.5 px-3 text-xs lg:text-sm font-bold tracking-wider uppercase transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              currentTab === 'anime'
                ? 'text-white font-black'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            ANIME
            {currentTab === 'anime' && (
              <span className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </button>

          {/* EXPLORAR */}
          <button
            id="tab-explore"
            onClick={() => onSelectTab('explore')}
            className={`relative py-1.5 px-3 text-xs lg:text-sm font-bold tracking-wider uppercase transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              currentTab === 'explore'
                ? 'text-white font-black'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            EXPLORAR
            {currentTab === 'explore' && (
              <span className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </button>

          {/* MINHA LISTA */}
          <button
            id="tab-favorites"
            onClick={() => onSelectTab('favorites')}
            className={`relative py-1.5 px-3 rounded-full text-xs lg:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              currentTab === 'favorites'
                ? 'text-white font-extrabold bg-neutral-900/90 border border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40 border border-transparent'
            }`}
            title="Minha Lista de Favoritos"
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-500" />
            <span>MINHA LISTA</span>
            {currentTab === 'favorites' && (
              <span className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </button>

          {/* ABA CONFIGURAÇÕES (Centraliza Drives, Scraper pt-BR, Nuvem, Rede e Pastas) */}
          <button
            id="tab-settings"
            onClick={() => onSelectTab('settings')}
            className={`relative py-1.5 px-3 rounded-full text-xs lg:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              currentTab === 'settings'
                ? 'text-white font-extrabold bg-neutral-900/90 border border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40 border border-transparent'
            }`}
            title="Aba de Configurações do Sistema"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>CONFIGURAÇÕES</span>
            {currentTab === 'settings' && (
              <span className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </button>
        </nav>

        {/* Right: Search Box & Sync (Clean & Minimalist - Never overflows) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <div
              className={`flex items-center bg-neutral-900/90 border border-neutral-800 rounded-xl px-2.5 py-1.5 transition-all ${
                isSearchOpen ? 'w-36 sm:w-48 ring-1 ring-amber-400/60' : 'w-28 sm:w-36'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <input
                id="search-input"
                type="text"
                placeholder="Buscar..."
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

          {/* Quick Refresh Icon */}
          <button
            id="refresh-drives-btn"
            onClick={onRefresh}
            disabled={isScanning || accounts.length === 0}
            title={isScanning ? 'Escaneando biblioteca...' : 'Sincronizar Google Drive'}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white disabled:opacity-40 transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning || isBackgroundSyncing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile TV Navigation Bar */}
      <div className="md:hidden flex items-center justify-start overflow-x-auto border-t border-neutral-800/50 bg-neutral-950/95 px-3 py-2 text-xs gap-1.5 scrollbar-none">
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
        <button
          onClick={() => onSelectTab('settings')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 flex items-center gap-1 ${
            currentTab === 'settings' ? 'border border-amber-400 text-white bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          <Settings className="w-3 h-3 text-amber-400" />
          CONFIG
        </button>
      </div>
    </header>
  );
}
