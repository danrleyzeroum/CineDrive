import React, { useState, useEffect } from 'react';
import {
  Settings,
  HardDrive,
  Sparkles,
  Cloud,
  Wifi,
  FolderOpen,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  Folder,
  Layers,
  Clock,
  Key,
  Sliders,
} from 'lucide-react';
import { DriveAccount, MediaItem } from '../types';
import {
  loadScraperSettings,
  saveScraperSettings,
  loadSyncSettings,
  saveSyncSettings,
} from '../services/storageService';
import {
  loadNetworkSettings,
  saveNetworkSettings,
  getCacheBreakdown,
  clearMetadataAndImagesCache,
  clearWatchProgressCache,
  clearAllLocalCache,
  testNetworkPing,
  CacheBreakdown,
} from '../services/networkSettingsService';
import FolderBrowser from './FolderBrowser';

export type SettingsSection = 'drives' | 'scraper' | 'cloud' | 'network' | 'folders';

interface SettingsViewProps {
  accounts: DriveAccount[];
  onConnectDrive: (slotIndex: number) => Promise<void>;
  onDisconnectDrive: (accountId: string) => void;
  onSyncDrive: (account: DriveAccount) => Promise<void>;
  onOpenFolderSelector: (account: DriveAccount) => void;
  onClearFolder: (accountId: string) => void;
  isConnecting: boolean;
  isScanning: boolean;
  onScanAllDrives: () => Promise<void>;
  selectedAccountFilter: string | null;
  onSelectAccountFilter: (accountId: string | null) => void;
  onTriggerFullRescrape: () => void;
  onTriggerBackgroundSync: () => void;
  isBackgroundSyncing: boolean;
  onCacheCleared?: () => void;
  onPlayMedia: (item: MediaItem) => void;
  onSetSourceFolder: (accountId: string, folderId?: string, folderName?: string) => void;
  initialSection?: SettingsSection;
}

