import React, { useState } from 'react';
import {
  X,
  Sliders,
  Database,
  Globe,
  Sparkles,
  RefreshCw,
  Check,
  Key,
  ExternalLink,
  ShieldCheck,
  Layers,
  Clock,
  Cloud,
  Play,
} from 'lucide-react';
import { ScraperSettings, BackgroundSyncSettings } from '../types';
import {
  loadScraperSettings,
  saveScraperSettings,
  loadSyncSettings,
  saveSyncSettings,
} from '../services/storageService';

interface MetadataSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRescrapeLibrary?: () => void;
  onTriggerFullRescrape?: () => void;
  onTriggerBackgroundSync?: () => void;
  isScrapingActive?: boolean;
  isBackgroundSyncing?: boolean;
}

export default function MetadataSettingsModal({
  isOpen,
  onClose,
  onRescrapeLibrary,
  onTriggerFullRescrape,
  onTriggerBackgroundSync,
  isScrapingActive = false,
  isBackgroundSyncing = false,
}: MetadataSettingsModalProps) {
  if (!isOpen) return null;

  const triggerRescrape = onTriggerFullRescrape || onRescrapeLibrary;

  const [settings, setSettings] = useState<ScraperSettings>(() => loadScraperSettings());
  const [syncSettings, setSyncSettings] = useState<BackgroundSyncSettings>(() => loadSyncSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<'success' | 'error' | null>(null);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveScraperSettings(settings);
    saveSyncSettings(syncSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestTmdbKey = async () => {
    if (!settings.tmdbApiKey.trim()) {
      setKeyTestStatus('error');
      return;
    }

    setIsTestingKey(true);
    setKeyTestStatus(null);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/authentication?api_key=${encodeURIComponent(
          settings.tmdbApiKey.trim()
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                Agente de Metadados & Scrapers
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Estilo Jellyfin / Plex
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Gerencie as fontes de capas oficiais, sinopses em português e detalhes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active language card */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-lg shadow-sm">
                🇧🇷
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200">
                  Idioma dos Metadados
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Todas as sinopses, gêneros e títulos são buscados em Português do Brasil (pt-BR)
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              pt-BR Ativo
            </span>
          </div>

          {/* Automatic scraping toggle */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
            <div className="space-y-0.5 max-w-md">
              <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Varredura Automática de Metadados
              </h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Ao sincronizar pastas ou adicionar arquivos do Google Drive, buscar capas, sinopses e detalhes automaticamente em segundo plano.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoScrapeOnScan}
                onChange={(e) => setSettings({ ...settings, autoScrapeOnScan: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Scraper Providers Stack */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              Provedores & Fontes de Dados
            </h4>

            {/* Provider 1: TMDb */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-100">
                      The Movie Database (TMDb)
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Oficial pt-BR
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Fonte padrão do Plex e Jellyfin para capas em alta resolução (4K), elenco completo e sinopses oficiais.
                  </p>
                </div>
              </div>

              {/* API Key Field */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" />
                    Chave de API do TMDb (Opcional):
                  </label>
                  <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
                  >
                    Obter chave grátis no TMDb
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={settings.tmdbApiKey}
                    onChange={(e) => setSettings({ ...settings, tmdbApiKey: e.target.value })}
                    placeholder="Cole sua chave API (ex: a1b2c3d4e5f6...)"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestTmdbKey}
                    disabled={isTestingKey || !settings.tmdbApiKey.trim()}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-semibold text-neutral-300 transition-colors shrink-0"
                  >
                    {isTestingKey ? 'Testando...' : 'Testar'}
                  </button>
                </div>

                {keyTestStatus === 'success' && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Chave TMDb válida e conectada com sucesso!
                  </p>
                )}
                {keyTestStatus === 'error' && (
                  <p className="text-[11px] text-rose-400">
                    Chave inválida. Verifique sua chave em themoviedb.org/settings/api.
                  </p>
                )}
              </div>
            </div>

            {/* Provider 2: Cinemeta + Metahub + TVMaze */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-200">
                    Cinemeta, IMDb & Metahub
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                    Sempre Ativo
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Banco público descentralizado com notas do IMDb, diretores e atores (sem limites).
                </p>
              </div>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Provider 3: Wikipédia pt-BR */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-200">
                    Wikipédia Brasil (pt-BR)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                    Sempre Ativo
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Garante sinopses 100% em português brasileiro autêntico e títulos nacionais.
                </p>
              </div>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Provider 4: AniList */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-200">
                    AniList & Kitsu (Animes)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                    Sempre Ativo
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Scraper especializado para coleções de animação japonesa (Demon Slayer, Jujutsu Kaisen, etc).
                </p>
              </div>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          </div>

          {/* Section: Cloud Database (Firestore) */}
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-sky-900/30 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-neutral-100">
                      Banco de Dados na Nuvem (Firebase Firestore)
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Conectado
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    Salva automaticamente títulos traduzidos, capas em HD, sinopses em pt-BR, notas e identificações manuais na nuvem.
                    <span className="text-sky-300 font-semibold"> Seus dados nunca são perdidos</span> ao re-escanear o Drive ou trocar de aparelho, e <span className="text-sky-300 font-semibold">não consomem memória local</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Preservação automática em novas varreduras
              </span>
              <span className="text-neutral-500 font-mono text-[10px]">
                Coleção: media_metadata
              </span>
            </div>
          </div>

          {/* Section: Background Periodic Sync */}
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-neutral-100">
                      Verificação Automática em Segundo Plano (Agendador)
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Sem Interrupção
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    Verifica periodicamente se você adicionou novos vídeos no Google Drive e atualiza o catálogo silenciosamente.
                    <strong className="text-neutral-200"> Nunca interrompe a reprodução de filmes/séries nem tira o foco da tela.</strong>
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={syncSettings.enabled}
                  onChange={(e) => setSyncSettings({ ...syncSettings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {syncSettings.enabled && (
              <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-300">
                    Intervalo de verificação:
                  </span>
                  <select
                    value={syncSettings.intervalMinutes}
                    onChange={(e) =>
                      setSyncSettings({ ...syncSettings, intervalMinutes: Number(e.target.value) })
                    }
                    className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={5}>A cada 5 minutos (Rápido)</option>
                    <option value={15}>A cada 15 minutos (Recomendado)</option>
                    <option value={30}>A cada 30 minutos</option>
                    <option value={60}>A cada 1 hora</option>
                  </select>
                </div>

                {onTriggerBackgroundSync && (
                  <button
                    type="button"
                    disabled={isBackgroundSyncing}
                    onClick={onTriggerBackgroundSync}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-neutral-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBackgroundSyncing ? 'animate-spin text-purple-400' : ''}`} />
                    {isBackgroundSyncing ? 'Verificando em 2º plano...' : 'Verificar Agora'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action: Re-scrape entire library */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-950 border border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                Atualizar Metadados de Todos os Arquivos
              </h4>
              <p className="text-[11px] text-neutral-400">
                Reexecuta o scraper em toda a sua biblioteca para baixar capas e sinopses faltantes.
              </p>
            </div>

            <button
              type="button"
              disabled={isScrapingActive}
              onClick={() => {
                onClose();
                triggerRescrape?.();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScrapingActive ? 'animate-spin' : ''}`} />
              {isScrapingActive ? 'Escaneando...' : 'Atualizar Biblioteca'}
            </button>
          </div>

          {/* Footer Save */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> Configurações salvas!
              </span>
            ) : (
              <span className="text-[11px] text-neutral-500">
                Alterações são salvas localmente
              </span>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-medium transition-colors"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-lg transition-all"
              >
                Salvar Preferências
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
