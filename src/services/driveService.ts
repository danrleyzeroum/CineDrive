import { DriveRawFile, DriveFolder } from '../types';
import { decodeSubtitleBuffer } from './subtitleService';

/**
 * Traverses subfolders under rootFolderId to collect all descendant folder IDs,
 * so media inside subfolders (e.g. Movies/2023 or Series/Season 1) is automatically indexed.
 */
export async function getAllDescendantFolderIds(
  accessToken: string,
  rootFolderId: string,
  maxFolders = 200
): Promise<string[]> {
  const collectedIds = [rootFolderId];
  const queue = [rootFolderId];

  while (queue.length > 0 && collectedIds.length < maxFolders) {
    const currentId = queue.shift()!;
    try {
      const children = await fetchFoldersFromDrive(accessToken, '', '', currentId);
      for (const child of children) {
        if (!collectedIds.includes(child.id)) {
          collectedIds.push(child.id);
          queue.push(child.id);
          if (collectedIds.length >= maxFolders) break;
        }
      }
    } catch {
      // Continue with whatever folders have been gathered
      break;
    }
  }

  return collectedIds;
}

/**
 * Scans Google Drive for video files (mp4, mkv, avi, webm, mov, etc.).
 * Supports specific folder selection with recursive subfolder searching,
 * shared drives, and pagination.
 */
export async function fetchVideosFromDrive(
  accessToken: string,
  accountId: string,
  accountLabel: string,
  folderId?: string,
  onProgress?: (count: number) => void
): Promise<DriveRawFile[]> {
  const allFiles: DriveRawFile[] = [];
  const videoFilter = "(mimeType contains 'video/' or name contains '.mkv' or name contains '.mp4' or name contains '.avi' or name contains '.webm') and trashed = false";

  // If a specific folder is selected, collect its descendant folders to scan subfolders too!
  let targetFolderIds: string[] = [];
  if (folderId) {
    try {
      targetFolderIds = await getAllDescendantFolderIds(accessToken, folderId);
    } catch {
      targetFolderIds = [folderId];
    }
  }

  // Helper to query Drive with pagination
  const runQuery = async (queryCondition: string) => {
    let pageToken: string | null = null;
    do {
      const params = new URLSearchParams({
        q: `${videoFilter} and ${queryCondition}`,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, webContentLink, iconLink, videoMediaMetadata, parents)',
        pageSize: '100',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
        orderBy: 'modifiedTime desc',
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Erro na API do Google Drive (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMsg = errorJson.error.message;
          }
        } catch {
          // fallback
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const files: DriveRawFile[] = (data.files || []).map((file: any) => ({
        ...file,
        accountId,
        accountLabel,
      }));

      for (const file of files) {
        if (!allFiles.some((existing) => existing.id === file.id)) {
          allFiles.push(file);
        }
      }

      if (onProgress) {
        onProgress(allFiles.length);
      }

      pageToken = data.nextPageToken || null;
      if (allFiles.length >= 1200) break;
    } while (pageToken);
  };

  if (targetFolderIds.length > 0) {
    // Query chunks of 15 parents at a time
    const CHUNK_SIZE = 15;
    for (let i = 0; i < targetFolderIds.length; i += CHUNK_SIZE) {
      const chunk = targetFolderIds.slice(i, i + CHUNK_SIZE);
      const parentCondition = chunk.length === 1
        ? `'${chunk[0]}' in parents`
        : `(${chunk.map((id) => `'${id}' in parents`).join(' or ')})`;

      await runQuery(parentCondition);
      if (allFiles.length >= 1200) break;
    }
  } else {
    // Entire Drive (no specific parent folder restriction)
    let pageToken: string | null = null;
    do {
      const params = new URLSearchParams({
        q: videoFilter,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, webContentLink, iconLink, videoMediaMetadata, parents)',
        pageSize: '100',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
        orderBy: 'modifiedTime desc',
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Erro na API do Google Drive (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMsg = errorJson.error.message;
          }
        } catch {
          // fallback
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const files: DriveRawFile[] = (data.files || []).map((file: any) => ({
        ...file,
        accountId,
        accountLabel,
      }));

      allFiles.push(...files);
      if (onProgress) {
        onProgress(allFiles.length);
      }

      pageToken = data.nextPageToken || null;
      if (allFiles.length >= 1200) break;
    } while (pageToken);
  }

  return allFiles;
}

/**
 * Fetches folders from a Google Drive account to allow folder navigation and selection.
 * Supports pagination so no folders are cut off when navigating Meu Drive or subdirectories.
 */
export async function fetchFoldersFromDrive(
  accessToken: string,
  accountId: string,
  accountLabel: string,
  parentId?: string
): Promise<DriveFolder[]> {
  const allFolders: DriveFolder[] = [];
  // If parentId is not provided or is 'root', query direct children of Meu Drive
  let q: string;
  if (!parentId || parentId === 'root') {
    q = "mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false";
  } else {
    q = `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  }

  let pageToken: string | null = null;
  let pageCount = 0;

  try {
    do {
      const params = new URLSearchParams({
        q,
        fields: 'nextPageToken, files(id, name, parents)',
        pageSize: '100',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
        orderBy: 'name',
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        break;
      }

      const data = await response.json();
      const batch: DriveFolder[] = (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        accountId,
        accountLabel,
        parentId: f.parents?.[0],
      }));

      allFolders.push(...batch);
      pageToken = data.nextPageToken || null;
      pageCount++;
      if (pageCount >= 6) break; // Fetch up to 600 folders
    } while (pageToken);

    // Fallback: If 'root' in parents returned 0 folders (some accounts don't use 'root' parent representation)
    if (allFolders.length === 0 && (!parentId || parentId === 'root')) {
      const fallbackParams = new URLSearchParams({
        q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, name, parents)',
        pageSize: '100',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
        orderBy: 'name',
      });

      const fallbackRes = await fetch(`https://www.googleapis.com/drive/v3/files?${fallbackParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        return (fallbackData.files || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          accountId,
          accountLabel,
          parentId: f.parents?.[0],
        }));
      }
    }
  } catch (err) {
    console.error('Erro ao buscar pastas do Drive:', err);
  }

  return allFolders;
}

