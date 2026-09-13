export interface DriveAccount {
  id: string; // unique identifier or email
  email: string;
  name: string;
  photoUrl?: string;
  accessToken: string;
  expiresAt?: number;
  label: string; // e.g. "Drive Principal" or "Drive 2"
  color: 'blue' | 'purple' | 'amber' | 'emerald';
  fileCount: number;
  selectedFolderId?: string; // Specific folder ID to scan, or undefined for root/all
  selectedFolderName?: string; // Name of selected folder for display e.g. "Filmes", "Series"
}

export interface DriveRawFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  parents?: string[];
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
  accountId: string;
  accountLabel: string;
}

export interface Episode {
  id: string;
  fileId: string;
  accountId: string;
  accountLabel: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  rawFileName: string;
  size?: string;
  durationFormatted?: string;
  thumbnailUrl?: string;
  webViewLink?: string;
  quality?: string;
  parents?: string[];
}

export interface MediaItem {
  id: string;
  title: string;
  cleanTitle: string;
  type: 'movie' | 'series';
  year?: string;
  quality?: string;
  genre?: string[];
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  accounts: {
    accountId: string;
    accountLabel: string;
    color: 'blue' | 'purple' | 'amber' | 'emerald';
  }[];
  // For movies
  movieFile?: DriveRawFile;
  duration?: string;
  // For series
  seasons?: {
    seasonNumber: number;
    episodes: Episode[];
  }[];
  totalEpisodes?: number;
  lastUpdated?: string;
  // Jellyfin / Plex / Emby Scraper metadata
  rating?: string; // e.g. "8.4"
  director?: string; // e.g. "Christopher Nolan"
  cast?: string[]; // e.g. ["Cillian Murphy", "Emily Blunt", "Matt Damon"]
  contentRating?: string; // e.g. "16", "14", "Livre"
  originalTitle?: string;
  tagline?: string;
  imdbId?: string;
  tmdbId?: string | number;
  trailerKey?: string;
  trailerUrl?: string;
}

export interface ScraperSettings {
  tmdbApiKey: string;
  preferredLanguage: string; // 'pt-BR'
  autoScrapeOnScan: boolean;
  activeProvider: 'tmdb' | 'cinemeta' | 'auto';
}

export interface WatchProgress {
  mediaId: string;
  fileId: string;
  progressPercent: number;
  currentTimeSeconds: number;
  durationSeconds: number;
  lastWatched: number;
  title: string;
  episodeInfo?: string;
  posterUrl?: string;
  accountEmail?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  accountId: string;
  accountLabel: string;
  parentId?: string;
}

export interface SubtitleCue {
  id: number;
  start: number; // in seconds
  end: number; // in seconds
  text: string;
}

export interface SubtitleTrack {
  id: string; // file id or generated id
  label: string; // display name e.g. "Português (Brasil)", "Inglês"
  fileName: string;
  language?: string; // 'pt-BR', 'en', etc.
  format: 'srt' | 'vtt';
  source: 'drive' | 'local';
  fileId?: string;
  accountId?: string;
  accountLabel?: string;
  vttBlobUrl?: string;
  cues?: SubtitleCue[];
  rawText?: string;
}

export interface SubtitleSettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  offsetSeconds: number; // e.g. -1.0, +0.5
  textColor: 'white' | 'yellow';
  backgroundColor: 'semi' | 'solid' | 'none';
}

export interface CloudMediaMetadata {
  id: string;
  mediaKey: string;
  title: string;
  originalTitle?: string;
  type: 'movie' | 'series';
  year?: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  rating?: string;
  genres?: string[];
  quality?: string;
  duration?: string;
  director?: string;
  cast?: string[];
  tmdbId?: string;
  updatedAt: string;
}

export interface BackgroundSyncSettings {
  enabled: boolean;
  intervalMinutes: number; // 5, 15, 30, 60
  lastSyncTime?: number;
  notifyOnNewMedia: boolean;
  cloudDatabaseEnabled: boolean;
}

export type PlaybackQuality = 'auto' | '480p' | '720p' | '1080p';

export interface NetworkSettings {
  defaultQuality: PlaybackQuality;
  dataSaverEnabled: boolean;
  preloadThumbnails: boolean;
  bufferSizeSeconds: number;
}


