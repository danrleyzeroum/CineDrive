import os
import time
import requests

STREAMTAPE_LOGIN = os.environ.get("STREAMTAPE_LOGIN")
STREAMTAPE_KEY = os.environ.get("STREAMTAPE_KEY")

if not STREAMTAPE_LOGIN or not STREAMTAPE_KEY:
    raise ValueError("Credenciais STREAMTAPE_LOGIN e STREAMTAPE_KEY não configuradas nos Secrets!")

HEADERS_BROWSER = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
}

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
    1. Consulta /file/info para atualizar a persistência nos servidores do Streamtape.
    2. Realiza uma requisição HTTP autêntica no endpoint /e/ (embed) simulando leitor para registar tráfego.
    """
    url_info = f"https://api.streamtape.com/file/info?file={file_id}&login={STREAMTAPE_LOGIN}&key={STREAMTAPE_KEY}"
    
    try:
        res_info = requests.get(url_info, timeout=15).json()
        
        status_info = res_info.get("status")
        if status_info != 200:
            print(f"   ⚠️ Ficheiro indisponível na API: {nome[:35]}")
            return False
            
        url_embed = f"https://streamtape.com/e/{file_id}"
        res_embed = requests.get(url_embed, headers=HEADERS_BROWSER, timeout=15)
        
        if res_embed.status_code == 200:
            print(f"   ✅ Atividade renovada com sucesso: {nome[:40]}")
            return True
        else:
            print(f"   ⚠️ Embed retornou status {res_embed.status_code}: {nome[:35]}")
            return False

    except Exception as e:
        print(f"   ❌ Erro ao renovar {nome[:35]}: {e}")
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
            
        time.sleep(0.4)
        
    print("\n" + "="*60)
    print(f"📊 Relatório de Renovação: {sucessos}/{total} renovados com sucesso | {falhas} falhas")
    print("="*60)

if __name__ == "__main__":
    main()
