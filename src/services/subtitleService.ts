import { SubtitleCue, SubtitleTrack } from '../types';

/**
 * Parses timestamp string (HH:MM:SS,mmm or HH:MM:SS.mmm or MM:SS.mmm) into seconds.
 */
export function parseTimestampToSeconds(timestampStr: string): number {
  const clean = timestampStr.trim().replace(',', '.');
  const parts = clean.split(':');
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else {
    return parseFloat(clean) || 0;
  }
}

/**
 * Converts standard SRT text to valid WebVTT string.
 */
export function srtToWebVtt(srtContent: string): string {
  // Remove BOM if present
  let text = srtContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Replace commas with periods in timestamps
  // Pattern: 00:01:23,456 --> 00:01:25,789
  text = text.replace(
    /(\d{1,2}:\d{2}:\d{2}),(\d{3})/g,
    '$1.$2'
  );

  // Handle timestamps missing hours: 01:23,456 --> 01:25,789
  text = text.replace(
    /(?:^|\n)(\d{1,2}:\d{2}),(\d{3})/g,
    '\n00:$1.$2'
  );

  return `WEBVTT\n\n${text}`;
}

/**
 * Parses SRT or WebVTT string into an array of SubtitleCue objects.
 */
export function parseSubtitlesToCues(rawText: string): SubtitleCue[] {
  if (!rawText) return [];

  // Remove BOM and normalize newlines
  const text = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = text.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];
  let cueIndex = 1;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed === 'WEBVTT' || trimmed.startsWith('NOTE') || trimmed.startsWith('STYLE')) {
      continue;
    }

    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Find the line containing '-->'
    let timingLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timingLineIndex = i;
        break;
      }
    }

    if (timingLineIndex === -1) continue;

    const timingParts = lines[timingLineIndex].split('-->');
    if (timingParts.length < 2) continue;

    // Extract start and end time (ignoring any WebVTT position parameters like line:50% etc.)
    const startStr = timingParts[0].trim().split(/\s+/)[0];
    const endStr = timingParts[1].trim().split(/\s+/)[0];

    const start = parseTimestampToSeconds(startStr);
    const end = parseTimestampToSeconds(endStr);

    if (isNaN(start) || isNaN(end) || end <= start) continue;

    // The rest of the lines are subtitle text
    const textLines = lines.slice(timingLineIndex + 1);
    const subtitleText = textLines
      .join('\n')
      .replace(/<[^>]*>/g, '') // strip HTML/WebVTT styling tags for clean display
      .trim();

    if (subtitleText) {
      cues.push({
        id: cueIndex++,
        start,
        end,
        text: subtitleText,
      });
    }
  }

  return cues.sort((a, b) => a.start - b.start);
}

/**
 * Detects language and generates a friendly label based on subtitle filename.
 */
export function detectLanguageFromFilename(filename: string): { label: string; language: string } {
  const lower = filename.toLowerCase();

  if (
    lower.includes('pt-br') ||
    lower.includes('pt_br') ||
    lower.includes('ptbr') ||
    lower.includes('portugues') ||
    lower.includes('brazilian')
  ) {
    return { label: 'Português (Brasil)', language: 'pt-BR' };
  }
  if (lower.includes('.pob.') || lower.includes('.pob') || lower.includes('.por.') || lower.includes('.pt.')) {
    return { label: 'Português', language: 'pt' };
  }
  if (
    lower.includes('eng') ||
    lower.includes('english') ||
    lower.includes('.en.') ||
    lower.includes('_en.') ||
    lower.includes('.en-')
  ) {
    return { label: 'Inglês (English)', language: 'en' };
  }
  if (
    lower.includes('spa') ||
    lower.includes('spanish') ||
    lower.includes('espanol') ||
    lower.includes('.es.') ||
    lower.includes('_es.')
  ) {
    return { label: 'Espanhol (Español)', language: 'es' };
  }
  if (lower.includes('fre') || lower.includes('french') || lower.includes('.fr.')) {
    return { label: 'Francês (Français)', language: 'fr' };
  }
  if (lower.includes('ita') || lower.includes('italian') || lower.includes('.it.')) {
    return { label: 'Italiano', language: 'it' };
  }
  if (lower.includes('ger') || lower.includes('german') || lower.includes('deutsch') || lower.includes('.de.')) {
    return { label: 'Alemão (Deutsch)', language: 'de' };
  }
  if (lower.includes('jpn') || lower.includes('japanese') || lower.includes('.ja.')) {
    return { label: 'Japonês', language: 'ja' };
  }

  // Friendly title from filename
  const cleanName = filename.replace(/\.(srt|vtt)$/i, '').replace(/[\._]/g, ' ').trim();
  return { label: cleanName || filename, language: 'und' };
}

/**
 * Decodes text buffer handling UTF-8 and Windows-1252 (common for Portuguese subtitles).
 */
export function decodeSubtitleBuffer(buffer: ArrayBuffer): string {
  // Try UTF-8 first
  const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

  // If text has bad replacement characters (e.g. \uFFFD) in place of accented Portuguese chars
  if (utf8Text.includes('\uFFFD')) {
    try {
      const winText = new TextDecoder('windows-1252').decode(buffer);
      if (!winText.includes('\uFFFD')) {
        return winText;
      }
    } catch {
      // ignore
    }
  }

  return utf8Text;
}

/**
 * Converts raw subtitle text into a full SubtitleTrack with parsed cues and WebVTT Blob URL.
 */
export function createSubtitleTrack(
  fileName: string,
  rawContent: string,
  source: 'drive' | 'local',
  fileId?: string,
  accountId?: string,
  accountLabel?: string
): SubtitleTrack {
  const isVtt = fileName.toLowerCase().endsWith('.vtt') || rawContent.trim().startsWith('WEBVTT');
  const format = isVtt ? 'vtt' : 'srt';

  // Prepare WebVTT text for HTML5 <track>
  const vttText = isVtt ? rawContent : srtToWebVtt(rawContent);
  const vttBlob = new Blob([vttText], { type: 'text/vtt' });
  const vttBlobUrl = URL.createObjectURL(vttBlob);

  const { label, language } = detectLanguageFromFilename(fileName);
  const cues = parseSubtitlesToCues(rawContent);

  return {
    id: fileId || `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    label,
    fileName,
    language,
    format,
    source,
    fileId,
    accountId,
    accountLabel,
    vttBlobUrl,
    cues,
    rawText: rawContent,
  };
}
