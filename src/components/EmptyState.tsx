import { HardDrive, Film, Tv, Play, Plus, ShieldCheck, Sparkles, FolderSync } from 'lucide-react';

interface EmptyStateProps {
  onConnectDrive: (slotIndex: number) => void;
  isConnecting: boolean;
  hasDrivesConnected: boolean;
  onRefresh: () => void;
  isScanning: boolean;
}

export default function EmptyState({
  onConnectDrive,
  isConnecting,
  hasDrivesConnected,
  onRefresh,
  isScanning,
}: EmptyStateProps) {
  if (hasDrivesConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-rose-500 shadow-xl">
          <FolderSync className={`w-8 h-8 ${isScanning ? 'animate-spin' : ''}`} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-neutral-100">
            {isScanning ? 'Indexando seus vídeos...' : 'Nenhum vídeo encontrado'}
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {isScanning
              ? 'Estamos buscando todos os arquivos de vídeo (MP4, MKV, AVI, WEBM) nas suas contas do Google Drive.'
              : 'Verifique se as contas do Google Drive conectadas possuem arquivos de vídeo ou certifique-se de que os arquivos não estão na lixeira.'}
          </p>
        </div>

        <button
          id="rescan-empty-btn"
          onClick={onRefresh}
          disabled={isScanning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-950 transition-all disabled:opacity-50"
        >
          <FolderSync className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Verificando...' : 'Escanear Novamente'}
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-20 px-4 max-w-4xl mx-auto space-y-12">
      {/* Hero Welcome */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Seu streaming pessoal com 2 Google Drives
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Transforme seus <span className="text-rose-500">Google Drives</span> em um cinema
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Conecte sua 1ª e 2ª conta do Google Drive. O Drive Cinema unifica seus arquivos de vídeo, detecta automaticamente filmes e temporadas de séries e oferece um player completo com reprodução contínua.
        </p>
      </div>

      {/* 2 Drives Connect Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Slot 1 */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between space-y-6 hover:border-neutral-700 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-800/60">
                Drive 1 (Principal)
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-100">
                Primeira Conta do Drive
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Conecte seu Gmail/Google Drive primário para listar filmes e séries armazenados.
              </p>
            </div>
          </div>

          <button
            id="empty-connect-drive-1"
            onClick={() => onConnectDrive(0)}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Conectar Google Drive 1
          </button>
        </div>

        {/* Slot 2 */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between space-y-6 hover:border-neutral-700 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-800/60">
                Drive 2 (Secundário)
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-100">
                Segunda Conta do Drive
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Conecte sua conta secundária para fundir ambos os catálogos em uma única tela.
              </p>
            </div>
          </div>

          <button
            id="empty-connect-drive-2"
            onClick={() => onConnectDrive(1)}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Conectar Google Drive 2
          </button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-800/80 text-center max-w-3xl mx-auto">
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/50 space-y-2">
          <Film className="w-5 h-5 text-rose-500 mx-auto" />
          <h4 className="text-xs font-bold text-neutral-200">Reconhecimento Automático</h4>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Identifica temporadas (S01E01), episódios e filmes sem necessidade de renomear arquivos.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/50 space-y-2">
          <Play className="w-5 h-5 text-rose-500 mx-auto" />
          <h4 className="text-xs font-bold text-neutral-200">Player com Transcodificação</h4>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Player oficial do Google Drive para MKV e player HTML5 com retomada de onde parou.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/50 space-y-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto" />
          <h4 className="text-xs font-bold text-neutral-200">Seguro e Somente Leitura</h4>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Seus arquivos continuam seguros nos seus Drives. Nada é modificado ou deletado.
          </p>
        </div>
      </div>
    </div>
  );
}
