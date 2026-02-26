---
layout: default
title: Guide de démarrage rapide
lang: fr
page_id: quickstart
---

# Guide de démarrage rapide

Lancez-vous avec NumiSync Wizard en 5 minutes. Ce guide vous présente le flux de travail de base pour enrichir votre collection de pièces.

**Note sur les plateformes :** Ce guide fonctionne pour Windows, macOS et Linux. Les raccourcis clavier sont indiqués pour toutes les plateformes lorsqu'ils diffèrent.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- **NumiSync Wizard installé** ([Guide d'installation](/fr/installation))
- **Une collection OpenNumismat** (fichier .db avec quelques pièces)
- **Une clé API Numista** (gratuite sur [numista.com](https://www.numista.com/))

---

## Étape 1 : Lancement et configuration

### Ouvrir NumiSync Wizard

1. Lancez NumiSync Wizard :
   - **Windows :** Menu Démarrer ou raccourci sur le Bureau
   - **macOS :** Dossier Applications ou Launchpad
   - **Linux :** Menu des applications ou exécutez `numisync-wizard` (si installé via .deb/.rpm)
2. Le premier lancement créera automatiquement un répertoire de cache

### Ajouter votre clé API

1. Cliquez sur **Settings** (icône d'engrenage) ou appuyez sur :
   - **Windows/Linux :** `Ctrl+,`
   - **macOS :** `Cmd+,`
2. Allez dans l'onglet **API Settings**
3. Collez votre clé API Numista
4. Cliquez sur **Save**

**Vous n'avez pas de clé API ?** Obtenez-en une gratuitement sur [numista.com](https://www.numista.com/) → Profil → Accès API

---

## Étape 2 : Ouvrir votre collection

1. Cliquez sur **File → Open Collection** ou appuyez sur :
   - **Windows/Linux :** `Ctrl+O`
   - **macOS :** `Cmd+O`
2. Naviguez jusqu'à votre fichier OpenNumismat `.db`
3. Cliquez sur **Open**
4. Vos pièces se chargeront dans la fenêtre principale

**Conseil :** NumiSync mémorise les collections récentes. Utilisez **File → Recent Collections** pour un accès rapide.

---

## Étape 3 : Rechercher des correspondances

### Sélectionner les pièces à enrichir

Vous pouvez enrichir les pièces une par une ou par lots :

- **Pièce unique :** Cliquez sur une ligne de pièce pour la sélectionner
- **Plusieurs pièces :** Maintenez la touche modificatrice et cliquez sur plusieurs lignes
  - **Windows/Linux :** `Ctrl+Clic`
  - **macOS :** `Cmd+Clic`
- **Plage :** Cliquez sur la première pièce, maintenez `Maj`, cliquez sur la dernière pièce
- **Toutes les pièces :** Sélectionner tout
  - **Windows/Linux :** `Ctrl+A`
  - **macOS :** `Cmd+A`

### Lancer la recherche

1. Cliquez sur le bouton **Search & Enrich** (ou appuyez sur `F2`)
2. NumiSync recherchera sur Numista chaque pièce sélectionnée
3. L'indicateur de progression affiche le statut actuel

**Ce qui se passe :**
- Recherche par dénomination, pays, année, marque d'atelier
- Gère les variantes (ex. : "Cent" vs "Cents", "USA" vs "United States")
- Prend en charge les calendriers non grégoriens (années Meiji, années Hijri, etc.)
- Utilise les résultats en cache lorsque disponibles (plus rapide !)

---

## Étape 4 : Examiner les correspondances

### Comprendre les résultats de correspondance

Après la recherche, chaque pièce affiche l'un des trois statuts suivants :

- **Match Found** - Entrée du catalogue Numista trouvée
- **Multiple Matches** - Plusieurs possibilités (sélection manuelle requise)
- **No Match** - Aucune entrée du catalogue trouvée (essayez la recherche manuelle)

### Afficher la comparaison des champs

1. Cliquez sur une pièce avec une correspondance
2. Le **panneau de comparaison des champs** affiche :
   - **Colonne gauche :** Vos données existantes
   - **Colonne droite :** Données du catalogue Numista
   - **Différences mises en évidence** en couleur
3. Examinez ce qui va changer

---

## Étape 5 : Accepter ou affiner les correspondances

### Accepter toutes les modifications

Si la correspondance semble correcte :
1. Cliquez sur le bouton **Accept Match** (ou appuyez sur `Entrée`)
2. Toutes les données Numista mettent à jour votre pièce immédiatement
3. La pièce est marquée comme enrichie

### Sélectionner des champs spécifiques

Pour ne mettre à jour que certains champs :
1. Dans le panneau de comparaison des champs, **décochez** les champs que vous ne souhaitez pas mettre à jour
2. Cliquez sur **Accept Match**
3. Seuls les champs cochés seront mis à jour

### Choisir une émission différente

De nombreuses pièces ont plusieurs émissions (années, marques d'atelier, types) :

1. Cliquez sur le bouton **Choose Issue**
2. La boîte de dialogue **Issue Picker** affiche toutes les variantes
3. Sélectionnez l'émission correcte pour votre pièce
4. La comparaison des champs se met à jour avec les données de cette émission
5. Cliquez sur **Accept Match**

### Recherche manuelle

Si aucune correspondance n'est trouvée automatiquement :
1. Cliquez sur le bouton **Manual Search** ou appuyez sur :
   - **Windows/Linux :** `Ctrl+F`
   - **macOS :** `Cmd+F`
2. Modifiez les paramètres de recherche (dénomination, année, pays)
3. Cliquez sur **Search**
4. Parcourez les résultats et sélectionnez l'entrée correcte
5. Cliquez sur **Accept Match**

---

## Étape 6 : Télécharger des images (optionnel)

### Téléchargement automatique d'images

Si **Data Settings → Images** est activé :
- Les images se téléchargent automatiquement lorsque vous acceptez une correspondance
- Images d'avers, de revers et de tranche (si disponibles)
- Stockées dans le répertoire d'images d'OpenNumismat

### Téléchargement manuel d'images

1. Sélectionnez une pièce enrichie
2. Cliquez sur le bouton **Download Images**
3. Choisissez les images à télécharger (avers, revers, tranche)
4. Cliquez sur **Download**

**Conseil :** Utilisez la **comparaison d'images** pour prévisualiser avant d'accepter

---

## Flux de travail courants

### Flux de travail 1 : Enrichir une nouvelle collection

1. Ouvrez une collection avec beaucoup de pièces non enrichies
2. Sélectionnez toutes les pièces (`Ctrl+A`)
3. Cliquez sur **Search & Enrich** (ou appuyez sur `F2`)
4. Examinez les correspondances une par une
5. Acceptez les correspondances au fur et à mesure
6. Utilisez la recherche manuelle pour les pièces sans correspondance

**Gain de temps :** 2-3 minutes par pièce → 10-15 secondes par pièce

### Flux de travail 2 : Mettre à jour les prix uniquement

1. Allez dans **Settings → Data Settings**
2. Décochez **Basic** et **Issue** (laissez **Pricing** coché)
3. Sélectionnez les pièces à mettre à jour
4. Cliquez sur **Search & Enrich**
5. Acceptez les correspondances (seuls les prix se mettent à jour)

**Conseil pro :** Obtenez une [licence Supporter](#) pour utiliser le **Fast Pricing Mode** - met à jour toutes les pièces correspondantes instantanément !

### Flux de travail 3 : Corriger des correspondances incorrectes

1. Sélectionnez une pièce avec des données incorrectes
2. Cliquez sur **Manual Search**
3. Trouvez l'entrée correcte du catalogue
4. Acceptez la correspondance
5. Les anciennes données sont écrasées

**Conseil :** Utilisez la **Field Comparison** pour vérifier avant d'accepter

---

## Conseils pour de meilleurs résultats

### Conseils de recherche

**Bonnes pratiques :**
- Commencez avec des pièces ayant des informations complètes (année, pays, dénomination)
- Utilisez les abréviations de dénomination standard ("1 Cent" plutôt que "1c")
- Laissez NumiSync normaliser automatiquement les dénominations

**À éviter :**
- Rechercher des pièces avec des champs critiques manquants (pays, dénomination)
- Modifier manuellement les requêtes de recherche sauf si nécessaire
- Supposer que la première correspondance est correcte - vérifiez toujours !

### Qualité des données

**Bonnes pratiques :**
- Examinez la Field Comparison avant d'accepter
- Utilisez l'Issue Picker lorsque plusieurs variantes existent
- Vérifiez que les images correspondent à votre pièce physique

**À éviter :**
- Accepter aveuglément toutes les correspondances
- Écraser de bonnes données avec des données de catalogue incomplètes
- Oublier de sauvegarder votre collection d'abord !

### Performance

**Bonnes pratiques :**
- Activez la mise en cache (Settings → General → Cache)
- Travaillez en lots de 10-20 pièces
- Utilisez Fast Pricing Mode pour les mises à jour importantes (licence Supporter)

**À éviter :**
- Rechercher 1000+ pièces d'un coup (respecte les limites de débit, mais lent)
- Désactiver la mise en cache (gaspille les appels API)
- Rechercher la même pièce plusieurs fois (utilisez le cache)

---

## Raccourcis clavier

**Windows/Linux :**
- `Ctrl+O` - Ouvrir la collection
- `F2` - Search & Enrich les pièces sélectionnées
- `Ctrl+F` - Recherche manuelle
- `Entrée` - Accepter la correspondance
- `Échap` - Annuler/Fermer la boîte de dialogue
- `Ctrl+A` - Sélectionner toutes les pièces
- `Ctrl+,` - Ouvrir les paramètres
- `F1` - Ouvrir l'aide

**macOS :**
- `Cmd+O` - Ouvrir la collection
- `F2` - Search & Enrich les pièces sélectionnées
- `Cmd+F` - Recherche manuelle
- `Entrée` - Accepter la correspondance
- `Échap` - Annuler/Fermer la boîte de dialogue
- `Cmd+A` - Sélectionner toutes les pièces
- `Cmd+,` - Ouvrir les paramètres
- `F1` - Ouvrir l'aide

---

## Et ensuite ?

### Explorer les fonctionnalités premium

Obtenez une **[licence Supporter (10 $)](#)** pour débloquer :
- **Fast Pricing Mode** - Mise à jour des prix en masse pour toutes les pièces correspondantes
- **Auto-Propagate** - Appliquer automatiquement les données de type aux pièces correspondantes
- **Plus d'invites intempestives !**

### Fonctionnalités avancées

- **Field Mapping** - Personnalisez comment les données Numista se mappent à vos champs
- **Opérations par lots** - Traitez efficacement des centaines de pièces
- **Support multi-machines** - Partagez le cache entre appareils
- **Emplacement de cache personnalisé** - Stockez le cache sur un lecteur réseau

### En savoir plus

- **[Manuel utilisateur](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Documentation complète des fonctionnalités
- **[FAQ](#)** - Questions fréquentes
- **[Tutoriels vidéo](#)** - Bientôt disponibles !

---

## Besoin d'aide ?

### Problèmes courants

**Q : Pourquoi ma pièce n'a-t-elle pas trouvé de correspondance ?**
- R : Le pays ou la dénomination peut nécessiter une normalisation. Essayez la recherche manuelle avec des variantes.

**Q : Pourquoi certains champs ne se mettent-ils pas à jour ?**
- R : Vérifiez **Data Settings** - certaines catégories de données peuvent être désactivées.

**Q : Puis-je annuler une correspondance acceptée ?**
- R : Pas automatiquement. Restaurez depuis une sauvegarde ou revenez manuellement aux données.

**Q : Comment mettre à jour les prix sans modifier les autres champs ?**
- R : Settings → Data Settings → Décochez Basic et Issue, laissez Pricing coché.

**Q : Que se passe-t-il si je recherche une pièce deux fois ?**
- R : NumiSync utilise les résultats en cache (instantané) sauf si vous cliquez sur "Refresh from API".

### Obtenir de l'aide

- **Problèmes :** [Signaler sur GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussions :** [Demander à la communauté](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentation :** [Docs complètes](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/fr/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← Guide d'installation</a>
  <a href="/fr/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Retour à l'accueil</a>
</div>
