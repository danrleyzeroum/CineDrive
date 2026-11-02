import os
import time
import requests

STREAMTAPE_LOGIN = os.environ.get("STREAMTAPE_LOGIN")
STREAMTAPE_KEY = os.environ.get("STREAMTAPE_KEY")

if not STREAMTAPE_LOGIN or not STREAMTAPE_KEY:
    raise ValueError("Credenciais STREAMTAPE_LOGIN e STREAMTAPE_KEY não configuradas nos Secrets!")

def listar_todos_os_arquivos():
    """Busca recursivamente todos os IDs de arquivos existentes na conta."""
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
                        "name": f.get("name")
                    })
                for pasta in resultado.get("folders", []):
                    buscar_pasta(pasta.get("id"))
            else:
                print(f"⚠️ Erro ao listar pasta {folder_id}: {r}")
        except Exception as e:
            print(f"❌ Exceção ao buscar arquivos: {e}")

    print("🔍 Varrendo sua biblioteca completa no Streamtape...")
    buscar_pasta()
    return arquivos

def renovar_arquivo(file_id, nome):
    """
    Simula uma reprodução/download real consumindo alguns megabytes do arquivo via API.
    Isso força os servidores do Streamtape a registrarem atividade de tráfego.
    """
    url_ticket = f"https://api.streamtape.com/file/dlticket?file={file_id}&login={STREAMTAPE_LOGIN}&key={STREAMTAPE_KEY}"
    
    try:
        # 1. Solicita o ticket oficial de download
        res_ticket = requests.get(url_ticket, timeout=15).json()
        if res_ticket.get("status") != 200:
            print(f"   ⚠️ Não foi possível gerar ticket para {nome[:30]} ({res_ticket.get('msg')})")
            return False
            
        ticket = res_ticket["result"]["ticket"]
        tempo_espera = res_ticket["result"].get("wait_time", 5)
        
        # O Streamtape exige aguardar o wait_time do ticket antes de pegar o link
        time.sleep(tempo_espera + 1)
        
        # 2. Resgata o link direto do arquivo (.mp4)
        url_dl = f"https://api.streamtape.com/file/dl?file={file_id}&ticket={ticket}"
        res_dl = requests.get(url_dl, timeout=15).json()
        
        if res_dl.get("status") != 200:
            print(f"   ⚠️ Falha ao obter URL de stream para {nome[:30]}")
            return False
            
        link_midia = res_dl["result"]["url"]
        
        # 3. Baixa 5 MB do arquivo de vídeo para registrar tráfego de leitura
        headers = {"Range": "bytes=0-5242880"}  # 5 MB
        with requests.get(link_midia, headers=headers, stream=True, timeout=25) as stream:
            bytes_consumidos = 0
            for chunk in stream.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    bytes_consumidos += len(chunk)
            
        mb = round(bytes_consumidos / (1024 * 1024), 2)
        print(f"   ✅ Atividade confirmada: {nome[:35]} | {mb} MB trafegados.")
        return True

    except Exception as e:
        print(f"   ❌ Erro ao renovar {nome[:30]}: {e}")
        return False

def main():
    todos = listar_todos_os_arquivos()
    print(f"\nTotal de mídias identificadas para renovação: {len(todos)}\n" + "-"*60)
    
    sucessos = 0
    falhas = 0
    
    for item in todos:
        f_id = item["id"]
        f_name = item["name"]
        
        ok = renovar_arquivo(f_id, f_name)
        if ok:
            sucessos += 1
        else:
            falhas += 1
            
        # Pausa suave para respeitar os limites de requisições por minuto da API
        time.sleep(3)
        
    print("\n" + "="*60)
    print(f"📊 Relatório de Renovação: {sucessos} renovados com sucesso | {falhas} falhas")
    print("="*60)

if __name__ == "__main__":
    main()
