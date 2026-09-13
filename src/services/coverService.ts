import { MediaItem } from '../types';

export interface CoverSearchResult {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year?: string;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  genres?: string[];
}

const CUSTOM_COVERS_KEY = 'drive_cinema_custom_covers_v1';

// Pre-curated high-resolution covers and banners matching the user's screenshot & top streaming titles
export const CURATED_CATALOG: MediaItem[] = [
  {
    id: 'curated-fast-x',
    title: 'Velozes e Furiosos 10',
    cleanTitle: 'Velozes e Furiosos 10',
    type: 'movie',
    year: '2023',
    quality: '4K UHD',
    genre: ['Ação', 'Crime', 'Aventura'],
    overview: 'Dom Toretto e sua família enfrentam o adversário mais letal que já encontraram: uma ameaça terrível que surge das sombras do passado, alimentada por sede de vingança de Dante Reyes.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/1E5baAaEse26fej7uHcjOgEE2t2.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/4XM8DUTQb3lhLemJC51Jx4a2EuA.jpg',
    duration: '2h 21m',
    accounts: [
      {
        accountId: 'drive-curated-1',
        accountLabel: 'Drive 1 (Principal)',
        color: 'blue',
      },
    ],
  },
  {
    id: 'curated-resgate-2',
    title: 'Resgate 2',
    cleanTitle: 'Resgate 2',
    type: 'movie',
    year: '2023',
    quality: '4K UHD',
    genre: ['Ação', 'Suspense'],
    overview: 'Depois de sobreviver por pouco aos eventos do primeiro filme, o mercenário Tyler Rake embarca em outra missão de alto risco para salvar a família de um implacável mafioso georgiano.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/7gKI9hpEMcZUwYeCuVmNaGodCV1.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/7I6VUdPj6tQECNHdviJkUHD2389.jpg',
    duration: '2h 03m',
    accounts: [
      {
        accountId: 'drive-curated-2',
        accountLabel: 'Drive 2 (Secundário)',
        color: 'purple',
      },
    ],
  },
  {
    id: 'curated-stranger-things',
    title: 'Stranger Things',
    cleanTitle: 'Stranger Things',
    type: 'series',
    year: '2022',
    quality: '4K UHD',
    genre: ['Ficção Científica', 'Terror', 'Mistério'],
    overview: 'Quando um garoto desaparece em Hawkins, uma pequena cidade descobre um mistério envolvendo experimentos secretos, forças sobrenaturais aterrorizantes e uma garota muito estranha.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    totalEpisodes: 34,
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: 'st-s1e1',
            fileId: 'st-s1e1-f',
            accountId: 'drive-curated-1',
            accountLabel: 'Drive 1 (Principal)',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Capítulo Um: O Desaparecimento de Will Byers',
            rawFileName: 'Stranger.Things.S01E01.1080p.NF.WEB-DL.mkv',
            size: '2.1 GB',
            durationFormatted: '48m',
            quality: '1080p',
          },
          {
            id: 'st-s1e2',
            fileId: 'st-s1e2-f',
            accountId: 'drive-curated-1',
            accountLabel: 'Drive 1 (Principal)',
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Capítulo Dois: A Estranha da Maple Street',
            rawFileName: 'Stranger.Things.S01E02.1080p.NF.WEB-DL.mkv',
            size: '2.2 GB',
            durationFormatted: '55m',
            quality: '1080p',
          },
        ],
      },
    ],
    accounts: [
      {
        accountId: 'drive-curated-1',
        accountLabel: 'Drive 1 (Principal)',
        color: 'blue',
      },
    ],
  },
  {
    id: 'curated-last-of-us',
    title: 'The Last of Us',
    cleanTitle: 'The Last of Us',
    type: 'series',
    year: '2023',
    quality: '4K UHD',
    genre: ['Drama', 'Ficção Científica', 'Ação'],
    overview: 'Joel e Ellie, conectados pela dureza do mundo pós-pandêmico em que vivem, são forçados a enfrentar circunstâncias brutais e monstros implacáveis em uma jornada pelos Estados Unidos.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/uKvVjHNqB5VmOrdxqAt2V7JMrne.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    totalEpisodes: 9,
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: 'tlou-s1e1',
            fileId: 'tlou-s1e1-f',
            accountId: 'drive-curated-2',
            accountLabel: 'Drive 2 (Secundário)',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Quando Você Estiver Perdido na Escuridão',
            rawFileName: 'The.Last.of.Us.S01E01.2160p.UHD.mkv',
            size: '4.8 GB',
            durationFormatted: '1h 21m',
            quality: '4K UHD',
          },
        ],
      },
    ],
    accounts: [
      {
        accountId: 'drive-curated-2',
        accountLabel: 'Drive 2 (Secundário)',
        color: 'purple',
      },
    ],
  },
  {
    id: 'curated-mario-bros',
    title: 'Super Mario Bros. O Filme',
    cleanTitle: 'Super Mario Bros',
    type: 'movie',
    year: '2023',
    quality: '4K UHD',
    genre: ['Animação', 'Kids', 'Aventura', 'Comédia'],
    overview: 'Os encanadores do Brooklyn Mario e Luigi viajam por um labirinto subterrâneo e enfrentam Bowser para resgatar a Princesa Peach e proteger o Reino dos Cogumelos.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9n2tJBplPbgR2ca05h5q1729QJ0.jpg',
    duration: '1h 32m',
    accounts: [
      {
        accountId: 'drive-curated-1',
        accountLabel: 'Drive 1 (Principal)',
        color: 'blue',
      },
    ],
  },
  {
    id: 'curated-demon-slayer',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    cleanTitle: 'Demon Slayer',
    type: 'series',
    year: '2024',
    quality: '1080p Full HD',
    genre: ['Anime', 'Ação', 'Fantasia'],
    overview: 'Tanjiro Kamado, um jovem determinado, luta contra demônios e busca uma cura para sua irmã Nezuko, que foi transformada em um deles.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/nTvM4mhqZlHIvUkIvdikWstje9g.jpg',
    totalEpisodes: 55,
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: 'ds-s1e1',
            fileId: 'ds-s1e1-f',
            accountId: 'drive-curated-2',
            accountLabel: 'Drive 2 (Secundário)',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Crueldade',
            rawFileName: 'Demon.Slayer.S01E01.1080p.Dual.Audio.mkv',
            size: '1.4 GB',
            durationFormatted: '24m',
            quality: '1080p',
          },
        ],
      },
    ],
    accounts: [
      {
        accountId: 'drive-curated-2',
        accountLabel: 'Drive 2 (Secundário)',
        color: 'purple',
      },
    ],
  },
  {
    id: 'curated-john-wick-4',
    title: 'John Wick 4: Baba Yaga',
    cleanTitle: 'John Wick 4',
    type: 'movie',
    year: '2023',
    quality: '4K UHD',
    genre: ['Ação', 'Crime', 'Suspense'],
    overview: 'John Wick descobre um caminho para derrotar a Alta Cúpula. Mas antes que ele possa conquistar sua liberdade, Wick deve enfrentar um novo inimigo com poderosas alianças globais.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/vZloFAK7NKnMGKEslUsZ2VoXVmm.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/h8gHn0OzRogL0GayNX0aHQiv0XQ.jpg',
    duration: '2h 49m',
    accounts: [
      {
        accountId: 'drive-curated-1',
        accountLabel: 'Drive 1 (Principal)',
        color: 'blue',
      },
    ],
  },
  {
    id: 'curated-oppenheimer',
    title: 'Oppenheimer',
    cleanTitle: 'Oppenheimer',
    type: 'movie',
    year: '2023',
    quality: '4K UHD',
    genre: ['Drama', 'História', 'Biografia'],
    overview: 'A história do físico americano J. Robert Oppenheimer, seu papel no Projeto Manhattan e o desenvolvimento da primeira bomba atômica da história.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    duration: '3h 00m',
    accounts: [
      {
        accountId: 'drive-curated-2',
        accountLabel: 'Drive 2 (Secundário)',
        color: 'purple',
      },
    ],
  },
  {
    id: 'curated-spiderman-spiderverse',
    title: 'Homem-Aranha: Através do Aranhaverso',
    cleanTitle: 'Homem Aranha Atraves do Aranhaverso',
    type: 'movie',
    year: '2023',
    quality: '4K UHD',
    genre: ['Animação', 'Kids', 'Ação', 'Aventura'],
    overview: 'Miles Morales é catapultado através do Multiverso, onde encontra uma equipe de Pessoas-Aranha encarregadas de proteger sua própria existência.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    duration: '2h 20m',
    accounts: [
      {
        accountId: 'drive-curated-1',
        accountLabel: 'Drive 1 (Principal)',
        color: 'blue',
      },
    ],
  },
  {
    id: 'curated-jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    cleanTitle: 'Jujutsu Kaisen',
    type: 'series',
    year: '2023',
    quality: '1080p Full HD',
    genre: ['Anime', 'Ação', 'Sobrenatural'],
    overview: 'Yuji Itadori engole um dedo amaldiçoado e se junta a uma escola secreta de Feiticeiros Jujutsu para combater as maldições mortais que assolam o Japão.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/hFWP5HkbVEe40grX8D5N40S5Kk5.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9r1B3TfF025Xk2Xz2w55f54Kz5Q.jpg',
    totalEpisodes: 47,
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: 'jjk-s1e1',
            fileId: 'jjk-s1e1-f',
            accountId: 'drive-curated-2',
            accountLabel: 'Drive 2 (Secundário)',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Ryomen Sukuna',
            rawFileName: 'Jujutsu.Kaisen.S01E01.1080p.mkv',
            size: '1.2 GB',
            durationFormatted: '24m',
            quality: '1080p',
          },
        ],
      },
    ],
    accounts: [
      {
        accountId: 'drive-curated-2',
        accountLabel: 'Drive 2 (Secundário)',
        color: 'purple',
      },
    ],
  },
];

