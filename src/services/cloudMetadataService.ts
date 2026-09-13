import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { MediaItem, CloudMediaMetadata } from '../types';

const COLLECTION_NAME = 'media_metadata';

/**
 * Generates a stable, safe document ID for Firestore.
 * Matches movies by file ID or normalized title, and series by normalized series title.
 */
export function generateCloudMediaKey(item: MediaItem): string {
  if (item.type === 'movie' && item.movieFile?.id) {
    return `movie_${item.movieFile.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  const clean = (item.cleanTitle || item.title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 80);
  return `${item.type}_${clean}`;
}

/**
 * Saves or updates a single media item's enriched metadata in the Firestore cloud database.
 * Does not store heavy binary data, only lightweight metadata (titles, posters, synopses, ratings)
 * so it consumes virtually zero device storage.
 */
export async function saveMediaMetadataToCloud(item: MediaItem): Promise<boolean> {
  try {
    const mediaKey = generateCloudMediaKey(item);
    const docRef = doc(db, COLLECTION_NAME, mediaKey);

    const data: CloudMediaMetadata = {
      id: item.id,
      mediaKey,
      title: item.title,
      originalTitle: item.originalTitle || '',
      type: item.type,
      year: item.year || '',
      overview: item.overview || '',
      posterUrl: item.posterUrl || '',
      backdropUrl: item.backdropUrl || '',
      rating: item.rating || '',
      genres: item.genre || [],
      quality: item.quality || '',
      duration: item.duration || '',
      director: item.director || '',
      cast: item.cast || [],
      tmdbId: item.tmdbId ? String(item.tmdbId) : '',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.warn('Falha ao salvar metadados na nuvem (Firestore):', err);
    return false;
  }
}

/**
 * Saves a list of enriched items in Firestore batches (up to 20 at a time).
 */
export async function batchSaveMediaMetadataToCloud(items: MediaItem[]): Promise<number> {
  if (!items || items.length === 0) return 0;
  let savedCount = 0;

  try {
    const chunkSize = 20;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      for (const item of chunk) {
        // Only save items that actually have enriched data (poster or synopsis or rating)
        const hasEnrichment =
          (item.posterUrl && !item.posterUrl.includes('googleusercontent.com')) ||
          (item.overview && item.overview.length > 30) ||
          item.rating;

        if (hasEnrichment) {
          const mediaKey = generateCloudMediaKey(item);
          const docRef = doc(db, COLLECTION_NAME, mediaKey);
          const data: CloudMediaMetadata = {
            id: item.id,
            mediaKey,
            title: item.title,
            originalTitle: item.originalTitle || '',
            type: item.type,
            year: item.year || '',
            overview: item.overview || '',
            posterUrl: item.posterUrl || '',
            backdropUrl: item.backdropUrl || '',
            rating: item.rating || '',
            genres: item.genre || [],
            quality: item.quality || '',
            duration: item.duration || '',
            director: item.director || '',
            cast: item.cast || [],
            tmdbId: item.tmdbId ? String(item.tmdbId) : '',
            updatedAt: new Date().toISOString(),
          };
          batch.set(docRef, data, { merge: true });
          savedCount++;
        }
      }

      await batch.commit();
    }
  } catch (err) {
    console.warn('Erro ao salvar lote na nuvem:', err);
  }

  return savedCount;
}

/**
 * Loads all stored metadata from Firestore into a memory Map.
 * Fast single-roundtrip operation that allows instantly restoring enriched titles,
 * covers, synopses, and ratings without re-scraping and without using local device storage.
 */
export async function loadAllCloudMetadata(): Promise<Map<string, CloudMediaMetadata>> {
  const map = new Map<string, CloudMediaMetadata>();
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    snap.forEach((docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data() as CloudMediaMetadata;
        if (d.mediaKey) {
          map.set(d.mediaKey, d);
        } else {
          map.set(docSnap.id, d);
        }
      }
    });
  } catch (err) {
    console.warn('Aviso: Não foi possível carregar banco de dados na nuvem:', err);
  }
  return map;
}

/**
 * Merges raw parsed media items with enriched metadata from the cloud database.
 * Preserves pt-BR titles, custom covers, Portuguese synopses, ratings, directors, and genres!
 */
export function mergeItemsWithCloudMetadata(
  items: MediaItem[],
  cloudMap: Map<string, CloudMediaMetadata>
): { mergedItems: MediaItem[]; restoredCount: number } {
  if (cloudMap.size === 0) {
    return { mergedItems: items, restoredCount: 0 };
  }

  let restoredCount = 0;

  const mergedItems = items.map((item) => {
    const key = generateCloudMediaKey(item);
    const cloudData = cloudMap.get(key);

    if (!cloudData) {
      return item;
    }

    restoredCount++;

    return {
      ...item,
      title: cloudData.title || item.title,
      originalTitle: cloudData.originalTitle || item.originalTitle,
      posterUrl: cloudData.posterUrl || item.posterUrl,
      backdropUrl: cloudData.backdropUrl || item.backdropUrl || cloudData.posterUrl,
      overview: cloudData.overview || item.overview,
      rating: cloudData.rating || item.rating,
      genre: cloudData.genres && cloudData.genres.length > 0 ? cloudData.genres : item.genre,
      quality: cloudData.quality || item.quality,
      duration: cloudData.duration || item.duration,
      director: cloudData.director || item.director,
      cast: cloudData.cast && cloudData.cast.length > 0 ? cloudData.cast : item.cast,
      tmdbId: cloudData.tmdbId || item.tmdbId,
      year: cloudData.year || item.year,
    };
  });

  return { mergedItems, restoredCount };
}
