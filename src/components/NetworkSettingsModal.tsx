import React, { useState, useEffect } from 'react';
import {
  Wifi,
  X,
  Check,
  Trash2,
  Activity,
  HardDrive,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { NetworkSettings, PlaybackQuality } from '../types';
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

interface NetworkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: NetworkSettings) => void;
  onCacheCleared?: () => void;
}

export default function NetworkSettingsModal({
  isOpen,
  onClose,
  onSettingsChanged,
  onCacheCleared,
}: NetworkSettingsModalProps) {
  const [settings, setSettings] = useState<NetworkSettings>(() => loadNetworkSettings());
  const [cacheInfo, setCacheInfo] = useState<CacheBreakdown>(() => getCacheBreakdown());
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadNetworkSettings());
      setCacheInfo(getCacheBreakdown());
      runPingTest();
    }
  }, [isOpen]);

  const runPingTest = async () => {
    setIsTestingPing(true);
    const ms = await testNetworkPing();
    setPingMs(ms);
    setIsTestingPing(false);
  };

  const handleSelectQuality = (quality: PlaybackQuality) => {
    const updated: NetworkSettings = { ...settings, defaultQuality: quality };
    setSettings(updated);
    saveNetworkSettings(updated);
    onSettingsChanged?.(updated);
    showFeedback(`Qualidade padrão definida para ${quality.toUpperCase()}`);
  };

  const handleToggleDataSaver = () => {
    const updated: NetworkSettings = {
      ...settings,
      dataSaverEnabled: !settings.dataSaverEnabled,
      // When data saver is turned on, lower default quality if set to 1080p
      defaultQuality: !settings.dataSaverEnabled && settings.defaultQuality === '1080p' ? '720p' : settings.defaultQuality,
    };
    setSettings(updated);
    saveNetworkSettings(updated);
    onSettingsChanged?.(updated);
    showFeedback(
      updated.dataSaverEnabled ? 'Economizador de dados ATIVADO' : 'Economizador de dados DESATIVADO'
    );
  };

  const handleTogglePreload = () => {
    const updated: NetworkSettings = {
      ...settings,
      preloadThumbnails: !settings.preloadThumbnails,
    };
    setSettings(updated);
    saveNetworkSettings(updated);
    onSettingsChanged?.(updated);
  };

  const handleClearMetadata = () => {
    clearMetadataAndImagesCache();
    setCacheInfo(getCacheBreakdown());
    onCacheCleared?.();
    showFeedback('Cache de metadados e pôsteres limpo!');
  };

  const handleClearProgress = () => {
    clearWatchProgressCache();
    setCacheInfo(getCacheBreakdown());
    onCacheCleared?.();
    showFeedback('Histórico de progresso local limpo!');
  };

  const handleClearAll = () => {
    clearAllLocalCache();
    setCacheInfo(getCacheBreakdown());
    setConfirmClearAll(false);
    onCacheCleared?.();
    showFeedback('Todo o cache local foi limpo!');
  };

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  if (!isOpen) return null;

  const qualityOptions: {
    id: PlaybackQuality;
    title: string;
    badge: string;
    description: string;
    dataUsage: string;
  }[] = [
    {
      id: 'auto',
      title: 'Automático',
      badge: 'Recomendado',
      description: 'Ajusta a resolução dinamicamente conforme a velocidade da sua internet na TV.',
      dataUsage: 'Ajustável',
    },
    {
      id: '1080p',
      title: '1080p (Full HD)',
      badge: 'Máxima Nitidez',
      description: 'Melhor qualidade de imagem para TVs 4K e grandes telas. Requer boa conexão.',
      dataUsage: '~2.5 a 4.0 GB/hora',
    },
    {
      id: '720p',
      title: '720p (HD)',
      badge: 'Equilibrado',
      description: 'Excelente equilíbrio entre qualidade visual e carregamento sem travamentos.',
      dataUsage: '~1.0 a 1.8 GB/hora',
    },
    {
      id: '480p',
      title: '480p (SD)',
      badge: 'Econômico',
      description: 'Ideal para conexões lentas ou dados móveis limitados. Reduz consumo ao máximo.',
      dataUsage: '~400 a 700 MB/hora',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="network-settings-modal"
        className="relative w-full max-w-2xl bg-neutral-900/95 border border-neutral-800 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Configuração de Rede & Cache</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  TV Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Qualidade de reprodução, economia de banda e limpeza de armazenamento local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className="bg-emerald-950/90 border-b border-emerald-700 px-6 py-2.5 text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
            <Check className="w-4 h-4 text-emerald-400" />
            {actionFeedback}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-neutral-200">
          {/* SECTION 1: QUALIDADE PADRÃO DE REPRODUÇÃO */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <Sliders className="w-4 h-4 text-amber-400" />
                Qualidade Padrão de Reprodução
              </label>
              <span className="text-xs text-neutral-400">
                Atual: <strong className="text-amber-400 uppercase">{settings.defaultQuality}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {qualityOptions.map((opt) => {
                const isSelected = settings.defaultQuality === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectQuality(opt.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/80 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30'
                        : 'bg-neutral-950/50 border-neutral-800 hover:bg-neutral-800/50 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        {opt.title}
                        {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-500 text-black font-extrabold'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">{opt.description}</p>
                    <div className="text-[10px] font-semibold text-neutral-500 flex items-center gap-1 mt-0.5">
                      <span>Consumo de dados:</span>
                      <span className="text-neutral-300 font-mono">{opt.dataUsage}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: ECONOMIZADOR DE DADOS */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Modo Economizador de Dados</p>
                  <p className="text-[11px] text-neutral-400">
                    Otimiza os buffers e evita downloads desnecessários em conexões lentas
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleDataSaver}
                className={`w-12 h-6 rounded-full transition-colors relative focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  settings.dataSaverEnabled ? 'bg-emerald-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    settings.dataSaverEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between">
              <div className="text-[11px] text-neutral-300">
                Pré-carregar miniaturas e cartazes de filmes
              </div>
              <button
                onClick={handleTogglePreload}
                className={`w-10 h-5 rounded-full transition-colors relative focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  settings.preloadThumbnails ? 'bg-amber-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                    settings.preloadThumbnails ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION 3: GERENCIAMENTO DE CACHE LOCAL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <HardDrive className="w-4 h-4 text-amber-400" />
                Gerenciar Cache Local ({cacheInfo.totalFormatted})
              </label>
              <button
                onClick={() => setCacheInfo(getCacheBreakdown())}
                className="text-xs text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                title="Recalcular tamanho do cache"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
                  <span>Uso do armazenamento do navegador</span>
                  <span className="text-neutral-200 font-mono">{cacheInfo.totalFormatted}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(5, (cacheInfo.metadataBytes / (cacheInfo.totalBytes || 1)) * 100))}%`,
                    }}
                    title="Metadados"
                  />
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{
                      width: `${Math.min(100, (cacheInfo.progressBytes / (cacheInfo.totalBytes || 1)) * 100)}%`,
                    }}
                    title="Progresso"
                  />
                  <div
                    className="bg-sky-500 h-full transition-all"
                    style={{
                      width: `${Math.min(100, (cacheInfo.settingsBytes / (cacheInfo.totalBytes || 1)) * 100)}%`,
                    }}
                    title="Outros"
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Metadados: {cacheInfo.metadataFormatted}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Progresso: {cacheInfo.progressFormatted}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Configurações: {cacheInfo.settingsFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Cache */}
              <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap gap-2">
                <button
                  onClick={handleClearMetadata}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                  Limpar Cache de Pôsteres & Metadados
                </button>

                <button
                  onClick={handleClearProgress}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Limpar Histórico Local
                </button>

                {!confirmClearAll ? (
                  <button
                    onClick={() => setConfirmClearAll(true)}
                    className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Limpar Todo o Cache
                  </button>
                ) : (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[11px] text-rose-400 font-semibold">Confirmar limpeza?</span>
                    <button
                      onClick={handleClearAll}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                    >
                      Sim, Limpar
                    </button>
                    <button
                      onClick={() => setConfirmClearAll(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: DIAGNÓSTICO DE REDE E PING */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Status da Conexão</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-400 font-semibold">Conectado (Online)</span>
                  {pingMs !== null && (
                    <span className="text-[11px] text-neutral-400 font-mono">
                      • Latência: <strong className="text-neutral-200">{pingMs} ms</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={runPingTest}
              disabled={isTestingPing}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin' : ''}`} />
              {isTestingPing ? 'Testando...' : 'Testar Ping'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Configurações salvas automaticamente</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-950 transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
