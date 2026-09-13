import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { DriveAccount, MediaItem, Episode, WatchProgress, DriveRawFile } from './types';
import { signInWithGoogleDrive } from './services/firebase';
import { fetchVideosFromDrive } from './services/driveService';
import { groupFilesIntoMediaItems, isVideoFile, cleanMediaItemOfNonVideos } from './services/mediaParser';
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
import {
  saveMediaMetadataToCloud,
  batchSaveMediaMetadataToCloud,
  loadAllCloudMetadata,
  mergeItemsWithCloudMetadata,
} from './services/cloudMetadataService';
import {
  subscribeToCloudWatchProgress,
  syncCloudWatchProgress,
  mergeWatchProgressLists,
} from './services/cloudProgressService';
import { backgroundSync } from './services/backgroundSyncService';

import Header, { AppTab } from './components/Header';
import DualHeroBanners from './components/DualHeroBanners';
import CategoryHeroYouCine, { CategoryFilterType } from './components/CategoryHeroYouCine';
import MediaCard from './components/MediaCard';
import TvMediaRow from './components/TvMediaRow';
import MediaModal from './components/MediaModal';
import VideoPlayerModal from './components/VideoPlayerModal';
import DriveAccountsModal from './components/DriveAccountsModal';
import FolderBrowser from './components/FolderBrowser';
import EmptyState from './components/EmptyState';
import CoverEditorModal from './components/CoverEditorModal';
import FolderSelectorModal from './components/FolderSelectorModal';
import FixMatchModal from './components/FixMatchModal';
import MetadataSettingsModal from './components/MetadataSettingsModal';
import NetworkSettingsModal from './components/NetworkSettingsModal';
import Top1BrasilBanner from './components/Top1BrasilBanner';
import Top10ServerRow from './components/Top10ServerRow';
import SettingsView from './components/SettingsView';
import { useTvNavigation } from './hooks/useTvNavigation';

