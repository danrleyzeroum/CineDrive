import { MediaItem, ScraperSettings } from '../types';
import { loadScraperSettings } from './storageService';
import { loadCustomCovers, CURATED_CATALOG } from './coverService';

export interface ScrapedMetadata {
  id: string;
  title: string;
  originalTitle?: string;
  type: 'movie' | 'series';
  year?: string;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  rating?: string;
  director?: string;
  cast?: string[];
  genres?: string[];
  contentRating?: string;
  tagline?: string;
  provider: 'tmdb' | 'cinemeta' | 'wikipedia' | 'anilist' | 'tvmaze' | 'curated';
  tmdbId?: string | number;
  imdbId?: string;
  trailerKey?: string;
}

// Portuguese translations for common genre names
const GENRE_TRANSLATIONS: Record<string, string> = {
  action: 'Ação',
  adventure: 'Aventura',
  animation: 'Animação',
  anime: 'Anime',
  comedy: 'Comédia',
  crime: 'Crime',
  documentary: 'Documentário',
  drama: 'Drama',
  family: 'Família',
  fantasy: 'Fantasia',
  history: 'História',
  horror: 'Terror',
  music: 'Música',
  musical: 'Musical',
  mystery: 'Mistério',
  romance: 'Romance',
  'science fiction': 'Ficção Científica',
  'sci-fi': 'Ficção Científica',
  scifi: 'Ficção Científica',
  thriller: 'Suspense',
  suspense: 'Suspense',
  war: 'Guerra',
  western: 'Faroeste',
  kids: 'Infantil',
  superhero: 'Super-herói',
  supernatural: 'Sobrenatural',
  biography: 'Biografia',
  sport: 'Esporte',
};

export function translateGenres(genres?: string[]): string[] {
  if (!genres || genres.length === 0) return ['Geral'];
  return genres.map((g) => {
    const clean = g.toLowerCase().trim();
    return GENRE_TRANSLATIONS[clean] || g;
  });
}

/**
 * Strips technical release garbage from filenames to prepare for search
 */
