import { useState } from 'react';
import { X, HardDrive, Plus, CheckCircle2, RefreshCw, Trash2, ShieldCheck, Info, Folder, FolderOpen } from 'lucide-react';
import { DriveAccount } from '../types';

interface DriveAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: DriveAccount[];
  onConnectDrive: (slotIndex: number) => Promise<void>;
  onDisconnectDrive: (accountId: string) => void;
  onSyncDrive: (account: DriveAccount) => Promise<void>;
  onOpenFolderSelector: (account: DriveAccount) => void;
  onClearFolder: (accountId: string) => void;
  isConnecting: boolean;
}

export default function DriveAccountsModal({
  isOpen,
  onClose,
  accounts,
  onConnectDrive,
  onDisconnectDrive,
  onSyncDrive,
  onOpenFolderSelector,
  onClearFolder,
  isConnecting,
}: DriveAccountsModalProps) {
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Accurately map each drive to its corresponding slot
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

  const handleSync = async (account: DriveAccount) => {
    try {
      setSyncingAccountId(account.id);
      await onSyncDrive(account);
    } finally {
      setSyncingAccountId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Gerenciar seus 2 Google Drives
              </h2>
              <p className="text-xs text-neutral-400">
                Conecte suas contas e defina de quais pastas o app deve buscar os filmes e séries
              </p>
            </div>
          </div>
          <button
            id="close-accounts-modal-btn"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Seleção de Pasta:</span> Você pode escolher uma pasta específica em cada Drive (ex: <i>&ldquo;Filmes&rdquo;</i> ou <i>&ldquo;Series&rdquo;</i>). O app buscará todos os vídeos contidos nela e em suas subpastas automaticamente!
            </div>
          </div>

          {/* Same account tip */}
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs flex items-start gap-2.5">
            <span className="text-base shrink-0 mt-0.5">📂</span>
            <div className="space-y-1 text-[11px] leading-relaxed">
              <span className="font-bold text-blue-300">Dica: Você pode usar a MESMA conta Google no Drive 1 e no Drive 2!</span>
              <p className="text-neutral-300">
                Por exemplo: conecte seu e-mail no <strong>Drive 1</strong> e escolha a pasta <span className="text-amber-400 font-semibold">&ldquo;Filmes&rdquo;</span>. Em seguida, conecte a mesma conta no <strong>Drive 2</strong> e escolha a pasta <span className="text-amber-400 font-semibold">&ldquo;Séries&rdquo;</span>. O app varrerá ambas as pastas e unificará tudo na sua tela inicial!
              </p>
            </div>
          </div>

          {/* Google OAuth Help Notice (App em desenvolvimento) */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <span className="text-base">💡</span>
              <span>Apareceu &ldquo;App em desenvolvimento / Fale com o desenvolvedor&rdquo; no Google?</span>
            </div>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              Como o projeto Google Cloud foi criado recentemente, o Google exige que outros e-mails sejam adicionados como <strong>Usuários de Teste</strong> ou que o app seja colocado em modo de <strong>Produção</strong>:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-200/90 pl-1 font-mono">
              <li>Acesse o <strong>Google Cloud Console</strong> &gt; <strong>Tela de consentimento OAuth</strong>.</li>
              <li>Na seção <strong>&ldquo;Usuários de teste&rdquo; (Test users)</strong>, clique em <strong>+ ADD USERS</strong>.</li>
              <li>Adicione o seu segundo e-mail Gmail e clique em <strong>Salvar</strong>.</li>
              <li>(Ou clique no botão <strong>&ldquo;PUBLICAR APLICATIVO&rdquo;</strong> para liberar qualquer conta).</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DRIVE SLOT 1 */}
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950/60 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                      Drive 1 (Principal)
                    </span>
                  </div>
                  {drive1 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" /> Ativo
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-neutral-500">Não conectado</span>
                  )}
                </div>

                {drive1 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/80">
                      {drive1.photoUrl ? (
                        <img
                          src={drive1.photoUrl}
                          alt={drive1.name}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-700 font-bold text-white flex items-center justify-center text-xs">
                          {drive1.name ? drive1.name.charAt(0).toUpperCase() : '1'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-200 truncate">{drive1.name || 'Conta Google'}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{drive1.email}</p>
                      </div>
                    </div>

                    {/* Specific Folder selection block */}
                    <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800/90 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-amber-400" />
                          Pasta de Mídia:
                        </span>
                        {drive1.selectedFolderName && (
                          <button
                            onClick={() => onClearFolder(drive1.id)}
                            className="text-[10px] text-neutral-400 hover:text-rose-400 transition-colors underline"
                            title="Voltar para escanear todo o Drive"
                          >
                            Todo o Drive
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-neutral-200 truncate flex items-center gap-1">
                          {drive1.selectedFolderName ? (
                            <>
                              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate text-amber-300">{drive1.selectedFolderName}</span>
                            </>
                          ) : (
                            <span className="text-neutral-400">Todo o Drive (Raiz)</span>
                          )}
                        </span>
                        <button
                          id="select-folder-drive-1-btn"
                          onClick={() => onOpenFolderSelector(drive1)}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition-colors shrink-0"
                        >
                          {drive1.selectedFolderName ? 'Trocar' : 'Escolher Pasta'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                      <span>Vídeos indexados:</span>
                      <span className="font-semibold text-neutral-200">{drive1.fileCount || 0} arquivos</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-neutral-400">Conecte sua primeira conta do Google Drive com seus filmes e séries.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center gap-2">
                {drive1 ? (
                  <>
                    <button
                      id="sync-drive-1-btn"
                      onClick={() => handleSync(drive1)}
                      disabled={syncingAccountId === drive1.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingAccountId === drive1.id ? 'animate-spin text-blue-400' : ''}`} />
                      Sincronizar
                    </button>
                    <button
                      id="disconnect-drive-1-btn"
                      onClick={() => onDisconnectDrive(drive1.id)}
                      className="p-2 rounded-lg bg-neutral-800/60 hover:bg-rose-950/50 hover:text-rose-400 text-neutral-400 text-xs transition-colors"
                      title="Desconectar Drive 1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    id="connect-drive-1-btn"
                    onClick={() => onConnectDrive(0)}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-950 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Conectar Drive 1
                  </button>
                )}
              </div>
            </div>

            {/* DRIVE SLOT 2 */}
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950/60 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                    <span className="text-xs uppercase font-bold tracking-wider text-purple-400">
                      Drive 2 (Secundário)
                    </span>
                  </div>
                  {drive2 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" /> Ativo
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-neutral-500">Não conectado</span>
                  )}
                </div>

                {drive2 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/80">
                      {drive2.photoUrl ? (
                        <img
                          src={drive2.photoUrl}
                          alt={drive2.name}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-purple-700 font-bold text-white flex items-center justify-center text-xs">
                          {drive2.name ? drive2.name.charAt(0).toUpperCase() : '2'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-200 truncate">{drive2.name || 'Conta Google 2'}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{drive2.email}</p>
                      </div>
                    </div>

                    {/* Specific Folder selection block */}
                    <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800/90 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-purple-400" />
                          Pasta de Mídia:
                        </span>
                        {drive2.selectedFolderName && (
                          <button
                            onClick={() => onClearFolder(drive2.id)}
                            className="text-[10px] text-neutral-400 hover:text-rose-400 transition-colors underline"
                            title="Voltar para escanear todo o Drive"
                          >
                            Todo o Drive
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-neutral-200 truncate flex items-center gap-1">
                          {drive2.selectedFolderName ? (
                            <>
                              <FolderOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span className="truncate text-purple-300">{drive2.selectedFolderName}</span>
                            </>
                          ) : (
                            <span className="text-neutral-400">Todo o Drive (Raiz)</span>
                          )}
                        </span>
                        <button
                          id="select-folder-drive-2-btn"
                          onClick={() => onOpenFolderSelector(drive2)}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition-colors shrink-0"
                        >
                          {drive2.selectedFolderName ? 'Trocar' : 'Escolher Pasta'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                      <span>Vídeos indexados:</span>
                      <span className="font-semibold text-neutral-200">{drive2.fileCount || 0} arquivos</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-neutral-400">Conecte sua 2ª conta Google para unir todos os vídeos em uma única biblioteca.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center gap-2">
                {drive2 ? (
                  <>
                    <button
                      id="sync-drive-2-btn"
                      onClick={() => handleSync(drive2)}
                      disabled={syncingAccountId === drive2.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingAccountId === drive2.id ? 'animate-spin text-purple-400' : ''}`} />
                      Sincronizar
                    </button>
                    <button
                      id="disconnect-drive-2-btn"
                      onClick={() => onDisconnectDrive(drive2.id)}
                      className="p-2 rounded-lg bg-neutral-800/60 hover:bg-rose-950/50 hover:text-rose-400 text-neutral-400 text-xs transition-colors"
                      title="Desconectar Drive 2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    id="connect-drive-2-btn"
                    onClick={() => onConnectDrive(1)}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Conectar 2º Google Drive
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Security & Access details */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center gap-3 text-xs text-neutral-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Acesso somente leitura (<code className="text-neutral-300 font-mono text-[11px]">drive.readonly</code>). O app nunca modifica ou deleta seus arquivos.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
          <button
            id="done-accounts-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