export default function App() {
  const [accounts, setAccounts] = useState<DriveAccount[]>(() => loadSavedAccounts());
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const cached = loadCachedMedia();
    const source = cached && cached.length > 0 ? cached : CURATED_CATALOG;
    const enriched = enrichMediaItemsSync(source);
    const seen = new Set<string>();
    return enriched
      .map(cleanMediaItemOfNonVideos)
      .filter((item): item is MediaItem => {
        if (!item || !item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
  });
  const [watchProgressList, setWatchProgressList] = useState<WatchProgress[]>(() => loadWatchProgress());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());

  const [currentTab, setCurrentTab] = useState<AppTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>('all');
  const [categoryGenre, setCategoryGenre] = useState<string | null>(null);

  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState<boolean>(false);
  const [folderSelectorAccount, setFolderSelectorAccount] = useState<DriveAccount | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [coverEditorItem, setCoverEditorItem] = useState<MediaItem | null>(null);
  const [fixMatchItem, setFixMatchItem] = useState<MediaItem | null>(null);
  const [isMetadataSettingsOpen, setIsMetadataSettingsOpen] = useState<boolean>(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState<boolean>(false);
  const [scrapingProgress, setScrapingProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);
  const [activePlayer, setActivePlayer] = useState<{
    media: MediaItem;
    episode?: Episode;
  } | null>(null);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);

  // Enable Android TV Remote D-Pad Navigation and back key support
  useTvNavigation({
    onBack: () => {
      if (activePlayer) setActivePlayer(null);
      else if (selectedMedia) setSelectedMedia(null);
      else if (coverEditorItem) setCoverEditorItem(null);
      else if (fixMatchItem) setFixMatchItem(null);
      else if (isNetworkModalOpen) setIsNetworkModalOpen(false);
      else if (isMetadataSettingsOpen) setIsMetadataSettingsOpen(false);
      else if (isAccountsModalOpen) setIsAccountsModalOpen(false);
      else if (currentTab !== 'all') setCurrentTab('all');
    },
    isEnabled: true,
  });

  // Synchronized refs to allow background sync loops to read fresh state without restarting timers
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  const mediaItemsRef = useRef(mediaItems);
  mediaItemsRef.current = mediaItems;

  const activePlayerRef = useRef(activePlayer);
  activePlayerRef.current = activePlayer;

  const showToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Restore cloud database metadata on initial app boot so no metadata is lost
  useEffect(() => {
    loadAllCloudMetadata()
      .then((cloudMap) => {
        if (cloudMap && cloudMap.size > 0) {
          setMediaItems((current) => {
            const { mergedItems, restoredCount } = mergeItemsWithCloudMetadata(current, cloudMap);
            if (restoredCount > 0) {
              saveCachedMedia(mergedItems);
              return mergedItems;
            }
            return current;
          });
        }
      })
      .catch((err) => {
        console.warn('Aviso ao sincronizar metadados do Firestore:', err);
      });
  }, []);

  // Real-time Watch Progress synchronization via Firebase Firestore across devices
  useEffect(() => {
    // 1. Initial bi-directional sync (local storage + Firestore)
    syncCloudWatchProgress().then((merged) => {
      if (merged && merged.length > 0) {
        setWatchProgressList(merged);
      }
    });

    // 2. Real-time subscription to cloud changes (when paused on TV, mobile or PC updates immediately)
    const unsubscribe = subscribeToCloudWatchProgress((cloudList) => {
      setWatchProgressList((localList) => {
        return mergeWatchProgressLists(localList, cloudList);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Background sync service: runs periodically without interrupting playback
  useEffect(() => {
    if (accounts.length === 0) {
      backgroundSync.stop();
      return;
    }

    backgroundSync.start(
      () => accountsRef.current,
      () => mediaItemsRef.current,
      () => activePlayerRef.current !== null,
      (updatedMedia, newFilesCount) => {
        const sanitized = updatedMedia
          .map(cleanMediaItemOfNonVideos)
          .filter((item): item is MediaItem => item !== null);
        setMediaItems(sanitized);
        saveCachedMedia(sanitized);
        if (newFilesCount > 0) {
          showToast(
            `🎬 Catálogo atualizado em segundo plano: +${newFilesCount} novo${newFilesCount > 1 ? 's' : ''} vídeo${newFilesCount > 1 ? 's' : ''} detectado${newFilesCount > 1 ? 's' : ''} no Drive!`,
            'success'
          );
        }
      }
    );

    return () => {
      backgroundSync.stop();
    };
  }, [accounts.length]);

  // Manual trigger for background sync check
  const handleTriggerBackgroundSync = async () => {
    if (accounts.length === 0) {
      showToast('Conecte ao menos um Google Drive para sincronizar.', 'info');
      return;
    }
    setIsBackgroundSyncing(true);
    try {
      const result = await backgroundSync.runSyncCheck(accounts, mediaItems, false);
      if (result.hasChanges && result.newCount > 0) {
        showToast(
          `Sincronização concluída: +${result.newCount} novo${result.newCount > 1 ? 's' : ''} conteúdo${result.newCount > 1 ? 's' : ''} adicionado${result.newCount > 1 ? 's' : ''}!`,
          'success'
        );
      } else {
        showToast('Tudo atualizado! Nenhum novo arquivo encontrado no Google Drive.', 'info');
      }
    } catch (err: any) {
      showToast(`Erro na sincronização: ${err.message}`, 'error');
    } finally {
      setIsBackgroundSyncing(false);
    }
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

      // Persist enriched metadata to Firestore cloud database so it's permanent and takes 0 device storage!
      batchSaveMediaMetadataToCloud(scraped);

      showToast(`Scraper pt-BR: ${scraped.length} conteúdos enriquecidos e salvos na nuvem!`, 'success');
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
      const allFiles: DriveRawFile[] = [];
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
          // Deduplicate files by id across drives/folders
          for (const f of files) {
            if (!allFiles.some((existing) => existing.id === f.id)) {
              allFiles.push(f);
            }
          }
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

        // Merge with existing Cloud Firestore metadata so NO previous data (titles, covers, synopses, ratings) is lost!
        const cloudMap = await loadAllCloudMetadata();
        const { mergedItems, restoredCount } = mergeItemsWithCloudMetadata(enrichedItems, cloudMap);

        // Strict deduplication of final merged items by item.id
        const uniqueMerged: MediaItem[] = [];
        const seenIds = new Set<string>();
        for (const item of mergedItems) {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueMerged.push(item);
          }
        }

        setMediaItems(uniqueMerged);
        saveCachedMedia(uniqueMerged);

        if (restoredCount > 0) {
          showToast(`Varredura concluída: ${uniqueMerged.length} títulos (${restoredCount} preservados da nuvem)!`, 'success');
        } else {
          showToast(`Varredura concluída: ${uniqueMerged.length} títulos unificados!`, 'success');
        }

        // Automatically fetch pt-BR metadata, posters, ratings & synopses for missing items
        runAutoScraper(uniqueMerged);
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

  // Connect Drive 1 or Drive 2 (Supports connecting the same Google account in both slots with different folders!)
  const handleConnectDrive = async (slotIndex: number) => {
    setIsConnecting(true);
    try {
      const selectAccount = slotIndex === 1 || accounts.length > 0;
      const { user, accessToken } = await signInWithGoogleDrive(selectAccount);

      const label = slotIndex === 0 ? 'Drive 1 (Principal)' : 'Drive 2 (Secundário)';
      const color = slotIndex === 0 ? 'blue' : 'purple';
      const slotId = slotIndex === 0 ? `drive_slot_1_${user.uid}` : `drive_slot_2_${user.uid}`;

      // Check if this specific slot was previously configured
      const existingSlotIdx = accounts.findIndex(
        (a) =>
          a.id === slotId ||
          (slotIndex === 0 ? a.label.includes('Drive 1') : a.label.includes('Drive 2'))
      );

      const newAccount: DriveAccount = {
        id: slotId,
        email: user.email || `drive${slotIndex + 1}@gmail.com`,
        name: user.displayName || `Drive ${slotIndex + 1}`,
        photoUrl: user.photoURL || undefined,
        accessToken,
        label,
        color,
        fileCount: 0,
        selectedFolderId: existingSlotIdx >= 0 ? accounts[existingSlotIdx].selectedFolderId : undefined,
        selectedFolderName: existingSlotIdx >= 0 ? accounts[existingSlotIdx].selectedFolderName : undefined,
      };

      const updated = [...accounts];
      if (existingSlotIdx >= 0) {
        updated[existingSlotIdx] = newAccount;
      } else {
        if (slotIndex === 0) {
          updated.unshift(newAccount);
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

    // Persist to Cloud Database (Firestore)
    saveMediaMetadataToCloud(updatedItem);

    showToast(`Capa e banner de "${updatedItem.title}" atualizados e salvos na nuvem!`, 'success');
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

    // Persist to Cloud Database (Firestore)
    saveMediaMetadataToCloud(updatedItem);

    showToast(`Conteúdo identificado como "${updatedItem.title}" (${updatedItem.year || ''}) e salvo na nuvem!`, 'success');
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

    // Deduplicate result by item.id
    const seen = new Set<string>();
    return result.filter((item) => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [mediaItems, currentTab, selectedAccountFilter, selectedGenreFilter, searchQuery, favorites]);

  // Split movies & series for dual banners and lists (Strictly deduplicated by id)
  const moviesList = useMemo(() => {
    const seen = new Set<string>();
    return mediaItems.filter((m) => {
      if (m.type !== 'movie' || !m.id || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [mediaItems]);

  const seriesList = useMemo(() => {
    const seen = new Set<string>();
    return mediaItems.filter((m) => {
      if (m.type !== 'series' || !m.id || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [mediaItems]);

  const kidsList = useMemo(() => {
    const seen = new Set<string>();
    return mediaItems.filter((m) => {
      if (!isKidsItem(m) || !m.id || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [mediaItems]);

  const animeList = useMemo(() => {
    const seen = new Set<string>();
    return mediaItems.filter((m) => {
      if (!isAnimeItem(m) || !m.id || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [mediaItems]);

  // Active category items for FILMES / SÉRIES / KIDS / ANIME YouCine view
  const activeCategoryItems = useMemo(() => {
    if (currentTab === 'movies') return moviesList;
    if (currentTab === 'series') return seriesList;
    if (currentTab === 'kids') return kidsList;
    if (currentTab === 'anime') return animeList;
    return [];
  }, [currentTab, moviesList, seriesList, kidsList, animeList]);

  // Display items for the Category View based on active filter buttons
  const displayCategoryItems = useMemo(() => {
    let list = activeCategoryItems;

    // Filter by drive origin if set
    if (selectedAccountFilter) {
      list = list.filter((item) =>
        item.accounts.some((a) => a.accountId === selectedAccountFilter)
      );
    }

    // Filter by search query if typed
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.cleanTitle.toLowerCase().includes(q) ||
          item.genre?.some((g) => g.toLowerCase().includes(q))
      );
    }

    // Filter by the 4 YouCine buttons:
    if (categoryFilter === '2026') {
      list = list.filter((item) => item.year === '2026');
    } else if (categoryFilter === 'cinema') {
      list = [...list].sort((a, b) => {
        const ra = parseFloat(a.rating || '0') || 0;
        const rb = parseFloat(b.rating || '0') || 0;
        return rb - ra;
      });
    } else if (categoryFilter === 'genre' && categoryGenre) {
      list = list.filter((item) =>
        item.genre?.some((g) => g.toLowerCase() === categoryGenre.toLowerCase())
      );
    }

    // Deduplicate displayCategoryItems by item.id
    const seen = new Set<string>();
    return list.filter((item) => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [activeCategoryItems, selectedAccountFilter, searchQuery, categoryFilter, categoryGenre]);

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
          setCategoryFilter('all');
          setCategoryGenre(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        accounts={accounts}
        onOpenAccountsModal={() => setIsAccountsModalOpen(true)}
        isScanning={isScanning}
        isBackgroundSyncing={isBackgroundSyncing}
        onRefresh={() => scanAllDrives()}
        selectedAccountFilter={selectedAccountFilter}
        onSelectAccountFilter={setSelectedAccountFilter}
        onOpenMetadataSettings={() => setIsMetadataSettingsOpen(true)}
        onOpenNetworkSettings={() => setIsNetworkModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Drive Accounts Status Banner if only 1 drive is connected and not on settings tab */}
        {accounts.length === 1 && currentTab !== 'settings' && (
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
              onClick={() => setCurrentTab('settings')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950 transition-all shrink-0"
            >
              + Conectar 2º Drive
            </button>
          </div>
        )}

        {/* Settings View Tab */}
        {currentTab === 'settings' ? (
          <SettingsView
            accounts={accounts}
            onConnectDrive={handleConnectDrive}
            onDisconnectDrive={handleDisconnectDrive}
            onSyncDrive={handleSyncDrive}
            onOpenFolderSelector={(account) => setFolderSelectorAccount(account)}
            onClearFolder={handleClearFolder}
            isConnecting={isConnecting}
            isScanning={isScanning}
            onScanAllDrives={() => scanAllDrives()}
            selectedAccountFilter={selectedAccountFilter}
            onSelectAccountFilter={setSelectedAccountFilter}
            onTriggerFullRescrape={handleTriggerFullRescrape}
            onTriggerBackgroundSync={handleTriggerBackgroundSync}
            isBackgroundSyncing={isBackgroundSyncing}
            onCacheCleared={() => {
              setMediaItems(loadCachedMedia() || enrichMediaItemsSync(CURATED_CATALOG));
              setWatchProgressList(loadWatchProgress());
              showToast('Cache de dados limpo com sucesso!', 'success');
            }}
            onPlayMedia={handlePlayMovie}
            onSetSourceFolder={handleSelectFolder}
          />
        ) : currentTab === 'folders' ? (
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
            {/* Esquerda SEMPRE Filmes, Direita SEMPRE Séries (ou EM BREVE se 0 séries) */}
            {/* ========================================================================= */}
            {currentTab === 'all' && !searchQuery && (
              <DualHeroBanners
                movies={moviesList}
                series={seriesList}
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

            {/* ========================================================================= */}
            {/* TOP 1 DO BRASIL: Atualiza automaticamente quando o #1 do Brasil muda */}
            {/* ========================================================================= */}
            {currentTab === 'all' && !searchQuery && (
              <Top1BrasilBanner
                libraryItems={mediaItems}
                onPlayMedia={(item) =>
                  item.type === 'movie'
                    ? handlePlayMovie(item)
                    : item.seasons?.[0]?.episodes?.[0]
                    ? handlePlayEpisode(item.seasons[0].episodes[0], item)
                    : setSelectedMedia(item)
                }
                onOpenDetails={setSelectedMedia}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {/* ========================================================================= */}
            {/* 1 - TOP 10 FILMES DO SERVIDOR */}
            {/* ========================================================================= */}
            {currentTab === 'all' && !searchQuery && moviesList.length > 0 && (
              <Top10ServerRow
                id="top-10-movies-server"
                title="TOP 10 FILMES DO SERVIDOR"
                type="movie"
                items={moviesList}
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handlePlayMovie}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {/* ========================================================================= */}
            {/* 2 - TOP 10 SÉRIES DO SERVIDOR */}
            {/* ========================================================================= */}
            {currentTab === 'all' && !searchQuery && seriesList.length > 0 && (
              <Top10ServerRow
                id="top-10-series-server"
                title="TOP 10 SÉRIES DO SERVIDOR"
                type="series"
                items={seriesList}
                onSelectMedia={setSelectedMedia}
                onPlayMedia={(m) =>
                  m.seasons?.[0]?.episodes?.[0]
                    ? handlePlayEpisode(m.seasons[0].episodes[0], m)
                    : setSelectedMedia(m)
                }
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {/* Continuar Assistindo (Continue Watching) */}
            {continueWatchingItems.length > 0 && !searchQuery && currentTab === 'all' && (
              <TvMediaRow
                id="continue-watching"
                title="Continuar Assistindo"
                icon={Clock}
                iconColor="text-amber-400"
                items={continueWatchingItems.map((cw) => cw.media)}
                badgeText={`${continueWatchingItems.length} em andamento`}
                onSelectMedia={setSelectedMedia}
                onPlayMedia={(m) =>
                  m.type === 'movie'
                    ? handlePlayMovie(m)
                    : m.seasons?.[0]?.episodes?.[0]
                    ? handlePlayEpisode(m.seasons[0].episodes[0], m)
                    : setSelectedMedia(m)
                }
                onOpenCoverEditor={setCoverEditorItem}
                onOpenFixMatch={setFixMatchItem}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
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
            {currentTab === 'all' && moviesList.length > 0 && (
              <TvMediaRow
                id="filmes-tv-row"
                title="Filmes"
                icon={Film}
                iconColor="text-rose-500"
                items={moviesList}
                badgeText={`${moviesList.length} títulos`}
                actionText="Ver todos"
                onActionClick={() => setCurrentTab('movies')}
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handlePlayMovie}
                onOpenCoverEditor={setCoverEditorItem}
                onOpenFixMatch={setFixMatchItem}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {/* ========================================================================= */}
            {/* CATEGORY VIEW: FILMES / SÉRIES / KIDS / ANIME (ESTILO YOUCINE DO PRINT)  */}
            {/* ========================================================================= */}
            {(currentTab === 'movies' || currentTab === 'series' || currentTab === 'kids' || currentTab === 'anime') && (
              <div className="space-y-6">
                {/* O Banner YouCine com Carrossel de Lançamentos 2026, 4 Botões e 2 Verticais */}
                <CategoryHeroYouCine
                  categoryType={currentTab}
                  categoryTitle={
                    currentTab === 'movies'
                      ? 'Filmes'
                      : currentTab === 'series'
                      ? 'Séries'
                      : currentTab === 'kids'
                      ? 'Kids'
                      : 'Anime'
                  }
                  items={activeCategoryItems}
                  activeFilter={categoryFilter}
                  onSelectFilter={setCategoryFilter}
                  selectedGenre={categoryGenre}
                  onSelectGenre={setCategoryGenre}
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

                {/* Grade de Conteúdos da Categoria com Título e Filtro Selecionado */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-neutral-100">
                      {currentTab === 'movies' && <Film className="w-5 h-5 text-rose-500" />}
                      {currentTab === 'series' && <Tv className="w-5 h-5 text-amber-400" />}
                      {currentTab === 'kids' && (
                        <span className="flex items-center gap-0.5">
                          <span className="text-pink-500 font-extrabold">K</span>
                          <span className="text-amber-400 font-extrabold">I</span>
                          <span className="text-emerald-400 font-extrabold">D</span>
                          <span className="text-sky-400 font-extrabold">S</span>
                        </span>
                      )}
                      {currentTab === 'anime' && <Sparkles className="w-5 h-5 text-amber-400" />}
                      <span>
                        {categoryFilter === '2026'
                          ? 'Lançamentos 2026'
                          : categoryFilter === 'cinema'
                          ? 'No Cinema / Em Alta'
                          : categoryFilter === 'genre' && categoryGenre
                          ? `Gênero: ${categoryGenre}`
                          : `Todos os ${
                              currentTab === 'movies'
                                ? 'Filmes'
                                : currentTab === 'series'
                                ? 'Séries'
                                : currentTab === 'kids'
                                ? 'Títulos Infantis'
                                : 'Animes'
                            }`}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                        {displayCategoryItems.length} títulos
                      </span>
                    </div>

                    {categoryFilter !== 'all' && (
                      <button
                        onClick={() => {
                          setCategoryFilter('all');
                          setCategoryGenre(null);
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        Limpar Filtro (Ver Todos)
                      </button>
                    )}
                  </div>

                  {displayCategoryItems.length === 0 ? (
                    <div className="py-16 text-center text-neutral-400 text-xs bg-neutral-900/40 rounded-2xl border border-neutral-800 p-8">
                      <p className="font-semibold text-neutral-300 text-sm mb-2">
                        Nenhum título encontrado para o filtro selecionado.
                      </p>
                      <p className="text-neutral-500 mb-4">
                        {categoryFilter === '2026'
                          ? 'Ainda não foram detectados títulos com ano 2026 nesta categoria.'
                          : 'Tente selecionar o botão "Todos" para visualizar todo o catálogo.'}
                      </p>
                      <button
                        onClick={() => {
                          setCategoryFilter('all');
                          setCategoryGenre(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all"
                      >
                        Exibir Todos os Títulos
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
                      {displayCategoryItems.map((item, idx) => (
                        <MediaCard
                          key={`${item.id}_cat_${idx}`}
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
                    {filteredMedia.map((item, idx) => (
                      <MediaCard
                        key={`${item.id}_fav_${idx}`}
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
        onTriggerBackgroundSync={handleTriggerBackgroundSync}
        isBackgroundSyncing={isBackgroundSyncing}
      />

      {/* TV Network & Cache Settings Modal */}
      <NetworkSettingsModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        onCacheCleared={() => {
          setMediaItems(loadCachedMedia() || enrichMediaItemsSync(CURATED_CATALOG));
          setWatchProgressList(loadWatchProgress());
          showToast('Cache de dados limpo com sucesso!', 'success');
        }}
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
          initialProgress={
            watchProgressList.find(
              (p) =>
                p.fileId ===
                (activePlayer.episode ? activePlayer.episode.fileId : activePlayer.media.movieFile?.id)
            ) || watchProgressList.find((p) => p.mediaId === activePlayer.media.id)
          }
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
