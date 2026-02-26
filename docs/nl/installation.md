---
layout: default
title: Installatiegids
lang: nl
page_id: installation
---

# Installatiegids

NumiSync Wizard is beschikbaar voor **Windows**, **macOS** en **Linux**. Kies hieronder uw platform voor de installatie-instructies.

---

## Systeemvereisten

### Alle Platforms
- **OpenNumismat** geïnstalleerd ([opennumismat.github.io](https://opennumismat.github.io/))
- **Numista API-sleutel** (gratis via [numista.com](https://www.numista.com/))
- **RAM:** minimaal 4 GB, aanbevolen 8 GB
- **Opslag:** 200 MB + cacheruimte

### Windows
- **OS:** Windows 10 (64-bits) of Windows 11
- **Processor:** Intel Core i3 of gelijkwaardig

### macOS
- **OS:** macOS 10.13 High Sierra of later
- **Architectuur:** Intel (x64) en Apple Silicon (M1/M2/M3 arm64)

### Linux
- **OS:** Ubuntu 20.04+, Debian 10+, Fedora 32+ of compatibel
- **Architectuur:** x64
- **Displayserver:** X11 of Wayland

---

## Windows-installatie

### Optie 1: Microsoft Store (Binnenkort beschikbaar)

NumiSync Wizard is ingediend bij de Microsoft Store en wacht op certificering. Na goedkeuring kunt u het rechtstreeks via de Store installeren met automatische updates en zonder SmartScreen-waarschuwingen.

### Optie 2: Direct downloaden

#### Stap 1: NumiSync Wizard downloaden

1. Ga naar de [releasepagina](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Download het nieuwste installatieprogramma:
   - **64-bits systemen:** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **32-bits systemen:** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**Weet u niet welke versie u nodig heeft?** De meeste moderne Windows-systemen zijn 64-bits. Controleren:
- Klik met de rechtermuisknop op **Deze pc** → **Eigenschappen**
- Zoek naar "Systeemtype" (bijv. "64-bits besturingssysteem")

#### Stap 2: Het installatieprogramma uitvoeren

1. **Dubbelklik** op het gedownloade installatieprogramma
2. Windows kan een SmartScreen-waarschuwing tonen (niet-ondertekend installatieprogramma)
   - Klik op **"Meer info"** → **"Toch uitvoeren"**
3. Accepteer de Eindgebruikerlicentieovereenkomst (EULA)
4. Kies de installatiedirectory (standaard: `C:\Program Files\NumiSync Wizard`)
5. Klik op **Installeren**
6. Wacht tot de installatie is voltooid
7. Klik op **Voltooien** om NumiSync Wizard te starten

#### Stap 3: Eerste start

Bij de eerste start zal NumiSync Wizard:
- Een cachedirectory aanmaken in `%LOCALAPPDATA%\numisync-wizard-cache`
- Opstarten zonder een geopende collectie

---

## macOS-installatie

**Belangrijk:** NumiSync Wizard is **niet ondertekend** met een Apple Developer-certificaat. macOS blokkeert de app standaard. Volg deze stappen om te installeren:

### Stap 1: NumiSync Wizard downloaden

1. Ga naar de [releasepagina](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Download de nieuwste DMG:
   - **Universele DMG:** `NumiSync-Wizard-1.0.0-universal.dmg` (werkt op zowel Intel als Apple Silicon)
   - **Alleen Intel:** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon:** `NumiSync-Wizard-1.0.0-arm64.dmg`

**De meeste gebruikers dienen de universele DMG te downloaden.**

### Stap 2: De app installeren

1. **Open de DMG** door erop te dubbelklikken
2. **Sleep NumiSync Wizard** naar uw map Programma's
3. **Gooi de DMG uit** (rechtermuisknop → Uitwerpen)

### Stap 3: Gatekeeper omzeilen (Vereist)

Omdat de app niet ondertekend is, blokkeert macOS hem. Gebruik **Methode 1** (eenvoudigst):

#### Methode 1: Openen via rechtermuisknop (Aanbevolen)

1. **Ga naar de map Programma's** in Finder
2. **Klik met de rechtermuisknop** (of Control+klik) op NumiSync Wizard
3. Selecteer **"Openen"** in het menu
4. Klik op **"Openen"** in het beveiligingsdialoogvenster
5. De app wordt gestart — **alle toekomstige starts werken normaal** (gewoon dubbelklikken)

#### Methode 2: Systeemvoorkeurenoverschrijving

1. Probeer de app normaal te openen (deze wordt geblokkeerd)
2. Ga naar **Systeemvoorkeuren** → **Beveiliging en privacy** → **Algemeen**
3. Klik op **"Toch openen"** naast het bericht over de geblokkeerde app
4. Klik op **"Openen"** in het bevestigingsdialoogvenster

#### Methode 3: Terminal-overschrijving (Gevorderd)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**Zie de [macOS-installatiegids](/macos-install) voor gedetailleerde probleemoplossing.**

### Stap 4: Eerste start

Bij de eerste start zal NumiSync Wizard:
- Een cachedirectory aanmaken in `~/Library/Application Support/numisync-wizard-cache`
- Opstarten zonder een geopende collectie

---

## Linux-installatie

NumiSync Wizard is beschikbaar in drie formaten voor Linux. Kies op basis van uw distributie:

### Optie 1: AppImage (Universeel - Aanbevolen)

**Beste keuze voor:** Alle distributies

1. Download `NumiSync-Wizard-1.0.0.AppImage` van de [releasepagina](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Maak het uitvoerbaar:
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Voer het uit:
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Optioneel:** Integreer met uw bureaubladomgeving via [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Optie 2: Debian/Ubuntu (.deb)

**Beste keuze voor:** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# Download het .deb-bestand
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# Installeren
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# Installeer afhankelijkheden indien nodig
sudo apt-get install -f
```

Start vanuit het programmamenu of voer uit:
```bash
numisync-wizard
```

### Optie 3: Fedora/RHEL (.rpm)

**Beste keuze voor:** Fedora, RHEL, CentOS, Rocky Linux

```bash
# Download het .rpm-bestand
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# Installeren
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# Of met dnf (aanbevolen)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Start vanuit het programmamenu of voer uit:
```bash
numisync-wizard
```

### Eerste start (Linux)

Bij de eerste start zal NumiSync Wizard:
- Een cachedirectory aanmaken in `~/.config/numisync-wizard-cache`
- Opstarten zonder een geopende collectie

---

## Eerste Configuratie

**Opmerking:** Deze stappen zijn hetzelfde voor alle platforms (Windows, macOS, Linux)

### 1. Uw Numista API-sleutel toevoegen

1. Klik op **Settings** (tandwielpictogram) of druk op `Ctrl+,`
2. Navigeer naar het tabblad **API Settings**
3. Voer uw Numista API-sleutel in
4. Klik op **Save**

**Hoe een API-sleutel te verkrijgen:**
1. Ga naar [numista.com](https://www.numista.com/) en maak een gratis account aan
2. Log in → Profiel → API-toegang
3. Vraag een API-sleutel aan (directe goedkeuring voor persoonlijk gebruik)
4. Kopieer de sleutel en plak deze in NumiSync Wizard

### 2. Uw Collectie Openen

1. Klik op **File → Open Collection** (sneltoets verschilt per platform)
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Navigeer naar uw OpenNumismat `.db`-bestand
3. Selecteer het bestand en klik op **Open**
4. Uw munten worden geladen in het hoofdvenster

### 3. Gegevensinstellingen Configureren (Optioneel)

1. Ga naar **Settings → Data Settings**
2. Kies welke gegevens u wilt synchroniseren:
   - **Basic** - Typegegevens uit de catalogus (oplage, samenstelling, heerser, graveur)
   - **Issue** - Uitgifte-specifieke gegevens (jaar, muntteken, typevarianten)
   - **Pricing** - Actuele marktprijzen (UNC, XF, VF, F kwaliteiten)
3. Configureer veldmapping indien nodig (alleen voor gevorderde gebruikers)

---

## Installatie Controleren

### Basisfunctionaliteit Testen

1. Selecteer enkele munten in uw collectie
2. Klik op de knop **Search & Enrich**
3. NumiSync zoekt bij Numista en vindt overeenkomsten
4. Bekijk de overeenkomsten in de veldvergelijkingsinterface
5. Accepteer een overeenkomst om te verifiëren dat gegevensupdates werken

Als u overeenkomsten ziet en muntgegevens kunt bijwerken, is de installatie geslaagd!

---

## Probleemoplossing

### Windows-problemen

**Het installatieprogramma start niet:**
- SmartScreen-waarschuwing: Klik op "Meer info" → "Toch uitvoeren"
- Antivirus blokkeert: Voeg een uitzondering toe voor het installatieprogramma
- Beschadigde download: Download opnieuw en controleer de bestandsgrootte

**De applicatie start niet:**
- Controleer Logboeken: Windows-logboeken → Toepassing
- Ontbrekende afhankelijkheden: Installeer [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- Antivirusinterferentie: Voeg uitzondering toe voor `NumiSync Wizard.exe`

### macOS-problemen

**"NumiSync Wizard is beschadigd en kan niet worden geopend":**
- Verwijder de DMG en download opnieuw
- Controleer of de bestandsgrootte overeenkomt met de releasepagina
- Probeer Methode 1 (rechtermuisknop → Openen)

**"Geen optie om te openen in het beveiligingsdialoogvenster":**
- U heeft dubbelgeklikt in plaats van rechts geklikt
- Gebruik Methode 1 of Methode 2 uit de installatiestappen hierboven

**App crasht onmiddellijk:**
- Controleer de Console-app op crashlogs
- Meld het probleem met macOS-versie en crashlog

**Zie de [macOS-installatiegids](/macos-install) voor gedetailleerde probleemoplossing.**

### Linux-problemen

**AppImage start niet:**
- Zorg dat het uitvoerbaar is: `chmod +x *.AppImage`
- Installeer FUSE: `sudo apt-get install fuse` (Ubuntu/Debian)
- Probeer vanuit terminal te starten om foutmeldingen te zien

**Installatie van .deb mislukt:**
- Installeer afhankelijkheden: `sudo apt-get install -f`
- Controleer systeemvereisten (Ubuntu 20.04+)

**Installatie van .rpm mislukt:**
- Installeer afhankelijkheden: `sudo dnf install <pakketnaam>`
- Controleer systeemvereisten (Fedora 32+)

**Ontbrekende bibliotheken:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### Alle Platforms

**Collectie kan niet worden geopend:**
- Controleer of het `.db`-bestand bestaat en niet beschadigd is
- Zorg dat u lees-/schrijfmachtigingen heeft
- Sluit OpenNumismat als het de collectie open heeft
- Probeer File → Recent Collections

**API-sleutel werkt niet:**
- Zorgvuldig kopiëren en plakken (geen extra spaties)
- Controleer tarieflimieten (120 verzoeken/minuut)
- Controleer of het Numista-account actief is
- Test de sleutel op de Numista API-documentatiepagina

**Problemen met cachedirectory:**
- **Windows:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS:** `~/Library/Application Support/numisync-wizard-cache`
- **Linux:** `~/.config/numisync-wizard-cache`
- Controleer schrijfmachtigingen
- Wis de cache als deze beschadigd is

---

## Verwijderen

### Windows

1. Ga naar **Instellingen → Apps → Apps en functies**
2. Zoek naar "NumiSync Wizard"
3. Klik op **Verwijderen**
4. Volg de instructies van het verwijderprogramma

**Handmatige opschoning (optioneel):**
- Cache verwijderen: `%LOCALAPPDATA%\numisync-wizard-cache`
- Instellingen verwijderen: `%APPDATA%\numisync-wizard`

### macOS

1. Sluit de applicatie
2. Verwijder `NumiSync Wizard.app` uit de map Programma's
3. **Optionele opschoning:**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage:** Verwijder eenvoudig het `.AppImage`-bestand

**Debian/Ubuntu (.deb):**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -e numisync-wizard
# Of met dnf
sudo dnf remove numisync-wizard
```

**Handmatige opschoning (alle Linux):**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## Upgraden naar een Nieuwe Versie

NumiSync Wizard controleert bij het opstarten op updates (indien ingeschakeld in Settings).

### Automatische Update (Indien Beschikbaar)
1. Klik op de melding **"Update Available"**
2. De download start automatisch
3. De installatie begint zodra de download klaar is
4. De applicatie herstart met de nieuwe versie

### Handmatige Update
1. Download het nieuwste installatieprogramma van de [releasepagina](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Voer het installatieprogramma uit
3. Het detecteert en upgradet de bestaande installatie automatisch
4. Uw instellingen en cache blijven behouden

---

## Volgende Stappen

- **[Snelstartgids](/nl/quickstart)** - Aan de slag in 5 minuten
- **[Gebruikershandleiding](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Uitgebreide functiedocumentatie
- **[Koop een Supporter-licentie](/nl/license)** - Ontgrendel Fast Pricing Mode en Auto-Propagate

---

## Hulp Nodig?

- **Problemen:** [Meld op GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussies:** [Vraag de gemeenschap](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentatie:** [Volledige documentatie](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/nl/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← Terug naar home</a>
  <a href="/nl/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Volgende: Snelstart →</a>
</div>
