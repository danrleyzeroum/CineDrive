import { MediaItem } from '../types';
import { loadScraperSettings } from './storageService';

export interface TopBrasilItem {
  id: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  rating: string;
  releaseDate?: string;
  year: string;
  mediaType: 'movie' | 'tv';
  genres: string[];
  matchedLibraryMedia?: MediaItem;
  lastUpdated: string; // ISO date string
}

const TOP_BRASIL_CACHE_KEY = 'drive_cinema_top_1_brasil_cache_v1';

// Dynamic fallback items that represent top trending titles in Brazil if offline
const BRASIL_TRENDING_DEFAULTS: Omit<TopBrasilItem, 'lastUpdated' | 'matchedLibraryMedia'>[] = [
  {
    id: 'trending-br-1',
    title: 'Deadpool & Wolverine',
    originalTitle: 'Deadpool & Wolverine',
    overview: 'Wolverine se recupera quando cruza o caminho do tagarela Deadpool. Juntos, eles formam uma equipe improvável para derrotar um inimigo comum.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/yDHYTjA3R0neEjvuBE4A3L5iC3v.jpg',
    rating: '8.1',
    year: '2024',
    mediaType: 'movie',
    genres: ['Ação', 'Comédia', 'Ficção Científica'],
  },
  {
    id: 'trending-br-2',
    title: 'Duna: Parte 2',
    originalTitle: 'Dune: Part Two',
    overview: 'Paul Atreides se une a Chani e aos Fremen em busca de vingança contra os conspiradores que destruíram sua família.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/5aUVv0aL0p4HwOup40ZpZ9gB51h.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
    rating: '8.3',
    year: '2024',
    mediaType: 'movie',
    genres: ['Ficção Científica', 'Aventura'],
  },
  {
    id: 'trending-br-3',
    title: 'A Casa do Dragão',
    originalTitle: 'House of the Dragon',
    overview: 'A história da família Targaryen 200 anos antes dos eventos de Game of Thrones, no auge de seu poder com mais de 15 dragões sob seu jugo.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/t9Xke5724fqW3429BMgm49Fz24L.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/etj5CuMP7Hgj22z9Tev7J31UvjV.jpg',
    rating: '8.4',
    year: '2024',
    mediaType: 'tv',
    genres: ['Drama', 'Ação', 'Fantasia'],
  },
  {
    id: 'trending-br-4',
    title: 'Divertida Mente 2',
    originalTitle: 'Inside Out 2',
    overview: 'Riley agora é uma adolescente com novas emoções como Ansiedade, Vergonha, Tédio e Inveja entrando na sala de controle da mente.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xg270vgjbkHN9VeJJWs3amOTgWq.jpg',
    rating: '7.6',
    year: '2024',
    mediaType: 'movie',
    genres: ['Animação', 'Família', 'Aventura'],
  },
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Searches user's library for a match with the top title
 */
export function matchWithLibrary(
  topTitle: string,
  originalTitle: string | undefined,
  libraryItems: MediaItem[]
): MediaItem | undefined {
  const normTop = normalize(topTitle);
  const normOrig = originalTitle ? normalize(originalTitle) : '';

  return libraryItems.find((item) => {
    const itemTitle = normalize(item.title);
    const itemClean = normalize(item.cleanTitle);
    const itemOrig = item.originalTitle ? normalize(item.originalTitle) : '';

    if (itemTitle === normTop || itemClean === normTop) return true;
    if (normOrig && (itemTitle === normOrig || itemClean === normOrig || itemOrig === normOrig)) return true;
    if (itemTitle.includes(normTop) || normTop.includes(itemTitle)) return true;
    return false;
  });
}

/**
 * Loads cached Top 1 Brasil or fetches updated trending data
 */
export async function getTop1Brasil(libraryItems: MediaItem[]): Promise<TopBrasilItem> {
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const settings = loadScraperSettings();

  // Try to read cache
  try {
    const raw = localStorage.getItem(TOP_BRASIL_CACHE_KEY);
    if (raw) {
      const parsed: TopBrasilItem = JSON.parse(raw);
      // If cached today, just refresh library match
      if (parsed.lastUpdated === todayDateStr) {
        parsed.matchedLibraryMedia = matchWithLibrary(parsed.title, parsed.originalTitle, libraryItems);
        return parsed;
      }
    }
  } catch {}

  // Attempt live TMDb Brazil Trending fetch if API key is provided
  if (settings.tmdbApiKey && settings.tmdbApiKey.trim()) {
    try {
      const resp = await fetch(
        `https://api.themoviedb.org/3/trending/all/day?api_key=${settings.tmdbApiKey.trim()}&language=pt-BR&region=BR`
      );
      if (resp.ok) {
        const data = await resp.json();
        const top = data.results?.[0];
        if (top) {
          const item: TopBrasilItem = {
            id: `tmdb-br-${top.id}`,
            title: top.title || top.name || 'Top 1 Brasil',
            originalTitle: top.original_title || top.original_name,
            overview: top.overview || 'O título mais assistido e comentado no Brasil hoje.',
            posterUrl: top.poster_path
              ? `https://image.tmdb.org/t/p/w780${top.poster_path}`
              : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
            backdropUrl: top.backdrop_path
              ? `https://image.tmdb.org/t/p/original${top.backdrop_path}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920',
            rating: (top.vote_average || 8.5).toFixed(1),
            year: (top.release_date || top.first_air_date || '2026').slice(0, 4),
            mediaType: top.media_type === 'tv' ? 'tv' : 'movie',
            genres: ['Em Alta', 'Top Brasil'],
            lastUpdated: todayDateStr,
            matchedLibraryMedia: matchWithLibrary(
              top.title || top.name,
              top.original_title || top.original_name,
              libraryItems
            ),
          };

          localStorage.setItem(TOP_BRASIL_CACHE_KEY, JSON.stringify(item));
          return item;
        }
      }
    } catch (e) {
      console.warn('Could not fetch online TMDb Top Brasil, using library/curated fallback', e);
    }
  }

  // Fallback: If library has high-rated items, pick the highest rated / most watched item from the user's library as the Server Top 1
  if (libraryItems.length > 0) {
    const sorted = [...libraryItems].sort((a, b) => {
      const ra = parseFloat(a.rating || '0') || 0;
      const rb = parseFloat(b.rating || '0') || 0;
      return rb - ra;
    });

    const best = sorted[0];
    const item: TopBrasilItem = {
      id: `lib-top-${best.id}`,
      title: best.title,
      originalTitle: best.originalTitle,
      overview: best.overview || 'Líder de reproduções e avaliações na sua biblioteca.',
      posterUrl: best.posterUrl || '',
      backdropUrl: best.backdropUrl || best.posterUrl || '',
      rating: best.rating || '8.8',
      year: best.year || '2026',
      mediaType: best.type === 'series' ? 'tv' : 'movie',
      genres: best.genre || ['Top 1 Brasil'],
      lastUpdated: todayDateStr,
      matchedLibraryMedia: best,
    };

    localStorage.setItem(TOP_BRASIL_CACHE_KEY, JSON.stringify(item));
    return item;
  }

  // Or use the rotating curated trending list
  const dayOfYear = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const fallbackChoice = BRASIL_TRENDING_DEFAULTS[dayOfYear % BRASIL_TRENDING_DEFAULTS.length];

  const item: TopBrasilItem = {
    ...fallbackChoice,
    lastUpdated: todayDateStr,
    matchedLibraryMedia: matchWithLibrary(fallbackChoice.title, fallbackChoice.originalTitle, libraryItems),
  };

  localStorage.setItem(TOP_BRASIL_CACHE_KEY, JSON.stringify(item));
  return item;
}
