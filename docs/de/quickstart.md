---
layout: default
title: Schnellstart-Leitfaden
lang: de
page_id: quickstart
---

# Schnellstart-Leitfaden

Starten Sie mit NumiSync Wizard in 5 Minuten durch. Dieser Leitfaden führt Sie durch den grundlegenden Arbeitsablauf zur Anreicherung Ihrer Münzsammlung.

**Plattformhinweis:** Dieser Leitfaden funktioniert für Windows, macOS und Linux. Tastaturkürzel werden für alle Plattformen angegeben, sofern sie abweichen.

---

## Voraussetzungen

Stellen Sie vor dem Start sicher, dass Sie haben:

- **NumiSync Wizard installiert** ([Installationshandbuch](/de/installation))
- **Eine OpenNumismat-Sammlung** (.db-Datei mit einigen Münzen)
- **Einen Numista-API-Schlüssel** (kostenlos von [numista.com](https://www.numista.com/))

---

## Schritt 1: Starten und Konfigurieren

### NumiSync Wizard öffnen

1. NumiSync Wizard starten:
   - **Windows:** Startmenü oder Desktop-Verknüpfung
   - **macOS:** Programme-Ordner oder Launchpad
   - **Linux:** Anwendungsmenü oder `numisync-wizard` ausführen (wenn via .deb/.rpm installiert)
2. Der erste Start erstellt automatisch ein Cache-Verzeichnis

### Ihren API-Schlüssel hinzufügen

1. Klicken Sie auf **Settings** (Zahnradsymbol) oder drücken Sie:
   - **Windows/Linux:** `Ctrl+,`
   - **macOS:** `Cmd+,`
2. Gehen Sie zur Registerkarte **API Settings**
3. Fügen Sie Ihren Numista-API-Schlüssel ein
4. Klicken Sie auf **Save**

**Noch kein API-Schlüssel?** Erhalten Sie einen kostenlos auf [numista.com](https://www.numista.com/) → Profil → API-Zugang

---

## Schritt 2: Ihre Sammlung öffnen

1. Klicken Sie auf **File → Open Collection** oder drücken Sie:
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Navigieren Sie zu Ihrer OpenNumismat-`.db`-Datei
3. Klicken Sie auf **Open**
4. Ihre Münzen werden im Hauptfenster geladen

**Tipp:** NumiSync merkt sich zuletzt geöffnete Sammlungen. Nutzen Sie **File → Recent Collections** für schnellen Zugriff.

---

## Schritt 3: Nach Treffern suchen

### Zu bereichernde Münzen auswählen

Sie können Münzen einzeln oder in Stapeln bereichern:

- **Einzelne Münze:** Klicken Sie auf eine Münzzeile, um sie auszuwählen
- **Mehrere Münzen:** Halten Sie die Modifikatortaste gedrückt und klicken Sie auf mehrere Zeilen
  - **Windows/Linux:** `Ctrl+Klick`
  - **macOS:** `Cmd+Klick`
- **Bereich:** Klicken Sie auf die erste Münze, halten Sie `Umschalt` gedrückt, klicken Sie auf die letzte Münze
- **Alle Münzen:** Alle auswählen
  - **Windows/Linux:** `Ctrl+A`
  - **macOS:** `Cmd+A`

### Suche starten

1. Klicken Sie auf die Schaltfläche **Search & Enrich** (oder drücken Sie `F2`)
2. NumiSync sucht auf Numista für jede ausgewählte Münze
3. Der Fortschrittsanzeiger zeigt den aktuellen Status

**Was passiert:**
- Suche nach Denomination, Land, Jahr, Münzzeichen
- Verarbeitet Variationen (z. B. "Cent" vs. "Cents", "USA" vs. "United States")
- Unterstützt nicht-gregorianische Kalender (Meiji-Jahre, Hijri-Jahre usw.)
- Verwendet zwischengespeicherte Ergebnisse, wenn verfügbar (schneller!)

---

## Schritt 4: Treffer überprüfen

### Treffergebnisse verstehen

Nach der Suche zeigt jede Münze einen von drei Status:

- **Match Found** - Numista-Katalogeintrag gefunden
- **Multiple Matches** - Mehrere Möglichkeiten (manuelle Auswahl erforderlich)
- **No Match** - Kein Katalogeintrag gefunden (manuelle Suche versuchen)

### Feldvergleich anzeigen

1. Klicken Sie auf eine Münze mit einem Treffer
2. Das **Feldvergleichs-Panel** zeigt:
   - **Linke Spalte:** Ihre vorhandenen Daten
   - **Rechte Spalte:** Numista-Katalogdaten
   - **Unterschiede farblich hervorgehoben**
3. Überprüfen Sie, was sich ändern wird

---

## Schritt 5: Treffer akzeptieren oder verfeinern

### Alle Änderungen akzeptieren

Wenn der Treffer korrekt aussieht:
1. Klicken Sie auf die Schaltfläche **Accept Match** (oder drücken Sie `Enter`)
2. Alle Numista-Daten aktualisieren Ihre Münze sofort
3. Münze als angereichert markiert

### Einzelne Felder auswählen

Um nur bestimmte Felder zu aktualisieren:
1. Entfernen Sie im Feldvergleichs-Panel das Häkchen bei Feldern, die Sie nicht aktualisieren möchten
2. Klicken Sie auf **Accept Match**
3. Nur markierte Felder werden aktualisiert

### Eine andere Emission auswählen

Viele Münzen haben mehrere Emissionen (Jahre, Münzzeichen, Typen):

1. Klicken Sie auf die Schaltfläche **Choose Issue**
2. Der **Issue Picker**-Dialog zeigt alle Varianten
3. Wählen Sie die richtige Emission für Ihre Münze aus
4. Der Feldvergleich wird mit den Daten dieser Emission aktualisiert
5. Klicken Sie auf **Accept Match**

### Manuelle Suche

Wenn automatisch kein Treffer gefunden wurde:
1. Klicken Sie auf die Schaltfläche **Manual Search** oder drücken Sie:
   - **Windows/Linux:** `Ctrl+F`
   - **macOS:** `Cmd+F`
2. Ändern Sie Suchparameter (Denomination, Jahr, Land)
3. Klicken Sie auf **Search**
4. Durchsuchen Sie Ergebnisse und wählen Sie den richtigen Eintrag aus
5. Klicken Sie auf **Accept Match**

---

## Schritt 6: Bilder herunterladen (Optional)

### Automatischer Bilddownload

Wenn **Data Settings → Images** aktiviert ist:
- Bilder werden automatisch heruntergeladen, wenn Sie einen Treffer akzeptieren
- Avers-, Revers- und Randbilder (sofern verfügbar)
- Im Bildverzeichnis von OpenNumismat gespeichert

### Manueller Bilddownload

1. Wählen Sie eine angereicherte Münze aus
2. Klicken Sie auf die Schaltfläche **Download Images**
3. Wählen Sie, welche Bilder heruntergeladen werden sollen (Avers, Revers, Rand)
4. Klicken Sie auf **Download**

**Tipp:** Verwenden Sie den **Bildvergleich**, um vor der Übernahme eine Vorschau anzuzeigen

---

## Übliche Arbeitsabläufe

### Arbeitsablauf 1: Eine neue Sammlung anreichern

1. Öffnen Sie eine Sammlung mit vielen nicht angereicherten Münzen
2. Alle Münzen auswählen (`Ctrl+A`)
3. Klicken Sie auf **Search & Enrich** (oder drücken Sie `F2`)
4. Treffer einzeln überprüfen
5. Treffer akzeptieren, während Sie voranschreiten
6. Manuelle Suche für Münzen ohne Treffer verwenden

**Zeitersparnis:** 2-3 Minuten pro Münze → 10-15 Sekunden pro Münze

### Arbeitsablauf 2: Nur Preise aktualisieren

1. Gehen Sie zu **Settings → Data Settings**
2. Deaktivieren Sie **Basic** und **Issue** (lassen Sie **Pricing** aktiviert)
3. Zu aktualisierende Münzen auswählen
4. Klicken Sie auf **Search & Enrich**
5. Treffer akzeptieren (nur Preise werden aktualisiert)

**Profi-Tipp:** Holen Sie sich eine [Supporter-Lizenz](#), um den **Fast Pricing Mode** zu verwenden - aktualisiert alle übereinstimmenden Münzen sofort!

### Arbeitsablauf 3: Falsche Treffer korrigieren

1. Wählen Sie eine Münze mit falschen Daten aus
2. Klicken Sie auf **Manual Search**
3. Finden Sie den richtigen Katalogeintrag
4. Treffer akzeptieren
5. Alte Daten werden überschrieben

**Tipp:** Verwenden Sie die **Field Comparison**, um vor der Übernahme zu überprüfen

---

## Tipps für beste Ergebnisse

### Suchtipps

**Bewährte Vorgehensweisen:**
- Beginnen Sie mit Münzen, die vollständige Informationen haben (Jahr, Land, Denomination)
- Verwenden Sie Standard-Denominationsabkürzungen ("1 Cent" statt "1c")
- Lassen Sie NumiSync Denominationen automatisch normalisieren

**Vermeiden Sie:**
- Münzen mit fehlenden kritischen Feldern suchen (Land, Denomination)
- Suchanfragen manuell bearbeiten, außer wenn notwendig
- Den ersten Treffer als korrekt annehmen - immer überprüfen!

### Datenqualität

**Bewährte Vorgehensweisen:**
- Feldvergleich vor der Übernahme überprüfen
- Issue Picker verwenden, wenn mehrere Varianten existieren
- Überprüfen, ob Bilder zu Ihrer physischen Münze passen

**Vermeiden Sie:**
- Alle Treffer blind akzeptieren
- Gute Daten mit unvollständigen Katalogdaten überschreiben
- Vergessen, Ihre Sammlung vorher zu sichern!

### Leistung

**Bewährte Vorgehensweisen:**
- Caching aktivieren (Settings → General → Cache)
- In Stapeln von 10-20 Münzen arbeiten
- Fast Pricing Mode für große Aktualisierungen verwenden (Supporter-Lizenz)

**Vermeiden Sie:**
- 1000+ Münzen auf einmal suchen (respektiert Ratenlimits, aber langsam)
- Caching deaktivieren (verschwendet API-Aufrufe)
- Dieselbe Münze mehrfach suchen (Cache verwenden)

---

## Tastaturkürzel

**Windows/Linux:**
- `Ctrl+O` - Sammlung öffnen
- `F2` - Search & Enrich für ausgewählte Münzen
- `Ctrl+F` - Manuelle Suche
- `Enter` - Treffer akzeptieren
- `Escape` - Abbrechen/Dialog schließen
- `Ctrl+A` - Alle Münzen auswählen
- `Ctrl+,` - Einstellungen öffnen
- `F1` - Hilfe öffnen

**macOS:**
- `Cmd+O` - Sammlung öffnen
- `F2` - Search & Enrich für ausgewählte Münzen
- `Cmd+F` - Manuelle Suche
- `Enter` - Treffer akzeptieren
- `Escape` - Abbrechen/Dialog schließen
- `Cmd+A` - Alle Münzen auswählen
- `Cmd+,` - Einstellungen öffnen
- `F1` - Hilfe öffnen

---

## Was kommt als Nächstes?

### Premium-Funktionen erkunden

Holen Sie sich eine **[Supporter-Lizenz (10 $)](#)**, um freizuschalten:
- **Fast Pricing Mode** - Massenaktualisierung von Preisen für alle übereinstimmenden Münzen
- **Auto-Propagate** - Typendaten automatisch auf übereinstimmende Münzen anwenden
- **Keine lästigen Hinweisfenster mehr!**

### Erweiterte Funktionen

- **Field Mapping** - Anpassen, wie Numista-Daten auf Ihre Felder abgebildet werden
- **Stapelverarbeitung** - Hunderte von Münzen effizient verarbeiten
- **Multi-Rechner-Unterstützung** - Cache über Geräte teilen
- **Benutzerdefinierter Cache-Speicherort** - Cache auf Netzlaufwerk speichern

### Mehr erfahren

- **[Benutzerhandbuch](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Vollständige Funktionsdokumentation
- **[FAQ](#)** - Häufig gestellte Fragen
- **[Video-Tutorials](#)** - Demnächst verfügbar!

---

## Hilfe benötigt?

### Häufige Probleme

**F: Warum wurde meine Münze nicht gefunden?**
- A: Land oder Denomination benötigt möglicherweise Normalisierung. Probieren Sie die manuelle Suche mit Variationen.

**F: Warum aktualisieren sich einige Felder nicht?**
- A: Prüfen Sie **Data Settings** - einige Datenkategorien könnten deaktiviert sein.

**F: Kann ich einen akzeptierten Treffer rückgängig machen?**
- A: Nicht automatisch. Stellen Sie aus einer Sicherungskopie wieder her oder korrigieren Sie die Daten manuell.

**F: Wie aktualisiere ich Preise, ohne andere Felder zu ändern?**
- A: Settings → Data Settings → Basic und Issue deaktivieren, Pricing aktiviert lassen.

**F: Was passiert, wenn ich eine Münze zweimal suche?**
- A: NumiSync verwendet zwischengespeicherte Ergebnisse (sofort), außer wenn Sie auf "Refresh from API" klicken.

### Unterstützung erhalten

- **Probleme:** [Auf GitHub melden](https://github.com/inguy24/numismat-enrichment/issues)
- **Diskussionen:** [Community fragen](https://github.com/inguy24/numismat-enrichment/discussions)
- **Dokumentation:** [Vollständige Dokumentation](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/de/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← Installationshandbuch</a>
  <a href="/de/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Zurück zur Startseite</a>
</div>
