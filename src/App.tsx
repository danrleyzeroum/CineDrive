import { useState, useMemo, useCallback } from 'react';
import {
  Film,
  Tv,
  Bookmark,
  Sparkles,
  AlertCircle,
  HardDrive,
  Clock,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { DriveAccount, MediaItem, Episode, WatchProgress } from './types';
import { signInWithGoogleDrive } from './services/firebase';
import { fetchVideosFromDrive } from './services/driveService';
import { groupFilesIntoMediaItems } from './services/mediaParser';
import {
  loadSavedAccounts,
  saveAccounts,
  loadWatchProgress,
  loadFavorites,
  toggleFavorite,
  loadCachedMedia,
  saveCachedMedia,
  loadScraperSettings,
} from './services/storageService';
import { CURATED_CATALOG, enrichMediaItemsSync } from './services/coverService';
import { autoScrapeMediaItems } from './services/metadataScraper';

import Header, { AppTab } from './components/Header';
import DualHeroBanners from './components/DualHeroBanners';
import MediaCard from './components/MediaCard';
import MediaModal from './components/MediaModal';
import VideoPlayerModal from './components/VideoPlayerModal';
import DriveAccountsModal from './components/DriveAccountsModal';
import FolderBrowser from './components/FolderBrowser';
import EmptyState from './components/EmptyState';
import CoverEditorModal from './components/CoverEditorModal';
import FolderSelectorModal from './components/FolderSelectorModal';
import FixMatchModal from './components/FixMatchModal';
import MetadataSettingsModal from './components/MetadataSettingsModal';

export default function App() {
  const [accounts, setAccounts] = useState<DriveAccount[]>(() => loadSavedAccounts());
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const cached = loadCachedMedia();
    if (cached && cached.length > 0) {
      return enrichMediaItemsSync(cached);
    }
    // Curated fallback matching user's requested layout (Fast X, Extraction 2, etc.)
    return enrichMediaItemsSync(CURATED_CATALOG);
  });
  const [watchProgressList, setWatchProgressList] = useState<WatchProgress[]>(() => loadWatchProgress());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());

  const [currentTab, setCurrentTab] = useState<AppTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string | null>(null);

  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState<boolean>(false);
  const [folderSelectorAccount, setFolderSelectorAccount] = useState<DriveAccount | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [coverEditorItem, setCoverEditorItem] = useState<MediaItem | null>(null);
  const [fixMatchItem, setFixMatchItem] = useState<MediaItem | null>(null);
  const [isMetadataSettingsOpen, setIsMetadataSettingsOpen] = useState<boolean>(false);
  const [scrapingProgress, setScrapingProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);
  const [activePlayer, setActivePlayer] = useState<{
    media: MediaItem;
    episode?: Episode;
  } | null>(null);

  const showToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Automated metadata scraper (Jellyfin / Plex / Emby pt-BR)
  const runAutoScraper = useCallback(async (itemsToScrape: MediaItem[]) => {
    const settings = loadScraperSettings();
    if (!settings.autoScrapeOnScan && itemsToScrape.length > 0) return;

    setScrapingProgress({
      current: 0,
      total: itemsToScrape.length,
      title: 'Iniciando busca automática de capas e sinopses em pt-BR...',
    });

    try {
      const scraped = await autoScrapeMediaItems(
        itemsToScrape,
        (current, total, title) => {
          setScrapingProgress({ current, total, title });
        },
        settings
      );

      setMediaItems(scraped);
      saveCachedMedia(scraped);
      showToast(`Scraper pt-BR: ${scraped.length} conteúdos enriquecidos com capas e sinopses!`, 'success');
    } catch (err: any) {
      console.error('Erro no scraper de metadados:', err);
    } finally {
      setTimeout(() => {
        setScrapingProgress(null);
      }, 1500);
    }
  }, []);

  // Sync / Scan all connected Google Drive accounts with folder filtering
  const scanAllDrives = useCallback(async (currentAccountsList = accounts) => {
    if (currentAccountsList.length === 0) return;
    setIsScanning(true);
    showToast('Buscando filmes e séries nas pastas selecionadas dos seus Drives...', 'info');

    try {
      const allFiles = [];
      const updatedAccounts = [...currentAccountsList];

      for (let i = 0; i < updatedAccounts.length; i++) {
        const acc = updatedAccounts[i];
        try {
          const files = await fetchVideosFromDrive(
            acc.accessToken,
            acc.id,
            acc.label,
            acc.selectedFolderId,
            () => {}
          );
          updatedAccounts[i] = {
            ...acc,
            fileCount: files.length,
          };
          allFiles.push(...files);
        } catch (err: any) {
          console.error(`Erro ao escanear conta ${acc.label}:`, err);
          showToast(`Erro ao ler ${acc.label}: ${err.message || 'Token expirado'}. Tente reconectar.`, 'error');
        }
      }

      setAccounts(updatedAccounts);
      saveAccounts(updatedAccounts);

      if (allFiles.length > 0) {
        const parsedItems = groupFilesIntoMediaItems(allFiles);
        const enrichedItems = enrichMediaItemsSync(parsedItems);
        setMediaItems(enrichedItems);
        saveCachedMedia(enrichedItems);
        showToast(`Varredura concluída: ${enrichedItems.length} títulos unificados!`, 'success');

        // Automatically fetch pt-BR metadata, posters, ratings & synopses (Jellyfin/Plex style)
        runAutoScraper(enrichedItems);
      } else {
        showToast('Nenhum vídeo encontrado na(s) pasta(s) selecionada(s).', 'info');
      }
    } catch (err: any) {
      showToast(`Falha na varredura: ${err.message}`, 'error');
    } finally {
      setIsScanning(false);
    }
  }, [accounts, runAutoScraper]);

  // Handle selecting a specific folder as media source for a Drive account
  const handleSelectFolder = async (accountId: string, folderId?: string, folderName?: string) => {
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          selectedFolderId: folderId,
          selectedFolderName: folderName,
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    saveAccounts(updatedAccounts);

    if (folderName) {
      showToast(`Pasta "${folderName}" definida como fonte de mídia! Re-escaneando...`, 'info');
    } else {
      showToast('Fonte redefinida para todo o Google Drive (Raiz). Re-escaneando...', 'info');
    }

    await scanAllDrives(updatedAccounts);
  };

  // Clear folder filter (use entire drive)
  const handleClearFolder = async (accountId: string) => {
    await handleSelectFolder(accountId, undefined, undefined);
  };

  // Connect Drive 1 or Drive 2
  const handleConnectDrive = async (slotIndex: number) => {
    setIsConnecting(true);
    try {
      const selectAccount = slotIndex === 1 || accounts.length > 0;
      const { user, accessToken } = await signInWithGoogleDrive(selectAccount);

      const label = slotIndex === 0 ? 'Drive 1 (Principal)' : 'Drive 2 (Secundário)';
      const color = slotIndex === 0 ? 'blue' : 'purple';

      const newAccount: DriveAccount = {
        id: user.uid,
        email: user.email || `drive${slotIndex + 1}@gmail.com`,
        name: user.displayName || `Drive ${slotIndex + 1}`,
        photoUrl: user.photoURL || undefined,
        accessToken,
        label,
        color,
        fileCount: 0,
      };

      const updated = [...accounts];
      const existingIdx = updated.findIndex((a) => a.id === user.uid);
      if (existingIdx >= 0) {
        updated[existingIdx] = {
          ...newAccount,
          selectedFolderId: updated[existingIdx].selectedFolderId,
          selectedFolderName: updated[existingIdx].selectedFolderName,
        };
      } else {
        if (slotIndex === 0 && updated[0]) {
          updated[0] = newAccount;
        } else if (slotIndex === 1 && updated[1]) {
          updated[1] = newAccount;
        } else {
          updated.push(newAccount);
        }
      }

      setAccounts(updated);
      saveAccounts(updated);
      showToast(`${label} conectado com sucesso! Escaneando biblioteca...`, 'success');

      await scanAllDrives(updated);
    } catch (err: any) {
      console.error('Falha ao conectar Google Drive:', err);
      showToast(`Falha na conexão: ${err.message}`, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Drive
  const handleDisconnectDrive = (accountId: string) => {
    const updated = accounts.filter((a) => a.id !== accountId);
    setAccounts(updated);
    saveAccounts(updated);

    const remainingItems = mediaItems.filter((item) =>
      item.accounts.some((acc) => acc.accountId !== accountId)
    );
    const finalItems = remainingItems.length > 0 ? remainingItems : enrichMediaItemsSync(CURATED_CATALOG);
    setMediaItems(finalItems);
    saveCachedMedia(finalItems);

    showToast('Drive desconectado.', 'info');
  };

  // Sync individual drive
  const handleSyncDrive = async () => {
    await scanAllDrives(accounts);
  };

  // Toggle favorite
  const handleToggleFavorite = (mediaId: string) => {
    const isFav = toggleFavorite(mediaId);
    setFavorites(loadFavorites());
    showToast(isFav ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info');
  };

  // Play Movie
  const handlePlayMovie = (item: MediaItem) => {
    setActivePlayer({ media: item });
  };

  // Play Episode
  const handlePlayEpisode = (episode: Episode, series: MediaItem) => {
    setActivePlayer({ media: series, episode });
  };

  // Save updated cover from CoverEditorModal
  const handleSaveCover = (updatedItem: MediaItem) => {
    setMediaItems((prev) => {
      const next = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      saveCachedMedia(next);
      return next;
    });

    if (selectedMedia?.id === updatedItem.id) {
      setSelectedMedia(updatedItem);
    }

    showToast(`Capa e banner de "${updatedItem.title}" atualizados!`, 'success');
  };

  // Handle saving match from FixMatchModal (identificação manual / override)
  const handleSaveFixMatch = (updatedItem: MediaItem) => {
    setMediaItems((prev) => {
      const next = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      saveCachedMedia(next);
      return next;
    });

    if (selectedMedia?.id === updatedItem.id) {
      setSelectedMedia(updatedItem);
    }

    showToast(`Conteúdo identificado como "${updatedItem.title}" (${updatedItem.year || ''})!`, 'success');
  };

  // Handle re-scraping entire library
  const handleTriggerFullRescrape = async () => {
    if (mediaItems.length === 0) {
      showToast('Nenhum conteúdo na biblioteca para re-escanear.', 'info');
      return;
    }
    showToast('Iniciando varredura completa de metadados em português (pt-BR)...', 'info');
    await runAutoScraper(mediaItems);
  };

  // Episode navigation inside active player
  const currentEpisodeInfo = useMemo(() => {
    if (!activePlayer?.episode || !activePlayer.media.seasons) return null;
    const seasons = activePlayer.media.seasons;
    const curEp = activePlayer.episode;

    const allEpisodes: Episode[] = [];
    seasons.forEach((s) => {
      allEpisodes.push(...s.episodes);
    });

    const currentIndex = allEpisodes.findIndex((e) => e.id === curEp.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex >= 0 && currentIndex < allEpisodes.length - 1;

    return {
      allEpisodes,
      currentIndex,
      hasPrevious,
      hasNext,
      previousEpisode: hasPrevious ? allEpisodes[currentIndex - 1] : undefined,
      nextEpisode: hasNext ? allEpisodes[currentIndex + 1] : undefined,
    };
  }, [activePlayer]);

  // Kids & Anime keywords helper
  const isKidsItem = (item: MediaItem) => {
    const text = `${item.title} ${item.cleanTitle} ${item.genre?.join(' ') || ''} ${item.overview || ''}`.toLowerCase();
    return (
      text.includes('animação') ||
      text.includes('animacao') ||
      text.includes('infantil') ||
      text.includes('desenho') ||
      text.includes('kids') ||
      text.includes('mario') ||
      text.includes('aranha') ||
      text.includes('disney') ||
      text.includes('pixar')
    );
  };

  const isAnimeItem = (item: MediaItem) => {
    const text = `${item.title} ${item.cleanTitle} ${item.genre?.join(' ') || ''} ${item.overview || ''}`.toLowerCase();
    return (
      text.includes('anime') ||
      text.includes('demon slayer') ||
      text.includes('kimetsu') ||
      text.includes('titan') ||
      text.includes('shingeki') ||
      text.includes('naruto') ||
      text.includes('one piece') ||
      text.includes('jujutsu') ||
      text.includes('japones')
    );
  };

  // Filtered media items based on currentTab, searchQuery, and account filter
  const filteredMedia = useMemo(() => {
    let result = [...mediaItems];

    // Filter by Tab
    if (currentTab === 'movies') {
      result = result.filter((item) => item.type === 'movie');
    } else if (currentTab === 'series') {
      result = result.filter((item) => item.type === 'series');
    } else if (currentTab === 'kids') {
      result = result.filter(isKidsItem);
    } else if (currentTab === 'anime') {
      result = result.filter(isAnimeItem);
    } else if (currentTab === 'favorites') {
      result = result.filter((item) => favorites.includes(item.id));
    }

    // Filter by Drive origin
    if (selectedAccountFilter) {
      result = result.filter((item) =>
        item.accounts.some((a) => a.accountId === selectedAccountFilter)
      );
    }

    // Filter by Explore Genre if set
    if (selectedGenreFilter) {
      result = result.filter((item) =>
        item.genre?.some((g) => g.toLowerCase().includes(selectedGenreFilter.toLowerCase()))
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.cleanTitle.toLowerCase().includes(q) ||
          item.genre?.some((g) => g.toLowerCase().includes(q))
      );
    }

    return result;
  }, [mediaItems, currentTab, selectedAccountFilter, selectedGenreFilter, searchQuery, favorites]);

  // Split movies & series for dual banners and lists
  const moviesList = useMemo(() => mediaItems.filter((m) => m.type === 'movie'), [mediaItems]);
  const seriesList = useMemo(() => mediaItems.filter((m) => m.type === 'series'), [mediaItems]);

  // Continue watching list (media with watch progress)
  const continueWatchingItems = useMemo(() => {
    if (watchProgressList.length === 0) return [];
    return watchProgressList
      .map((p) => {
        const media = mediaItems.find((m) => m.id === p.mediaId);
        return media ? { media, progress: p } : null;
      })
      .filter(Boolean) as { media: MediaItem; progress: WatchProgress }[];
  }, [watchProgressList, mediaItems]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200'
              : notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : 'bg-neutral-900/90 border-neutral-700 text-neutral-200'
          }`}
        >
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSelectedGenreFilter(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        accounts={accounts}
        onOpenAccountsModal={() => setIsAccountsModalOpen(true)}
        isScanning={isScanning}
        onRefresh={() => scanAllDrives()}
        selectedAccountFilter={selectedAccountFilter}
        onSelectAccountFilter={setSelectedAccountFilter}
        onOpenMetadataSettings={() => setIsMetadataSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Drive Accounts Status Banner if only 1 drive is connected */}
        {accounts.length === 1 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-neutral-900/60 to-neutral-900/40 border border-purple-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-200">
                  Você conectou 1 Google Drive ({accounts[0].label})
                </p>
                <p className="text-[11px] text-neutral-400">
                  Deseja adicionar seu 2º Google Drive agora para unificar todos os seus filmes e séries em uma só tela?
                </p>
              </div>
            </div>
            <button
              id="add-second-drive-banner-btn"
              onClick={() => setIsAccountsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950 transition-all shrink-0"
            >
              + Conectar 2º Drive
            </button>
          </div>
        )}

        {/* Folder Browser View */}
        {currentTab === 'folders' ? (
          <FolderBrowser
            accounts={accounts}
            onPlayMedia={handlePlayMovie}
            onSetSourceFolder={handleSelectFolder}
          />
        ) : accounts.length === 0 && mediaItems.length === 0 ? (
          /* Empty / Onboarding State */
          <EmptyState
            onConnectDrive={handleConnectDrive}
            isConnecting={isConnecting}
            hasDrivesConnected={accounts.length > 0}
            onRefresh={() => scanAllDrives()}
            isScanning={isScanning}
          />
        ) : (
          /* Normal Catalog Views */
          <div className="space-y-10">
            {/* ========================================================================= */}
            {/* DUAL HERO BANNERS: 2 BANNERS (Filmes à esquerda, Séries à direita) */}
            {/* Conforme o print enviado pelo usuário! */}
            {/* ========================================================================= */}
            {currentTab === 'all' && !searchQuery && (
              <DualHeroBanners
                movies={moviesList.length > 0 ? moviesList : mediaItems}
                series={seriesList.length > 0 ? seriesList : mediaItems}
                onPlay={(item) =>
                  item.type === 'movie'
                    ? handlePlayMovie(item)
                    : item.seasons?.[0]?.episodes?.[0]
                    ? handlePlayEpisode(item.seasons[0].episodes[0], item)
                    : setSelectedMedia(item)
                }
                onOpenDetails={setSelectedMedia}
                onOpenCoverEditor={setCoverEditorItem}
                onOpenFixMatch={setFixMatchItem}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {/* Continuar Assistindo (Continue Watching) */}
            {continueWatchingItems.length > 0 && !searchQuery && currentTab === 'all' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-neutral-200">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Continuar Assistindo</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {continueWatchingItems.slice(0, 6).map(({ media, progress }) => (
                    <MediaCard
                      key={`cw-${media.id}`}
                      item={media}
                      onSelect={setSelectedMedia}
                      onPlay={(m) =>
                        m.type === 'movie'
                          ? handlePlayMovie(m)
                          : m.seasons?.[0]?.episodes?.[0]
                          ? handlePlayEpisode(m.seasons[0].episodes[0], m)
                          : setSelectedMedia(m)
                      }
                      onOpenCoverEditor={setCoverEditorItem}
                      onOpenFixMatch={setFixMatchItem}
                      watchProgress={progress}
                      isFavorite={favorites.includes(media.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Explore Tab Categories & Genre Badges */}
            {currentTab === 'explore' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-neutral-100">
                    <Compass className="w-5 h-5 text-amber-400" />
                    <span>Explorar Catálogo</span>
                  </div>
                </div>

                {/* Genre filter buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedGenreFilter(null)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedGenreFilter === null
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    Todos os Gêneros
                  </button>
                  {['Ação', 'Aventura', 'Ficção Científica', 'Crime', 'Suspense', 'Terror', 'Animação'].map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenreFilter(selectedGenreFilter === genre ? null : genre)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selectedGenreFilter === genre
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Filmes */}
            {(currentTab === 'all' || currentTab === 'movies' || currentTab === 'explore') && moviesList.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-neutral-100">
                    <Film className="w-5 h-5 text-rose-500" />
                    <span>Filmes ({moviesList.length})</span>
                  </div>
                  {currentTab === 'all' && moviesList.length > 6 && (
                    <button
                      onClick={() => setCurrentTab('movies')}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                    >
                      Ver todos &rarr;
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {(currentTab === 'all' ? moviesList.slice(0, 12) : filteredMedia.filter((m) => m.type === 'movie')).map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onSelect={setSelectedMedia}
                      onPlay={handlePlayMovie}
                      onOpenCoverEditor={setCoverEditorItem}
                      onOpenFixMatch={setFixMatchItem}
                      isFavorite={favorites.includes(item.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section: Séries */}
            {(currentTab === 'all' || currentTab === 'series' || currentTab === 'explore') && seriesList.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-neutral-100">
                    <Tv className="w-5 h-5 text-amber-400" />
                    <span>Séries ({seriesList.length})</span>
                  </div>
                  {currentTab === 'all' && seriesList.length > 6 && (
                    <button
                      onClick={() => setCurrentTab('series')}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                    >
                      Ver todas &rarr;
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {(currentTab === 'all' ? seriesList.slice(0, 12) : filteredMedia.filter((m) => m.type === 'series')).map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onSelect={setSelectedMedia}
                      onPlay={(series) => {
                        const firstEp = series.seasons?.[0]?.episodes?.[0];
                        if (firstEp) {
                          handlePlayEpisode(firstEp, series);
                        } else {
                          setSelectedMedia(series);
                        }
                      }}
                      onOpenCoverEditor={setCoverEditorItem}
                      onOpenFixMatch={setFixMatchItem}
                      isFavorite={favorites.includes(item.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Kids Tab View */}
            {currentTab === 'kids' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-neutral-100">
                  <span className="text-pink-500 font-extrabold">K</span>
                  <span className="text-amber-400 font-extrabold">I</span>
                  <span className="text-emerald-400 font-extrabold">D</span>
                  <span className="text-sky-400 font-extrabold">S</span>
                  <span className="text-sm font-normal text-neutral-400">({filteredMedia.length} títulos)</span>
                </div>

                {filteredMedia.length === 0 ? (
                  <div className="py-16 text-center text-neutral-500 text-xs">
                    Nenhum título infantil ou animação detectado nos drives no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                    {filteredMedia.map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        onSelect={setSelectedMedia}
                        onPlay={(m) =>
                          m.type === 'movie'
                            ? handlePlayMovie(m)
                            : m.seasons?.[0]?.episodes?.[0]
                            ? handlePlayEpisode(m.seasons[0].episodes[0], m)
                            : setSelectedMedia(m)
                        }
                        onOpenCoverEditor={setCoverEditorItem}
                        onOpenFixMatch={setFixMatchItem}
                        isFavorite={favorites.includes(item.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Anime Tab View */}
            {currentTab === 'anime' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-neutral-100">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Animes ({filteredMedia.length})</span>
                </div>

                {filteredMedia.length === 0 ? (
                  <div className="py-16 text-center text-neutral-500 text-xs">
                    Nenhum anime detectado nos drives no momento. Você pode renomear seus arquivos ou alterar capas manualmente.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                    {filteredMedia.map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        onSelect={setSelectedMedia}
                        onPlay={(m) =>
                          m.type === 'movie'
                            ? handlePlayMovie(m)
                            : m.seasons?.[0]?.episodes?.[0]
                            ? handlePlayEpisode(m.seasons[0].episodes[0], m)
                            : setSelectedMedia(m)
                        }
                        onOpenCoverEditor={setCoverEditorItem}
                        onOpenFixMatch={setFixMatchItem}
                        isFavorite={favorites.includes(item.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Minha Lista (Favorites) Tab */}
            {currentTab === 'favorites' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-neutral-100">
                  <Bookmark className="w-5 h-5 text-rose-500" />
                  <span>Minha Lista ({filteredMedia.length})</span>
                </div>

                {filteredMedia.length === 0 ? (
                  <div className="py-16 text-center text-neutral-500 text-xs">
                    Você ainda não adicionou nenhum filme ou série aos favoritos.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                    {filteredMedia.map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        onSelect={setSelectedMedia}
                        onPlay={(m) =>
                          m.type === 'movie'
                            ? handlePlayMovie(m)
                            : m.seasons?.[0]?.episodes?.[0]
                            ? handlePlayEpisode(m.seasons[0].episodes[0], m)
                            : setSelectedMedia(m)
                        }
                        onOpenCoverEditor={setCoverEditorItem}
                        onOpenFixMatch={setFixMatchItem}
                        isFavorite={true}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* If search query yielded no results */}
            {searchQuery && filteredMedia.length === 0 && (
              <div className="py-20 text-center space-y-2">
                <p className="text-base font-semibold text-neutral-300">
                  Nenhum resultado para &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-neutral-500">
                  Tente buscar por outro nome ou verifique se o arquivo está presente em um dos seus 2 Google Drives.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cover & Banner Customization Modal ("Sistema de Capas") */}
      <CoverEditorModal
        item={coverEditorItem}
        isOpen={Boolean(coverEditorItem)}
        onClose={() => setCoverEditorItem(null)}
        onSaveCover={handleSaveCover}
      />

      {/* Drive Accounts Manager Modal */}
      <DriveAccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        accounts={accounts}
        onConnectDrive={handleConnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        onSyncDrive={handleSyncDrive}
        onOpenFolderSelector={(account) => setFolderSelectorAccount(account)}
        onClearFolder={handleClearFolder}
        isConnecting={isConnecting}
      />

      {/* Specific Folder Selector Modal */}
      <FolderSelectorModal
        isOpen={Boolean(folderSelectorAccount)}
        onClose={() => setFolderSelectorAccount(null)}
        account={folderSelectorAccount}
        onSelectFolder={handleSelectFolder}
      />

      {/* Media Details Modal */}
      <MediaModal
        item={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onPlayMovie={handlePlayMovie}
        onPlayEpisode={handlePlayEpisode}
        onOpenCoverEditor={(item) => setCoverEditorItem(item)}
        onOpenFixMatch={(item) => setFixMatchItem(item)}
        isFavorite={selectedMedia ? favorites.includes(selectedMedia.id) : false}
        onToggleFavorite={handleToggleFavorite}
        accounts={accounts}
      />

      {/* Manual Match / Metadata Fixer Modal (Jellyfin/Plex Fix Match) */}
      <FixMatchModal
        item={fixMatchItem}
        isOpen={Boolean(fixMatchItem)}
        onClose={() => setFixMatchItem(null)}
        onSaveMatch={handleSaveFixMatch}
      />

      {/* Metadata & Scraper Settings Modal */}
      <MetadataSettingsModal
        isOpen={isMetadataSettingsOpen}
        onClose={() => setIsMetadataSettingsOpen(false)}
        onTriggerFullRescrape={handleTriggerFullRescrape}
      />

      {/* Floating Scraper Progress Widget (Like Jellyfin & Plex Library Scan) */}
      {scrapingProgress && (
        <div
          id="scraper-live-progress-widget"
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-neutral-900/95 border border-rose-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-100">Buscando metadados pt-BR</span>
              <span className="font-mono text-rose-400 font-semibold">
                {scrapingProgress.current}/{scrapingProgress.total}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 truncate">
              {scrapingProgress.title}
            </p>
            <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-amber-400 h-full transition-all duration-300"
                style={{
                  width: `${
                    scrapingProgress.total > 0
                      ? Math.round((scrapingProgress.current / scrapingProgress.total) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activePlayer && (
        <VideoPlayerModal
          media={activePlayer.media}
          episode={activePlayer.episode}
          accounts={accounts}
          onClose={() => {
            setActivePlayer(null);
            setWatchProgressList(loadWatchProgress());
          }}
          onNextEpisode={
            currentEpisodeInfo?.nextEpisode
              ? () => handlePlayEpisode(currentEpisodeInfo.nextEpisode!, activePlayer.media)
              : undefined
          }
          onPreviousEpisode={
            currentEpisodeInfo?.previousEpisode
              ? () => handlePlayEpisode(currentEpisodeInfo.previousEpisode!, activePlayer.media)
              : undefined
          }
          hasNextEpisode={currentEpisodeInfo?.hasNext}
          hasPreviousEpisode={currentEpisodeInfo?.hasPrevious}
        />
      )}
    </div>
  );
}
