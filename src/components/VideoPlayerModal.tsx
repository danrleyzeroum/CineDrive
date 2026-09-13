import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  ExternalLink,
  SkipForward,
  SkipBack,
  Film,
  Tv,
  AlertTriangle,
  Check,
  Subtitles,
  Cloud,
  RotateCcw,
  Wifi,
  Sliders,
} from 'lucide-react';
import { MediaItem, Episode, DriveAccount, WatchProgress, SubtitleTrack, SubtitleSettings, PlaybackQuality } from '../types';
import { getDrivePreviewUrl, getDriveDirectMediaUrl } from '../services/driveService';
import { saveCloudWatchProgress } from '../services/cloudProgressService';
import { loadNetworkSettings, saveNetworkSettings } from '../services/networkSettingsService';
import SubtitleSelectorModal from './SubtitleSelectorModal';

interface VideoPlayerModalProps {
  media: MediaItem;
  episode?: Episode;
  accounts: DriveAccount[];
  onClose: () => void;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPreviousEpisode?: boolean;
  initialProgress?: WatchProgress;
}

const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 'md',
  offsetSeconds: 0,
  textColor: 'white',
  backgroundColor: 'semi',
};

function loadSavedSubtitleSettings(): SubtitleSettings {
  try {
    const raw = localStorage.getItem('drive_cinema_subtitle_settings');
    if (raw) return { ...DEFAULT_SUBTITLE_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SUBTITLE_SETTINGS;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayerModal({
  media,
  episode,
  accounts,
  onClose,
  onNextEpisode,
  onPreviousEpisode,
  hasNextEpisode,
  hasPreviousEpisode,
  initialProgress,
}: VideoPlayerModalProps) {
  // 'drive' uses the official Google Drive Preview iframe (supports MKV, transcode, multi-audio, subs)
  // 'native' uses HTML5 <video> with direct media URL
  const [playerMode, setPlayerMode] = useState<'drive' | 'native'>('drive');
  const [showDriveNotice, setShowDriveNotice] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cross-device Firebase Watch Progress sync state
  const [hasCloudSynced, setHasCloudSynced] = useState(false);
  const [showResumeNotice, setShowResumeNotice] = useState(() =>
    Boolean(initialProgress && initialProgress.currentTimeSeconds > 10)
  );
  const lastSyncTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  // Subtitle state
  const [isSubtitleModalOpen, setIsSubtitleModalOpen] = useState(false);
  const [activeSubtitleTrack, setActiveSubtitleTrack] = useState<SubtitleTrack | null>(null);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(() => loadSavedSubtitleSettings());
  const [currentTime, setCurrentTime] = useState(0);

  // Network & Playback Quality State
  const [playbackQuality, setPlaybackQuality] = useState<PlaybackQuality>(
    () => loadNetworkSettings().defaultQuality
  );
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const fileId = episode ? episode.fileId : media.movieFile?.id || '';
  const accountId = episode ? episode.accountId : media.movieFile?.accountId || '';
  const rawFileName = episode ? episode.rawFileName : media.movieFile?.name;
  const parentFolderIds = episode ? episode.parents : media.movieFile?.parents;

  const account = accounts.find((a) => a.id === accountId) || accounts[0];
  const accessToken = account?.accessToken || '';

  const title = episode
    ? `${media.title} - T${episode.seasonNumber}:E${episode.episodeNumber} (${episode.title})`
    : media.title;

  const previewUrl = getDrivePreviewUrl(fileId);
  const directUrl = accessToken ? getDriveDirectMediaUrl(fileId, accessToken) : '';

  // Synchronize progress to Firebase Firestore & local cache
  const syncProgress = (time: number, duration: number) => {
    if (!duration || duration <= 0) return;
    const percent = Math.min(100, (time / duration) * 100);
    saveCloudWatchProgress(
      {
        mediaId: media.id,
        fileId,
        progressPercent: percent,
        currentTimeSeconds: time,
        durationSeconds: duration,
        lastWatched: Date.now(),
        title: media.title,
        episodeInfo: episode ? `T${episode.seasonNumber}:E${episode.episodeNumber}` : undefined,
        posterUrl: media.posterUrl,
        accountEmail: account?.email,
      },
      account?.email
    );
    setHasCloudSynced(true);
  };

  // Sync on unmount/exit with final timestamp
  useEffect(() => {
    return () => {
      if (currentTimeRef.current > 0 && durationRef.current > 0) {
        syncProgress(currentTimeRef.current, durationRef.current);
      }
    };
  }, [fileId, media.id]);

  // Persist subtitle settings
  const handleUpdateSubtitleSettings = (newSettings: SubtitleSettings) => {
    setSubtitleSettings(newSettings);
    try {
      localStorage.setItem('drive_cinema_subtitle_settings', JSON.stringify(newSettings));
    } catch {}
  };

  // Cleanup object URL on unmount or track change
  useEffect(() => {
    return () => {
      if (activeSubtitleTrack?.vttBlobUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(activeSubtitleTrack.vttBlobUrl);
      }
    };
  }, [activeSubtitleTrack]);

  // Active cue matching current video playback time
  const effectiveTime = currentTime + subtitleSettings.offsetSeconds;
  const activeCue = useMemo(() => {
    if (!activeSubtitleTrack?.cues || activeSubtitleTrack.cues.length === 0) return null;
    return activeSubtitleTrack.cues.find(
      (cue) => cue.start <= effectiveTime && effectiveTime <= cue.end
    ) || null;
  }, [activeSubtitleTrack, effectiveTime]);

  // Resume playback on native video player if available
  useEffect(() => {
    if (playerMode === 'native' && videoRef.current && initialProgress?.currentTimeSeconds) {
      videoRef.current.currentTime = initialProgress.currentTimeSeconds;
    }
  }, [playerMode, initialProgress]);

  // Track watch progress & current time for subtitles with cloud throttling
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      currentTimeRef.current = current;
      durationRef.current = duration;
      setCurrentTime(current);

      if (duration && duration > 0) {
        const now = Date.now();
        // Sync to cloud every 5 seconds
        if (now - lastSyncTimeRef.current > 5000) {
          lastSyncTimeRef.current = now;
          syncProgress(current, duration);
        }
      }
    }
  };

  const handlePause = () => {
    if (currentTimeRef.current > 0 && durationRef.current > 0) {
      syncProgress(currentTimeRef.current, durationRef.current);
    }
  };

  const handleRestartFromBeginning = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    setShowResumeNotice(false);
    syncProgress(0, durationRef.current || 1);
  };

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubtitleModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubtitleModalOpen]);

  // Font sizing
  const fontSizeClasses = {
    sm: 'text-sm sm:text-base md:text-lg',
    md: 'text-base sm:text-xl md:text-2xl',
    lg: 'text-lg sm:text-2xl md:text-3xl',
    xl: 'text-xl sm:text-3xl md:text-4xl',
  }[subtitleSettings.fontSize] || 'text-base sm:text-xl md:text-2xl';

  const textColorClass =
    subtitleSettings.textColor === 'yellow' ? 'text-yellow-300' : 'text-white';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white animate-in fade-in duration-200">
      {/* Player Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-neutral-950 border-b border-neutral-800 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="close-player-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0"
            title="Fechar player (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-neutral-100 truncate flex items-center gap-2">
              {episode ? <Tv className="w-4 h-4 text-indigo-400 shrink-0" /> : <Film className="w-4 h-4 text-rose-500 shrink-0" />}
              {title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded font-semibold border ${
                  account?.label?.includes('1')
                    ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                    : 'bg-purple-950/80 text-purple-300 border-purple-800'
                }`}
              >
                {account?.label || 'Google Drive'}
              </span>
              <span>•</span>
              <span className="text-[11px] text-neutral-400">
                {playerMode === 'drive' ? 'Player Google Drive (Compatível MKV/AVI)' : 'Player HTML5 Nativo'}
              </span>
              {activeSubtitleTrack && (
                <>
                  <span>•</span>
                  <span className="text-[11px] text-rose-400 font-medium truncate max-w-[120px] sm:max-w-xs">
                    Legenda: {activeSubtitleTrack.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Player Controls & Switches */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cloud Sync Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] font-medium">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sincronização Nuvem Ativa</span>
          </div>

          {/* Subtitles Button */}
          <button
            id="player-subtitles-btn"
            onClick={() => setIsSubtitleModalOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubtitleTrack
                ? 'bg-rose-950/60 border-rose-600/70 text-rose-300 hover:bg-rose-900/60 shadow-sm'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title="Gerenciar Legendas (.srt / .vtt)"
          >
            <Subtitles className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">
              {activeSubtitleTrack ? 'Legenda Ativa' : 'Legendas'}
            </span>
            {activeSubtitleTrack && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {/* Network & Playback Quality Dropdown (Auto / 1080p / 720p / 480p) */}
          <div className="relative">
            <button
              id="player-quality-btn"
              onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-amber-400 flex items-center gap-1.5 transition-all"
              title="Qualidade de Reprodução de Rede"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span className="uppercase">{playbackQuality}</span>
            </button>

            {isQualityMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                  Qualidade TV
                </div>
                {(['auto', '1080p', '720p', '480p'] as PlaybackQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setPlaybackQuality(q);
                      setIsQualityMenuOpen(false);
                      const currentCfg = loadNetworkSettings();
                      saveNetworkSettings({ ...currentCfg, defaultQuality: q });
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left font-semibold flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                      playbackQuality === q ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-300'
                    }`}
                  >
                    <span className="uppercase">{q}</span>
                    {playbackQuality === q && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Previous / Next Episode buttons */}
          {episode && (
            <div className="hidden sm:flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
              <button
                id="prev-episode-btn"
                onClick={onPreviousEpisode}
                disabled={!hasPreviousEpisode}
                className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 disabled:hover:bg-transparent"
                title="Episódio Anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                id="next-episode-btn"
                onClick={onNextEpisode}
                disabled={!hasNextEpisode}
                className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 disabled:hover:bg-transparent"
                title="Próximo Episódio"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              id="switch-player-drive-btn"
              onClick={() => setPlayerMode('drive')}
              className={`px-2.5 py-1 rounded transition-colors ${
                playerMode === 'drive' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Usa o player nativo do Google Drive (transcodifica MKV, legendas, etc.)"
            >
              Drive
            </button>
            <button
              id="switch-player-native-btn"
              onClick={() => setPlayerMode('native')}
              className={`px-2.5 py-1 rounded transition-colors ${
                playerMode === 'native' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Player HTML5 do navegador com controle de progresso e legendas externas"
            >
              HTML5
            </button>
          </div>

          {/* Open directly in Google Drive */}
          <a
            href={media.movieFile?.webViewLink || previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Abrir no Google Drive (nova aba)"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Floating Cloud Resume Notification Banner */}
        {showResumeNotice && initialProgress && initialProgress.currentTimeSeconds > 10 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-2xl bg-neutral-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <Cloud className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-neutral-200">
              Continuando de onde você parou:{' '}
              <strong className="text-amber-300 font-bold">
                {formatDuration(initialProgress.currentTimeSeconds)}
              </strong>{' '}
              ({Math.round(initialProgress.progressPercent)}%)
            </span>
            {playerMode === 'native' && (
              <button
                type="button"
                onClick={handleRestartFromBeginning}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 transition-all active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Reiniciar
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowResumeNotice(false)}
              className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
              title="Dispensar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {playerMode === 'drive' ? (
          <iframe
            id="drive-video-iframe"
            src={previewUrl}
            title={title}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {directUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  id="native-html5-video"
                  src={directUrl}
                  controls
                  autoPlay
                  onTimeUpdate={handleTimeUpdate}
                  onPause={handlePause}
                  onEnded={handlePause}
                  onError={() => {
                    setShowDriveNotice(true);
                    setPlayerMode('drive');
                  }}
                  className="w-full h-full max-h-full object-contain"
                >
                  {activeSubtitleTrack?.vttBlobUrl && (
                    <track
                      key={activeSubtitleTrack.id}
                      kind="subtitles"
                      src={activeSubtitleTrack.vttBlobUrl}
                      label={activeSubtitleTrack.label}
                      srcLang={activeSubtitleTrack.language || 'pt-BR'}
                      default
                    />
                  )}
                  Seu navegador não suporta a tag de vídeo HTML5.
                </video>

                {/* High-Definition Stylized Subtitle Overlay */}
                {activeCue && (
                  <div className="pointer-events-none absolute bottom-14 sm:bottom-16 left-0 right-0 px-6 sm:px-12 flex justify-center z-30 transition-all">
                    <div
                      className={`text-center font-semibold max-w-3xl leading-relaxed tracking-wide ${fontSizeClasses} ${textColorClass} bg-black/80 px-4 py-1.5 rounded-xl shadow-2xl backdrop-blur-[2px] border border-white/10`}
                      style={{
                        textShadow:
                          '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {activeCue.text.split('\n').map((line, idx) => (
                        <React.Fragment key={idx}>
                          {line}
                          {idx < activeCue.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 max-w-md space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm text-neutral-300">
                  O token de acesso direto para HTML5 não está disponível para este arquivo.
                </p>
                <button
                  onClick={() => setPlayerMode('drive')}
                  className="px-4 py-2 bg-rose-600 rounded-lg text-xs font-bold text-white hover:bg-rose-500"
                >
                  Usar Player Google Drive
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notice when subtitle is loaded in Drive mode */}
        {activeSubtitleTrack && playerMode === 'drive' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-950/95 border border-rose-500/80 rounded-2xl px-5 py-3 text-xs text-neutral-200 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in">
            <Subtitles className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-neutral-100">
                Legenda externa selecionada ({activeSubtitleTrack.label})
              </p>
              <p className="text-[11px] text-neutral-400">
                Mude para o <b>Player HTML5</b> para sincronizar a legenda na tela com ajustes de fonte e delay.
              </p>
            </div>
            <button
              onClick={() => setPlayerMode('native')}
              className="ml-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-md shrink-0"
            >
              Mudar para HTML5
            </button>
          </div>
        )}

        {/* Transient notice if auto-switched to drive player */}
        {showDriveNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-950/90 border border-amber-600/80 text-amber-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg backdrop-blur-sm animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Formato (ex: MKV) incompatível com HTML5. Alternado para o Player Google Drive.</span>
            <button onClick={() => setShowDriveNotice(false)} className="ml-2 hover:text-white">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Subtitle Selector & Settings Modal */}
      <SubtitleSelectorModal
        isOpen={isSubtitleModalOpen}
        onClose={() => setIsSubtitleModalOpen(false)}
        accounts={accounts}
        currentAccountId={accountId}
        rawFileName={rawFileName}
        parentFolderIds={parentFolderIds}
        mediaTitle={media.title}
        activeTrack={activeSubtitleTrack}
        onSelectTrack={(track) => {
          setActiveSubtitleTrack(track);
          if (track && playerMode === 'drive') {
            // Suggest or automatically switch to native player so subtitle is visible
            setPlayerMode('native');
          }
        }}
        settings={subtitleSettings}
        onUpdateSettings={handleUpdateSubtitleSettings}
      />
    </div>
  );
}

