---
layout: default
title: Guida all'Installazione
lang: it
page_id: installation
---

# Guida all'Installazione

NumiSync Wizard è disponibile per **Windows**, **macOS** e **Linux**. Scegli la tua piattaforma per le istruzioni di installazione.

---

## Requisiti di Sistema

### Tutte le piattaforme
- **OpenNumismat** installato ([opennumismat.github.io](https://opennumismat.github.io/))
- **Chiave API di Numista** (gratuita da [numista.com](https://www.numista.com/))
- **RAM:** 4 GB minimo, 8 GB consigliati
- **Spazio su disco:** 200 MB + spazio per la cache

### Windows
- **SO:** Windows 10 (64 bit) o Windows 11
- **Processore:** Intel Core i3 o equivalente

### macOS
- **SO:** macOS 10.13 High Sierra o successivo
- **Architettura:** Intel (x64) e Apple Silicon (M1/M2/M3 arm64)

### Linux
- **SO:** Ubuntu 20.04+, Debian 10+, Fedora 32+ o compatibile
- **Architettura:** x64
- **Server grafico:** X11 o Wayland

---

## Installazione su Windows

### Opzione 1: Microsoft Store (Prossimamente)

NumiSync Wizard è stato inviato al Microsoft Store ed è in attesa di certificazione. Una volta approvato, potrai installarlo direttamente dallo Store con aggiornamenti automatici e senza avvisi SmartScreen.

### Opzione 2: Download Diretto

#### Passaggio 1: Scarica NumiSync Wizard

1. Visita la [pagina delle versioni](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Scarica l'ultimo programma di installazione:
   - **Sistemi a 64 bit:** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **Sistemi a 32 bit:** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**Non sai quale versione scegliere?** La maggior parte dei sistemi Windows moderni è a 64 bit. Per verificarlo:
- Fai clic destro su **Questo PC** → **Proprietà**
- Cerca "Tipo sistema" (es. "Sistema operativo a 64 bit")

#### Passaggio 2: Esegui il Programma di Installazione

1. **Fai doppio clic** sul programma di installazione scaricato
2. Windows potrebbe mostrare un avviso SmartScreen (programma di installazione non firmato)
   - Clicca su **"Ulteriori informazioni"** → **"Esegui comunque"**
3. Accetta il Contratto di Licenza con l'Utente Finale (EULA)
4. Scegli la directory di installazione (predefinita: `C:\Program Files\NumiSync Wizard`)
5. Clicca su **Installa**
6. Attendi il completamento dell'installazione
7. Clicca su **Fine** per avviare NumiSync Wizard

#### Passaggio 3: Primo Avvio

Al primo avvio, NumiSync Wizard:
- Creerà una directory cache in `%LOCALAPPDATA%\numisync-wizard-cache`
- Si aprirà senza nessuna collezione caricata

---

## Installazione su macOS

**Importante:** NumiSync Wizard **non è firmato** con un certificato Apple Developer. macOS lo bloccherà per impostazione predefinita. Segui questi passaggi per installarlo:

### Passaggio 1: Scarica NumiSync Wizard

1. Visita la [pagina delle versioni](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Scarica l'ultimo DMG:
   - **DMG Universale:** `NumiSync-Wizard-1.0.0-universal.dmg` (funziona sia su Intel che su Apple Silicon)
   - **Solo Intel:** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon:** `NumiSync-Wizard-1.0.0-arm64.dmg`

**La maggior parte degli utenti dovrebbe scaricare il DMG Universale.**

### Passaggio 2: Installa l'App

1. **Apri il DMG** facendo doppio clic
2. **Trascina NumiSync Wizard** nella cartella Applicazioni
3. **Espelli il DMG** (clic destro → Espelli)

### Passaggio 3: Ignora Gatekeeper (Obbligatorio)

Poiché l'app non è firmata, macOS la bloccherà. Usa il **Metodo 1** (il più semplice):

#### Metodo 1: Apertura con clic destro (Consigliato)

1. **Vai alla cartella Applicazioni** nel Finder
2. **Fai clic destro** (o Control+clic) su NumiSync Wizard
3. Seleziona **"Apri"** dal menu
4. Clicca su **"Apri"** nella finestra di dialogo di sicurezza
5. L'app si avvierà — **i lanci futuri funzioneranno normalmente** (basta fare doppio clic)

#### Metodo 2: Preferenze di Sistema

1. Prova ad aprire l'app normalmente (verrà bloccata)
2. Vai su **Preferenze di Sistema** → **Sicurezza e Privacy** → **Generale**
3. Clicca su **"Apri comunque"** accanto al messaggio dell'app bloccata
4. Clicca su **"Apri"** nella finestra di conferma

#### Metodo 3: Terminale (Avanzato)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**Per la risoluzione dei problemi dettagliata, consulta la [Guida all'Installazione su macOS](/macos-install).**

### Passaggio 4: Primo Avvio

Al primo avvio, NumiSync Wizard:
- Creerà una directory cache in `~/Library/Application Support/numisync-wizard-cache`
- Si aprirà senza nessuna collezione caricata

---

## Installazione su Linux

NumiSync Wizard è disponibile in tre formati per Linux. Scegli in base alla tua distribuzione:

### Opzione 1: AppImage (Universale - Consigliato)

**Ideale per:** Tutte le distribuzioni

1. Scarica `NumiSync-Wizard-1.0.0.AppImage` dalla [pagina delle versioni](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Rendilo eseguibile:
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Eseguilo:
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Opzionale:** Integralo con il tuo ambiente desktop usando [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Opzione 2: Debian/Ubuntu (.deb)

**Ideale per:** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# Scarica il file .deb
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# Installa
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# Installa le dipendenze se necessario
sudo apt-get install -f
```

Avvia dal menu delle applicazioni o esegui:
```bash
numisync-wizard
```

### Opzione 3: Fedora/RHEL (.rpm)

**Ideale per:** Fedora, RHEL, CentOS, Rocky Linux

```bash
# Scarica il file .rpm
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# Installa
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# Oppure con dnf (consigliato)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Avvia dal menu delle applicazioni o esegui:
```bash
numisync-wizard
```

### Primo Avvio (Linux)

Al primo avvio, NumiSync Wizard:
- Creerà una directory cache in `~/.config/numisync-wizard-cache`
- Si aprirà senza nessuna collezione caricata

---

## Configurazione Iniziale

**Nota:** Questi passaggi sono gli stessi per tutte le piattaforme (Windows, macOS, Linux)

### 1. Aggiungi la Tua Chiave API di Numista

1. Clicca su **Settings** (icona dell'ingranaggio) o premi `Ctrl+,`
2. Vai alla scheda **API Settings**
3. Inserisci la tua chiave API di Numista
4. Clicca su **Save**

**Come ottenere una chiave API:**
1. Vai su [numista.com](https://www.numista.com/) e crea un account gratuito
2. Accedi → Profilo → Accesso API
3. Richiedi una chiave API (approvazione immediata per uso personale)
4. Copia la chiave e incollala in NumiSync Wizard

### 2. Apri la Tua Collezione

1. Clicca su **File → Open Collection** (la scorciatoia da tastiera varia per piattaforma)
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Naviga fino al tuo file `.db` di OpenNumismat
3. Seleziona il file e clicca su **Open**
4. Le tue monete verranno caricate nella finestra principale

### 3. Configura le Impostazioni dei Dati (Opzionale)

1. Vai su **Settings → Data Settings**
2. Scegli quali dati sincronizzare:
   - **Basic** - Dati del catalogo a livello di tipo (tiratura, composizione, sovrano, disegnatore)
   - **Issue** - Dati specifici dell'emissione (anno, segno di zecca, varianti di tipo)
   - **Pricing** - Prezzi di mercato attuali (gradi UNC, XF, VF, F)
3. Configura la mappatura dei campi se necessario (solo per utenti avanzati)

---

## Verifica dell'Installazione

### Testa le Funzioni di Base

1. Seleziona alcune monete nella tua collezione
2. Clicca sul pulsante **Search & Enrich**
3. NumiSync dovrebbe cercare su Numista e trovare corrispondenze
4. Esamina le corrispondenze nell'interfaccia di confronto dei campi
5. Accetta una corrispondenza per verificare che gli aggiornamenti dei dati funzionino

Se vedi corrispondenze e riesci ad aggiornare i dati delle monete, l'installazione è riuscita!

---

## Risoluzione dei Problemi

### Problemi su Windows

**Il programma di installazione non si avvia:**
- Avviso SmartScreen: clicca su "Ulteriori informazioni" → "Esegui comunque"
- Antivirus che blocca: aggiungi un'eccezione per il programma di installazione
- Download corrotto: riscarica e verifica la dimensione del file

**L'applicazione non si avvia:**
- Controlla il Visualizzatore eventi: Registri di Windows → Applicazione
- Dipendenze mancanti: installa [Visual C++ Redistributable](https://learn.microsoft.com/it-it/cpp/windows/latest-supported-vc-redist)
- Interferenza antivirus: aggiungi un'eccezione per `NumiSync Wizard.exe`

### Problemi su macOS

**"NumiSync Wizard è danneggiato e non può essere aperto":**
- Elimina il DMG e riscaricalo
- Verifica che la dimensione del file corrisponda a quella della pagina delle versioni
- Prova il Metodo 1 (clic destro → Apri)

**"Nessuna opzione Apri nella finestra di sicurezza":**
- Hai fatto doppio clic invece di clic destro
- Usa il Metodo 1 o il Metodo 2 dai passaggi di installazione precedenti

**L'app si chiude immediatamente:**
- Controlla l'app Console per i log degli errori
- Segnala il problema con la versione di macOS e il log degli errori

**Consulta la [Guida all'Installazione su macOS](/macos-install) per la risoluzione dei problemi dettagliata.**

### Problemi su Linux

**AppImage non si avvia:**
- Assicurati che sia eseguibile: `chmod +x *.AppImage`
- Installa FUSE: `sudo apt-get install fuse` (Ubuntu/Debian)
- Prova ad avviarlo dal terminale per vedere i messaggi di errore

**L'installazione del .deb non riesce:**
- Installa le dipendenze: `sudo apt-get install -f`
- Controlla i requisiti di sistema (Ubuntu 20.04+)

**L'installazione del .rpm non riesce:**
- Installa le dipendenze: `sudo dnf install <nome-pacchetto>`
- Controlla i requisiti di sistema (Fedora 32+)

**Librerie mancanti:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### Tutte le piattaforme

**Impossibile aprire la collezione:**
- Verifica che il file `.db` esista e non sia corrotto
- Assicurati di avere i permessi di lettura/scrittura
- Chiudi OpenNumismat se ha la collezione aperta
- Prova File → Recent Collections

**La chiave API non funziona:**
- Copia e incolla con attenzione (senza spazi aggiuntivi)
- Controlla i limiti di velocità (120 richieste/minuto)
- Verifica che il tuo account Numista sia attivo
- Testa la chiave sulla pagina di documentazione dell'API di Numista

**Problemi con la directory cache:**
- **Windows:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS:** `~/Library/Application Support/numisync-wizard-cache`
- **Linux:** `~/.config/numisync-wizard-cache`
- Controlla i permessi di scrittura
- Cancella la cache se è corrotta

---

## Disinstallazione

### Windows

1. Vai su **Impostazioni → App → App e funzionalità**
2. Cerca "NumiSync Wizard"
3. Clicca su **Disinstalla**
4. Segui le istruzioni del programma di disinstallazione

**Pulizia manuale (opzionale):**
- Elimina la cache: `%LOCALAPPDATA%\numisync-wizard-cache`
- Elimina le impostazioni: `%APPDATA%\numisync-wizard`

### macOS

1. Chiudi l'applicazione
2. Elimina `NumiSync Wizard.app` dalla cartella Applicazioni
3. **Pulizia opzionale:**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage:** Elimina semplicemente il file `.AppImage`

**Debian/Ubuntu (.deb):**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -e numisync-wizard
# Oppure con dnf
sudo dnf remove numisync-wizard
```

**Pulizia manuale (tutti i Linux):**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## Aggiornamento a una Nuova Versione

NumiSync Wizard verificherà la presenza di aggiornamenti all'avvio (se abilitato nelle Settings).

### Aggiornamento Automatico (Quando Disponibile)
1. Clicca sulla notifica **"Update Available"**
2. Il download partirà automaticamente
3. L'installazione procederà al completamento del download
4. L'applicazione si riavvierà con la nuova versione

### Aggiornamento Manuale
1. Scarica l'ultimo programma di installazione dalla [pagina delle versioni](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Esegui il programma di installazione
3. Rileverà e aggiornerà automaticamente l'installazione esistente
4. Le tue impostazioni e la cache verranno conservate

---

## Passi Successivi

- **[Guida Rapida](/it/quickstart)** - Inizia in 5 minuti
- **[Manuale utente](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Documentazione completa delle funzioni
- **[Ottieni una Licenza Supporter](/it/license)** - Sblocca Fast Pricing Mode e Auto-Propagate

---

## Hai bisogno di aiuto?

- **Problemi:** [Segnala su GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussioni:** [Chiedi alla comunità](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentazione:** [Documentazione completa](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/it/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← Torna alla home</a>
  <a href="/it/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Successivo: Guida Rapida →</a>
</div>
