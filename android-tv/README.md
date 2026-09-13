# Drive Cinema TV — Aplicativo Nativo para Android TV & TV Box

Este é o código-fonte nativo do aplicativo **Drive Cinema TV**, desenvolvido especificamente para **Android TV**, **Google TV** e **TV Box**.

---

## Principais Recursos Nativos

- **Reprodução com Aceleração por Hardware (ExoPlayer / Media3):**
  - Reproduz arquivos `.mkv`, `.mp4`, `.webm`, `.avi` sem travamentos.
  - Compatível com 4K, 1080p, H.265 (HEVC), 10-bit e áudio multicanal AC3 / EAC3 (Dolby Digital) e DTS.
- **Suporte a Legendas:**
  - Carregamento automático de legendas externas `.srt` e `.vtt` do Google Drive.
  - Menu de seleção de legendas direto na tela com o controle remoto.
- **Navegação com Controle Remoto (D-Pad):**
  - Foco suave e natural com as setas (`Cima`, `Baixo`, `Esquerda`, `Direita`, `OK` e `Voltar`).
  - Avanço e retrocesso de 10 segundos pelas setas do controle.
- **Metadados TMDb em Português (pt-BR):**
  - Pôsteres em alta definição, imagens de fundo (backdrops), notas e sinopses.
- **Suporte Multi-Contas Google Drive:**
  - Conecte múltiplas contas e unifique seu catálogo de filmes e séries em um único lugar.

---

## Como Gerar o APK no Android Studio

### Passo 1: Baixar o Projeto
No menu superior do Google AI Studio, clique em **Export / Download ZIP** (ou clone o repositório do GitHub).

### Passo 2: Abrir no Android Studio
1. Instale o [Android Studio](https://developer.android.com/studio) (gratuito).
2. Abra o Android Studio e selecione **Open**.
3. Escolha a pasta **`android-tv`**.
4. Aguarde a sincronização do Gradle (o Android Studio fará o download das bibliotecas do Compose TV e ExoPlayer automaticamente).

### Passo 3: Gerar o APK de Instalação
1. No menu superior do Android Studio, clique em:
   **`Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`**.
2. Quando a compilação terminar, uma notificação aparecerá no canto inferior direito dizendo:
   *`APK(s) generated successfully`*.
3. Clique em **`locate`** para abrir a pasta com o arquivo `app-debug.apk`.

---

## Como Instalar na sua TV Box / Android TV

### Método 1: Via Pen Drive (Mais Fácil)
1. Copie o arquivo `app-debug.apk` para um pen drive.
2. Conecte o pen drive na sua TV Box ou Android TV.
3. Abra um gerenciador de arquivos na TV (como o *FX File Explorer* ou *X-plore* da Google Play Store).
4. Localize o arquivo `.apk` no pen drive e clique para instalar.

### Método 2: Via Wi-Fi (Sem Fios)
1. Instale o app **Send Files to TV (SFTV)** na sua TV Box e no seu celular ou computador.
2. Envie o arquivo `.apk` pela rede Wi-Fi e instale diretamente na TV Box.