// Load user-defined custom covers from localStorage
export function loadCustomCovers(): Record<string, { posterUrl?: string; backdropUrl?: string; title?: string; overview?: string }> {
  try {
    const raw = localStorage.getItem(CUSTOM_COVERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Save user-defined custom cover for a given mediaId
export function saveCustomCover(
  mediaId: string,
  cover: { posterUrl?: string; backdropUrl?: string; title?: string; overview?: string }
): void {
  try {
    const current = loadCustomCovers();
    current[mediaId] = { ...current[mediaId], ...cover };
    localStorage.setItem(CUSTOM_COVERS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save custom cover', e);
  }
}

/**
 * Searches online database (Cinemeta / Open APIs) for covers and backdrops.
 */
export async function searchCoversOnline(query: string, type?: 'movie' | 'series'): Promise<CoverSearchResult[]> {
  const cleanQ = encodeURIComponent(query.trim().toLowerCase());
  if (!cleanQ) return [];

  const results: CoverSearchResult[] = [];

  // Check curated catalog first for immediate matches
  const qLower = query.toLowerCase();
  for (const item of CURATED_CATALOG) {
    if (
      item.title.toLowerCase().includes(qLower) ||
      item.cleanTitle.toLowerCase().includes(qLower)
    ) {
      results.push({
        id: item.id,
        title: item.title,
        type: item.type,
        year: item.year,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        overview: item.overview,
        genres: item.genre,
      });
    }
  }

  // Query Cinemeta public API (no API key needed, has official posters and backdrops)
  try {
    const searchType = type === 'series' ? 'series' : 'movie';
    const response = await fetch(
      `https://v3-cinemeta.strem.io/catalog/${searchType}/top/search=${cleanQ}.json`,
      { headers: { Accept: 'application/json' } }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.metas)) {
        for (const meta of data.metas.slice(0, 10)) {
          // Format poster & backdrop
          const poster = meta.poster ? meta.poster.replace(/_V1_SX\d+\./, '_V1_SX700.') : undefined;
          const backdrop = meta.background || poster;

          if (!results.some((r) => r.id === meta.id)) {
            results.push({
              id: meta.id || meta.imdb_id || `cm-${Math.random()}`,
              title: meta.name || query,
              type: meta.type === 'series' ? 'series' : 'movie',
              year: meta.releaseInfo || meta.year,
              posterUrl: poster,
              backdropUrl: backdrop,
              overview: meta.description,
              genres: meta.genres,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Cinemeta search error:', err);
  }

  // Also query TVMaze if series or no results yet
  if (results.length === 0 || type === 'series') {
    try {
      const tvRes = await fetch(`https://api.tvmaze.com/search/shows?q=${cleanQ}`);
      if (tvRes.ok) {
        const tvData = await tvRes.json();
        if (Array.isArray(tvData)) {
          for (const item of tvData.slice(0, 5)) {
            const show = item.show;
            if (show) {
              results.push({
                id: `tvmaze-${show.id}`,
                title: show.name,
                type: 'series',
                year: show.premiered ? show.premiered.slice(0, 4) : undefined,
                posterUrl: show.image?.original || show.image?.medium,
                backdropUrl: show.image?.original,
                overview: show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : undefined,
                genres: show.genres,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('TVMaze search error:', e);
    }
  }

  return results;
}

/**
 * Enriches a media item with high-res covers either from custom overrides,
 * curated matches, or online search.
 */
export async function enrichMediaItemCover(item: MediaItem): Promise<MediaItem> {
  const customCovers = loadCustomCovers();
  const custom = customCovers[item.id];

  if (custom) {
    return {
      ...item,
      posterUrl: custom.posterUrl || item.posterUrl,
      backdropUrl: custom.backdropUrl || item.backdropUrl,
      title: custom.title || item.title,
      overview: custom.overview || item.overview,
    };
  }

  // Check if matches curated list
  const titleLower = item.cleanTitle.toLowerCase().trim();
  const curated = CURATED_CATALOG.find((c) => {
    const cTitleLower = c.cleanTitle.toLowerCase().trim();
    return (
      titleLower.includes(cTitleLower) ||
      cTitleLower.includes(titleLower) ||
      titleLower.replace(/[^a-z0-9]/g, '') === cTitleLower.replace(/[^a-z0-9]/g, '')
    );
  });

  if (curated) {
    return {
      ...item,
      posterUrl: item.posterUrl || curated.posterUrl,
      backdropUrl: item.backdropUrl || curated.backdropUrl,
      overview: item.overview && item.overview.length > 50 ? item.overview : curated.overview,
      genre: item.genre && item.genre.length > 2 ? item.genre : curated.genre,
      year: item.year || curated.year,
    };
  }

  // Attempt automatic online fetch if missing poster
  if (!item.posterUrl || item.posterUrl.includes('googleusercontent.com')) {
    try {
      const search = await searchCoversOnline(item.cleanTitle, item.type);
      if (search.length > 0 && search[0].posterUrl) {
        return {
          ...item,
          posterUrl: search[0].posterUrl,
          backdropUrl: search[0].backdropUrl || item.backdropUrl || search[0].posterUrl,
          overview: item.overview && item.overview.length > 50 ? item.overview : search[0].overview,
          genre: item.genre && item.genre.length > 2 ? item.genre : search[0].genres,
          year: item.year || search[0].year,
        };
      }
    } catch {
      // Keep existing
    }
  }

  return item;
}

/**
 * Synchronously enriches media items with local custom covers and curated high-resolution covers.
 */
export function enrichMediaItemsSync(items: MediaItem[]): MediaItem[] {
  const customCovers = loadCustomCovers();

  return items.map((item) => {
    const custom = customCovers[item.id];
    let enriched = { ...item };

    if (custom) {
      enriched.posterUrl = custom.posterUrl || enriched.posterUrl;
      enriched.backdropUrl = custom.backdropUrl || enriched.backdropUrl;
      enriched.title = custom.title || enriched.title;
      enriched.overview = custom.overview || enriched.overview;
      return enriched;
    }

    const titleLower = item.cleanTitle.toLowerCase().trim();
    const curated = CURATED_CATALOG.find((c) => {
      const cTitleLower = c.cleanTitle.toLowerCase().trim();
      return (
        titleLower.includes(cTitleLower) ||
        cTitleLower.includes(titleLower) ||
        titleLower.replace(/[^a-z0-9]/g, '') === cTitleLower.replace(/[^a-z0-9]/g, '')
      );
    });

    if (curated) {
      enriched.posterUrl = enriched.posterUrl || curated.posterUrl;
      enriched.backdropUrl = enriched.backdropUrl || curated.backdropUrl;
      enriched.overview = enriched.overview && enriched.overview.length > 50 ? enriched.overview : curated.overview;
      enriched.genre = enriched.genre && enriched.genre.length > 2 ? enriched.genre : curated.genre;
      enriched.year = enriched.year || curated.year;
    }

    return enriched;
  });
}
