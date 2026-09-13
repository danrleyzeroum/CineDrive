import { NetworkSettings, PlaybackQuality } from '../types';

const NETWORK_SETTINGS_KEY = 'drive_cinema_network_settings_v1';

export const DEFAULT_NETWORK_SETTINGS: NetworkSettings = {
  defaultQuality: 'auto',
  dataSaverEnabled: false,
  preloadThumbnails: true,
  bufferSizeSeconds: 30,
};

export function loadNetworkSettings(): NetworkSettings {
  try {
    const raw = localStorage.getItem(NETWORK_SETTINGS_KEY);
    if (!raw) return DEFAULT_NETWORK_SETTINGS;
    return { ...DEFAULT_NETWORK_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NETWORK_SETTINGS;
  }
}

export function saveNetworkSettings(settings: NetworkSettings): void {
  try {
    localStorage.setItem(NETWORK_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save network settings', e);
  }
}

export interface CacheBreakdown {
  totalBytes: number;
  totalFormatted: string;
  metadataBytes: number;
  metadataFormatted: string;
  progressBytes: number;
  progressFormatted: string;
  settingsBytes: number;
  settingsFormatted: string;
  itemsCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function getCacheBreakdown(): CacheBreakdown {
  let totalBytes = 0;
  let metadataBytes = 0;
  let progressBytes = 0;
  let settingsBytes = 0;
  let itemsCount = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || '';
      const keyBytes = key.length * 2;
      const valueBytes = value.length * 2;
      const itemBytes = keyBytes + valueBytes;
      totalBytes += itemBytes;
      itemsCount++;

      if (key.includes('cached_media') || key.includes('metadata') || key.includes('accounts')) {
        metadataBytes += itemBytes;
      } else if (key.includes('progress') || key.includes('history')) {
        progressBytes += itemBytes;
      } else {
        settingsBytes += itemBytes;
      }
    }
  } catch (e) {
    console.warn('Error reading localStorage cache size:', e);
  }

  return {
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    metadataBytes,
    metadataFormatted: formatBytes(metadataBytes),
    progressBytes,
    progressFormatted: formatBytes(progressBytes),
    settingsBytes,
    settingsFormatted: formatBytes(settingsBytes),
    itemsCount,
  };
}

export function clearMetadataAndImagesCache(): boolean {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cached_media') || key.includes('scraper') || key.includes('covers_v1'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    return true;
  } catch (e) {
    console.error('Failed to clear metadata cache:', e);
    return false;
  }
}

export function clearWatchProgressCache(): boolean {
  try {
    localStorage.removeItem('drive_cinema_watch_progress_v1');
    localStorage.removeItem('drive_cinema_cloud_progress_sync_v1');
    return true;
  } catch (e) {
    console.error('Failed to clear watch progress cache:', e);
    return false;
  }
}

export function clearAllLocalCache(): boolean {
  try {
    // Preserve drive accounts so user doesn't lose connected drives
    const accounts = localStorage.getItem('drive_cinema_accounts_v1');
    localStorage.clear();
    if (accounts) {
      localStorage.setItem('drive_cinema_accounts_v1', accounts);
    }
    return true;
  } catch (e) {
    console.error('Failed to clear all cache:', e);
    return false;
  }
}

export async function testNetworkPing(): Promise<number> {
  const start = performance.now();
  try {
    // Fetch a tiny asset or HEAD request with cache busting
    await fetch(`/?_ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    const elapsed = Math.round(performance.now() - start);
    return Math.max(1, elapsed);
  } catch {
    return Math.round(performance.now() - start);
  }
}
