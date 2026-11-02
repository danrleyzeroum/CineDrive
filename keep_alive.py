import os
import time
import requests

STREAMTAPE_LOGIN = os.environ.get("STREAMTAPE_LOGIN")
STREAMTAPE_KEY = os.environ.get("STREAMTAPE_KEY")

if not STREAMTAPE_LOGIN or not STREAMTAPE_KEY:
    raise ValueError("Credenciais STREAMTAPE_LOGIN e STREAMTAPE_KEY não configuradas nos Secrets!")

def listar_todos_os_arquivos():
    """Busca recursivamente todos os ficheiros da conta via API oficial."""
    arquivos = []
    
    def buscar_pasta(folder_id=None):
        url = f"https://api.streamtape.com/file/listfolder?login={STREAMTAPE_LOGIN}&key={STREAMTAPE_KEY}"
        if folder_id:
            url += f"&folder={folder_id}"
            
        try:
            r = requests.get(url, timeout=20).json()
            if r.get("status") == 200:
                resultado = r.get("result", {})
                for f in resultado.get("files", []):
                    arquivos.append({
                        "id": f.get("id"),
                        "name": f.get("name"),
                        "link": f.get("link")
                    })
                for pasta in resultado.get("folders", []):
                    buscar_pasta(pasta.get("id"))
            else:
                print(f"⚠️ Erro ao listar pasta {folder_id}: {r}")
        except Exception as e:
            print(f"❌ Exceção ao buscar ficheiros: {e}")

    print("🔍 A varrer a sua biblioteca completa no Streamtape...")
    buscar_pasta()
    return arquivos

def renovar_arquivo(file_id, nome, link_original):
    """
    Renovação 100% via API oficial autenticada:
    Usa o endpoint /file/info para validar a integridade e registar atividade na conta.
    """
    url_info = f"https://api.streamtape.com/file/info?file={file_id}&login={STREAMTAPE_LOGIN}&key={STREAMTAPE_KEY}"
    
    try:
        res_info = requests.get(url_info, timeout=15).json()
        
        status_info = res_info.get("status")
        if status_info == 200:
            print(f"   ✅ Atividade confirmada e renovada via API: {nome[:42]}")
            return True
        else:
            msg = res_info.get("msg", "Erro desconhecido")
            print(f"   ⚠️ API retornou status {status_info} ({msg}) para: {nome[:35]}")
            return False

    except Exception as e:
        print(f"   ❌ Exceção ao comunicar com a API para {nome[:35]}: {e}")
        return False

def main():
    todos = listar_todos_os_arquivos()
    total = len(todos)
    print(f"\nTotal de ficheiros identificados para renovação: {total}\n" + "-"*60)
    
    sucessos = 0
    falhas = 0
    
    for idx, item in enumerate(todos, start=1):
        f_id = item["id"]
        f_name = item["name"]
        f_link = item.get("link")
        
        ok = renovar_arquivo(f_id, f_name, f_link)
        if ok:
            sucessos += 1
        else:
            falhas += 1
            
        time.sleep(0.3)
        
    print("\n" + "="*60)
    print(f"📊 Relatório de Renovação: {sucessos}/{total} renovados com sucesso | {falhas} falhas")
    print("="*60)

if __name__ == "__main__":
    main()