/**
 * Searches across the entire Google Drive for folders matching a specific keyword (e.g. "MIDIA").
 * Searches at all folder depths and across all shared drives.
 */
export async function searchFoldersGlobally(
  accessToken: string,
  accountId: string,
  accountLabel: string,
  searchTerm: string
): Promise<DriveFolder[]> {
  const cleanTerm = searchTerm.trim().replace(/'/g, "\\'");
  if (!cleanTerm) return [];

  const foundFolders: DriveFolder[] = [];
  const query = `mimeType = 'application/vnd.google-apps.folder' and name contains '${cleanTerm}' and trashed = false`;

  try {
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id, name, parents)',
      pageSize: '50',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      orderBy: 'name',
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      (data.files || []).forEach((f: any) => {
        foundFolders.push({
          id: f.id,
          name: f.name,
          accountId,
          accountLabel,
          parentId: f.parents?.[0],
        });
      });
    }
  } catch (err) {
    console.error(`Erro ao pesquisar pastas com "${cleanTerm}":`, err);
  }

  return foundFolders;
}

/**
 * Specifically finds folders named MIDIA, Mídia, Midia, midias, etc. across the entire Drive,
 * including root, subfolders, and shared folders.
 */
export async function findFoldersNamedMidia(
  accessToken: string,
  accountId: string,
  accountLabel: string
): Promise<DriveFolder[]> {
  const terms = ['MIDIA', 'Mídia', 'Midia', 'midia', 'MÍDIA'];
  const map = new Map<string, DriveFolder>();

  for (const term of terms) {
    try {
      const results = await searchFoldersGlobally(accessToken, accountId, accountLabel, term);
      for (const item of results) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      }
      if (map.size >= 10) break;
    } catch {
      // Continue next variation
    }
  }

  // Also check shared with me
  try {
    const shared = await fetchSharedWithMeFolders(accessToken, accountId, accountLabel);
    for (const f of shared) {
      const lower = f.name.toLowerCase();
      if (lower.includes('midi') || lower.includes('mídi')) {
        if (!map.has(f.id)) {
          map.set(f.id, f);
        }
      }
    }
  } catch {
    // Continue
  }

  return Array.from(map.values());
}

/**
 * Fetches folders shared with the user from another Google account.
 */
