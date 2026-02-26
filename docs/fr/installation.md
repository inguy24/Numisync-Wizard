---
layout: default
title: Guide d'installation
lang: fr
page_id: installation
---

# Guide d'installation

NumiSync Wizard est disponible pour **Windows**, **macOS** et **Linux**. Choisissez votre plateforme ci-dessous pour les instructions d'installation.

---

## Configuration requise

### Toutes les plateformes
- **OpenNumismat** installé ([opennumismat.github.io](https://opennumismat.github.io/))
- **Clé API Numista** (gratuite sur [numista.com](https://www.numista.com/))
- **RAM :** 4 Go minimum, 8 Go recommandé
- **Stockage :** 200 Mo + espace de cache

### Windows
- **Système :** Windows 10 (64 bits) ou Windows 11
- **Processeur :** Intel Core i3 ou équivalent

### macOS
- **Système :** macOS 10.13 High Sierra ou version ultérieure
- **Architecture :** Intel (x64) et Apple Silicon (M1/M2/M3 arm64)

### Linux
- **Système :** Ubuntu 20.04+, Debian 10+, Fedora 32+ ou compatible
- **Architecture :** x64
- **Serveur d'affichage :** X11 ou Wayland

---

## Installation Windows

### Option 1 : Microsoft Store (bientôt disponible)

NumiSync Wizard a été soumis au Microsoft Store et est en attente de certification. Une fois approuvé, vous pourrez l'installer directement depuis le Store avec des mises à jour automatiques et sans avertissements SmartScreen.

### Option 2 : Téléchargement direct

#### Étape 1 : Télécharger NumiSync Wizard

1. Visitez la [page des versions](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Téléchargez le dernier installateur :
   - **Systèmes 64 bits :** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **Systèmes 32 bits :** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**Vous ne savez pas quelle version choisir ?** La plupart des systèmes Windows modernes sont 64 bits. Pour vérifier :
- Clic droit sur **Ce PC** → **Propriétés**
- Cherchez "Type du système" (ex. : "Système d'exploitation 64 bits")

#### Étape 2 : Exécuter l'installateur

1. **Double-cliquez** sur l'installateur téléchargé
2. Windows peut afficher un avertissement SmartScreen (installateur non signé)
   - Cliquez sur **"Plus d'informations"** → **"Exécuter quand même"**
3. Acceptez le Contrat de Licence Utilisateur Final (CLUF)
4. Choisissez le répertoire d'installation (par défaut : `C:\Program Files\NumiSync Wizard`)
5. Cliquez sur **Installer**
6. Attendez la fin de l'installation
7. Cliquez sur **Terminer** pour lancer NumiSync Wizard

#### Étape 3 : Premier lancement

Au premier lancement, NumiSync Wizard va :
- Créer un répertoire de cache dans `%LOCALAPPDATA%\numisync-wizard-cache`
- Se charger sans collection ouverte

---

## Installation macOS

**Attention :** NumiSync Wizard n'est **pas signé** avec un certificat Apple Developer. macOS le bloquera par défaut. Suivez ces étapes pour l'installer :

### Étape 1 : Télécharger NumiSync Wizard

1. Visitez la [page des versions](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Téléchargez le dernier DMG :
   - **DMG Universel :** `NumiSync-Wizard-1.0.0-universal.dmg` (fonctionne sur Intel et Apple Silicon)
   - **Spécifique Intel :** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon :** `NumiSync-Wizard-1.0.0-arm64.dmg`

**La plupart des utilisateurs devraient télécharger le DMG Universel.**

### Étape 2 : Installer l'application

1. **Ouvrez le DMG** en double-cliquant dessus
2. **Faites glisser NumiSync Wizard** vers votre dossier Applications
3. **Éjectez le DMG** (clic droit → Éjecter)

### Étape 3 : Contourner Gatekeeper (requis)

Comme l'application n'est pas signée, macOS la bloquera. Utilisez la **Méthode 1** (la plus simple) :

#### Méthode 1 : Ouverture par clic droit (recommandée)

1. **Allez dans le dossier Applications** dans le Finder
2. **Faites un clic droit** (ou Ctrl+clic) sur NumiSync Wizard
3. Sélectionnez **"Ouvrir"** dans le menu
4. Cliquez sur **"Ouvrir"** dans la boîte de dialogue de sécurité
5. L'application se lance — **les lancements ultérieurs fonctionnent normalement** (double-clic suffit)

#### Méthode 2 : Contournement via les Préférences Système

1. Essayez d'ouvrir l'application normalement (elle sera bloquée)
2. Allez dans **Préférences Système** → **Sécurité et confidentialité** → **Général**
3. Cliquez sur **"Ouvrir quand même"** à côté du message sur l'application bloquée
4. Cliquez sur **"Ouvrir"** dans la boîte de dialogue de confirmation

#### Méthode 3 : Contournement via le Terminal (avancé)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**Pour un dépannage détaillé, consultez le [Guide d'installation macOS](/macos-install).**

### Étape 4 : Premier lancement

Au premier lancement, NumiSync Wizard va :
- Créer un répertoire de cache dans `~/Library/Application Support/numisync-wizard-cache`
- Se charger sans collection ouverte

---

## Installation Linux

NumiSync Wizard est disponible en trois formats pour Linux. Choisissez selon votre distribution :

### Option 1 : AppImage (Universel - Recommandé)

**Idéal pour :** Toutes les distributions

1. Téléchargez `NumiSync-Wizard-1.0.0.AppImage` depuis les [Versions](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Rendez-le exécutable :
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Exécutez-le :
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Optionnel :** Intégrez à votre environnement de bureau avec [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Option 2 : Debian/Ubuntu (.deb)

**Idéal pour :** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# Télécharger le fichier .deb
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# Installer
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# Installer les dépendances si nécessaire
sudo apt-get install -f
```

Lancez depuis le menu des applications ou exécutez :
```bash
numisync-wizard
```

### Option 3 : Fedora/RHEL (.rpm)

**Idéal pour :** Fedora, RHEL, CentOS, Rocky Linux

```bash
# Télécharger le fichier .rpm
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# Installer
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# Ou avec dnf (recommandé)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Lancez depuis le menu des applications ou exécutez :
```bash
numisync-wizard
```

### Premier lancement (Linux)

Au premier lancement, NumiSync Wizard va :
- Créer un répertoire de cache dans `~/.config/numisync-wizard-cache`
- Se charger sans collection ouverte

---

## Configuration initiale

**Remarque :** Ces étapes sont identiques pour toutes les plateformes (Windows, macOS, Linux)

### 1. Ajouter votre clé API Numista

1. Cliquez sur **Settings** (icône d'engrenage) ou appuyez sur `Ctrl+,`
2. Naviguez vers l'onglet **API Settings**
3. Entrez votre clé API Numista
4. Cliquez sur **Save**

**Comment obtenir une clé API :**
1. Allez sur [numista.com](https://www.numista.com/) et créez un compte gratuit
2. Connectez-vous → Profil → Accès API
3. Demandez une clé API (approbation instantanée pour usage personnel)
4. Copiez la clé et collez-la dans NumiSync Wizard

### 2. Ouvrir votre collection

1. Cliquez sur **File → Open Collection** (le raccourci clavier varie selon la plateforme)
   - **Windows/Linux :** `Ctrl+O`
   - **macOS :** `Cmd+O`
2. Naviguez jusqu'à votre fichier OpenNumismat `.db`
3. Sélectionnez le fichier et cliquez sur **Open**
4. Vos pièces se chargeront dans la fenêtre principale

### 3. Configurer les paramètres de données (optionnel)

1. Allez dans **Settings → Data Settings**
2. Choisissez les données à synchroniser :
   - **Basic** - Données du catalogue de niveau type (tirage, composition, souverain, graveur)
   - **Issue** - Données spécifiques aux émissions (année, marque d'atelier, variantes de type)
   - **Pricing** - Prix actuels du marché (grades UNC, XF, VF, F)
3. Configurez les mappages de champs si nécessaire (utilisateurs avancés uniquement)

---

## Vérifier l'installation

### Tester les fonctionnalités de base

1. Sélectionnez quelques pièces dans votre collection
2. Cliquez sur le bouton **Search & Enrich**
3. NumiSync devrait rechercher sur Numista et trouver des correspondances
4. Examinez les correspondances dans l'interface de comparaison des champs
5. Acceptez une correspondance pour vérifier que les mises à jour de données fonctionnent

Si vous voyez des correspondances et pouvez mettre à jour les données de pièces, l'installation est réussie !

---

## Dépannage

### Problèmes Windows

**L'installateur ne se lance pas :**
- Avertissement SmartScreen : Cliquez sur "Plus d'informations" → "Exécuter quand même"
- Antivirus bloquant : Ajoutez une exception pour l'installateur
- Téléchargement corrompu : Re-téléchargez et vérifiez la taille du fichier

**L'application ne se lance pas :**
- Vérifiez l'Observateur d'événements : Journaux Windows → Application
- Dépendances manquantes : Installez [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- Interférence antivirus : Ajoutez une exception pour `NumiSync Wizard.exe`

### Problèmes macOS

**"NumiSync Wizard est endommagé et ne peut pas être ouvert" :**
- Supprimez le DMG et re-téléchargez
- Vérifiez que la taille du fichier correspond à la page des versions
- Essayez la Méthode 1 (Clic droit → Ouvrir)

**"Aucune option Ouvrir dans la boîte de dialogue de sécurité" :**
- Vous avez double-cliqué au lieu de faire un clic droit
- Utilisez la Méthode 1 ou la Méthode 2 des étapes d'installation ci-dessus

**L'application plante immédiatement :**
- Vérifiez les journaux de crash dans l'application Console
- Signalez le problème avec la version macOS et le journal de crash

**Consultez le [Guide d'installation macOS](/macos-install) pour un dépannage détaillé.**

### Problèmes Linux

**AppImage ne se lance pas :**
- Assurez-vous qu'il est exécutable : `chmod +x *.AppImage`
- Installez FUSE : `sudo apt-get install fuse` (Ubuntu/Debian)
- Essayez de lancer depuis le terminal pour voir les messages d'erreur

**L'installation .deb échoue :**
- Installez les dépendances : `sudo apt-get install -f`
- Vérifiez la configuration requise (Ubuntu 20.04+)

**L'installation .rpm échoue :**
- Installez les dépendances : `sudo dnf install <nom-du-paquet>`
- Vérifiez la configuration requise (Fedora 32+)

**Bibliothèques manquantes :**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### Toutes plateformes

**Impossible d'ouvrir la collection :**
- Vérifiez que le fichier `.db` existe et n'est pas corrompu
- Assurez-vous d'avoir les permissions de lecture/écriture
- Fermez OpenNumismat s'il a la collection ouverte
- Essayez File → Recent Collections

**La clé API ne fonctionne pas :**
- Copiez-collez soigneusement (sans espaces supplémentaires)
- Vérifiez les limites de débit (120 requêtes/minute)
- Vérifiez que votre compte Numista est actif
- Testez la clé sur la page de documentation de l'API Numista

**Problèmes de répertoire de cache :**
- **Windows :** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS :** `~/Library/Application Support/numisync-wizard-cache`
- **Linux :** `~/.config/numisync-wizard-cache`
- Vérifiez les permissions d'écriture
- Effacez le cache si corrompu

---

## Désinstallation

### Windows

1. Allez dans **Paramètres → Applications → Applications et fonctionnalités**
2. Recherchez "NumiSync Wizard"
3. Cliquez sur **Désinstaller**
4. Suivez les instructions du désinstallateur

**Nettoyage manuel (optionnel) :**
- Supprimer le cache : `%LOCALAPPDATA%\numisync-wizard-cache`
- Supprimer les paramètres : `%APPDATA%\numisync-wizard`

### macOS

1. Quittez l'application
2. Supprimez `NumiSync Wizard.app` du dossier Applications
3. **Nettoyage optionnel :**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage :** Supprimez simplement le fichier `.AppImage`

**Debian/Ubuntu (.deb) :**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm) :**
```bash
sudo rpm -e numisync-wizard
# Ou avec dnf
sudo dnf remove numisync-wizard
```

**Nettoyage manuel (tous Linux) :**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## Mise à niveau vers une nouvelle version

NumiSync Wizard vérifiera les mises à jour au lancement (si activé dans Settings).

### Mise à jour automatique (lorsque disponible)
1. Cliquez sur la notification **"Update Available"**
2. Le téléchargement démarre automatiquement
3. L'installation procède à la fin du téléchargement
4. L'application redémarre avec la nouvelle version

### Mise à jour manuelle
1. Téléchargez le dernier installateur depuis les [Versions](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Exécutez l'installateur
3. Il détectera et mettra à niveau automatiquement l'installation existante
4. Vos paramètres et cache sont conservés

---

## Prochaines étapes

- **[Guide de démarrage rapide](/fr/quickstart)** - Démarrez en 5 minutes
- **[Manuel utilisateur](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Documentation complète des fonctionnalités
- **[Obtenir une licence Supporter](#)** - Déverrouillez Fast Pricing Mode et Auto-Propagate

---

## Besoin d'aide ?

- **Problèmes :** [Signaler sur GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussions :** [Demander à la communauté](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentation :** [Docs complètes](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/fr/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← Retour à l'accueil</a>
  <a href="/fr/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Suivant : Démarrage rapide →</a>
</div>
