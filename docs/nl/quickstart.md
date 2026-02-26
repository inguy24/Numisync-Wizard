---
layout: default
title: Snelstartgids
lang: nl
page_id: quickstart
---

# Snelstartgids

Aan de slag met NumiSync Wizard in 5 minuten. Deze gids leidt u door de basisworkflow voor het verrijken van uw muntencollectie.

**Platformopmerking:** Deze gids werkt voor Windows, macOS en Linux. Sneltoetsen worden voor alle platforms weergegeven waar ze verschillen.

---

## Vereisten

Zorg er voor het beginnen voor dat u het volgende heeft:

- **NumiSync Wizard geïnstalleerd** ([Installatiegids](/nl/installation))
- **OpenNumismat-collectie** (.db-bestand met enkele munten)
- **Numista API-sleutel** (gratis via [numista.com](https://www.numista.com/))

---

## Stap 1: Starten en Configureren

### NumiSync Wizard Openen

1. Start NumiSync Wizard:
   - **Windows:** Startmenu of bureaubladsnelkoppeling
   - **macOS:** Map Programma's of Launchpad
   - **Linux:** Programmamenu of voer `numisync-wizard` uit (indien geïnstalleerd via .deb/.rpm)
2. De eerste start maakt automatisch een cachedirectory aan

### Uw API-sleutel Toevoegen

1. Klik op **Settings** (tandwielpictogram) of druk op:
   - **Windows/Linux:** `Ctrl+,`
   - **macOS:** `Cmd+,`
2. Ga naar het tabblad **API Settings**
3. Plak uw Numista API-sleutel
4. Klik op **Save**

**Heeft u geen API-sleutel?** Haal er gratis een op via [numista.com](https://www.numista.com/) → Profiel → API-toegang

---

## Stap 2: Uw Collectie Openen

1. Klik op **File → Open Collection** of druk op:
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Navigeer naar uw OpenNumismat `.db`-bestand
3. Klik op **Open**
4. Uw munten worden geladen in het hoofdvenster

**Tip:** NumiSync onthoudt recente collecties. Gebruik **File → Recent Collections** voor snelle toegang.

---

## Stap 3: Zoeken naar Overeenkomsten

### Munten Selecteren om te Verrijken

U kunt munten één voor één of in batches verrijken:

- **Enkele munt:** Klik op een muntrij om deze te selecteren
- **Meerdere munten:** Houd de wijzigingstoets ingedrukt en klik op meerdere rijen
  - **Windows/Linux:** `Ctrl+Klik`
  - **macOS:** `Cmd+Klik`
- **Bereik:** Klik op de eerste munt, houd `Shift` ingedrukt, klik op de laatste munt
- **Alle munten:** Alles selecteren
  - **Windows/Linux:** `Ctrl+A`
  - **macOS:** `Cmd+A`

### Zoekopdracht Starten

1. Klik op de knop **Search & Enrich** (of druk op `F2`)
2. NumiSync zoekt bij Numista voor elke geselecteerde munt
3. De voortgangsindicator toont de huidige status

**Wat er gebeurt:**
- Zoekt op denominatie, land, jaar en muntteken
- Verwerkt variaties (bijv. "Cent" vs "Cents", "VS" vs "United States")
- Ondersteunt niet-Gregoriaanse kalenders (Meiji-jaren, Hijri-jaren, enz.)
- Gebruikt gecachede resultaten indien beschikbaar (sneller!)

---

## Stap 4: Overeenkomsten Bekijken

### Zoekresultaten Begrijpen

Na het zoeken toont elke munt een van de drie statussen:

- **Match Found** - Catalogusvermelding in Numista gevonden
- **Multiple Matches** - Meerdere mogelijkheden (handmatige selectie vereist)
- **No Match** - Geen catalogusvermelding gevonden (probeer handmatig te zoeken)

### Veldvergelijking Bekijken

1. Klik op een munt met een overeenkomst
2. Het **Field Comparison Panel** toont:
   - **Linkerkolom:** Uw bestaande gegevens
   - **Rechterkolom:** Numista-catalogusgegevens
   - **Verschillen gemarkeerd** in kleur
3. Bekijk wat er zal veranderen

---

## Stap 5: Overeenkomsten Accepteren of Verfijnen

### Alle Wijzigingen Accepteren

Als de overeenkomst er goed uitziet:
1. Klik op de knop **Accept Match** (of druk op `Enter`)
2. Alle Numista-gegevens worden onmiddellijk in uw munt bijgewerkt
3. De munt wordt gemarkeerd als verrijkt

### Velden Individueel Kiezen

Om alleen specifieke velden bij te werken:
1. Schakel in het Field Comparison Panel de velden **uit** die u niet wilt bijwerken
2. Klik op **Accept Match**
3. Alleen aangevinkte velden worden bijgewerkt

### Een Andere Uitgifte Kiezen

Veel munten hebben meerdere uitgiften (jaren, munttekens, typen):

1. Klik op de knop **Choose Issue**
2. Het **Issue Picker Dialog** toont alle varianten
3. Selecteer de juiste uitgifte voor uw munt
4. De veldvergelijking wordt bijgewerkt met de gegevens van die uitgifte
5. Klik op **Accept Match**

### Handmatig Zoeken

Als er automatisch geen overeenkomst wordt gevonden:
1. Klik op de knop **Manual Search** of druk op:
   - **Windows/Linux:** `Ctrl+F`
   - **macOS:** `Cmd+F`
2. Pas de zoekparameters aan (denominatie, jaar, land)
3. Klik op **Search**
4. Blader door de resultaten en selecteer de juiste vermelding
5. Klik op **Accept Match**

---

## Stap 6: Afbeeldingen Downloaden (Optioneel)

### Automatisch Afbeeldingen Downloaden

Als **Data Settings → Images** is ingeschakeld:
- Afbeeldingen worden automatisch gedownload wanneer u een overeenkomst accepteert
- Voorzijde-, keerzijde- en randafbeeldingen (indien beschikbaar)
- Opgeslagen in de afbeeldingsmap van OpenNumismat

### Handmatig Afbeeldingen Downloaden

1. Selecteer een verrijkte munt
2. Klik op de knop **Download Images**
3. Kies welke afbeeldingen u wilt downloaden (voorzijde, keerzijde, rand)
4. Klik op **Download**

**Tip:** Gebruik **Image Comparison** om een voorbeeld te bekijken voordat u accepteert

---

## Veelgebruikte Workflows

### Workflow 1: Een Nieuwe Collectie Verrijken

1. Open de collectie met veel niet-verrijkte munten
2. Selecteer alle munten (`Ctrl+A`)
3. Klik op **Search & Enrich** (of druk op `F2`)
4. Bekijk de overeenkomsten één voor één
5. Accepteer overeenkomsten naarmate u vordert
6. Gebruik handmatig zoeken voor munten zonder overeenkomst

**Tijdsbesparing:** 2-3 minuten per munt → 10-15 seconden per munt

### Workflow 2: Alleen Prijzen Bijwerken

1. Ga naar **Settings → Data Settings**
2. Schakel **Basic** en **Issue** uit (laat **Pricing** ingeschakeld)
3. Selecteer de bij te werken munten
4. Klik op **Search & Enrich**
5. Accepteer overeenkomsten (alleen prijzen worden bijgewerkt)

**Pro-tip:** Koop een [Supporter-licentie](/nl/license) om **Fast Pricing Mode** te gebruiken — werkt alle gematchte munten direct bij!

### Workflow 3: Onjuiste Overeenkomsten Herstellen

1. Selecteer een munt met onjuiste gegevens
2. Klik op **Manual Search**
3. Zoek de juiste catalogusvermelding
4. Accepteer de overeenkomst
5. Oude gegevens worden overschreven

**Tip:** Gebruik **Field Comparison** om te verifiëren voordat u accepteert

---

## Tips voor Beste Resultaten

### Zoektips

**Beste Praktijken:**
- Begin met munten die volledige informatie hebben (jaar, land, denominatie)
- Gebruik standaard denominatieafkortingen ("1 Cent" niet "1c")
- Laat NumiSync denominaties automatisch normaliseren

**Vermijd:**
- Munten zoeken met ontbrekende essentiële velden (land, denominatie)
- Handmatig zoekparameters aanpassen tenzij nodig
- Aannemen dat de eerste overeenkomst correct is — altijd verifiëren!

### Gegevenskwaliteit

**Beste Praktijken:**
- Bekijk de veldvergelijking voor het accepteren
- Gebruik Issue Picker als er meerdere varianten bestaan
- Controleer of afbeeldingen overeenkomen met uw fysieke munt

**Vermijd:**
- Alle overeenkomsten blindelings accepteren
- Goede gegevens overschrijven met onvolledige catalogusgegevens
- Vergeten eerst een back-up te maken van uw collectie!

### Prestaties

**Beste Praktijken:**
- Schakel caching in (Settings → General → Cache)
- Werk in batches van 10-20 munten
- Gebruik Fast Pricing Mode voor grote updates (Supporter-licentie)

**Vermijd:**
- Meer dan 1.000 munten tegelijk zoeken (respecteert tarieflimieten, maar traag)
- Caching uitschakelen (verspilt API-aanroepen)
- Dezelfde munt herhaaldelijk zoeken (gebruik de cache)

---

## Sneltoetsen

**Windows/Linux:**
- `Ctrl+O` - Collectie openen
- `F2` - Search & Enrich geselecteerde munten
- `Ctrl+F` - Handmatig zoeken
- `Enter` - Overeenkomst accepteren
- `Escape` - Annuleren/Dialoogvenster sluiten
- `Ctrl+A` - Alle munten selecteren
- `Ctrl+,` - Instellingen openen
- `F1` - Help openen

**macOS:**
- `Cmd+O` - Collectie openen
- `F2` - Search & Enrich geselecteerde munten
- `Cmd+F` - Handmatig zoeken
- `Enter` - Overeenkomst accepteren
- `Escape` - Annuleren/Dialoogvenster sluiten
- `Cmd+A` - Alle munten selecteren
- `Cmd+,` - Instellingen openen
- `F1` - Help openen

---

## Wat Nu?

### Ontdek Premiumfuncties

Koop een **[Supporter-licentie ($10)](/nl/license)** om te ontgrendelen:
- **Fast Pricing Mode** - Prijzen voor alle gematchte munten in bulk bijwerken
- **Auto-Propagate** - Typegegevens automatisch toepassen op overeenkomende munten
- **Geen herhalende meldingen meer!**

### Geavanceerde Functies

- **Field Mapping** - Pas aan hoe Numista-gegevens worden gekoppeld aan uw velden
- **Batchbewerkingen** - Honderden munten efficiënt verwerken
- **Multi-computerondersteuning** - Cache delen over apparaten
- **Aangepaste cachelocatie** - Cache opslaan op netwerkstation

### Meer Leren

- **[Gebruikershandleiding](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Volledige functiedocumentatie
- **[FAQ](#)** - Veelgestelde vragen beantwoord
- **[Videotutorials](#)** - Binnenkort beschikbaar!

---

## Hulp Nodig?

### Veelvoorkomende Problemen

**V: Waarom komt mijn munt niet overeen?**
- A: Land of denominatie heeft mogelijk normalisatie nodig. Probeer handmatig zoeken met variaties.

**V: Waarom worden sommige velden niet bijgewerkt?**
- A: Controleer **Data Settings** — sommige gegevenscategorieën zijn mogelijk uitgeschakeld.

**V: Kan ik een geaccepteerde overeenkomst ongedaan maken?**
- A: Niet automatisch. Herstel vanuit een back-up of herstel de gegevens handmatig.

**V: Hoe kan ik alleen prijzen bijwerken zonder andere velden te wijzigen?**
- A: Settings → Data Settings → Schakel Basic en Issue uit, laat Pricing ingeschakeld.

**V: Wat gebeurt er als ik een munt twee keer zoek?**
- A: NumiSync gebruikt gecachede resultaten (direct) tenzij u op "Refresh from API" klikt.

### Ondersteuning Krijgen

- **Problemen:** [Meld op GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussies:** [Vraag de gemeenschap](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentatie:** [Volledige documentatie](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/nl/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← Installatiegids</a>
  <a href="/nl/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Terug naar home</a>
</div>
