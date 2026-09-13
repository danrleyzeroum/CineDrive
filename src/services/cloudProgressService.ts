import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { WatchProgress } from '../types';
import { loadWatchProgress, saveWatchProgress } from './storageService';

const COLLECTION_NAME = 'watch_progress';

/**
 * Generates a clean document key for Firestore.
 * Prefers fileId; if empty, uses mediaId.
 */
export function generateProgressDocId(fileId: string, mediaId?: string): string {
  const raw = fileId || mediaId || 'unknown_item';
  return `prog_${raw.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

/**
 * Saves watch progress to both Firebase Firestore and LocalStorage.
 * Guarantees that progress is synced in the cloud so another device
 * can resume immediately from this exact point.
 */
export async function saveCloudWatchProgress(
  progress: WatchProgress,
  accountEmail?: string
): Promise<boolean> {
  // 1. Save locally first (instant UI update and offline safety)
  try {
    saveWatchProgress(progress);
  } catch (e) {
    console.warn('Falha ao salvar progresso localmente:', e);
  }

  // 2. Persist to Firestore
  try {
    const docId = generateProgressDocId(progress.fileId, progress.mediaId);
    const docRef = doc(db, COLLECTION_NAME, docId);

    const payload = {
      mediaId: progress.mediaId,
      fileId: progress.fileId,
      progressPercent: Math.round(progress.progressPercent * 10) / 10,
      currentTimeSeconds: Math.round(progress.currentTimeSeconds),
      durationSeconds: Math.round(progress.durationSeconds || 0),
      lastWatched: progress.lastWatched || Date.now(),
      title: progress.title || '',
      episodeInfo: progress.episodeInfo || '',
      posterUrl: progress.posterUrl || '',
      accountEmail: accountEmail || progress.accountEmail || '',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.warn('Aviso: Falha ao sincronizar progresso na nuvem (Firestore):', error);
    return false;
  }
}

/**
 * Subscribes to real-time watch progress updates from Firebase Firestore.
 * When the user pauses or advances on a second device (phone/tablet/PC),
 * the primary device (Android TV or browser) receives the updated progress
 * instantly and refreshes the Continue Watching shelf.
 */
export function subscribeToCloudWatchProgress(
  onUpdate: (progressList: WatchProgress[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy('lastWatched', 'desc'), limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudList: WatchProgress[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            cloudList.push({
              mediaId: data.mediaId,
              fileId: data.fileId,
              progressPercent: Number(data.progressPercent) || 0,
              currentTimeSeconds: Number(data.currentTimeSeconds) || 0,
              durationSeconds: Number(data.durationSeconds) || 0,
              lastWatched: Number(data.lastWatched) || 0,
              title: data.title || '',
              episodeInfo: data.episodeInfo || undefined,
              posterUrl: data.posterUrl || undefined,
              accountEmail: data.accountEmail || undefined,
            });
          }
        });

        // Merge with local progress (most recent timestamp wins per fileId)
        const localList = loadWatchProgress();
        const merged = mergeWatchProgressLists(cloudList, localList);

        // Update local storage cache to keep them consistent
        try {
          localStorage.setItem('drive_cinema_watch_progress_v1', JSON.stringify(merged.slice(0, 30)));
        } catch {}

        onUpdate(merged);
      },
      (error) => {
        console.warn('Erro no listener de progresso do Firebase:', error);
        // Fallback to local storage
        onUpdate(loadWatchProgress());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Não foi possível iniciar o listener de progresso do Firestore:', err);
    onUpdate(loadWatchProgress());
    return () => {};
  }
}

/**
 * Performs a one-time bidirectional sync between LocalStorage and Firestore.
 */
export async function syncCloudWatchProgress(): Promise<WatchProgress[]> {
  const localList = loadWatchProgress();
  let cloudList: WatchProgress[] = [];

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    snap.forEach((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        cloudList.push({
          mediaId: data.mediaId,
          fileId: data.fileId,
          progressPercent: Number(data.progressPercent) || 0,
          currentTimeSeconds: Number(data.currentTimeSeconds) || 0,
          durationSeconds: Number(data.durationSeconds) || 0,
          lastWatched: Number(data.lastWatched) || 0,
          title: data.title || '',
          episodeInfo: data.episodeInfo || undefined,
          posterUrl: data.posterUrl || undefined,
          accountEmail: data.accountEmail || undefined,
        });
      }
    });
  } catch (err) {
    console.warn('Erro ao carregar progresso da nuvem:', err);
  }

  // Upload local items that are newer than cloud
  for (const local of localList) {
    const cloudMatch = cloudList.find((c) => c.fileId === local.fileId);
    if (!cloudMatch || local.lastWatched > (cloudMatch.lastWatched || 0)) {
      saveCloudWatchProgress(local).catch(() => {});
    }
  }

  const merged = mergeWatchProgressLists(cloudList, localList);
  try {
    localStorage.setItem('drive_cinema_watch_progress_v1', JSON.stringify(merged.slice(0, 30)));
  } catch {}

  return merged;
}

/**
 * Removes progress for a specific video file from Firestore and LocalStorage.
 */
export async function deleteCloudWatchProgress(fileId: string, mediaId?: string): Promise<void> {
  try {
    const local = loadWatchProgress();
    const filtered = local.filter((p) => p.fileId !== fileId);
    localStorage.setItem('drive_cinema_watch_progress_v1', JSON.stringify(filtered));
  } catch {}

  try {
    const docId = generateProgressDocId(fileId, mediaId);
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
  } catch (err) {
    console.warn('Falha ao deletar progresso da nuvem:', err);
  }
}

/**
 * Utility to merge two progress lists keeping the most recently updated item for each file.
 */
export function mergeWatchProgressLists(listA: WatchProgress[], listB: WatchProgress[]): WatchProgress[] {
  const map = new Map<string, WatchProgress>();

  for (const item of [...listA, ...listB]) {
    const existing = map.get(item.fileId);
    if (!existing || (item.lastWatched || 0) > (existing.lastWatched || 0)) {
      map.set(item.fileId, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.lastWatched || 0) - (a.lastWatched || 0));
}
