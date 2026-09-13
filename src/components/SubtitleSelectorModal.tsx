import React, { useState, useEffect } from 'react';
import {
  X,
  Subtitles,
  Search,
  Upload,
  Check,
  Loader2,
  Sliders,
  FolderOpen,
  FileText,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { DriveAccount, DriveRawFile, SubtitleTrack, SubtitleSettings } from '../types';
import { fetchSubtitlesFromDrive, searchSubtitlesInDrive, fetchDriveSubtitleContent } from '../services/driveService';
import { createSubtitleTrack, decodeSubtitleBuffer } from '../services/subtitleService';

interface SubtitleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: DriveAccount[];
  currentAccountId: string;
  rawFileName?: string;
  parentFolderIds?: string[];
  mediaTitle: string;
  activeTrack: SubtitleTrack | null;
  onSelectTrack: (track: SubtitleTrack | null) => void;
  settings: SubtitleSettings;
  onUpdateSettings: (settings: SubtitleSettings) => void;
}

export default function SubtitleSelectorModal({
  isOpen,
  onClose,
  accounts,
  currentAccountId,
  rawFileName,
  parentFolderIds,
  mediaTitle,
  activeTrack,
  onSelectTrack,
  settings,
  onUpdateSettings,
}: SubtitleSelectorModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'detected' | 'search' | 'local' | 'settings'>('detected');

  // Detected subtitles state
  const [detectedFiles, setDetectedFiles] = useState<DriveRawFile[]>([]);
  const [isLoadingDetected, setIsLoadingDetected] = useState(false);
  const [loadedTracks, setLoadedTracks] = useState<SubtitleTrack[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState(mediaTitle.split(/[:\-_]/)[0].trim());
  const [searchResults, setSearchResults] = useState<DriveRawFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchAccount, setSelectedSearchAccount] = useState<string>(currentAccountId || accounts[0]?.id || '');

  // Loading indicator for a specific file being downloaded
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeAccount = accounts.find((a) => a.id === (currentAccountId || selectedSearchAccount)) || accounts[0];

  // Auto-scan for subtitles matching the file or folder when opened
  useEffect(() => {
    let isMounted = true;

    async function loadDetected() {
      if (!activeAccount?.accessToken) return;
      setIsLoadingDetected(true);
      setErrorMessage(null);

      try {
        const found = await fetchSubtitlesFromDrive(
          activeAccount.accessToken,
          activeAccount.id,
          activeAccount.label,
          rawFileName,
          parentFolderIds
        );
        if (isMounted) {
          setDetectedFiles(found);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage('Erro ao listar legendas do Google Drive.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetected(false);
        }
      }
    }

    loadDetected();

    return () => {
      isMounted = false;
    };
  }, [activeAccount, rawFileName, parentFolderIds]);

  // Handle selecting a subtitle file from Google Drive
  const handleSelectDriveSubtitle = async (file: DriveRawFile) => {
    // If it's already active, we can keep it
    if (activeTrack?.fileId === file.id) {
      onClose();
      return;
    }

    // Check if already loaded in memory
    const existing = loadedTracks.find((t) => t.fileId === file.id);
    if (existing) {
      onSelectTrack(existing);
      onClose();
      return;
    }

    const accountForFile = accounts.find((a) => a.id === file.accountId) || activeAccount;
    if (!accountForFile?.accessToken) {
      setErrorMessage('Conta do Google Drive não conectada ou sem token de acesso.');
      return;
    }

    setLoadingFileId(file.id);
    setErrorMessage(null);

    try {
      const rawText = await fetchDriveSubtitleContent(accountForFile.accessToken, file.id);
      const track = createSubtitleTrack(
        file.name,
        rawText,
        'drive',
        file.id,
        accountForFile.id,
        accountForFile.label
      );

      setLoadedTracks((prev) => [...prev.filter((t) => t.fileId !== file.id), track]);
      onSelectTrack(track);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao baixar conteúdo da legenda.');
    } finally {
      setLoadingFileId(null);
    }
  };

  // Handle searching Google Drive for subtitle files
  const handleSearchDrive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const accountForSearch = accounts.find((a) => a.id === selectedSearchAccount) || activeAccount;
    if (!accountForSearch?.accessToken) {
      setErrorMessage('Selecione uma conta válida com token.');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    try {
      const results = await searchSubtitlesInDrive(
        accountForSearch.accessToken,
        accountForSearch.id,
        accountForSearch.label,
        searchQuery
      );
      setSearchResults(results);
    } catch (err: any) {
      setErrorMessage('Erro na busca de legendas.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle local file upload (.srt or .vtt)
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const text = decodeSubtitleBuffer(buffer);
        const track = createSubtitleTrack(file.name, text, 'local');

        setLoadedTracks((prev) => [...prev, track]);
        onSelectTrack(track);
        onClose();
      } catch (err: any) {
        setErrorMessage('Não foi possível processar o arquivo de legenda selecionado.');
      }
    };

    reader.onerror = () => {
      setErrorMessage('Erro ao ler arquivo do computador.');
    };

    reader.readAsArrayBuffer(file);
  };

  // Subtitle synchronization adjustments
  const adjustOffset = (delta: number) => {
    const nextOffset = Math.round((settings.offsetSeconds + delta) * 10) / 10;
    onUpdateSettings({
      ...settings,
      offsetSeconds: nextOffset,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        id="subtitle-manager-modal"
        className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Subtitles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                Gerenciador de Legendas
              </h3>
              <p className="text-xs text-neutral-400 truncate max-w-sm">
                {rawFileName || mediaTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Track Status Banner */}
        <div className="px-6 py-3 bg-neutral-950/40 border-b border-neutral-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Legenda ativa:</span>
            {activeTrack ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold truncate max-w-xs">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{activeTrack.label}</span>
                <span className="text-[10px] text-emerald-500 uppercase font-mono">
                  ({activeTrack.format})
                </span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">
                Desativada
              </span>
            )}
          </div>

          {activeTrack && (
            <button
              onClick={() => onSelectTrack(null)}
              className="text-neutral-400 hover:text-rose-400 transition-colors underline font-medium"
            >
              Desativar legenda
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 px-6 bg-neutral-900/50">
          <button
            onClick={() => setActiveTab('detected')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'detected'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Detectadas no Drive</span>
            {detectedFiles.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                {detectedFiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Explorar Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'local'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Arquivo Local</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Ajustes & Delay</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: DETECTED SUBTITLES */}
          {activeTab === 'detected' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>
                  Legendas encontradas na pasta ou com nome correspondente:
                </span>
                <button
                  onClick={async () => {
                    if (!activeAccount?.accessToken) return;
                    setIsLoadingDetected(true);
                    try {
                      const found = await fetchSubtitlesFromDrive(
                        activeAccount.accessToken,
                        activeAccount.id,
                        activeAccount.label,
                        rawFileName,
                        parentFolderIds
                      );
                      setDetectedFiles(found);
                    } finally {
                      setIsLoadingDetected(false);
                    }
                  }}
                  disabled={isLoadingDetected}
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDetected ? 'animate-spin' : ''}`} />
                  Recarregar
                </button>
              </div>

              {isLoadingDetected ? (
                <div className="py-12 text-center text-neutral-400 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
                  <p className="text-xs">Varrendo Google Drive em busca de arquivos .srt e .vtt...</p>
                </div>
              ) : detectedFiles.length === 0 ? (
                <div className="py-8 text-center bg-neutral-950/40 border border-dashed border-neutral-800 rounded-2xl p-6 space-y-3">
                  <FileText className="w-10 h-10 text-neutral-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-300">
                      Nenhuma legenda automática encontrada nesta pasta
                    </p>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Use a aba <b>"Explorar Drive"</b> para buscar pelo nome do filme ou <b>"Arquivo Local"</b> para carregar do seu dispositivo.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Buscar no Google Drive
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {detectedFiles.map((file) => {
                    const isCurrent = activeTrack?.fileId === file.id;
                    const isDownloading = loadingFileId === file.id;
                    const format = file.name.toLowerCase().endsWith('.vtt') ? 'VTT' : 'SRT';

                    return (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-rose-950/20 border-rose-600/50'
                            : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              format === 'VTT'
                                ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/60'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                            }`}
                          >
                            <Subtitles className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-200 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                              <span className="font-mono text-neutral-500 uppercase">{format}</span>
                              <span>•</span>
                              <span className="text-neutral-500">{file.accountLabel}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          {isCurrent ? (
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              Ativa
                            </span>
                          ) : (
                            <button
                              disabled={isDownloading}
                              onClick={() => handleSelectDriveSubtitle(file)}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Carregando...
                                </>
                              ) : (
                                'Selecionar'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SEARCH GOOGLE DRIVE */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Search Form */}
              <form onSubmit={handleSearchDrive} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar legendas (ex: Oppenheimer, s01e01, pt-br)..."
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-rose-500 placeholder:text-neutral-600"
                    />
                  </div>

                  {accounts.length > 1 && (
                    <select
                      value={selectedSearchAccount}
                      onChange={(e) => setSelectedSearchAccount(e.target.value)}
                      className="px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-rose-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.label} ({acc.name})
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shrink-0"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Pesquisar
                  </button>
                </div>
              </form>

              {/* Search Results */}
              <div className="space-y-2">
                {isSearching ? (
                  <div className="py-10 text-center text-neutral-400 space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-rose-500" />
                    <p className="text-xs">Buscando legendas correspondentes no Google Drive...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((file) => {
                    const isCurrent = activeTrack?.fileId === file.id;
                    const isDownloading = loadingFileId === file.id;
                    const format = file.name.toLowerCase().endsWith('.vtt') ? 'VTT' : 'SRT';

                    return (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-rose-950/20 border-rose-600/50'
                            : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-neutral-800 text-rose-400 shrink-0">
                            <Subtitles className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-200 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                              <span className="font-mono text-neutral-500 uppercase">{format}</span>
                              <span>•</span>
                              <span className="text-neutral-500">{file.accountLabel}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          {isCurrent ? (
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              Ativa
                            </span>
                          ) : (
                            <button
                              disabled={isDownloading}
                              onClick={() => handleSelectDriveSubtitle(file)}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Carregando...
                                </>
                              ) : (
                                'Selecionar'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-500">
                    Digite um termo e clique em Pesquisar para localizar arquivos de legenda no Drive.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LOCAL FILE UPLOAD */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              <label
                htmlFor="local-sub-upload"
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 hover:border-rose-500/80 rounded-2xl bg-neutral-950/40 cursor-pointer transition-all hover:bg-neutral-950/70 text-center group"
              >
                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-neutral-200">
                  Clique para selecionar arquivo .srt ou .vtt
                </p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Compatível com legendas em UTF-8 e ANSI/Windows-1252 com acentuação pt-BR. O arquivo é processado instantaneamente no seu navegador.
                </p>
                <input
                  id="local-sub-upload"
                  type="file"
                  accept=".srt,.vtt,text/vtt,text/plain"
                  onChange={handleLocalFileUpload}
                  className="hidden"
                />
              </label>

              {/* Already loaded local tracks */}
              {loadedTracks.filter((t) => t.source === 'local').length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-400">
                    Legendas locais carregadas nesta sessão:
                  </span>
                  {loadedTracks
                    .filter((t) => t.source === 'local')
                    .map((track) => (
                      <div
                        key={track.id}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          activeTrack?.id === track.id
                            ? 'bg-rose-950/20 border-rose-600/50'
                            : 'bg-neutral-950/50 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Subtitles className="w-4 h-4 text-rose-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-200 truncate">
                              {track.fileName}
                            </p>
                            <span className="text-[10px] text-neutral-500 uppercase font-mono">
                              {track.format} • Local
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onSelectTrack(track);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200"
                        >
                          {activeTrack?.id === track.id ? 'Ativa' : 'Selecionar'}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS, SIZE & SYNC DELAY */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Delay / Sync Offset Control */}
              <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">
                    Sincronia / Delay da Legenda
                  </span>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      settings.offsetSeconds === 0
                        ? 'bg-neutral-800 text-neutral-300'
                        : settings.offsetSeconds > 0
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                        : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800'
                    }`}
                  >
                    {settings.offsetSeconds > 0 ? `+${settings.offsetSeconds.toFixed(1)}s` : `${settings.offsetSeconds.toFixed(1)}s`}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Ajuste se a legenda estiver adiantada ou atrasada em relação ao áudio do vídeo.
                </p>

                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <button
                    onClick={() => adjustOffset(-1.0)}
                    className="py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    -1.0s
                  </button>
                  <button
                    onClick={() => adjustOffset(-0.5)}
                    className="py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    -0.5s
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, offsetSeconds: 0 })}
                    className="py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors font-mono"
                  >
                    0.0s
                  </button>
                  <button
                    onClick={() => adjustOffset(+0.5)}
                    className="py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    +0.5s
                  </button>
                  <button
                    onClick={() => adjustOffset(+1.0)}
                    className="py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    +1.0s
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-neutral-200 block">
                  Tamanho do Texto da Legenda
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'sm', label: 'Pequeno' },
                    { key: 'md', label: 'Médio (Padrão)' },
                    { key: 'lg', label: 'Grande' },
                    { key: 'xl', label: 'Extra Grande' },
                  ].map((sz) => (
                    <button
                      key={sz.key}
                      onClick={() =>
                        onUpdateSettings({ ...settings, fontSize: sz.key as any })
                      }
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        settings.fontSize === sz.key
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Color */}
              <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-neutral-200 block">
                  Cor da Legenda
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, textColor: 'white' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      settings.textColor === 'white'
                        ? 'bg-white/10 text-white border-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-white border border-neutral-300" />
                    Branco Clássico
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, textColor: 'yellow' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      settings.textColor === 'yellow'
                        ? 'bg-yellow-500/10 text-yellow-300 border-yellow-400'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-yellow-300'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    Amarelo Cinema
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <p className="text-[11px] text-neutral-500">
            Suporta formatos <b>.srt</b> e <b>.vtt</b> com acentuação pt-BR.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
