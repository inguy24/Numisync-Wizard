---
layout: default
title: Gabay sa Pag-install
lang: tl
page_id: installation
---

# Gabay sa Pag-install

Ang NumiSync Wizard ay available para sa **Windows**, **macOS**, at **Linux**. Piliin ang iyong platform sa ibaba para sa mga tagubilin sa pag-install.

---

## Mga Kinakailangan ng Sistema

### Lahat ng Platform
- **OpenNumismat** na naka-install ([opennumismat.github.io](https://opennumismat.github.io/))
- **Numista API Key** (libre mula sa [numista.com](https://www.numista.com/))
- **RAM:** 4 GB minimum, 8 GB na inirerekomenda
- **Storage:** 200 MB + espasyo para sa cache

### Windows
- **OS:** Windows 10 (64-bit) o Windows 11
- **Processor:** Intel Core i3 o katumbas

### macOS
- **OS:** macOS 10.13 High Sierra o mas bago
- **Architecture:** Intel (x64) at Apple Silicon (M1/M2/M3 arm64)

### Linux
- **OS:** Ubuntu 20.04+, Debian 10+, Fedora 32+, o katugma
- **Architecture:** x64
- **Display Server:** X11 o Wayland

---

## Pag-install sa Windows

### Opsyon 1: Microsoft Store

Available na ang NumiSync Wizard sa Microsoft Store na may awtomatikong mga update at walang mga babala ng SmartScreen.

### Opsyon 2: Direct Download

#### Hakbang 1: I-download ang NumiSync Wizard

1. Bisitahin ang [pahina ng Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. I-download ang pinakabagong installer:
   - **64-bit na sistema:** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **32-bit na sistema:** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**Hindi sigurado kung aling bersyon?** Karamihan sa mga modernong sistema ng Windows ay 64-bit. Upang suriin:
- I-right-click ang **This PC** → **Properties**
- Hanapin ang "System type" (hal., "64-bit operating system")

#### Hakbang 2: Patakbuhin ang Installer

1. **I-double-click** ang na-download na installer
2. Maaaring magpakita ang Windows ng babala ng SmartScreen (unsigned installer)
   - I-click ang **"More info"** → **"Run anyway"**
3. Tanggapin ang End User License Agreement (EULA)
4. Piliin ang direktoryo ng pag-install (default: `C:\Program Files\NumiSync Wizard`)
5. I-click ang **Install**
6. Hintayin na matapos ang pag-install
7. I-click ang **Finish** upang ilunsad ang NumiSync Wizard

#### Hakbang 3: Unang Paglulunsad

Sa unang paglulunsad, ang NumiSync Wizard ay:
- Lilikha ng direktoryo ng cache sa `%LOCALAPPDATA%\numisync-wizard-cache`
- Magbubukas nang walang koleksyon na nakabukas

---

## Pag-install sa macOS

**Mahalaga:** Ang NumiSync Wizard ay **hindi naka-sign** gamit ang Apple Developer certificate. Haharangan ito ng macOS bilang default. Sundin ang mga hakbang na ito upang mai-install:

### Hakbang 1: I-download ang NumiSync Wizard

1. Bisitahin ang [pahina ng Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. I-download ang pinakabagong DMG:
   - **Universal DMG:** `NumiSync-Wizard-1.0.0-universal.dmg` (gumagana sa parehong Intel at Apple Silicon)
   - **Para sa Intel:** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon:** `NumiSync-Wizard-1.0.0-arm64.dmg`

**Karamihan sa mga user ay dapat mag-download ng Universal DMG.**

### Hakbang 2: I-install ang App

1. **Buksan ang DMG** sa pamamagitan ng pag-double-click dito
2. **I-drag ang NumiSync Wizard** sa iyong folder na Applications
3. **I-eject ang DMG** (i-right-click → Eject)

### Hakbang 3: Laktawan ang Gatekeeper (Kinakailangan)

Dahil ang app ay hindi naka-sign, haharangan ito ng macOS. Gamitin ang **Pamamaraan 1** (pinakamadali):

#### Pamamaraan 1: Right-Click na Pagbubukas (Inirerekomenda)

1. **Pumunta sa folder na Applications** sa Finder
2. **I-right-click** (o Control-click) sa NumiSync Wizard
3. Piliin ang **"Open"** mula sa menu
4. I-click ang **"Open"** sa dialog ng seguridad
5. Ilulunsad ang app — **lahat ng susunod na paglulunsad ay gumagana nang normal** (i-double-click na lang)

#### Pamamaraan 2: Override ng System Preferences

1. Subukan ang buksan ang app nang normal (mahaharangan ito)
2. Pumunta sa **System Preferences** → **Security & Privacy** → **General**
3. I-click ang **"Open Anyway"** sa tabi ng mensahe ng blocked app
4. I-click ang **"Open"** sa dialog ng kumpirmasyon

#### Pamamaraan 3: Terminal Override (Advanced)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

### Hakbang 4: Unang Paglulunsad

Sa unang paglulunsad, ang NumiSync Wizard ay:
- Lilikha ng direktoryo ng cache sa `~/Library/Application Support/numisync-wizard-cache`
- Magbubukas nang walang koleksyon na nakabukas

---

## Pag-install sa Linux

Ang NumiSync Wizard ay available sa tatlong format para sa Linux. Pumili batay sa iyong distribusyon:

### Opsyon 1: AppImage (Universal - Inirerekomenda)

**Pinakamainam para sa:** Lahat ng distribusyon

1. I-download ang `NumiSync-Wizard-1.0.0.AppImage` mula sa [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Gawing executable:
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Patakbuhin ito:
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Opsyonal:** I-integrate sa iyong desktop environment gamit ang [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Opsyon 2: Debian/Ubuntu (.deb)

**Pinakamainam para sa:** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# I-download ang .deb file
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# I-install
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# I-install ang mga dependency kung kinakailangan
sudo apt-get install -f
```

Ilunsad mula sa menu ng mga aplikasyon o patakbuhin:
```bash
numisync-wizard
```

### Opsyon 3: Fedora/RHEL (.rpm)

**Pinakamainam para sa:** Fedora, RHEL, CentOS, Rocky Linux

```bash
# I-download ang .rpm file
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# I-install
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# O gamit ang dnf (inirerekomenda)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Ilunsad mula sa menu ng mga aplikasyon o patakbuhin:
```bash
numisync-wizard
```

### Unang Paglulunsad (Linux)

Sa unang paglulunsad, ang NumiSync Wizard ay:
- Lilikha ng direktoryo ng cache sa `~/.config/numisync-wizard-cache`
- Magbubukas nang walang koleksyon na nakabukas

---

## Paunang Konfigurasyon

**Tandaan:** Ang mga hakbang na ito ay pareho para sa lahat ng platform (Windows, macOS, Linux)

### 1. Idagdag ang Iyong Numista API Key

1. I-click ang **Settings** (icon ng gear) o pindutin ang `Ctrl+,`
2. Pumunta sa tab na **API Settings**
3. Ilagay ang iyong Numista API key
4. I-click ang **Save**

**Paano makakuha ng API key:**
1. Pumunta sa [numista.com](https://www.numista.com/) at lumikha ng libreng account
2. Mag-log in → Profile → API Access
3. Humiling ng API key (agarang pag-apruba para sa personal na paggamit)
4. Kopyahin ang key at i-paste ito sa NumiSync Wizard

### 2. Buksan ang Iyong Koleksyon

1. I-click ang **File → Open Collection** (ang keyboard shortcut ay nag-iiba ayon sa platform)
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Pumunta sa iyong file na `.db` ng OpenNumismat
3. Piliin ang file at i-click ang **Open**
4. Mag-lo-load ang iyong mga barya sa pangunahing window

### 3. I-configure ang Mga Setting ng Data (Opsyonal)

1. Pumunta sa **Settings → Data Settings**
2. Piliin kung anong data ang isi-sync:
   - **Basic** - Data ng katalogo sa antas ng uri (mintage, komposisyon, pinuno, taga-disenyo)
   - **Issue** - Data na tukoy sa isyu (taon, mint mark, mga variant ng uri)
   - **Pricing** - Kasalukuyang presyo ng merkado (mga grado ng UNC, XF, VF, F)
3. I-configure ang mga field mapping kung kinakailangan (Para sa mga advanced na user lamang)

---

## I-verify ang Pag-install

### Subukan ang Pangunahing Functionality

1. Pumili ng ilang barya sa iyong koleksyon
2. I-click ang button na **Search & Enrich**
3. Dapat maghanap ang NumiSync sa Numista at makahanap ng mga tugma
4. Suriin ang mga tugma sa UI ng paghahambing ng field
5. Tanggapin ang isang tugma upang i-verify na gumagana ang mga update ng data

Kung nakakita ka ng mga tugma at makakapag-update ng data ng barya, matagumpay ang pag-install!

---

## Pag-troubleshoot

### Mga Isyu sa Windows

**Hindi tatakbo ang Installer:**
- Babala ng SmartScreen: I-click ang "More info" → "Run anyway"
- Hinaharangan ng antivirus: Magdagdag ng exception para sa installer
- Sira ang download: Mag-download ulit at i-verify ang laki ng file

**Hindi maglulunsad ang Aplikasyon:**
- Suriin ang Event Viewer: Windows Logs → Application
- Nawawalang mga dependency: I-install ang [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- Pakikialam ng antivirus: Magdagdag ng exception para sa `NumiSync Wizard.exe`

### Mga Isyu sa macOS

**"NumiSync Wizard is damaged and can't be opened":**
- Tanggalin ang DMG at mag-download ulit
- I-verify na ang laki ng file ay tumutugma sa pahina ng releases
- Subukan ang Pamamaraan 1 (Right-click → Open)

**"Walang opsyon na Open sa dialog ng seguridad":**
- Nag-double-click ka sa halip na nag-right-click
- Gamitin ang Pamamaraan 1 o Pamamaraan 2 mula sa mga hakbang sa pag-install sa itaas

**Nag-crash agad ang app:**
- Suriin ang Console app para sa mga crash log
- Iulat ang isyu na may bersyon ng macOS at crash log

### Mga Isyu sa Linux

**Hindi tatakbo ang AppImage:**
- Tiyakin na ito ay executable: `chmod +x *.AppImage`
- I-install ang FUSE: `sudo apt-get install fuse` (Ubuntu/Debian)
- Subukang patakbuhin mula sa terminal upang makita ang mga mensahe ng error

**Nabigo ang pag-install ng .deb:**
- I-install ang mga dependency: `sudo apt-get install -f`
- Suriin ang mga kinakailangan ng sistema (Ubuntu 20.04+)

**Nabigo ang pag-install ng .rpm:**
- I-install ang mga dependency: `sudo dnf install <package-name>`
- Suriin ang mga kinakailangan ng sistema (Fedora 32+)

**Nawawalang mga library:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### Lahat ng Platform

**Hindi Mabuksan ang Koleksyon:**
- I-verify na ang file na `.db` ay umiiral at hindi sira
- Tiyakin na mayroon kang mga pahintulot sa pagbabasa/pagsulat
- Isara ang OpenNumismat kung mayroon itong nakabukas na koleksyon
- Subukan ang File → Recent Collections

**Hindi Gumagana ang API Key:**
- Mag-copy-paste nang maingat (walang dagdag na espasyo)
- Suriin ang mga limitasyon ng rate (120 kahilingan/minuto)
- I-verify na ang account sa Numista ay aktibo
- Subukan ang key sa pahina ng dokumentasyon ng Numista API

**Mga Isyu sa Direktoryo ng Cache:**
- **Windows:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS:** `~/Library/Application Support/numisync-wizard-cache`
- **Linux:** `~/.config/numisync-wizard-cache`
- Suriin ang mga pahintulot sa pagsulat
- Linisin ang cache kung sira

---

## Pag-uninstall

### Windows

1. Pumunta sa **Settings → Apps → Apps & features**
2. Hanapin ang "NumiSync Wizard"
3. I-click ang **Uninstall**
4. Sundin ang mga prompt ng uninstaller

**Manual na paglilinis (opsyonal):**
- Tanggalin ang cache: `%LOCALAPPDATA%\numisync-wizard-cache`
- Tanggalin ang mga setting: `%APPDATA%\numisync-wizard`

### macOS

1. Isara ang aplikasyon
2. Tanggalin ang `NumiSync Wizard.app` mula sa folder na Applications
3. **Opsyonal na paglilinis:**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage:** Tanggalin lamang ang file na `.AppImage`

**Debian/Ubuntu (.deb):**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -e numisync-wizard
# O gamit ang dnf
sudo dnf remove numisync-wizard
```

**Manual na paglilinis (lahat ng Linux):**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## Pag-upgrade sa Bagong Bersyon

Susuriin ng NumiSync Wizard ang mga update sa paglulunsad (kung pinagana sa Settings).

### Awtomatikong Update (Kapag Available)
1. I-click ang abiso na **"Update Available"**
2. Awtomatikong magsisimula ang download
3. Magpapatuloy ang pag-install kapag natapos na ang download
4. Mag-restart ang aplikasyon na may bagong bersyon

### Manu-manong Update
1. I-download ang pinakabagong installer mula sa [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Patakbuhin ang installer
3. Awtomatiko nitong matatukoy at ia-upgrade ang kasalukuyang pag-install
4. Napanatili ang iyong mga setting at cache

---

## Mga Susunod na Hakbang

- **[Gabay sa Mabilis na Pagsisimula](/tl/quickstart)** - Magsimula sa loob ng 5 minuto
- **[User Manual](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Komprehensibong dokumentasyon ng tampok
- **[Kumuha ng Supporter License](/tl/license)** - I-unlock ang Fast Pricing Mode at Auto-Propagate

---

## Kailangan ng Tulong?

- **Mga Isyu:** [Iulat sa GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Mga Talakayan:** [Tanungin ang komunidad](https://github.com/inguy24/numismat-enrichment/discussions)
- **Dokumentasyon:** [Kumpletong docs](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/tl/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← Bumalik sa Home</a>
  <a href="/tl/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Susunod: Mabilis na Pagsisimula →</a>
</div>