export default function SettingsView({
  accounts,
  onConnectDrive,
  onDisconnectDrive,
  onSyncDrive,
  onOpenFolderSelector,
  onClearFolder,
  isConnecting,
  isScanning,
  onScanAllDrives,
  selectedAccountFilter,
  onSelectAccountFilter,
  onTriggerFullRescrape,
  onTriggerBackgroundSync,
  isBackgroundSyncing,
  onCacheCleared,
  onPlayMedia,
  onSetSourceFolder,
  initialSection = 'drives',
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  // Scraper & Sync settings
  const [scraperSettings, setScraperSettings] = useState(() => loadScraperSettings());
  const [syncSettings, setSyncSettings] = useState(() => loadSyncSettings());
  const [scraperSavedSuccess, setScraperSavedSuccess] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<'success' | 'error' | null>(null);

  // Network & TV Cache settings
  const [networkSettings, setNetworkSettingsState] = useState(() => loadNetworkSettings());
  const [cacheInfo, setCacheInfo] = useState<CacheBreakdown>(() => getCacheBreakdown());
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [cacheActionFeedback, setCacheActionFeedback] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Drives sync
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Map accounts to slots
  const drive1 =
    accounts.find((a) => a.id.startsWith('drive_slot_1') || a.label.includes('Drive 1')) ||
    (accounts.length > 0 && !accounts[0].label.includes('Drive 2') && !accounts[0].id.startsWith('drive_slot_2')
      ? accounts[0]
      : null);

  const drive2 =
    accounts.find((a) => a.id.startsWith('drive_slot_2') || a.label.includes('Drive 2')) ||
    (accounts.length > 1 && accounts[1] !== drive1
      ? accounts[1]
      : accounts.length === 1 && accounts[0] !== drive1
      ? accounts[0]
      : null);

  useEffect(() => {
    setCacheInfo(getCacheBreakdown());
  }, [activeSection]);

  const handleSaveScraper = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveScraperSettings(scraperSettings);
    saveSyncSettings(syncSettings);
    setScraperSavedSuccess(true);
    setTimeout(() => setScraperSavedSuccess(false), 3000);
  };

  const handleTestTmdbKey = async () => {
    if (!scraperSettings.tmdbApiKey.trim()) {
      setKeyTestStatus('error');
      return;
    }
    setIsTestingKey(true);
    setKeyTestStatus(null);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/authentication?api_key=${encodeURIComponent(
          scraperSettings.tmdbApiKey.trim()
        )}`
      );
      if (res.ok) {
        setKeyTestStatus('success');
      } else {
        setKeyTestStatus('error');
      }
    } catch {
      setKeyTestStatus('error');
    } finally {
      setIsTestingKey(false);
    }
  };

  const runPingTest = async () => {
    setIsTestingPing(true);
    const ms = await testNetworkPing();
    setPingMs(ms);
    setIsTestingPing(false);
  };

  const handleSaveNetwork = (newSettings: typeof networkSettings) => {
    setNetworkSettingsState(newSettings);
    saveNetworkSettings(newSettings);
  };

  const handleSyncAccount = async (account: DriveAccount) => {
    try {
      setSyncingAccountId(account.id);
      await onSyncDrive(account);
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleClearImages = () => {
    clearMetadataAndImagesCache();
    setCacheInfo(getCacheBreakdown());
    setCacheActionFeedback('Cache de imagens e posters liberado com sucesso!');
    setTimeout(() => setCacheActionFeedback(null), 3500);
    onCacheCleared?.();
  };

  const handleClearProgress = () => {
    clearWatchProgressCache();
    setCacheInfo(getCacheBreakdown());
    setCacheActionFeedback('Histórico de reprodução e "Continuar Assistindo" limpos!');
    setTimeout(() => setCacheActionFeedback(null), 3500);
    onCacheCleared?.();
  };

  const handleClearAll = () => {
    clearAllLocalCache();
    setCacheInfo(getCacheBreakdown());
    setConfirmClearAll(false);
    setCacheActionFeedback('Todo o cache local da TV foi limpo com segurança!');
    setTimeout(() => setCacheActionFeedback(null), 3500);
    onCacheCleared?.();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Settings Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-100 flex items-center gap-2">
              Configurações do Servidor
            </h1>
            <p className="text-xs text-neutral-400">
              Gerencie seus Google Drives, metadados pt-BR, nuvem Firestore, rede e cache em um só lugar.
            </p>
          </div>
        </div>

        {/* Global Quick Scan Action */}
        <button
          id="settings-rescan-all-btn"
          onClick={onScanAllDrives}
          disabled={isScanning || accounts.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Escaneando Drives...' : 'Sincronizar Ambos os Drives'}</span>
        </button>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-neutral-800/80">
        <button
          id="settings-tab-drives"
          onClick={() => setActiveSection('drives')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'drives'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
          }`}
        >
          <HardDrive className="w-4 h-4 text-rose-500" />
          <span>Google Drive & Contas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-900 text-neutral-300 font-semibold border border-neutral-700">
            {accounts.length}/2
          </span>
        </button>

        <button
          id="settings-tab-scraper"
          onClick={() => setActiveSection('scraper')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'scraper'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>Scraper pt-BR & Metadados</span>
        </button>

        <button
          id="settings-tab-cloud"
          onClick={() => setActiveSection('cloud')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'cloud'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
          }`}
        >
          <Cloud className="w-4 h-4 text-sky-400" />
          <span>Nuvem & Segundo Plano</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        <button
          id="settings-tab-network"
          onClick={() => setActiveSection('network')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'network'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
          }`}
        >
          <Wifi className="w-4 h-4 text-amber-400" />
          <span>Rede & Cache Local TV</span>
        </button>

        <button
          id="settings-tab-folders"
          onClick={() => setActiveSection('folders')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'folders'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-purple-400" />
          <span>Navegador de Pastas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: GOOGLE DRIVE & CONTAS                                         */}
      {/* ========================================================================= */}
      {activeSection === 'drives' && (
        <div className="space-y-6">
          {/* Helpful Information banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-neutral-100">Unificação de 2 Contas do Google Drive</span>
              <p className="text-neutral-400">
                Você pode conectar até 2 contas diferentes do Google Drive ou conectar a mesma conta duas vezes mapeando pastas distintas (ex: pasta <strong className="text-amber-400">&ldquo;Filmes&rdquo;</strong> no Drive 1 e pasta <strong className="text-amber-400">&ldquo;Séries&rdquo;</strong> no Drive 2). O catálogo mescla tudo automaticamente sem duplicatas!
              </p>
            </div>
          </div>

          {/* Quick Filter: Which Drive to display in the main catalog */}
          {accounts.length > 1 && (
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Filtro Rápido de Exibição no Catálogo
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Escolha se deseja ver os títulos de ambos os drives ou filtrar por um específico.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0 text-xs">
                <button
                  onClick={() => onSelectAccountFilter(null)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedAccountFilter === null
                      ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Ambos os Drives
                </button>
                {drive1 && (
                  <button
                    onClick={() => onSelectAccountFilter(drive1.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                      selectedAccountFilter === drive1.id
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Somente Drive 1
                  </button>
                )}
                {drive2 && (
                  <button
                    onClick={() => onSelectAccountFilter(drive2.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                      selectedAccountFilter === drive2.id
                        ? 'bg-purple-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Somente Drive 2
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Drive Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DRIVE 1 (Slot 1) */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                  <span className="text-sm font-black text-neutral-100 uppercase tracking-wider">
                    Drive 1 (Principal)
                  </span>
                </div>
                {drive1 ? (
                  <span className="text-[11px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Conectado
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-full">
                    Não conectado
                  </span>
                )}
              </div>

              {drive1 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                    <div className="truncate pr-2">
                      <p className="font-bold text-neutral-200 truncate">{drive1.name || drive1.email}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{drive1.email}</p>
                    </div>
                    <span className="text-xs font-extrabold text-blue-400 shrink-0 bg-blue-950/40 px-2 py-1 rounded-lg border border-blue-900/50">
                      {drive1.fileCount || 0} vídeos
                    </span>
                  </div>

                  {/* Folder mapping */}
                  <div className="flex items-center justify-between text-xs bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/80">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Pasta Mapeada:</span>
                        <span className="text-xs font-semibold text-neutral-200 truncate block">
                          {drive1.selectedFolderName || 'Todo o Google Drive (Raiz)'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onOpenFolderSelector(drive1)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold transition-colors"
                      >
                        Trocar
                      </button>
                      {drive1.selectedFolderId && (
                        <button
                          onClick={() => onClearFolder(drive1.id)}
                          className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 transition-colors"
                          title="Remover filtro de pasta (ler raiz)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSyncAccount(drive1)}
                      disabled={syncingAccountId === drive1.id || isScanning}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingAccountId === drive1.id ? 'animate-spin text-blue-400' : ''}`} />
                      <span>{syncingAccountId === drive1.id ? 'Sincronizando...' : 'Varrer Drive 1'}</span>
                    </button>
                    <button
                      onClick={() => onDisconnectDrive(drive1.id)}
                      className="p-2 rounded-xl bg-neutral-950 hover:bg-rose-950/40 text-neutral-500 hover:text-rose-400 border border-neutral-800 hover:border-rose-900/50 transition-colors"
                      title="Desconectar Drive 1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Conecte sua primeira conta do Google Drive para indexar seus filmes e séries automaticamente.
                  </p>
                  <button
                    onClick={() => onConnectDrive(1)}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isConnecting ? 'Conectando...' : 'Conectar Drive 1'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* DRIVE 2 (Slot 2) */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                  <span className="text-sm font-black text-neutral-100 uppercase tracking-wider">
                    Drive 2 (Secundário)
                  </span>
                </div>
                {drive2 ? (
                  <span className="text-[11px] font-bold text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Conectado
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-full">
                    Disponível
                  </span>
                )}
              </div>

              {drive2 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                    <div className="truncate pr-2">
                      <p className="font-bold text-neutral-200 truncate">{drive2.name || drive2.email}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{drive2.email}</p>
                    </div>
                    <span className="text-xs font-extrabold text-purple-400 shrink-0 bg-purple-950/40 px-2 py-1 rounded-lg border border-purple-900/50">
                      {drive2.fileCount || 0} vídeos
                    </span>
                  </div>

                  {/* Folder mapping */}
                  <div className="flex items-center justify-between text-xs bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/80">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Pasta Mapeada:</span>
                        <span className="text-xs font-semibold text-neutral-200 truncate block">
                          {drive2.selectedFolderName || 'Todo o Google Drive (Raiz)'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onOpenFolderSelector(drive2)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold transition-colors"
                      >
                        Trocar
                      </button>
                      {drive2.selectedFolderId && (
                        <button
                          onClick={() => onClearFolder(drive2.id)}
                          className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 transition-colors"
                          title="Remover filtro de pasta (ler raiz)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSyncAccount(drive2)}
                      disabled={syncingAccountId === drive2.id || isScanning}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingAccountId === drive2.id ? 'animate-spin text-purple-400' : ''}`} />
                      <span>{syncingAccountId === drive2.id ? 'Sincronizando...' : 'Varrer Drive 2'}</span>
                    </button>
                    <button
                      onClick={() => onDisconnectDrive(drive2.id)}
                      className="p-2 rounded-xl bg-neutral-950 hover:bg-rose-950/40 text-neutral-500 hover:text-rose-400 border border-neutral-800 hover:border-rose-900/50 transition-colors"
                      title="Desconectar Drive 2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Adicione um 2º Google Drive (ou vincule outra pasta) para dobrar sua biblioteca de streaming.
                  </p>
                  <button
                    onClick={() => onConnectDrive(2)}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isConnecting ? 'Conectando...' : 'Conectar 2º Drive'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: SCRAPER pt-BR & METADADOS (TMDb)                               */}
      {/* ========================================================================= */}
      {activeSection === 'scraper' && (
        <div className="space-y-6 max-w-4xl">
          <form onSubmit={handleSaveScraper} className="space-y-6">
            {/* TMDb API Key Card */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                    <Key className="w-4 h-4 text-rose-500" />
                    Chave de API do TheMovieDB (TMDb)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Utilizada para buscar pôsteres em alta definição, notas, gêneros e sinopses em Português (pt-BR).
                  </p>
                </div>
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors shrink-0"
                >
                  <span>Obter chave gratuita</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={scraperSettings.tmdbApiKey}
                  onChange={(e) =>
                    setScraperSettings({ ...scraperSettings, tmdbApiKey: e.target.value })
                  }
                  placeholder="Insira sua chave de API v3 do TMDb..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleTestTmdbKey}
                  disabled={isTestingKey}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                >
                  {isTestingKey ? 'Testando...' : 'Testar Chave'}
                </button>
              </div>

              {keyTestStatus === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Chave TMDb válida e conectada com sucesso!</span>
                </div>
              )}

              {keyTestStatus === 'error' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Não foi possível autenticar. Verifique sua chave TMDb.</span>
                </div>
              )}
            </div>

            {/* Scraper Language & Poster Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-neutral-200 block">Idioma Preferencial</span>
                <p className="text-[11px] text-neutral-400">
                  Prioridade para sinopses, títulos localizados e categorizações.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800/50 text-rose-200 text-xs font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Português do Brasil (pt-BR)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-neutral-200 block">Resolução dos Pôsteres</span>
                <p className="text-[11px] text-neutral-400">
                  Qualidade visual dos banners e capas carregados do TheMovieDB.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setScraperSettings({ ...scraperSettings, posterResolution: 'w500' })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      scraperSettings.posterResolution === 'w500'
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    HD (w500 - Mais Leve)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setScraperSettings({ ...scraperSettings, posterResolution: 'original' })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      scraperSettings.posterResolution === 'original'
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Ultra HD (Original)
                  </button>
                </div>
              </div>
            </div>

            {/* Scraper Actions */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Ações na Biblioteca
              </h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={onTriggerFullRescrape}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md shadow-amber-950/50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Forçar Re-varredura Completa de Metadados</span>
                </button>
                <p className="text-[11px] text-neutral-400">
                  Re-identifica todos os títulos do Drive buscando novos pôsteres e sinopses em pt-BR.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition-all"
              >
                Salvar Configurações de Metadados
              </button>
              {scraperSavedSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: NUVEM FIRESTORE & SEGUNDO PLANO                                */}
      {/* ========================================================================= */}
      {activeSection === 'cloud' && (
        <div className="space-y-6 max-w-4xl">
          {/* Cloud Badge Status Card */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                    Banco de Dados na Nuvem (Firestore)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Sincronização instantânea e persistente entre qualquer TV, computador ou celular.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Nuvem Ativa
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1">
                <span className="font-bold text-neutral-200">0% de Espaço em Disco da TV</span>
                <p className="text-neutral-400">
                  Suas personalizações de capa, correspondências manuais e títulos corrigidos são salvos diretamente no Firestore. A TV não fica sem espaço nem lenta!
                </p>
              </div>
            </div>
          </div>

          {/* Background Sync Frequency */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Sincronização em Segundo Plano
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                O aplicativo verifica silenciosamente se novos filmes ou episódios foram adicionados aos seus Google Drives.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'A cada 15 min', val: 15 },
                { label: 'A cada 30 min', val: 30 },
                { label: 'A cada 1 hora', val: 60 },
                { label: 'Desativado', val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    const updated = { ...syncSettings, intervalMinutes: opt.val };
                    setSyncSettings(updated);
                    saveSyncSettings(updated);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold text-center border transition-all ${
                    syncSettings.intervalMinutes === opt.val
                      ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onTriggerBackgroundSync}
                disabled={isBackgroundSyncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBackgroundSyncing ? 'animate-spin' : ''}`} />
                <span>{isBackgroundSyncing ? 'Verificando em 2º plano...' : 'Testar Sincronização Agora'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: REDE, QUALIDADE & CACHE LOCAL DA TV                           */}
      {/* ========================================================================= */}
      {activeSection === 'network' && (
        <div className="space-y-6 max-w-4xl">
          {/* Network Ping Test */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">Teste de Latência / Conexão com Google Drive</h3>
                  <p className="text-xs text-neutral-400">Verifique a velocidade de resposta da sua TV com os servidores.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={runPingTest}
                disabled={isTestingPing}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isTestingPing ? 'Medindo...' : 'Testar Ping'}
              </button>
            </div>

            {pingMs !== null && (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Tempo de resposta da API:</span>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    pingMs < 120
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : pingMs < 300
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {pingMs} ms ({pingMs < 120 ? 'Excelente para 4K' : pingMs < 300 ? 'Bom para 1080p' : 'Moderado'})
                </span>
              </div>
            )}
          </div>

          {/* Video Playback Quality Settings */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Qualidade de Reprodução Padrão
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Prioridade de streaming na inicialização de filmes e episódios.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['auto', '4k', '1080p', '720p'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSaveNetwork({ ...networkSettings, defaultQuality: q })}
                  className={`p-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                    networkSettings.defaultQuality === q
                      ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {q === 'auto' ? 'Automático' : q === '4k' ? '4K Ultra HD' : q === '1080p' ? '1080p FHD' : '720p HD'}
                </button>
              ))}
            </div>

            {/* TV Buffer Mode */}
            <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-neutral-200 block">Buffer Otimizado para TV</span>
                <span className="text-[11px] text-neutral-400 block">
                  Pré-carrega segmentos do vídeo antes do início para evitar congelamentos no player.
                </span>
              </div>
              <input
                type="checkbox"
                checked={networkSettings.tvBufferMode}
                onChange={(e) =>
                  handleSaveNetwork({ ...networkSettings, tvBufferMode: e.target.checked })
                }
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* TV Local Storage & Cache Cleaner */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                Gerenciamento de Armazenamento Local da TV
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Limpe caches temporários para manter a TV sempre rápida e sem travamentos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Pôsteres & Imagens:</span>
                <span className="text-sm font-black text-neutral-200">{cacheInfo.imagesSizeKB} KB</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Metadados em Cache:</span>
                <span className="text-sm font-black text-neutral-200">{cacheInfo.metadataSizeKB} KB</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Histórico de Progresso:</span>
                <span className="text-sm font-black text-neutral-200">{cacheInfo.watchProgressCount} títulos</span>
              </div>
            </div>

            {cacheActionFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{cacheActionFeedback}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleClearImages}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
              >
                Limpar Cache de Imagens
              </button>
              <button
                type="button"
                onClick={handleClearProgress}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
              >
                Limpar Histórico de Progresso
              </button>
              {confirmClearAll ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                  >
                    Confirmar Limpeza Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-400 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-800 text-xs font-bold transition-colors"
                >
                  Limpar Todo Cache Local
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: NAVEGADOR DE PASTAS                                            */}
      {/* ========================================================================= */}
      {activeSection === 'folders' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
            <span>Navegue diretamente nas pastas do seu Google Drive sem sair das configurações.</span>
          </div>

          <FolderBrowser
            accounts={accounts}
            onPlayMedia={onPlayMedia}
            onSetSourceFolder={onSetSourceFolder}
          />
        </div>
      )}
    </div>
  );
}
