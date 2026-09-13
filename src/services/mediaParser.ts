import { DriveRawFile, MediaItem, Episode } from '../types';

interface ParsedFile {
  isSeries: boolean;
  cleanTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  year?: string;
  quality?: string;
}

// Clean up standard video release tags and clutter
const NOISE_WORDS = [
  '1080p', '720p', '2160p', '4k', 'uhd', 'bluray', 'bdrip', 'web-dl', 'webrip',
  'hdrip', 'dvdrip', 'x264', 'x265', 'h264', 'hevc', 'aac', 'ddp5.1', 'dts',
  'dual', 'audio', 'dublado', 'legendado', 'pt-br', 'multi', 'sub', 'ita',
  'repack', 'proper', 'yify', 'yts', 'rarbg', 'amzn', 'nf', 'dsnp', 'hmax'
];

/**
 * Parses raw file name to extract metadata, season, episode, year, and clean title.
 */
export function parseMediaFileName(filename: string): ParsedFile {
  // Strip file extension
  const baseName = filename.replace(/\.[^/.]+$/, '').trim();

  // Normalize separators: replace dots, underscores with spaces, but keep hyphens around for structure
  let normalized = baseName.replace(/[\._]/g, ' ').replace(/\s+/g, ' ');

  // Detect Series Patterns:
  // Pattern 1: S01E02 or s01e02 or S1E2 or S01-E02
  const sPattern = /\b[sS](\d{1,2})[\s\.\-_]*[eE](\d{1,3})\b/;
  // Pattern 2: 1x02 or 01x02
  const xPattern = /\b(\d{1,2})[xX](\d{1,3})\b/;
  // Pattern 3: Temporada 1 Episodio 2 / Temp 1 Ep 2
  const ptPattern = /\b(?:temp(?:orada)?|season)\s*(\d{1,2})[\s\.\-_]*(?:ep(?:isodio)?|cap(?:itulo)?)\s*(\d{1,3})\b/i;

  let isSeries = false;
  let seasonNumber = 1;
  let episodeNumber = 1;
  let titlePart = normalized;
  let episodeTitle: string | undefined;

  const matchS = normalized.match(sPattern);
  const matchX = normalized.match(xPattern);
  const matchPT = normalized.match(ptPattern);

  if (matchS) {
    isSeries = true;
    seasonNumber = parseInt(matchS[1], 10);
    episodeNumber = parseInt(matchS[2], 10);
    const index = normalized.indexOf(matchS[0]);
    titlePart = normalized.substring(0, index);
    const remainder = normalized.substring(index + matchS[0].length).trim();
    if (remainder) {
      episodeTitle = cleanNoise(remainder);
    }
  } else if (matchPT) {
    isSeries = true;
    seasonNumber = parseInt(matchPT[1], 10);
    episodeNumber = parseInt(matchPT[2], 10);
    const index = normalized.indexOf(matchPT[0]);
    titlePart = normalized.substring(0, index);
    const remainder = normalized.substring(index + matchPT[0].length).trim();
    if (remainder) {
      episodeTitle = cleanNoise(remainder);
    }
  } else if (matchX) {
    isSeries = true;
    seasonNumber = parseInt(matchX[1], 10);
    episodeNumber = parseInt(matchX[2], 10);
    const index = normalized.indexOf(matchX[0]);
    titlePart = normalized.substring(0, index);
    const remainder = normalized.substring(index + matchX[0].length).trim();
    if (remainder) {
      episodeTitle = cleanNoise(remainder);
    }
  }

  // Detect Year e.g. (2023) or 2023
  let year: string | undefined;
  const yearMatch = normalized.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) {
    year = yearMatch[1];
    // If it wasn't a series, maybe title was before year
    if (!isSeries) {
      const yearIdx = normalized.indexOf(yearMatch[0]);
      if (yearIdx > 2) {
        titlePart = normalized.substring(0, yearIdx);
      }
    }
  }

  // Detect Quality tag
  let quality: string | undefined;
  if (/2160p|4k|uhd/i.test(filename)) quality = '4K UHD';
  else if (/1080p/i.test(filename)) quality = '1080p Full HD';
  else if (/720p/i.test(filename)) quality = '720p HD';
  else quality = 'HD';

  // Final clean up of title
  const cleanTitle = cleanNoise(titlePart);

  return {
    isSeries,
    cleanTitle: cleanTitle || baseName,
    seasonNumber,
    episodeNumber,
    episodeTitle: episodeTitle && episodeTitle !== cleanTitle ? episodeTitle : undefined,
    year,
    quality,
  };
}

