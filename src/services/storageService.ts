import { DriveAccount, WatchProgress, MediaItem, ScraperSettings, BackgroundSyncSettings } from '../types';

const ACCOUNTS_KEY = 'drive_cinema_accounts_v1';
const PROGRESS_KEY = 'drive_cinema_watch_progress_v1';
const FAVORITES_KEY = 'drive_cinema_favorites_v1';
const CACHED_ITEMS_KEY = 'drive_cinema_cached_media_v1';
const SCRAPER_SETTINGS_KEY = 'drive_cinema_scraper_settings_v1';
const SYNC_SETTINGS_KEY = 'drive_cinema_sync_settings_v1';

export const DEFAULT_SYNC_SETTINGS: BackgroundSyncSettings = {
  enabled: true,
  intervalMinutes: 15,
  notifyOnNewMedia: true,
  cloudDatabaseEnabled: true,
};

export function loadSyncSettings(): BackgroundSyncSettings {
  try {
    const raw = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (!raw) return DEFAULT_SYNC_SETTINGS;
    return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SYNC_SETTINGS;
  }
}

export function saveSyncSettings(settings: BackgroundSyncSettings): void {
  try {
    localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save sync settings', e);
  }
}

export const DEFAULT_SCRAPER_SETTINGS: ScraperSettings = {
  tmdbApiKey: '',
  preferredLanguage: 'pt-BR',
  autoScrapeOnScan: true,
  activeProvider: 'auto',
};

export function loadScraperSettings(): ScraperSettings {
  try {
    const raw = localStorage.getItem(SCRAPER_SETTINGS_KEY);
    if (!raw) return DEFAULT_SCRAPER_SETTINGS;
    return { ...DEFAULT_SCRAPER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SCRAPER_SETTINGS;
  }
}

export function saveScraperSettings(settings: ScraperSettings): void {
  try {
    localStorage.setItem(SCRAPER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save scraper settings', e);
  }
}


export function loadSavedAccounts(): DriveAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load accounts from storage', e);
    return [];
  }
}

export function saveAccounts(accounts: DriveAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts to storage', e);
  }
}

export function loadWatchProgress(): WatchProgress[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveWatchProgress(progress: WatchProgress): void {
  try {
    const current = loadWatchProgress();
    const filtered = current.filter((p) => p.fileId !== progress.fileId);
    filtered.unshift(progress);
    // Keep max 20 items
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch (e) {
    console.error('Failed to save watch progress', e);
  }
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function toggleFavorite(mediaId: string): boolean {
  try {
    const list = loadFavorites();
    const index = list.indexOf(mediaId);
    let isFav = false;
    if (index >= 0) {
      list.splice(index, 1);
      isFav = false;
    } else {
      list.push(mediaId);
      isFav = true;
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    return isFav;
  } catch {
    return false;
  }
}

export function loadCachedMedia(): MediaItem[] {
  try {
    const raw = localStorage.getItem(CACHED_ITEMS_KEY);
    if (!raw) return [];
    const parsed: MediaItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Strictly deduplicate by item.id so any preexisting duplicates in local storage are cleaned immediately
    const seenIds = new Set<string>();
    const uniqueList: MediaItem[] = [];
    for (const item of parsed) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueList.push(item);
      }
    }
    return uniqueList;
  } catch {
    return [];
  }
}

export function saveCachedMedia(items: MediaItem[]): void {
  try {
    const seenIds = new Set<string>();
    const uniqueList: MediaItem[] = [];
    for (const item of items) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueList.push(item);
      }
    }
    localStorage.setItem(CACHED_ITEMS_KEY, JSON.stringify(uniqueList));
  } catch (e) {
    console.error('Failed to cache media', e);
  }
}
