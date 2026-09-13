import { useState, useEffect } from 'react';
import {
  Folder,
  FileVideo,
  ChevronRight,
  HardDrive,
  RefreshCw,
  Play,
  ArrowLeft,
  FolderCheck,
  Check,
  Globe,
  Search,
  Sparkles
} from 'lucide-react';
import { DriveAccount, DriveFolder, DriveRawFile, MediaItem } from '../types';
import {
  fetchFoldersFromDrive,
  fetchVideosFromDrive,
  searchFoldersGlobally,
  findFoldersNamedMidia
} from '../services/driveService';
import { groupFilesIntoMediaItems, formatBytes, isVideoFile } from '../services/mediaParser';

interface FolderBrowserProps {
  accounts: DriveAccount[];
  onPlayMedia: (item: MediaItem) => void;
  onSetSourceFolder?: (accountId: string, folderId?: string, folderName?: string) => void;
}

interface BreadcrumbItem {
  id?: string;
  name: string;
}

export default function FolderBrowser({ accounts, onPlayMedia, onSetSourceFolder }: FolderBrowserProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: 'Meu Drive' }]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveRawFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<DriveFolder[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const currentFolder = breadcrumbs[breadcrumbs.length - 1];
  const currentFolderId = currentFolder?.id;

  const loadDirectory = async (folderId?: string) => {
    if (!currentAccount) return;
    setLoading(true);
    setError(null);
    try {
      const [fetchedFolders, fetchedFiles] = await Promise.all([
        fetchFoldersFromDrive(currentAccount.accessToken, currentAccount.id, currentAccount.label, folderId),
        fetchVideosFromDrive(currentAccount.accessToken, currentAccount.id, currentAccount.label, folderId),
      ]);
      setFolders(fetchedFolders);
      setFiles(fetchedFiles.filter((f) => isVideoFile(f.name, f.mimeType)));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar conteúdo da pasta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAccount) {
      loadDirectory(currentFolderId);
    }
  }, [selectedAccountId, currentFolderId]);

  const handleOpenFolder = (folder: DriveFolder) => {
    setSearchResults(null);
    setSearchQuery('');
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    setSearchResults(null);
    setSearchQuery('');
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handlePlayFile = (file: DriveRawFile) => {
    const items = groupFilesIntoMediaItems([file]);
    if (items[0]) {
      onPlayMedia(items[0]);
    }
  };

  // Locate MIDIA folder across the entire Google Drive
  const handleQuickLocateMidia = async () => {
    if (!currentAccount) return;
    setSearching(true);
    setError(null);
    setSearchQuery('MIDIA');
    try {
      const results = await findFoldersNamedMidia(currentAccount.accessToken, currentAccount.id, currentAccount.label);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar pasta MIDIA.');
    } finally {
      setSearching(false);
    }
  };

  // Search folders by user-entered query
  const handleSearchFolders = async (term: string) => {
    if (!currentAccount || !term.trim()) return;
    setSearching(true);
    setError(null);
    try {
      let results = await searchFoldersGlobally(currentAccount.accessToken, currentAccount.id, currentAccount.label, term.trim());
      if (term.toLowerCase().includes('midi')) {
        const midiaResults = await findFoldersNamedMidia(currentAccount.accessToken, currentAccount.id, currentAccount.label);
        const map = new Map<string, DriveFolder>();
        [...midiaResults, ...results].forEach((f) => map.set(f.id, f));
        results = Array.from(map.values());
      }
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Erro ao pesquisar pastas.');
    } finally {
      setSearching(false);
    }
  };

  const isCurrentFolderSource = currentAccount?.selectedFolderId === currentFolderId;

  if (accounts.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400">
        Conecte pelo menos um Google Drive para navegar pelas pastas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drive Account selector tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-rose-500" />
          <span className="text-sm font-bold text-neutral-200">Navegar por Pastas do Drive:</span>
        </div>

        <div className="flex items-center gap-2">
          {accounts.map((acc, index) => (
            <button
              key={acc.id}
              id={`folder-drive-tab-${index}`}
              onClick={() => {
                setSelectedAccountId(acc.id);
                setBreadcrumbs([{ name: 'Meu Drive' }]);
                setSearchResults(null);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                currentAccount?.id === acc.id
                  ? index === 0
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-purple-600 text-white shadow-md'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-300' : 'bg-purple-300'}`} />
              {acc.label} ({acc.email})
            </button>
          ))}
          <button
            onClick={() => loadDirectory(currentFolderId)}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Recarregar pasta"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* QUICK LOCATE "MIDIA" BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-neutral-900/80 to-neutral-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-100">
              Procurando pela sua pasta <span className="text-amber-400 font-extrabold underline decoration-amber-400/50">MIDIA</span>?
            </p>
            <p className="text-[11px] text-neutral-400">
              Clique para localizar a pasta MIDIA diretamente em qualquer local do seu Google Drive.
            </p>
          </div>
        </div>

        <button
          id="locate-midia-browser-btn"
          onClick={handleQuickLocateMidia}
          disabled={searching}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-md shadow-amber-950 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          {searching ? 'Localizando...' : 'Localizar Pasta "MIDIA"'}
        </button>
      </div>

      {/* Deep Folder Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar pasta por nome em todo o Google Drive (ex: MIDIA, Filmes, Series)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchFolders(searchQuery);
            }}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 placeholder-neutral-500"
          />
        </div>
        <button
          onClick={() => handleSearchFolders(searchQuery)}
          disabled={searching || !searchQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-bold transition-colors shrink-0"
        >
          {searching ? 'Buscando...' : 'Buscar no Drive'}
        </button>
        {searchResults && (
          <button
            onClick={() => {
              setSearchResults(null);
              setSearchQuery('');
            }}
            className="px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold"
          >
            Limpar Busca
          </button>
        )}
      </div>

      {/* SEARCH RESULTS VIEW IF ACTIVE */}
      {searchResults && (
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/40 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-200">
              Pastas encontradas para &ldquo;{searchQuery}&rdquo; ({searchResults.length})
            </span>
            <button
              onClick={() => {
                setSearchResults(null);
                setSearchQuery('');
              }}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Voltar à navegação normal
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {searchResults.map((folder) => {
                const isMidia = folder.name.toLowerCase().includes('midi');
                const isSource = currentAccount?.selectedFolderId === folder.id;

                return (
                  <div
                    key={folder.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                      isMidia
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-neutral-950/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${isMidia ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-300'}`}>
                        <Folder className="w-5 h-5 fill-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-100 truncate">{folder.name}</p>
                        {isMidia && (
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-950 border border-amber-800 px-1.5 py-0.5 rounded inline-block mt-1">
                            Pasta MIDIA Detectada
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80">
                      <button
                        onClick={() => handleOpenFolder(folder)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
                      >
                        Abrir Pasta
                      </button>
                      {onSetSourceFolder && (
                        <button
                          onClick={() => onSetSourceFolder(currentAccount.id, folder.id, folder.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                            isSource
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 hover:bg-amber-400 text-black'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          {isSource ? 'Fonte Atual' : 'Definir como Fonte'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-neutral-400">
              Nenhuma pasta com o nome &ldquo;{searchQuery}&rdquo; foi encontrada.
            </div>
          )}
        </div>
      )}

      {/* Current Folder Action Bar */}
      {currentAccount && onSetSourceFolder && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-900/90 via-neutral-900/50 to-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-200">
                  Pasta Selecionada no Catálogo:
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {currentAccount.selectedFolderName || 'Todo o Google Drive (Raiz)'}
                </span>
                {isCurrentFolderSource && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                    Ativa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                O app busca filmes e séries desta pasta e de todas as subpastas dela.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentAccount.selectedFolderId && (
              <button
                onClick={() => onSetSourceFolder(currentAccount.id, undefined, undefined)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Voltar a escanear todo o drive"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                Escanear Todo o Drive
              </button>
            )}

            <button
              onClick={() => onSetSourceFolder(currentAccount.id, currentFolderId, currentFolder?.name)}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-950 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              {currentFolderId ? `Definir "${currentFolder?.name}" como Fonte` : 'Definir Raiz (Todo o Drive)'}
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-1 text-xs text-neutral-400">
        {breadcrumbs.map((b, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />}
              <button
                onClick={() => handleNavigateBreadcrumb(i)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  isLast
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {b.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-sm text-neutral-400">
          <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
          <span>Carregando pastas e arquivos de vídeo...</span>
        </div>
      )}

      {/* Content Grid */}
      {!loading && (
        <div className="space-y-6">
          {/* Back button if inside subfolder */}
          {breadcrumbs.length > 1 && (
            <button
              onClick={() => handleNavigateBreadcrumb(breadcrumbs.length - 2)}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para pasta anterior
            </button>
          )}

          {/* Subfolders */}
          {folders.length > 0 && (
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-500 mb-3">
                Pastas ({folders.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {folders.map((folder) => {
                  const isFolderSource = currentAccount?.selectedFolderId === folder.id;
                  const isMidia = folder.name.toLowerCase().includes('midi');

                  return (
                    <div
                      key={folder.id}
                      id={`folder-${folder.id}`}
                      className={`flex flex-col justify-between p-3 rounded-xl border transition-all group ${
                        isMidia
                          ? 'bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                          : isFolderSource
                          ? 'bg-amber-950/40 border-amber-500/80 shadow-md'
                          : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      <div
                        onClick={() => handleOpenFolder(folder)}
                        className="cursor-pointer space-y-2 mb-2"
                      >
                        <div className="flex items-center justify-between">
                          <Folder className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                            isMidia ? 'text-amber-400 fill-amber-400/20' : 'text-amber-500'
                          }`} />
                          {isFolderSource && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-950 border border-amber-800 px-1 py-0.2 rounded">
                              Fonte
                            </span>
                          )}
                          {isMidia && !isFolderSource && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-950 border border-amber-800 px-1 py-0.2 rounded">
                              MIDIA
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-medium line-clamp-2 group-hover:text-white ${
                          isMidia ? 'text-amber-300 font-bold' : 'text-neutral-200'
                        }`}>
                          {folder.name}
                        </span>
                      </div>

                      {onSetSourceFolder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetSourceFolder(currentAccount.id, folder.id, folder.name);
                          }}
                          className={`w-full py-1 text-[10px] font-bold rounded transition-colors ${
                            isFolderSource
                              ? 'bg-emerald-700 text-white'
                              : isMidia
                              ? 'bg-amber-500 text-black hover:bg-amber-400'
                              : 'bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-300'
                          }`}
                        >
                          {isFolderSource ? '✓ Fonte Atual' : 'Usar como Fonte'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Video Files */}
          {files.length > 0 && (
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-500 mb-3">
                Vídeos nesta pasta ({files.length})
              </h4>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    id={`file-row-${file.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/40 hover:bg-neutral-800/80 border border-neutral-800/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-rose-500 shrink-0">
                        <FileVideo className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-200 truncate group-hover:text-rose-400 transition-colors">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {formatBytes(file.size)} • {file.mimeType}
                        </p>
                      </div>
                    </div>

                    <button
                      id={`play-file-btn-${file.id}`}
                      onClick={() => handlePlayFile(file)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all shrink-0 ml-3"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Assistir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {folders.length === 0 && files.length === 0 && (
            <div className="text-center py-16 text-neutral-500 text-xs">
              Nenhuma subpasta ou arquivo de vídeo encontrado nesta pasta.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