export function cleanSearchQuery(title: string): string {
  return title
    .replace(/\[.*?\]|\(.*?\)/g, ' ')
    .replace(/\b(1080p|720p|2160p|4k|uhd|bluray|bdrip|web-dl|webrip|hdrip|dvdrip|x264|x265|h264|hevc|dual|audio|dublado|legendado|pt-br|multi|proper|repack|amzn|nf|dsnp|hmax|yify|yts|rarbg)\b/gi, '')
    .replace(/[\._\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scrapes metadata directly from The Movie Database (TMDb) if an API key is provided.
 */
async function scrapeFromTMDb(
  query: string,
  type: 'movie' | 'series',
  year?: string,
  apiKey?: string
): Promise<ScrapedMetadata | null> {
  if (!apiKey) return null;

  try {
    const searchType = type === 'series' ? 'tv' : 'movie';
    const params = new URLSearchParams({
      api_key: apiKey,
      query,
      language: 'pt-BR',
      include_adult: 'false',
    });
    if (year) {
      if (type === 'movie') params.append('year', year);
      else params.append('first_air_date_year', year);
    }

    const res = await fetch(`https://api.themoviedb.org/3/search/${searchType}?${params.toString()}`);
    if (!res.ok) return null;

    const data = await res.json();
    const hit = data.results?.[0];
    if (!hit) return null;

    // Fetch deep details with credits, certifications & trailers in pt-BR
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/${searchType}/${hit.id}?api_key=${apiKey}&language=pt-BR&append_to_response=credits,content_ratings,release_dates,videos`
    );
    const detail = detailRes.ok ? await detailRes.json() : hit;

    const directors = detail.credits?.crew?.filter((c: any) => c.job === 'Director').map((c: any) => c.name);
    const cast = detail.credits?.cast?.slice(0, 6).map((c: any) => c.name);
    const releaseYear = (detail.release_date || detail.first_air_date || '').slice(0, 4) || year;

    // Parse Brazilian content advisory rating if available
    let contentRating: string | undefined;
    if (detail.release_dates?.results) {
      const brRelease = detail.release_dates.results.find((r: any) => r.iso_3166_1 === 'BR');
      if (brRelease && brRelease.release_dates?.[0]?.certification) {
        contentRating = brRelease.release_dates[0].certification;
      }
    }

    // Extract official YouTube trailer
    const trailer = detail.videos?.results?.find(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    const trailerKey = trailer?.key;

    return {
      id: `tmdb-${hit.id}`,
      tmdbId: hit.id,
      title: detail.title || detail.name || query,
      originalTitle: detail.original_title || detail.original_name,
      type,
      year: releaseYear,
      posterUrl: detail.poster_path ? `https://image.tmdb.org/t/p/w780${detail.poster_path}` : undefined,
      backdropUrl: detail.backdrop_path ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}` : undefined,
      overview: detail.overview || undefined,
      rating: detail.vote_average ? detail.vote_average.toFixed(1) : undefined,
      director: directors && directors.length > 0 ? directors.join(', ') : undefined,
      cast,
      genres: detail.genres?.map((g: any) => g.name),
      contentRating,
      tagline: detail.tagline || undefined,
      trailerKey,
      provider: 'tmdb',
    };
  } catch (err) {
    console.warn('TMDb scraper error:', err);
    return null;
  }
}

/**
 * Searches Wikipedia in Portuguese (pt-BR) to get natural Brazilian Portuguese synopsis & title.
 */
async function scrapeFromWikipediaPt(query: string, type: 'movie' | 'series'): Promise<{ title?: string; overview?: string; posterUrl?: string } | null> {
  try {
    const searchSuffix = type === 'movie' ? ' filme' : ' série de televisão';
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query + searchSuffix
    )}&format=json&origin=*&utf8=1`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const hits = searchData.query?.search;
    if (!hits || hits.length === 0) return null;

    // Pick most relevant hit
    const bestHit = hits[0];
    const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestHit.title)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) return null;

    const summary = await summaryRes.json();
    const cleanOverview = summary.extract ? summary.extract.replace(/\n+/g, ' ').trim() : undefined;
    const cleanTitle = summary.title ? summary.title.replace(/\s*\((filme|série.*?)\)/gi, '').trim() : undefined;
    const poster = summary.originalimage?.source || summary.thumbnail?.source;

    return {
      title: cleanTitle,
      overview: cleanOverview,
      posterUrl: poster,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Scrapes metadata from Cinemeta + Metahub + TVMaze (Open Free Scraper, No Key Required).
 */
async function scrapeFromOpenScrapers(
  query: string,
  type: 'movie' | 'series',
  year?: string
): Promise<ScrapedMetadata | null> {
  const cleanQ = encodeURIComponent(query.toLowerCase());

  try {
    const searchType = type === 'series' ? 'series' : 'movie';
    const cinemetaUrl = `https://v3-cinemeta.strem.io/catalog/${searchType}/top/search=${cleanQ}.json`;

    const response = await fetch(cinemetaUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;

    const data = await response.json();
    const metas = data?.metas;
    if (!metas || !Array.isArray(metas) || metas.length === 0) return null;

    // Choose the best match (compare release year if available)
    let best = metas[0];
    if (year && metas.length > 1) {
      const yearMatch = metas.find((m) => m.releaseInfo === year || m.year === year);
      if (yearMatch) best = yearMatch;
    }

    // Now query detailed meta to get director, cast, description, rating
    let detail = best;
    try {
      const detailUrl = `https://v3-cinemeta.strem.io/meta/${searchType}/${best.id || best.imdb_id}.json`;
      const detailRes = await fetch(detailUrl);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        if (detailData?.meta) detail = detailData.meta;
      }
    } catch {
      // Use summary
    }

    const poster = detail.poster
      ? detail.poster.replace(/_V1_SX\d+\./, '_V1_SX700.')
      : best.poster;
    const backdrop = detail.background || best.background || poster;

    return {
      id: detail.id || detail.imdb_id || `meta-${Math.random()}`,
      imdbId: detail.imdb_id || best.imdb_id,
      tmdbId: detail.moviedb_id,
      title: detail.name || best.name || query,
      type,
      year: detail.year || detail.releaseInfo || best.releaseInfo || year,
      posterUrl: poster,
      backdropUrl: backdrop,
      overview: detail.description,
      rating: detail.imdbRating,
      director: Array.isArray(detail.director) ? detail.director.join(', ') : detail.director,
      cast: Array.isArray(detail.cast) ? detail.cast.slice(0, 6) : undefined,
      genres: translateGenres(detail.genre || detail.genres),
      provider: 'cinemeta',
    };
  } catch (err) {
    console.warn('Open scraper error:', err);
    return null;
  }
}

/**
 * Searches AniList for anime series/movies.
 */
async function scrapeFromAniList(query: string): Promise<ScrapedMetadata | null> {
  try {
    const gqlQuery = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          id
          title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large }
          bannerImage
          genres
          averageScore
          episodes
          seasonYear
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gqlQuery, variables: { search: query } }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const media = json.data?.Media;
    if (!media) return null;

    const cleanOverview = media.description
      ? media.description.replace(/<[^>]*>?/gm, '').replace(/__.*?__/g, '').trim()
      : undefined;

    return {
      id: `anilist-${media.id}`,
      title: media.title.english || media.title.romaji || query,
      originalTitle: media.title.native || media.title.romaji,
      type: 'series',
      year: media.seasonYear ? String(media.seasonYear) : undefined,
      posterUrl: media.coverImage?.extraLarge || media.coverImage?.large,
      backdropUrl: media.bannerImage || media.coverImage?.extraLarge,
      overview: cleanOverview,
      rating: media.averageScore ? (media.averageScore / 10).toFixed(1) : undefined,
      genres: translateGenres(media.genres),
      provider: 'anilist',
    };
  } catch {
    return null;
  }
}

/**
 * Complete Intelligent Metadata Scraper (Like Jellyfin / Plex / Emby).
 * Automatically searches TMDb, Cinemeta, Metahub, TVMaze, and Wikipedia in Brazilian Portuguese.
 */
export async function scrapeMediaMetadata(
  cleanTitle: string,
  type: 'movie' | 'series',
  year?: string,
  settings?: ScraperSettings
): Promise<ScrapedMetadata | null> {
  const currentSettings = settings || loadScraperSettings();
  const query = cleanSearchQuery(cleanTitle);
  if (!query) return null;

  // 1. Check if user already customized cover manually
  const customCovers = loadCustomCovers();
  const custom = customCovers[cleanTitle] || customCovers[query];
  if (custom && custom.posterUrl) {
    return {
      id: `custom-${cleanTitle}`,
      title: custom.title || cleanTitle,
      type,
      year,
      posterUrl: custom.posterUrl,
      backdropUrl: custom.backdropUrl,
      overview: custom.overview,
      provider: 'curated',
    };
  }

  // 2. Check Curated catalog first for fast instant match
  const qLower = query.toLowerCase();
  const curatedMatch = CURATED_CATALOG.find((c) => {
    const cTitleLower = c.cleanTitle.toLowerCase();
    return cTitleLower.includes(qLower) || qLower.includes(cTitleLower);
  });
  if (curatedMatch) {
    return {
      id: curatedMatch.id,
      title: curatedMatch.title,
      type: curatedMatch.type,
      year: curatedMatch.year || year,
      posterUrl: curatedMatch.posterUrl,
      backdropUrl: curatedMatch.backdropUrl,
      overview: curatedMatch.overview,
      genres: curatedMatch.genre,
      rating: '8.4',
      provider: 'curated',
    };
  }

  // 3. If TMDb API key is set, query TMDb (Portuguese Brasil)
  if (currentSettings.tmdbApiKey) {
    const tmdbData = await scrapeFromTMDb(query, type, year, currentSettings.tmdbApiKey);
    if (tmdbData) return tmdbData;
  }

  // 4. If Anime title or anime keywords present, query AniList
  if (/anime|yaiba|jujutsu|naruto|piece|bleach|titan|hero/i.test(query)) {
    const animeData = await scrapeFromAniList(query);
    if (animeData) {
      // Also try to get Portuguese synopsis from Wikipedia pt
      const wiki = await scrapeFromWikipediaPt(query, type);
      if (wiki?.overview) {
        animeData.overview = wiki.overview;
      }
      return animeData;
    }
  }

  // 5. Open Scrapers (Cinemeta + IMDb + Metahub)
  const openData = await scrapeFromOpenScrapers(query, type, year);

  // 6. Enrich with Brazilian Portuguese (pt-BR) synopsis & official Brazilian title from Wikipedia pt
  const wikiPt = await scrapeFromWikipediaPt(query, type);

  if (openData) {
    if (wikiPt) {
      if (wikiPt.overview && wikiPt.overview.length > 40) {
        openData.overview = wikiPt.overview;
      }
      if (wikiPt.title && wikiPt.title.length > 2) {
        openData.title = wikiPt.title;
      }
      if (!openData.posterUrl && wikiPt.posterUrl) {
        openData.posterUrl = wikiPt.posterUrl;
      }
    }
    return openData;
  }

  // If open data failed but Wikipedia found it in pt-BR
  if (wikiPt && wikiPt.overview) {
    return {
      id: `wiki-${Math.random()}`,
      title: wikiPt.title || query,
      type,
      year,
      posterUrl: wikiPt.posterUrl,
      backdropUrl: wikiPt.posterUrl,
      overview: wikiPt.overview,
      genres: ['Cinema', 'Streaming'],
      provider: 'wikipedia',
    };
  }

  return null;
}

/**
 * Searches multiple results for "Identificar / Fix Match" modal (Jellyfin/Plex match picker)
 */
export async function searchMultipleMetadataMatches(
  searchQuery: string,
  type?: 'movie' | 'series',
  year?: string
): Promise<ScrapedMetadata[]> {
  const cleanQ = cleanSearchQuery(searchQuery);
  if (!cleanQ) return [];

  const results: ScrapedMetadata[] = [];
  const settings = loadScraperSettings();

  // If TMDb Key is present, search TMDb
  if (settings.tmdbApiKey) {
    try {
      const searchType = type === 'series' ? 'tv' : 'movie';
      const params = new URLSearchParams({
        api_key: settings.tmdbApiKey,
        query: cleanQ,
        language: 'pt-BR',
      });
      const res = await fetch(`https://api.themoviedb.org/3/search/${searchType}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        for (const item of (data.results || []).slice(0, 6)) {
          results.push({
            id: `tmdb-${item.id}`,
            tmdbId: item.id,
            title: item.title || item.name,
            originalTitle: item.original_title || item.original_name,
            type: type || (item.media_type === 'tv' ? 'series' : 'movie'),
            year: (item.release_date || item.first_air_date || '').slice(0, 4),
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : undefined,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
            overview: item.overview,
            rating: item.vote_average ? item.vote_average.toFixed(1) : undefined,
            provider: 'tmdb',
          });
        }
      }
    } catch {
      // Continue to open scrapers
    }
  }

  // Open Cinemeta search
  try {
    const searchType = type === 'series' ? 'series' : 'movie';
    const cinemetaUrl = `https://v3-cinemeta.strem.io/catalog/${searchType}/top/search=${encodeURIComponent(cleanQ)}.json`;
    const res = await fetch(cinemetaUrl);
    if (res.ok) {
      const data = await res.json();
      for (const item of (data.metas || []).slice(0, 8)) {
        if (!results.some((r) => r.imdbId === item.imdb_id || r.id === item.id)) {
          const poster = item.poster ? item.poster.replace(/_V1_SX\d+\./, '_V1_SX700.') : undefined;
          results.push({
            id: item.id || item.imdb_id,
            imdbId: item.imdb_id,
            title: item.name,
            type: item.type === 'series' ? 'series' : 'movie',
            year: item.releaseInfo || item.year,
            posterUrl: poster,
            backdropUrl: item.background || poster,
            overview: item.description,
            rating: item.imdbRating,
            genres: translateGenres(item.genres || item.genre),
            provider: 'cinemeta',
          });
        }
      }
    }
  } catch {
    // Continue
  }

  // Also query Wikipedia pt for Portuguese Brazilian matches
  try {
    const wikiRes = await fetch(
      `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanQ + (type === 'series' ? ' série' : ' filme')
      )}&format=json&origin=*&utf8=1`
    );
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const hits = (wikiData.query?.search || []).slice(0, 3);
      for (const hit of hits) {
        const summaryRes = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`);
        if (summaryRes.ok) {
          const s = await summaryRes.json();
          if (s.extract && !results.some((r) => r.title.toLowerCase() === s.title.toLowerCase())) {
            results.push({
              id: `wiki-${s.pageid || Math.random()}`,
              title: s.title.replace(/\s*\((filme|série.*?)\)/gi, ''),
              type: type || 'movie',
              posterUrl: s.originalimage?.source || s.thumbnail?.source,
              backdropUrl: s.originalimage?.source,
              overview: s.extract,
              provider: 'wikipedia',
            });
          }
        }
      }
    }
  } catch {
    // Continue
  }

  return results;
}

/**
 * Automatically enriches a list of media items with scraped covers, Portuguese synopses, and details.
 * Reports real-time progress for the Jellyfin/Plex scraping banner!
 */
export async function autoScrapeMediaItems(
  items: MediaItem[],
  onProgress?: (processed: number, total: number, currentTitle: string) => void,
  customSettings?: ScraperSettings
): Promise<MediaItem[]> {
  const settings = customSettings || loadScraperSettings();
  if (!settings.autoScrapeOnScan) {
    return items;
  }

  const enrichedList: MediaItem[] = [];
  const total = items.length;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, total, item.cleanTitle || item.title);
    }

    // If already has high-quality poster and Portuguese overview, keep it
    const hasGoodPoster = item.posterUrl && !item.posterUrl.includes('googleusercontent.com');
    const hasGoodOverview = item.overview && item.overview.length > 50;

    if (hasGoodPoster && hasGoodOverview && item.rating) {
      enrichedList.push(item);
      continue;
    }

    try {
      const scraped = await scrapeMediaMetadata(item.cleanTitle || item.title, item.type, item.year, settings);
      if (scraped) {
        enrichedList.push({
          ...item,
          title: scraped.title || item.title,
          originalTitle: scraped.originalTitle || item.originalTitle,
          posterUrl: scraped.posterUrl || item.posterUrl,
          backdropUrl: scraped.backdropUrl || item.backdropUrl || scraped.posterUrl,
          overview: scraped.overview || item.overview,
          genre: scraped.genres && scraped.genres.length > 0 ? scraped.genres : item.genre,
          rating: scraped.rating || item.rating,
          director: scraped.director || item.director,
          cast: scraped.cast || item.cast,
          contentRating: scraped.contentRating || item.contentRating,
          tagline: scraped.tagline || item.tagline,
          year: scraped.year || item.year,
          imdbId: scraped.imdbId || item.imdbId,
          tmdbId: scraped.tmdbId || item.tmdbId,
        });
      } else {
        enrichedList.push(item);
      }
    } catch {
      enrichedList.push(item);
    }
  }

  return enrichedList;
}