function cleanNoise(text: string): string {
  let cleaned = text;
  // Remove brackets like [1080p], (Dual Audio)
  cleaned = cleaned.replace(/\[.*?\]|\(.*?\)/g, ' ');

  // Remove noise words
  const words = cleaned.split(/\s+/);
  const filtered = words.filter((w) => {
    const lower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    return !NOISE_WORDS.includes(lower);
  });

  cleaned = filtered.join(' ')
    .replace(/[-–—_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize properly
  return cleaned
    .split(' ')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

/**
 * Groups a raw list of Drive files across both accounts into categorized Movies and Series.
 */
export function groupFilesIntoMediaItems(files: DriveRawFile[]): MediaItem[] {
  const seriesMap = new Map<string, {
    cleanTitle: string;
    seasons: Map<number, Episode[]>;
    accounts: Map<string, { accountId: string; accountLabel: string; color: 'blue' | 'purple' | 'amber' | 'emerald' }>;
    quality: string;
    year?: string;
  }>();

  const movies: MediaItem[] = [];

  for (const file of files) {
    const parsed = parseMediaFileName(file.name);

    if (parsed.isSeries) {
      // Normalize key
      const key = parsed.cleanTitle.toLowerCase().trim();
      let series = seriesMap.get(key);
      if (!series) {
        series = {
          cleanTitle: parsed.cleanTitle,
          seasons: new Map(),
          accounts: new Map(),
          quality: parsed.quality || '1080p',
          year: parsed.year,
        };
        seriesMap.set(key, series);
      }

      // Record account
      const accountColor = file.accountLabel.includes('2') ? 'purple' : 'blue';
      series.accounts.set(file.accountId, {
        accountId: file.accountId,
        accountLabel: file.accountLabel,
        color: accountColor,
      });

      // Season list
      let seasonEpisodes = series.seasons.get(parsed.seasonNumber);
      if (!seasonEpisodes) {
        seasonEpisodes = [];
        series.seasons.set(parsed.seasonNumber, seasonEpisodes);
      }

      const episode: Episode = {
        id: file.id,
        fileId: file.id,
        accountId: file.accountId,
        accountLabel: file.accountLabel,
        seasonNumber: parsed.seasonNumber,
        episodeNumber: parsed.episodeNumber,
        title: parsed.episodeTitle || `Episódio ${parsed.episodeNumber}`,
        rawFileName: file.name,
        size: formatBytes(file.size),
        durationFormatted: formatDuration(file.videoMediaMetadata?.durationMillis),
        thumbnailUrl: file.thumbnailLink?.replace(/=s\d+/, '=s640'),
        webViewLink: file.webViewLink,
        quality: parsed.quality,
        parents: file.parents,
      };

      // Avoid duplicates
      if (!seasonEpisodes.some((e) => e.fileId === file.id)) {
        seasonEpisodes.push(episode);
      }
    } else {
      // Movie
      const accountColor = file.accountLabel.includes('2') ? 'purple' : 'blue';
      const movieItem: MediaItem = {
        id: `movie-${file.id}`,
        title: parsed.cleanTitle,
        cleanTitle: parsed.cleanTitle,
        type: 'movie',
        year: parsed.year || (file.modifiedTime ? new Date(file.modifiedTime).getFullYear().toString() : undefined),
        quality: parsed.quality,
        genre: ['Filme', 'Google Drive'],
        overview: `Arquivo: ${file.name}\nTamanho: ${formatBytes(file.size)}\nModificado: ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('pt-BR') : 'N/A'}`,
        posterUrl: file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s640') : undefined,
        backdropUrl: file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s1280') : undefined,
        accounts: [{
          accountId: file.accountId,
          accountLabel: file.accountLabel,
          color: accountColor,
        }],
        movieFile: file,
        duration: formatDuration(file.videoMediaMetadata?.durationMillis),
        lastUpdated: file.modifiedTime,
      };
      movies.push(movieItem);
    }
  }

  // Convert seriesMap to MediaItem array
  const seriesItems: MediaItem[] = Array.from(seriesMap.entries()).map(([key, item]) => {
    // Sort seasons
    const sortedSeasonNumbers = Array.from(item.seasons.keys()).sort((a, b) => a - b);
    const seasons = sortedSeasonNumbers.map((sNum) => {
      const episodes = item.seasons.get(sNum) || [];
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
      return {
        seasonNumber: sNum,
        episodes,
      };
    });

    const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodes.length, 0);
    // Find representative poster
    let posterUrl: string | undefined;
    for (const s of seasons) {
      for (const ep of s.episodes) {
        if (ep.thumbnailUrl) {
          posterUrl = ep.thumbnailUrl;
          break;
        }
      }
      if (posterUrl) break;
    }

    return {
      id: `series-${encodeURIComponent(key)}`,
      title: item.cleanTitle,
      cleanTitle: item.cleanTitle,
      type: 'series' as const,
      year: item.year,
      quality: item.quality,
      genre: ['Série', `${seasons.length} Temporada${seasons.length > 1 ? 's' : ''}`, `${totalEpisodes} Episódio${totalEpisodes > 1 ? 's' : ''}`],
      overview: `Série completa organizada a partir do Google Drive com ${seasons.length} temporada(s) e ${totalEpisodes} episódio(s) detectados.`,
      posterUrl,
      backdropUrl: posterUrl,
      accounts: Array.from(item.accounts.values()),
      seasons,
      totalEpisodes,
    };
  });

  return [...seriesItems, ...movies];
}

export function formatBytes(bytesStr?: string): string {
  if (!bytesStr) return 'Tamanho desconhecido';
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(millisStr?: string): string {
  if (!millisStr) return '';
  const millis = parseInt(millisStr, 10);
  if (isNaN(millis)) return '';
  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}
