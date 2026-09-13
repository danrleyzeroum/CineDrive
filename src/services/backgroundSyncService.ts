import { DriveAccount, MediaItem, BackgroundSyncSettings, DriveRawFile } from '../types';
import { fetchVideosFromDrive } from './driveService';
import { groupFilesIntoMediaItems, isVideoFile } from './mediaParser';
import { enrichMediaItemsSync } from './coverService';
import { autoScrapeMediaItems } from './metadataScraper';
import {
  loadAllCloudMetadata,
  mergeItemsWithCloudMetadata,
  batchSaveMediaMetadataToCloud,
} from './cloudMetadataService';
import { loadSyncSettings, saveSyncSettings } from './storageService';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  lastFoundCount: number;
  error: string | null;
}

type SyncCallback = (
  updatedMedia: MediaItem[],
  newCount: number,
  isBackground: boolean
) => void;

class BackgroundSyncManager {
  private timerId: any = null;
  private isCurrentlyRunning = false;
  private lastSyncTime: number | null = null;
  private onSyncCompleteCallback: SyncCallback | null = null;
  private isVideoPlayingGetter: (() => boolean) | null = null;

  /**
   * Initializes the periodic background worker.
   */
  public start(
    getAccounts: () => DriveAccount[],
    getCurrentMedia: () => MediaItem[],
    isVideoPlaying: () => boolean,
    onSyncComplete: SyncCallback
  ) {
    this.stop();
    this.onSyncCompleteCallback = onSyncComplete;
    this.isVideoPlayingGetter = isVideoPlaying;

    const settings = loadSyncSettings();
    if (!settings.enabled) {
      return;
    }

    // Convert minutes to milliseconds (default 15 minutes)
    const intervalMs = Math.max(1, settings.intervalMinutes || 15) * 60 * 1000;

    this.timerId = setInterval(async () => {
      await this.runSyncCheck(getAccounts(), getCurrentMedia(), true);
    }, intervalMs);
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public getStatus(): SyncStatus {
    return {
      isSyncing: this.isCurrentlyRunning,
      lastSyncTimestamp: this.lastSyncTime,
      lastFoundCount: 0,
      error: null,
    };
  }

  /**
   * Runs the silent check on Google Drive accounts for new videos.
   * NEVER interrupts video playback, never closes modals, and runs entirely non-blocking.
   */
  public async runSyncCheck(
    accounts: DriveAccount[],
    currentMedia: MediaItem[],
    isBackground = true
  ): Promise<{ hasChanges: boolean; newCount: number; updatedItems?: MediaItem[] }> {
    if (this.isCurrentlyRunning) {
      return { hasChanges: false, newCount: 0 };
    }

    if (!accounts || accounts.length === 0) {
      return { hasChanges: false, newCount: 0 };
    }

    this.isCurrentlyRunning = true;

    try {
      // 1. Gather all existing file IDs from current items in memory
      const existingFileIds = new Set<string>();
      for (const item of currentMedia) {
        if (item.movieFile?.id) {
          existingFileIds.add(item.movieFile.id);
        }
        if (item.seasons) {
          for (const s of item.seasons) {
            for (const ep of s.episodes) {
              if (ep.fileId) {
                existingFileIds.add(ep.fileId);
              }
            }
          }
        }
      }

      // 2. Fetch files from all Drive accounts in parallel or sequential
      const allFiles: DriveRawFile[] = [];
      for (const acc of accounts) {
        if (!acc.accessToken) continue;
        try {
          const files = await fetchVideosFromDrive(
            acc.accessToken,
            acc.id,
            acc.label,
            acc.selectedFolderId
          );
          // Deduplicate files by id and strictly ensure they are video files
          for (const file of files) {
            if (isVideoFile(file.name, file.mimeType) && !allFiles.some((existing) => existing.id === file.id)) {
              allFiles.push(file);
            }
          }
        } catch (accErr) {
          console.warn(`[Sync] Conta ${acc.label} indisponível na verificação silenciosa:`, accErr);
        }
      }

      if (allFiles.length === 0) {
        this.lastSyncTime = Date.now();
        const settings = loadSyncSettings();
        saveSyncSettings({ ...settings, lastSyncTime: this.lastSyncTime });
        return { hasChanges: false, newCount: 0 };
      }

      // 3. Detect new files
      const newFiles = allFiles.filter((f) => !existingFileIds.has(f.id));
      const removedFilesCount = Math.max(0, existingFileIds.size - allFiles.length);

      // If no new files and file count matches, no need to touch the UI
      if (newFiles.length === 0 && removedFilesCount === 0) {
        this.lastSyncTime = Date.now();
        const settings = loadSyncSettings();
        saveSyncSettings({ ...settings, lastSyncTime: this.lastSyncTime });
        return { hasChanges: false, newCount: 0 };
      }

      // 4. Reparse catalog with all files
      const parsedItems = groupFilesIntoMediaItems(allFiles);
      const withLocalCovers = enrichMediaItemsSync(parsedItems);

      // 5. CRITICAL: Merge with Cloud Database (Firestore)
      // This ensures that any item that was previously scraped or had its cover/title/synopsis edited
      // DOES NOT LOSE ITS INFORMATION when new items are added!
      const cloudMetadataMap = await loadAllCloudMetadata();
      const { mergedItems } = mergeItemsWithCloudMetadata(withLocalCovers, cloudMetadataMap);

      // 6. Also preserve any existing in-memory metadata for matching items
      const existingItemsMap = new Map<string, MediaItem>();
      for (const item of currentMedia) {
        existingItemsMap.set(item.id, item);
      }

      const finalCatalog = mergedItems.map((item) => {
        const existing = existingItemsMap.get(item.id);
        if (existing) {
          return {
            ...item,
            title: existing.title || item.title,
            originalTitle: existing.originalTitle || item.originalTitle,
            posterUrl: existing.posterUrl || item.posterUrl,
            backdropUrl: existing.backdropUrl || item.backdropUrl,
            overview: existing.overview || item.overview,
            rating: existing.rating || item.rating,
            genre: existing.genre && existing.genre.length > 0 ? existing.genre : item.genre,
            director: existing.director || item.director,
            cast: existing.cast || item.cast,
            year: existing.year || item.year,
            tmdbId: existing.tmdbId || item.tmdbId,
          };
        }
        return item;
      });

      // Strict deduplication of final catalog by item.id
      const seenFinalIds = new Set<string>();
      const deduplicatedCatalog: MediaItem[] = [];
      for (const item of finalCatalog) {
        if (item && item.id && !seenFinalIds.has(item.id)) {
          seenFinalIds.add(item.id);
          deduplicatedCatalog.push(item);
        }
      }

      this.lastSyncTime = Date.now();
      const settings = loadSyncSettings();
      saveSyncSettings({ ...settings, lastSyncTime: this.lastSyncTime });

      // 7. Scrape ONLY the truly new items in the background
      const newlyDiscoveredItems = deduplicatedCatalog.filter((item) => !existingItemsMap.has(item.id));

      if (newlyDiscoveredItems.length > 0) {
        // Run silent background scraper for the new items
        autoScrapeMediaItems(newlyDiscoveredItems).then(async (scrapedNewItems) => {
          // Save to Firestore cloud database so it's permanently stored in the cloud
          if (settings.cloudDatabaseEnabled) {
            await batchSaveMediaMetadataToCloud(scrapedNewItems);
          }
        }).catch((e) => console.warn('Aviso no background scraper:', e));
      }

      // Notify consumer
      if (this.onSyncCompleteCallback) {
        this.onSyncCompleteCallback(deduplicatedCatalog, newFiles.length, isBackground);
      }

      return {
        hasChanges: true,
        newCount: newFiles.length,
        updatedItems: deduplicatedCatalog,
      };
    } catch (err) {
      console.warn('Erro durante verificação silenciosa de plano de fundo:', err);
      return { hasChanges: false, newCount: 0 };
    } finally {
      this.isCurrentlyRunning = false;
    }
  }
}

export const backgroundSync = new BackgroundSyncManager();
