---
layout: default
title: Installationshandbuch
lang: de
page_id: installation
---

# Installationshandbuch

NumiSync Wizard ist für **Windows**, **macOS** und **Linux** verfügbar. Wählen Sie unten Ihre Plattform für die Installationsanweisungen.

---

## Systemanforderungen

### Alle Plattformen
- **OpenNumismat** installiert ([opennumismat.github.io](https://opennumismat.github.io/))
- **Numista-API-Schlüssel** (kostenlos von [numista.com](https://www.numista.com/))
- **RAM:** Mindestens 4 GB, 8 GB empfohlen
- **Speicher:** 200 MB + Cache-Speicher

### Windows
- **Betriebssystem:** Windows 10 (64-Bit) oder Windows 11
- **Prozessor:** Intel Core i3 oder gleichwertig

### macOS
- **Betriebssystem:** macOS 10.13 High Sierra oder höher
- **Architektur:** Intel (x64) und Apple Silicon (M1/M2/M3 arm64)

### Linux
- **Betriebssystem:** Ubuntu 20.04+, Debian 10+, Fedora 32+ oder kompatibel
- **Architektur:** x64
- **Display-Server:** X11 oder Wayland

---

## Windows-Installation

### Option 1: Microsoft Store (Demnächst verfügbar)

NumiSync Wizard wurde beim Microsoft Store eingereicht und wartet auf die Zertifizierung. Nach der Genehmigung können Sie es direkt aus dem Store installieren, mit automatischen Updates und ohne SmartScreen-Warnungen.

### Option 2: Direktdownload

#### Schritt 1: NumiSync Wizard herunterladen

1. Besuchen Sie die [Releases-Seite](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Laden Sie das neueste Installationsprogramm herunter:
   - **64-Bit-Systeme:** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **32-Bit-Systeme:** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**Nicht sicher, welche Version?** Die meisten modernen Windows-Systeme sind 64-Bit. So überprüfen Sie es:
- Rechtsklick auf **Dieser PC** → **Eigenschaften**
- Suchen Sie nach "Systemtyp" (z. B. "64-Bit-Betriebssystem")

#### Schritt 2: Installationsprogramm ausführen

1. **Doppelklicken** Sie auf das heruntergeladene Installationsprogramm
2. Windows zeigt möglicherweise eine SmartScreen-Warnung an (unsigniertes Installationsprogramm)
   - Klicken Sie auf **"Weitere Informationen"** → **"Trotzdem ausführen"**
3. Akzeptieren Sie den Endbenutzer-Lizenzvertrag (EULA)
4. Wählen Sie das Installationsverzeichnis (Standard: `C:\Programme\NumiSync Wizard`)
5. Klicken Sie auf **Installieren**
6. Warten Sie auf den Abschluss der Installation
7. Klicken Sie auf **Fertigstellen**, um NumiSync Wizard zu starten

#### Schritt 3: Erster Start

Beim ersten Start wird NumiSync Wizard:
- Ein Cache-Verzeichnis in `%LOCALAPPDATA%\numisync-wizard-cache` erstellen
- Ohne geöffnete Sammlung laden

---

## macOS-Installation

**Wichtiger Hinweis:** NumiSync Wizard ist **nicht signiert** mit einem Apple Developer-Zertifikat. macOS wird es standardmäßig blockieren. Befolgen Sie diese Schritte zur Installation:

### Schritt 1: NumiSync Wizard herunterladen

1. Besuchen Sie die [Releases-Seite](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Laden Sie das neueste DMG herunter:
   - **Universal DMG:** `NumiSync-Wizard-1.0.0-universal.dmg` (funktioniert sowohl auf Intel als auch Apple Silicon)
   - **Intel-spezifisch:** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon:** `NumiSync-Wizard-1.0.0-arm64.dmg`

**Die meisten Nutzer sollten das Universal DMG herunterladen.**

### Schritt 2: App installieren

1. **Öffnen Sie das DMG** durch Doppelklick
2. **Ziehen Sie NumiSync Wizard** in Ihren Programme-Ordner
3. **Werfen Sie das DMG aus** (Rechtsklick → Auswerfen)

### Schritt 3: Gatekeeper umgehen (Erforderlich)

Da die App unsigniert ist, wird macOS sie blockieren. Verwenden Sie **Methode 1** (am einfachsten):

#### Methode 1: Öffnen per Rechtsklick (Empfohlen)

1. **Öffnen Sie den Programme**-Ordner im Finder
2. **Rechtsklick** (oder Ctrl+Klick) auf NumiSync Wizard
3. Wählen Sie **"Öffnen"** aus dem Menü
4. Klicken Sie im Sicherheitsdialog auf **"Öffnen"**
5. Die App startet — **alle zukünftigen Starts funktionieren normal** (einfach doppelklicken)

#### Methode 2: Systemeinstellungen überschreiben

1. Versuchen Sie, die App normal zu öffnen (sie wird blockiert)
2. Gehen Sie zu **Systemeinstellungen** → **Datenschutz & Sicherheit** → **Allgemein**
3. Klicken Sie neben der blockierten App-Meldung auf **"Trotzdem öffnen"**
4. Klicken Sie im Bestätigungsdialog auf **"Öffnen"**

#### Methode 3: Terminal-Umgehung (Fortgeschritten)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**Für detaillierte Fehlerbehebung siehe den [macOS-Installationshandbuch](/macos-install).**

### Schritt 4: Erster Start

Beim ersten Start wird NumiSync Wizard:
- Ein Cache-Verzeichnis in `~/Library/Application Support/numisync-wizard-cache` erstellen
- Ohne geöffnete Sammlung laden

---

## Linux-Installation

NumiSync Wizard ist in drei Formaten für Linux verfügbar. Wählen Sie entsprechend Ihrer Distribution:

### Option 1: AppImage (Universal - Empfohlen)

**Am besten geeignet für:** Alle Distributionen

1. Laden Sie `NumiSync-Wizard-1.0.0.AppImage` von den [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest) herunter
2. Ausführbar machen:
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Ausführen:
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Optional:** Integration in Ihre Desktop-Umgebung mit [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Option 2: Debian/Ubuntu (.deb)

**Am besten geeignet für:** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# .deb-Datei herunterladen
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# Installieren
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# Abhängigkeiten installieren, falls erforderlich
sudo apt-get install -f
```

Starten aus dem Anwendungsmenü oder ausführen:
```bash
numisync-wizard
```

### Option 3: Fedora/RHEL (.rpm)

**Am besten geeignet für:** Fedora, RHEL, CentOS, Rocky Linux

```bash
# .rpm-Datei herunterladen
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# Installieren
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# Oder mit dnf (empfohlen)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Starten aus dem Anwendungsmenü oder ausführen:
```bash
numisync-wizard
```

### Erster Start (Linux)

Beim ersten Start wird NumiSync Wizard:
- Ein Cache-Verzeichnis in `~/.config/numisync-wizard-cache` erstellen
- Ohne geöffnete Sammlung laden

---

## Erstkonfiguration

**Hinweis:** Diese Schritte sind für alle Plattformen gleich (Windows, macOS, Linux)

### 1. Ihren Numista-API-Schlüssel hinzufügen

1. Klicken Sie auf **Settings** (Zahnradsymbol) oder drücken Sie `Ctrl+,`
2. Navigieren Sie zur Registerkarte **API Settings**
3. Geben Sie Ihren Numista-API-Schlüssel ein
4. Klicken Sie auf **Save**

**So erhalten Sie einen API-Schlüssel:**
1. Gehen Sie zu [numista.com](https://www.numista.com/) und erstellen Sie ein kostenloses Konto
2. Anmelden → Profil → API-Zugang
3. Fordern Sie einen API-Schlüssel an (sofortige Genehmigung für den persönlichen Gebrauch)
4. Kopieren Sie den Schlüssel und fügen Sie ihn in NumiSync Wizard ein

### 2. Ihre Sammlung öffnen

1. Klicken Sie auf **File → Open Collection** (Tastaturkürzel variiert je nach Plattform)
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Navigieren Sie zu Ihrer OpenNumismat-`.db`-Datei
3. Wählen Sie die Datei aus und klicken Sie auf **Open**
4. Ihre Münzen werden im Hauptfenster geladen

### 3. Dateneinstellungen konfigurieren (Optional)

1. Gehen Sie zu **Settings → Data Settings**
2. Wählen Sie, welche Daten synchronisiert werden sollen:
   - **Basic** - Katalogdaten auf Typebene (Auflage, Zusammensetzung, Herrscher, Graveur)
   - **Issue** - Emissionsspezifische Daten (Jahr, Münzzeichen, Typvarianten)
   - **Pricing** - Aktuelle Marktpreise (UNC, XF, VF, F-Grade)
3. Konfigurieren Sie bei Bedarf Feld-Mappings (nur für erfahrene Nutzer)

---

## Installation überprüfen

### Grundfunktionen testen

1. Wählen Sie einige Münzen in Ihrer Sammlung aus
2. Klicken Sie auf die Schaltfläche **Search & Enrich**
3. NumiSync sollte auf Numista suchen und Treffer finden
4. Überprüfen Sie die Treffer in der Feldvergleichs-Benutzeroberfläche
5. Akzeptieren Sie einen Treffer, um zu überprüfen, ob Datenaktualisierungen funktionieren

Wenn Sie Treffer sehen und Münzdaten aktualisieren können, ist die Installation erfolgreich!

---

## Fehlerbehebung

### Windows-Probleme

**Installationsprogramm startet nicht:**
- SmartScreen-Warnung: Klicken Sie auf "Weitere Informationen" → "Trotzdem ausführen"
- Antivirus blockiert: Ausnahme für das Installationsprogramm hinzufügen
- Beschädigter Download: Erneut herunterladen und Dateigröße prüfen

**Anwendung startet nicht:**
- Ereignisanzeige prüfen: Windows-Protokolle → Anwendung
- Fehlende Abhängigkeiten: [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist) installieren
- Antivirus-Interferenz: Ausnahme für `NumiSync Wizard.exe` hinzufügen

### macOS-Probleme

**"NumiSync Wizard ist beschädigt und kann nicht geöffnet werden":**
- DMG löschen und erneut herunterladen
- Dateigröße mit der Releases-Seite abgleichen
- Methode 1 versuchen (Rechtsklick → Öffnen)

**"Keine Option zum Öffnen im Sicherheitsdialog":**
- Sie haben doppelgeklickt statt rechts geklickt
- Verwenden Sie Methode 1 oder Methode 2 aus den Installationsschritten oben

**App stürzt sofort ab:**
- Absturzprotokolle in der Konsole-App prüfen
- Problem mit macOS-Version und Absturzprotokoll melden

**Siehe [macOS-Installationshandbuch](/macos-install) für detaillierte Fehlerbehebung.**

### Linux-Probleme

**AppImage startet nicht:**
- Sicherstellen, dass es ausführbar ist: `chmod +x *.AppImage`
- FUSE installieren: `sudo apt-get install fuse` (Ubuntu/Debian)
- Über Terminal starten, um Fehlermeldungen zu sehen

**.deb-Installation schlägt fehl:**
- Abhängigkeiten installieren: `sudo apt-get install -f`
- Systemanforderungen prüfen (Ubuntu 20.04+)

**.rpm-Installation schlägt fehl:**
- Abhängigkeiten installieren: `sudo dnf install <Paketname>`
- Systemanforderungen prüfen (Fedora 32+)

**Fehlende Bibliotheken:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### Alle Plattformen

**Sammlung kann nicht geöffnet werden:**
- Überprüfen, ob die `.db`-Datei vorhanden und nicht beschädigt ist
- Lese-/Schreibberechtigungen sicherstellen
- OpenNumismat schließen, falls es die Sammlung geöffnet hat
- File → Recent Collections versuchen

**API-Schlüssel funktioniert nicht:**
- Sorgfältig kopieren und einfügen (keine Leerzeichen)
- Ratenlimits prüfen (120 Anfragen/Minute)
- Numista-Konto auf Aktivität prüfen
- Schlüssel auf der Numista-API-Dokumentationsseite testen

**Cache-Verzeichnis-Probleme:**
- **Windows:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS:** `~/Library/Application Support/numisync-wizard-cache`
- **Linux:** `~/.config/numisync-wizard-cache`
- Schreibberechtigungen prüfen
- Cache löschen, falls beschädigt

---

## Deinstallation

### Windows

1. Gehen Sie zu **Einstellungen → Apps → Apps & Features**
2. Suchen Sie nach "NumiSync Wizard"
3. Klicken Sie auf **Deinstallieren**
4. Folgen Sie den Anweisungen des Deinstallationsprogramms

**Manuelle Bereinigung (optional):**
- Cache löschen: `%LOCALAPPDATA%\numisync-wizard-cache`
- Einstellungen löschen: `%APPDATA%\numisync-wizard`

### macOS

1. Anwendung beenden
2. `NumiSync Wizard.app` aus dem Programme-Ordner löschen
3. **Optionale Bereinigung:**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage:** Einfach die `.AppImage`-Datei löschen

**Debian/Ubuntu (.deb):**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -e numisync-wizard
# Oder mit dnf
sudo dnf remove numisync-wizard
```

**Manuelle Bereinigung (alle Linux):**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## Upgrade auf eine neue Version

NumiSync Wizard prüft beim Start auf Updates (falls in den Settings aktiviert).

### Automatisches Update (wenn verfügbar)
1. Klicken Sie auf die Benachrichtigung **"Update Available"**
2. Der Download startet automatisch
3. Die Installation erfolgt nach Abschluss des Downloads
4. Die Anwendung startet mit der neuen Version neu

### Manuelles Update
1. Laden Sie das neueste Installationsprogramm von den [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest) herunter
2. Führen Sie das Installationsprogramm aus
3. Es erkennt automatisch die vorhandene Installation und aktualisiert sie
4. Ihre Einstellungen und Ihr Cache bleiben erhalten

---

## Nächste Schritte

- **[Schnellstart-Leitfaden](/de/quickstart)** - In 5 Minuten loslegen
- **[Benutzerhandbuch](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Umfassende Funktionsdokumentation
- **[Supporter-Lizenz erwerben](#)** - Fast Pricing Mode und Auto-Propagate freischalten

---

## Hilfe benötigt?

- **Probleme:** [Auf GitHub melden](https://github.com/inguy24/numismat-enrichment/issues)
- **Diskussionen:** [Community fragen](https://github.com/inguy24/numismat-enrichment/discussions)
- **Dokumentation:** [Vollständige Dokumentation](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/de/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← Zurück zur Startseite</a>
  <a href="/de/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Weiter: Schnellstart →</a>
</div>
