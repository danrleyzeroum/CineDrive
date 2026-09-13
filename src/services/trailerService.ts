import { MediaItem } from '../types';
import { loadScraperSettings } from './storageService';

// In-memory cache for trailer keys so we don't query repeatedly
const trailerCache = new Map<string, string>();

/**
 * Retrieves a YouTube trailer video key or direct embed URL for a movie or series.
 * Queries TMDb if an API key is available, or falls back to an embedded search.
 */
export async function getTrailerEmbedUrl(item: MediaItem, isMuted = true): Promise<string> {
  const cacheKey = `${item.id}_${item.type}`;
  if (trailerCache.has(cacheKey)) {
    const key = trailerCache.get(cacheKey)!;
    return buildYouTubeUrl(key, isMuted);
  }

  // 1. Direct trailer key on item
  if (item.trailerKey) {
    trailerCache.set(cacheKey, item.trailerKey);
    return buildYouTubeUrl(item.trailerKey, isMuted);
  }

  // 2. Fetch from TMDb if tmdbId or apiKey is available
  const settings = loadScraperSettings();
  const apiKey = settings.tmdbApiKey;
  const tmdbId = item.tmdbId;

  if (apiKey && tmdbId) {
    try {
      const searchType = item.type === 'series' ? 'tv' : 'movie';
      // First try pt-BR
      const resBr = await fetch(
        `https://api.themoviedb.org/3/${searchType}/${tmdbId}/videos?api_key=${apiKey}&language=pt-BR`
      );
      if (resBr.ok) {
        const dataBr = await resBr.json();
        const trailerBr = dataBr.results?.find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (trailerBr?.key) {
          trailerCache.set(cacheKey, trailerBr.key);
          return buildYouTubeUrl(trailerBr.key, isMuted);
        }
      }

      // Fallback to English / Original
      const resEn = await fetch(
        `https://api.themoviedb.org/3/${searchType}/${tmdbId}/videos?api_key=${apiKey}&language=en-US`
      );
      if (resEn.ok) {
        const dataEn = await resEn.json();
        const trailerEn = dataEn.results?.find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (trailerEn?.key) {
          trailerCache.set(cacheKey, trailerEn.key);
          return buildYouTubeUrl(trailerEn.key, isMuted);
        }
      }
    } catch (e) {
      console.warn('Falha ao obter trailer no TMDb:', e);
    }
  }

  // 3. Fallback: YouTube Search Embed with muted autoplay
  // Uses YouTube embed with clean controls, no related videos, and autoplay
  const query = encodeURIComponent(`${item.title} ${item.year || ''} trailer dublado oficial`);
  return `https://www.youtube-nocookie.com/embed?listType=search&list=${query}&autoplay=1&mute=${
    isMuted ? '1' : '0'
  }&controls=0&playsinline=1&rel=0&modestbranding=1&loop=1&enablejsapi=1`;
}

function buildYouTubeUrl(key: string, isMuted = true): string {
  return `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&mute=${
    isMuted ? '1' : '0'
  }&controls=0&loop=1&playlist=${key}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
}