export async function fetchSharedWithMeFolders(
  accessToken: string,
  accountId: string,
  accountLabel: string
): Promise<DriveFolder[]> {
  try {
    const params = new URLSearchParams({
      q: "mimeType = 'application/vnd.google-apps.folder' and sharedWithMe = true and trashed = false",
      fields: 'files(id, name, parents)',
      pageSize: '50',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      orderBy: 'name',
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      accountId,
      accountLabel,
      parentId: f.parents?.[0],
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches details (such as name) for a specific folder ID.
 */
export async function fetchFolderDetails(
  accessToken: string,
  folderId: string
): Promise<{ id: string; name: string } | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType&supportsAllDrives=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return { id: data.id, name: data.name };
  } catch {
    return null;
  }
}

/**
 * Generates streamable / embed URL for a Google Drive file.
 */
export function getDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Direct download / stream media URL from Google Drive API using token.
 */
export function getDriveDirectMediaUrl(fileId: string, accessToken: string): string {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${encodeURIComponent(accessToken)}`;
}

/**
 * Searches Google Drive for .srt or .vtt subtitle files matching a media file's folder or title.
 */
export async function fetchSubtitlesFromDrive(
  accessToken: string,
  accountId: string,
  accountLabel: string,
  rawFileName?: string,
  parentFolderIds?: string[]
): Promise<DriveRawFile[]> {
  const subtitleFilter = "(name contains '.srt' or name contains '.vtt') and trashed = false";
  const results: DriveRawFile[] = [];

  // Helper to run query
  const queryDrive = async (q: string) => {
    try {
      const params = new URLSearchParams({
        q,
        fields: 'files(id, name, mimeType, size, modifiedTime, parents)',
        pageSize: '30',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      });

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      for (const file of data.files || []) {
        if (!results.some((r) => r.id === file.id)) {
          results.push({
            ...file,
            accountId,
            accountLabel,
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar legendas no Drive:', e);
    }
  };

  // 1. If parent folders are known, search inside the same folders as the video
  if (parentFolderIds && parentFolderIds.length > 0) {
    const parentConditions = parentFolderIds.map((pid) => `'${pid}' in parents`).join(' or ');
    await queryDrive(`${subtitleFilter} and (${parentConditions})`);
  }

  // 2. If rawFileName is known, extract clean base name and search
  if (rawFileName) {
    const cleanBase = rawFileName.replace(/\.[^/.]+$/, '').trim();
    // Search by full clean name
    const sanitizedBase = cleanBase.replace(/['\\]/g, '');
    if (sanitizedBase.length >= 3) {
      await queryDrive(`${subtitleFilter} and name contains '${sanitizedBase.slice(0, 30)}'`);
    }

    // Also try keywords if not enough results
    if (results.length === 0) {
      const firstKeyword = sanitizedBase.split(/[\s\.\-_]+/)[0];
      if (firstKeyword && firstKeyword.length >= 4) {
        await queryDrive(`${subtitleFilter} and name contains '${firstKeyword}'`);
      }
    }
  }

  return results;
}

/**
 * Searches all .srt / .vtt files in the specified Drive account by custom query.
 */
export async function searchSubtitlesInDrive(
  accessToken: string,
  accountId: string,
  accountLabel: string,
  queryText?: string
): Promise<DriveRawFile[]> {
  const subtitleFilter = "(name contains '.srt' or name contains '.vtt') and trashed = false";
  let fullQ = subtitleFilter;

  if (queryText && queryText.trim().length > 0) {
    const cleanQ = queryText.trim().replace(/['\\]/g, '');
    fullQ = `${subtitleFilter} and name contains '${cleanQ}'`;
  }

  try {
    const params = new URLSearchParams({
      q: fullQ,
      fields: 'files(id, name, mimeType, size, modifiedTime, parents)',
      pageSize: '50',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      orderBy: 'modifiedTime desc',
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      ...file,
      accountId,
      accountLabel,
    }));
  } catch (e) {
    console.error('Erro na pesquisa de legendas:', e);
    return [];
  }
}

/**
 * Downloads and decodes the raw text content of a subtitle (.srt or .vtt) from Google Drive.
 */
export async function fetchDriveSubtitleContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar legenda do Google Drive (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return decodeSubtitleBuffer(arrayBuffer);
}

