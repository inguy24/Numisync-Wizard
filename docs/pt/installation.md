---
layout: default
title: Guia de Instalação
lang: pt
page_id: installation
---

# Guia de Instalação

NumiSync Wizard está disponível para **Windows**, **macOS** e **Linux**. Escolha sua plataforma abaixo para as instruções de instalação.

---

## Requisitos do Sistema

### Todas as Plataformas
- **OpenNumismat** instalado ([opennumismat.github.io](https://opennumismat.github.io/))
- **Chave de API do Numista** (gratuita em [numista.com](https://www.numista.com/))
- **RAM:** mínimo 4 GB, recomendado 8 GB
- **Armazenamento:** 200 MB + espaço para cache

### Windows
- **SO:** Windows 10 (64 bits) ou Windows 11
- **Processador:** Intel Core i3 ou equivalente

### macOS
- **SO:** macOS 10.13 High Sierra ou posterior
- **Arquitetura:** Intel (x64) e Apple Silicon (M1/M2/M3 arm64)

### Linux
- **SO:** Ubuntu 20.04+, Debian 10+, Fedora 32+ ou compatível
- **Arquitetura:** x64
- **Servidor de Exibição:** X11 ou Wayland

---

## Instalação no Windows

### Opção 1: Microsoft Store (Em Breve)

O NumiSync Wizard foi submetido à Microsoft Store e aguarda certificação. Após a aprovação, você poderá instalá-lo diretamente pela Store com atualizações automáticas e sem avisos do SmartScreen.

### Opção 2: Download Direto

#### Passo 1: Baixar o NumiSync Wizard

1. Acesse a [página de Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Baixe o instalador mais recente:
   - **Sistemas 64 bits:** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **Sistemas 32 bits:** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**Não sabe qual versão baixar?** A maioria dos sistemas Windows modernos é de 64 bits. Para verificar:
- Clique com o botão direito em **Este Computador** → **Propriedades**
- Procure por "Tipo de sistema" (por exemplo, "Sistema operacional de 64 bits")

#### Passo 2: Executar o Instalador

1. **Clique duas vezes** no instalador baixado
2. O Windows pode exibir um aviso do SmartScreen (instalador não assinado)
   - Clique em **"Mais informações"** → **"Executar assim mesmo"**
3. Aceite o Contrato de Licença do Usuário Final (EULA)
4. Escolha o diretório de instalação (padrão: `C:\Program Files\NumiSync Wizard`)
5. Clique em **Instalar**
6. Aguarde a conclusão da instalação
7. Clique em **Concluir** para iniciar o NumiSync Wizard

#### Passo 3: Primeira Inicialização

Na primeira inicialização, o NumiSync Wizard irá:
- Criar um diretório de cache em `%LOCALAPPDATA%\numisync-wizard-cache`
- Abrir sem nenhuma coleção carregada

---

## Instalação no macOS

**Importante:** O NumiSync Wizard **não possui assinatura** de certificado Apple Developer. O macOS o bloqueará por padrão. Siga estas etapas para instalar:

### Passo 1: Baixar o NumiSync Wizard

1. Acesse a [página de Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Baixe o DMG mais recente:
   - **DMG Universal:** `NumiSync-Wizard-1.0.0-universal.dmg` (funciona em Intel e Apple Silicon)
   - **Somente Intel:** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon:** `NumiSync-Wizard-1.0.0-arm64.dmg`

**A maioria dos usuários deve baixar o DMG Universal.**

### Passo 2: Instalar o App

1. **Abra o DMG** clicando duas vezes nele
2. **Arraste o NumiSync Wizard** para a pasta Aplicativos
3. **Ejete o DMG** (clique com o botão direito → Ejetar)

### Passo 3: Contornar o Gatekeeper (Obrigatório)

Como o app não é assinado, o macOS o bloqueará. Use o **Método 1** (mais fácil):

#### Método 1: Abrir com Clique Direito (Recomendado)

1. **Vá para a pasta Aplicativos** no Finder
2. **Clique com o botão direito** (ou Control+clique) no NumiSync Wizard
3. Selecione **"Abrir"** no menu
4. Clique em **"Abrir"** na caixa de diálogo de segurança
5. O app será iniciado — **todas as inicializações futuras funcionam normalmente** (apenas clique duas vezes)

#### Método 2: Substituição pelas Preferências do Sistema

1. Tente abrir o app normalmente (ele será bloqueado)
2. Vá para **Preferências do Sistema** → **Segurança e Privacidade** → **Geral**
3. Clique em **"Abrir Assim Mesmo"** ao lado da mensagem do app bloqueado
4. Clique em **"Abrir"** na caixa de diálogo de confirmação

#### Método 3: Substituição pelo Terminal (Avançado)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**Para solução detalhada de problemas, consulte o [Guia de Instalação no macOS](/macos-install).**

### Passo 4: Primeira Inicialização

Na primeira inicialização, o NumiSync Wizard irá:
- Criar um diretório de cache em `~/Library/Application Support/numisync-wizard-cache`
- Abrir sem nenhuma coleção carregada

---

## Instalação no Linux

O NumiSync Wizard está disponível em três formatos para Linux. Escolha de acordo com sua distribuição:

### Opção 1: AppImage (Universal - Recomendado)

**Melhor para:** Todas as distribuições

1. Baixe `NumiSync-Wizard-1.0.0.AppImage` na página de [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Torne-o executável:
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Execute-o:
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Opcional:** Integre com seu ambiente de área de trabalho usando o [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Opção 2: Debian/Ubuntu (.deb)

**Melhor para:** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# Baixe o arquivo .deb
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# Instale
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# Instale dependências, se necessário
sudo apt-get install -f
```

Inicie pelo menu de aplicativos ou execute:
```bash
numisync-wizard
```

### Opção 3: Fedora/RHEL (.rpm)

**Melhor para:** Fedora, RHEL, CentOS, Rocky Linux

```bash
# Baixe o arquivo .rpm
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# Instale
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# Ou com dnf (recomendado)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Inicie pelo menu de aplicativos ou execute:
```bash
numisync-wizard
```

### Primeira Inicialização (Linux)

Na primeira inicialização, o NumiSync Wizard irá:
- Criar um diretório de cache em `~/.config/numisync-wizard-cache`
- Abrir sem nenhuma coleção carregada

---

## Configuração Inicial

**Observação:** Estas etapas são iguais para todas as plataformas (Windows, macOS, Linux)

### 1. Adicionar sua Chave de API do Numista

1. Clique em **Settings** (ícone de engrenagem) ou pressione `Ctrl+,`
2. Navegue até a aba **API Settings**
3. Insira sua chave de API do Numista
4. Clique em **Save**

**Como obter uma chave de API:**
1. Acesse [numista.com](https://www.numista.com/) e crie uma conta gratuita
2. Faça login → Perfil → Acesso à API
3. Solicite uma chave de API (aprovação instantânea para uso pessoal)
4. Copie a chave e cole no NumiSync Wizard

### 2. Abrir sua Coleção

1. Clique em **File → Open Collection** (o atalho de teclado varia por plataforma)
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Navegue até seu arquivo `.db` do OpenNumismat
3. Selecione o arquivo e clique em **Open**
4. Suas moedas serão carregadas na janela principal

### 3. Configurar as Opções de Dados (Opcional)

1. Vá para **Settings → Data Settings**
2. Escolha quais dados sincronizar:
   - **Basic** - Dados de catálogo em nível de tipo (tiragem, composição, governante, gravador)
   - **Issue** - Dados específicos de emissão (ano, marca de cunhagem, variantes de tipo)
   - **Pricing** - Preços de mercado atuais (notas UNC, XF, VF, F)
3. Configure o mapeamento de campos se necessário (somente usuários avançados)

---

## Verificar a Instalação

### Testar a Funcionalidade Básica

1. Selecione algumas moedas na sua coleção
2. Clique no botão **Search & Enrich**
3. O NumiSync deve pesquisar no Numista e encontrar correspondências
4. Revise as correspondências na interface de comparação de campos
5. Aceite uma correspondência para verificar se as atualizações de dados funcionam

Se você vê correspondências e consegue atualizar os dados das moedas, a instalação foi bem-sucedida!

---

## Solução de Problemas

### Problemas no Windows

**O instalador não abre:**
- Aviso do SmartScreen: Clique em "Mais informações" → "Executar assim mesmo"
- Antivírus bloqueando: Adicione uma exceção para o instalador
- Download corrompido: Baixe novamente e verifique o tamanho do arquivo

**O aplicativo não abre:**
- Verifique o Visualizador de Eventos: Logs do Windows → Aplicativo
- Dependências ausentes: Instale o [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- Interferência de antivírus: Adicione exceção para `NumiSync Wizard.exe`

### Problemas no macOS

**"NumiSync Wizard está danificado e não pode ser aberto":**
- Exclua o DMG e faça o download novamente
- Verifique se o tamanho do arquivo corresponde à página de releases
- Tente o Método 1 (Clique direito → Abrir)

**"Não há opção para Abrir na caixa de diálogo de segurança":**
- Você clicou duas vezes em vez de clicar com o botão direito
- Use o Método 1 ou o Método 2 das etapas de instalação acima

**O app trava imediatamente:**
- Verifique o app Console para ver os logs de falha
- Relate o problema com a versão do macOS e o log de falha

**Consulte o [Guia de Instalação no macOS](/macos-install) para solução detalhada de problemas.**

### Problemas no Linux

**O AppImage não executa:**
- Certifique-se de que é executável: `chmod +x *.AppImage`
- Instale o FUSE: `sudo apt-get install fuse` (Ubuntu/Debian)
- Tente executar pelo terminal para ver as mensagens de erro

**A instalação do .deb falha:**
- Instale as dependências: `sudo apt-get install -f`
- Verifique os requisitos do sistema (Ubuntu 20.04+)

**A instalação do .rpm falha:**
- Instale as dependências: `sudo dnf install <nome-do-pacote>`
- Verifique os requisitos do sistema (Fedora 32+)

**Bibliotecas ausentes:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### Todas as Plataformas

**Não consigo abrir a coleção:**
- Verifique se o arquivo `.db` existe e não está corrompido
- Certifique-se de ter permissões de leitura/escrita
- Feche o OpenNumismat se ele tiver a coleção aberta
- Tente File → Recent Collections

**A chave de API não funciona:**
- Copie e cole com cuidado (sem espaços extras)
- Verifique os limites de taxa (120 requisições/minuto)
- Verifique se a conta Numista está ativa
- Teste a chave na página de documentação da API do Numista

**Problemas com o diretório de cache:**
- **Windows:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS:** `~/Library/Application Support/numisync-wizard-cache`
- **Linux:** `~/.config/numisync-wizard-cache`
- Verifique as permissões de escrita
- Limpe o cache se estiver corrompido

---

## Desinstalação

### Windows

1. Vá para **Configurações → Aplicativos → Aplicativos e recursos**
2. Pesquise "NumiSync Wizard"
3. Clique em **Desinstalar**
4. Siga as instruções do desinstalador

**Limpeza manual (opcional):**
- Excluir cache: `%LOCALAPPDATA%\numisync-wizard-cache`
- Excluir configurações: `%APPDATA%\numisync-wizard`

### macOS

1. Saia do aplicativo
2. Exclua `NumiSync Wizard.app` da pasta Aplicativos
3. **Limpeza opcional:**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage:** Simplesmente exclua o arquivo `.AppImage`

**Debian/Ubuntu (.deb):**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -e numisync-wizard
# Ou com dnf
sudo dnf remove numisync-wizard
```

**Limpeza manual (todo Linux):**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## Atualização para uma Nova Versão

O NumiSync Wizard verificará atualizações na inicialização (se habilitado nas Settings).

### Atualização Automática (Quando Disponível)
1. Clique na notificação **"Update Available"**
2. O download iniciará automaticamente
3. A instalação prosseguirá quando o download for concluído
4. O aplicativo reiniciará com a nova versão

### Atualização Manual
1. Baixe o instalador mais recente na página de [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Execute o instalador
3. Ele detectará e atualizará automaticamente a instalação existente
4. Suas configurações e cache são preservados

---

## Próximos Passos

- **[Guia de Início Rápido](/pt/quickstart)** - Comece em 5 minutos
- **[Manual do Usuário](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Documentação completa de funcionalidades
- **[Adquira uma Licença de Apoiador](/pt/license)** - Desbloqueie Fast Pricing Mode e Auto-Propagate

---

## Precisa de Ajuda?

- **Problemas:** [Reporte no GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussões:** [Pergunte à comunidade](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentação:** [Documentação completa](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/pt/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← Voltar ao Início</a>
  <a href="/pt/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Próximo: Início Rápido →</a>
</div>
