import { useState, useEffect } from 'react';
import {
  X,
  Folder,
  ChevronRight,
  RefreshCw,
  Check,
  ArrowLeft,
  FolderCheck,
  FolderOpen,
  Globe,
  Search,
  Users,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { DriveAccount, DriveFolder } from '../types';
import {
  fetchFoldersFromDrive,
  searchFoldersGlobally,
  fetchSharedWithMeFolders,
  findFoldersNamedMidia
} from '../services/driveService';

interface FolderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: DriveAccount | null;
  onSelectFolder: (accountId: string, folderId?: string, folderName?: string) => void;
}

interface BreadcrumbItem {
  id?: string;
  name: string;
}

type TabType = 'drive' | 'search' | 'shared';

export default function FolderSelectorModal({
  isOpen,
  onClose,
  account,
  onSelectFolder,
}: FolderSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('drive');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: 'Meu Drive' }]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [searchResults, setSearchResults] = useState<DriveFolder[]>([]);
  const [sharedFolders, setSharedFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search input query
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState<string>('');

  const currentFolder = breadcrumbs[breadcrumbs.length - 1];
  const currentFolderId = currentFolder?.id;

  const loadFolders = async (parentId?: string) => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const fetched = await fetchFoldersFromDrive(
        account.accessToken,
        account.id,
        account.label,
        parentId
      );
      setFolders(fetched);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pastas do Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const loadSharedFolders = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const fetched = await fetchSharedWithMeFolders(account.accessToken, account.id, account.label);
      setSharedFolders(fetched);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pastas compartilhadas.');
    } finally {
      setLoading(false);
    }
  };

  // Perform global Google Drive API search for folders across all depths
  const handleGlobalSearch = async (term: string) => {
    if (!account || !term.trim()) return;
    setSearching(true);
    setError(null);
    setActiveTab('search');
    try {
      let results = await searchFoldersGlobally(account.accessToken, account.id, account.label, term.trim());
      // If searching specifically for midia, also use the multi-term midia finder
      if (term.toLowerCase().includes('midi')) {
        const midiaResults = await findFoldersNamedMidia(account.accessToken, account.id, account.label);
        const map = new Map<string, DriveFolder>();
        [...midiaResults, ...results].forEach((f) => map.set(f.id, f));
        results = Array.from(map.values());
      }
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Erro ao pesquisar pastas no Google Drive.');
    } finally {
      setSearching(false);
    }
  };

  // Quick 1-click button to locate "MIDIA" folder immediately
  const handleQuickLocateMidia = async () => {
    setSearchQuery('MIDIA');
    await handleGlobalSearch('MIDIA');
  };

  useEffect(() => {
    if (isOpen && account) {
      setActiveTab('drive');
      setBreadcrumbs([{ name: 'Meu Drive' }]);
      setSearchQuery('');
      setFilterQuery('');
      loadFolders(undefined);
    }
  }, [isOpen, account?.id]);

  useEffect(() => {
    if (isOpen && account && activeTab === 'drive') {
      loadFolders(currentFolderId);
    }
  }, [currentFolderId, activeTab]);

  useEffect(() => {
    if (isOpen && account && activeTab === 'shared' && sharedFolders.length === 0) {
      loadSharedFolders();
    }
  }, [activeTab]);

  if (!isOpen || !account) return null;

  const handleOpenFolder = (folder: DriveFolder) => {
    setFilterQuery('');
    setActiveTab('drive');
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    setFilterQuery('');
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleChooseCurrentFolder = () => {
    if (!currentFolderId) {
      // Root was chosen
      onSelectFolder(account.id, undefined, undefined);
    } else {
      onSelectFolder(account.id, currentFolderId, currentFolder.name);
    }
    onClose();
  };

  const handleChooseSubfolderDirectly = (folder: DriveFolder) => {
    onSelectFolder(account.id, folder.id, folder.name);
    onClose();
  };

  const handleChooseWholeDrive = () => {
    onSelectFolder(account.id, undefined, undefined);
    onClose();
  };

  const filteredDriveFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  const isCurrentFolderSelected = account.selectedFolderId === currentFolderId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/90">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                account.color === 'blue'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              }`}
            >
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                Selecionar Pasta de Mídia
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    account.color === 'blue'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-purple-950 text-purple-300 border border-purple-800'
                  }`}
                >
                  {account.label}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Localize sua pasta de vídeos (ex: MIDIA) ou navegue pelas pastas do Drive
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

        {/* PROMINENT QUICK SHORTCUT FOR "MIDIA" FOLDER */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-950/50 via-neutral-900 to-neutral-950 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-200">
                Procurando a pasta <span className="text-amber-400 font-extrabold underline decoration-amber-400/50">MIDIA</span>?
              </p>
              <p className="text-[11px] text-neutral-400">
                Encontre-a instantaneamente em qualquer nível ou subpasta do seu Google Drive.
              </p>
            </div>
          </div>

          <button
            id="quick-locate-midia-btn"
            onClick={handleQuickLocateMidia}
            disabled={searching}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-md shadow-amber-950/80 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            {searching ? 'Localizando...' : 'Localizar Pasta "MIDIA"'}
          </button>
        </div>

        {/* Global Search Bar (Deep API Query) */}
        <div className="px-6 py-3 bg-neutral-950/70 border-b border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite o nome da pasta para buscar em todo o Drive (ex: MIDIA, Filmes, Series)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGlobalSearch(searchQuery);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 placeholder-neutral-500"
            />
          </div>

          <button
            id="search-drive-folders-btn"
            onClick={() => handleGlobalSearch(searchQuery)}
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            {searching ? 'Buscando...' : 'Buscar no Drive'}
          </button>
        </div>

        {/* Current Folder Selection Banner */}
        <div className="px-6 py-2.5 bg-neutral-950 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-neutral-400 shrink-0">Pasta selecionada para abrir:</span>
            <span className="text-xs font-bold text-amber-400 truncate flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 fill-amber-400/20" />
              {currentFolder?.name || 'Meu Drive (Raiz)'}
            </span>
            {isCurrentFolderSelected && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded shrink-0">
                Ativa no Catálogo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentFolderId && (
              <button
                id="select-whole-drive-btn"
                onClick={handleChooseWholeDrive}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                title="Escanear todo o Drive sem restrição de pasta"
              >
                <Globe className="w-3 h-3 text-neutral-400" />
                Escanear Todo o Drive
              </button>
            )}

            <button
              id="confirm-current-folder-btn"
              onClick={handleChooseCurrentFolder}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-950 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <FolderCheck className="w-4 h-4" />
              {currentFolderId ? `Definir "${currentFolder.name}" como Fonte` : 'Definir Raiz (Todo o Drive)'}
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="px-6 pt-2 bg-neutral-950/40 border-b border-neutral-800 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('drive')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'drive'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            Meu Drive (Navegação)
          </button>

          {searchResults.length > 0 && (
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'search'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Resultados da Busca ({searchResults.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('shared')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'shared'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Compartilhados Comigo
          </button>
        </div>

        {/* Breadcrumb Navigator (only in 'drive' tab) */}
        {activeTab === 'drive' && (
          <div className="px-6 py-2 bg-neutral-900/40 border-b border-neutral-800/60 flex items-center gap-1 overflow-x-auto text-xs">
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <div key={i} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-600" />}
                  <button
                    onClick={() => handleNavigateBreadcrumb(i)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      isLast
                        ? 'bg-neutral-800 text-neutral-100 font-bold'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                    }`}
                  >
                    {b.name}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Content & Folders List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick filter in current list */}
          {activeTab === 'drive' && (
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Filtrar pastas listadas abaixo..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="flex-1 px-3.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 placeholder-neutral-500"
              />
              <button
                onClick={() => loadFolders(currentFolderId)}
                disabled={loading}
                className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Atualizar lista de pastas"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading state */}
          {(loading || searching) && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>{searching ? 'Pesquisando em todo o Google Drive...' : 'Buscando pastas no Google Drive...'}</span>
            </div>
          )}

          {/* TAB 1: Search Results */}
          {activeTab === 'search' && !searching && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">
                  Pastas encontradas para &ldquo;{searchQuery}&rdquo; ({searchResults.length})
                </span>
                <button
                  onClick={() => setActiveTab('drive')}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Voltar para Meu Drive
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.map((folder) => {
                    const isMidia = folder.name.toLowerCase().includes('midi');
                    const isSelected = account.selectedFolderId === folder.id;

                    return (
                      <div
                        key={folder.id}
                        id={`search-folder-${folder.id}`}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                          isMidia
                            ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/40'
                            : isSelected
                            ? 'bg-neutral-900 border-amber-400'
                            : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isMidia ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-300'
                          }`}>
                            <Folder className="w-5 h-5 fill-current" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-extrabold text-neutral-100 truncate">
                                {folder.name}
                              </p>
                              {isMidia && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black shrink-0">
                                  Pasta MIDIA
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                              ID: {folder.id.substring(0, 14)}...
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80">
                          <button
                            onClick={() => handleOpenFolder(folder)}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                            title="Ver o que tem dentro desta pasta"
                          >
                            Abrir Subpastas
                          </button>
                          <button
                            onClick={() => handleChooseSubfolderDirectly(folder)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-500 hover:bg-amber-400 text-black'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            {isSelected ? 'Fonte Atual' : 'Usar esta Pasta'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3 border border-dashed border-neutral-800 rounded-2xl p-6">
                  <Folder className="w-10 h-10 text-neutral-600 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-200">
                    Nenhuma pasta com o nome &ldquo;{searchQuery}&rdquo; foi encontrada.
                  </p>
                  <p className="text-[11px] text-neutral-400 max-w-md mx-auto">
                    Verifique se o nome está correto ou se a pasta foi compartilhada de outra conta (verifique a aba &ldquo;Compartilhados Comigo&rdquo;).
                  </p>
                  <button
                    onClick={() => setActiveTab('shared')}
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Verificar Pastas Compartilhadas
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Shared With Me */}
          {activeTab === 'shared' && !loading && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-neutral-300">
                Pastas Compartilhadas com sua Conta ({sharedFolders.length})
              </span>

              {sharedFolders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sharedFolders.map((folder) => {
                    const isMidia = folder.name.toLowerCase().includes('midi');
                    const isSelected = account.selectedFolderId === folder.id;

                    return (
                      <div
                        key={folder.id}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                          isMidia
                            ? 'bg-amber-950/40 border-amber-500/80'
                            : 'bg-neutral-950/70 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Folder className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-neutral-100 truncate">
                              {folder.name}
                            </p>
                            <span className="text-[10px] text-purple-300">Compartilhada</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80">
                          <button
                            onClick={() => handleOpenFolder(folder)}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
                          >
                            Abrir
                          </button>
                          <button
                            onClick={() => handleChooseSubfolderDirectly(folder)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            {isSelected ? 'Fonte Atual' : 'Usar como Fonte'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2 border border-dashed border-neutral-800 rounded-2xl p-4">
                  <Users className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-300">Nenhuma pasta compartilhada encontrada nesta conta.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Normal Meu Drive Breadcrumb Directory */}
          {activeTab === 'drive' && !loading && (
            <>
              {breadcrumbs.length > 1 && (
                <button
                  onClick={() => handleNavigateBreadcrumb(breadcrumbs.length - 2)}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Subir um nível (pasta anterior)
                </button>
              )}

              {filteredDriveFolders.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Pastas em &ldquo;{currentFolder.name}&rdquo; ({filteredDriveFolders.length})
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Clique na pasta para abrir ou no botão para selecionar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredDriveFolders.map((folder) => {
                      const isSelected = account.selectedFolderId === folder.id;
                      const isMidia = folder.name.toLowerCase().includes('midi');

                      return (
                        <div
                          key={folder.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isMidia
                              ? 'bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                              : isSelected
                              ? 'bg-amber-950/30 border-amber-400/80 shadow-md'
                              : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
                          }`}
                        >
                          <div
                            onClick={() => handleOpenFolder(folder)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                            title="Clique para abrir esta subpasta"
                          >
                            <Folder
                              className={`w-5 h-5 shrink-0 group-hover:scale-110 transition-transform ${
                                isMidia ? 'text-amber-400 fill-amber-400/20' : 'text-neutral-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate group-hover:text-amber-400 transition-colors ${
                                isMidia ? 'text-amber-300' : 'text-neutral-200'
                              }`}>
                                {folder.name}
                              </p>
                              <span className="text-[10px] text-neutral-500">
                                Clique p/ abrir subpastas
                              </span>
                            </div>
                          </div>

                          <button
                            id={`select-folder-btn-${folder.id}`}
                            onClick={() => handleChooseSubfolderDirectly(folder)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-md'
                                : isMidia
                                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                                : 'bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-200'
                            }`}
                            title="Selecionar esta pasta como fonte"
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                Selecionada
                              </>
                            ) : (
                              'Selecionar'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-3 border border-dashed border-neutral-800 rounded-2xl p-6">
                  <Folder className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-300">
                    Nenhuma subpasta encontrada aqui.
                  </p>
                  <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                    Não encontrou a pasta MIDIA? Use o botão &ldquo;Localizar Pasta MIDIA&rdquo; acima para uma busca profunda em toda a sua conta.
                  </p>
                  <button
                    onClick={handleQuickLocateMidia}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Buscar pasta MIDIA agora
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
          <span>
            {account.selectedFolderName
              ? `Pasta ativa: "${account.selectedFolderName}"`
              : 'Fonte configurada: Todo o Google Drive'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
