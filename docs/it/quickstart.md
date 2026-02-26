---
layout: default
title: Guida Rapida
lang: it
page_id: quickstart
---

# Guida Rapida

Inizia a usare NumiSync Wizard in 5 minuti. Questa guida ti accompagna passo dopo passo nel flusso di lavoro di base per arricchire la tua collezione di monete.

**Nota sulle piattaforme:** Questa guida è valida per Windows, macOS e Linux. Le scorciatoie da tastiera sono indicate per tutte le piattaforme dove differiscono.

---

## Prerequisiti

Prima di iniziare, assicurati di avere:

- **NumiSync Wizard installato** ([Guida all'Installazione](/it/installation))
- **Collezione di OpenNumismat** (file .db con alcune monete)
- **Chiave API di Numista** (gratuita da [numista.com](https://www.numista.com/))

---

## Passaggio 1: Avvio e Configurazione

### Apri NumiSync Wizard

1. Avvia NumiSync Wizard:
   - **Windows:** Menu Start o collegamento sul desktop
   - **macOS:** Cartella Applicazioni o Launchpad
   - **Linux:** Menu delle applicazioni o esegui `numisync-wizard` (se installato tramite .deb/.rpm)
2. Il primo avvio creerà automaticamente una directory cache

### Aggiungi la Tua Chiave API

1. Clicca su **Settings** (icona dell'ingranaggio) o premi:
   - **Windows/Linux:** `Ctrl+,`
   - **macOS:** `Cmd+,`
2. Vai alla scheda **API Settings**
3. Incolla la tua chiave API di Numista
4. Clicca su **Save**

**Non hai una chiave API?** Ottienila gratuitamente su [numista.com](https://www.numista.com/) → Profilo → Accesso API

---

## Passaggio 2: Apri la Tua Collezione

1. Clicca su **File → Open Collection** o premi:
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Naviga fino al tuo file `.db` di OpenNumismat
3. Clicca su **Open**
4. Le tue monete verranno caricate nella finestra principale

**Suggerimento:** NumiSync ricorda le collezioni recenti. Usa **File → Recent Collections** per un accesso rapido.

---

## Passaggio 3: Cerca le Corrispondenze

### Seleziona le Monete da Arricchire

Puoi arricchire le monete una alla volta o in gruppi:

- **Moneta singola:** Clicca su una riga per selezionarla
- **Più monete:** Tieni premuto il tasto modificatore e clicca su più righe
  - **Windows/Linux:** `Ctrl+Clic`
  - **macOS:** `Cmd+Clic`
- **Intervallo:** Clicca sulla prima moneta, tieni premuto `Shift`, clicca sull'ultima
- **Tutte le monete:** Seleziona tutto
  - **Windows/Linux:** `Ctrl+A`
  - **macOS:** `Cmd+A`

### Avvia la Ricerca

1. Clicca sul pulsante **Search & Enrich** (o premi `F2`)
2. NumiSync cercherà su Numista ogni moneta selezionata
3. L'indicatore di avanzamento mostra lo stato corrente

**Cosa succede:**
- Cerca usando denominazione, paese, anno e segno di zecca
- Gestisce le variazioni (es. "Cent" vs "Cents", "Italia" vs "Italy")
- Supporta calendari non gregoriani (anni Meiji, anni Hijri, ecc.)
- Usa risultati in cache quando disponibili (più veloce!)

---

## Passaggio 4: Esamina le Corrispondenze

### Capire i Risultati della Ricerca

Dopo la ricerca, ogni moneta mostra uno di tre stati:

- **Match Found** - Trovata una voce nel catalogo di Numista
- **Multiple Matches** - Diverse possibilità (è necessaria la selezione manuale)
- **No Match** - Nessuna voce trovata (prova la ricerca manuale)

### Visualizza il Confronto dei Campi

1. Clicca su una moneta con corrispondenza
2. Il **Field Comparison Panel** mostra:
   - **Colonna sinistra:** I tuoi dati esistenti
   - **Colonna destra:** Dati del catalogo di Numista
   - **Differenze evidenziate** a colori
3. Esamina cosa verrà modificato

---

## Passaggio 5: Accetta o Affina le Corrispondenze

### Accetta Tutte le Modifiche

Se la corrispondenza sembra corretta:
1. Clicca sul pulsante **Accept Match** (o premi `Enter`)
2. Tutti i dati di Numista aggiornano immediatamente la tua moneta
3. La moneta viene contrassegnata come arricchita

### Selezione dei Campi Individuali

Per aggiornare solo campi specifici:
1. Nel Field Comparison Panel, **deseleziona** i campi che non vuoi aggiornare
2. Clicca su **Accept Match**
3. Verranno aggiornati solo i campi selezionati

### Scegli un'Emissione Diversa

Molte monete hanno più emissioni (anni, segni di zecca, tipi):

1. Clicca sul pulsante **Choose Issue**
2. La finestra **Issue Picker Dialog** mostra tutte le varianti
3. Seleziona l'emissione corretta per la tua moneta
4. Il confronto dei campi si aggiorna con i dati di quell'emissione
5. Clicca su **Accept Match**

### Ricerca Manuale

Se non è stata trovata nessuna corrispondenza automaticamente:
1. Clicca sul pulsante **Manual Search** o premi:
   - **Windows/Linux:** `Ctrl+F`
   - **macOS:** `Cmd+F`
2. Modifica i parametri di ricerca (denominazione, anno, paese)
3. Clicca su **Search**
4. Sfoglia i risultati e seleziona la voce corretta
5. Clicca su **Accept Match**

---

## Passaggio 6: Scarica le Immagini (Opzionale)

### Download Automatico delle Immagini

Se **Data Settings → Images** è abilitato:
- Le immagini vengono scaricate automaticamente quando accetti una corrispondenza
- Immagini di dritto, rovescio e taglio (se disponibili)
- Memorizzate nella directory immagini di OpenNumismat

### Download Manuale delle Immagini

1. Seleziona una moneta arricchita
2. Clicca sul pulsante **Download Images**
3. Scegli quali immagini scaricare (dritto, rovescio, taglio)
4. Clicca su **Download**

**Suggerimento:** Usa **Image Comparison** per l'anteprima prima di accettare

---

## Flussi di Lavoro Comuni

### Flusso 1: Arricchire una Nuova Collezione

1. Apri la collezione con molte monete non arricchite
2. Seleziona tutte le monete (`Ctrl+A`)
3. Clicca su **Search & Enrich** (o premi `F2`)
4. Esamina le corrispondenze una per una
5. Accetta le corrispondenze man mano che procedi
6. Usa la ricerca manuale per le monete senza corrispondenza

**Risparmio di tempo:** da 2-3 minuti per moneta a 10-15 secondi per moneta

### Flusso 2: Aggiornare Solo i Prezzi

1. Vai su **Settings → Data Settings**
2. Deseleziona **Basic** e **Issue** (lascia **Pricing** selezionato)
3. Seleziona le monete da aggiornare
4. Clicca su **Search & Enrich**
5. Accetta le corrispondenze (vengono aggiornati solo i prezzi)

**Consiglio Pro:** Ottieni una [Licenza Supporter](/it/license) per usare **Fast Pricing Mode** — aggiorna tutte le monete abbinate istantaneamente!

### Flusso 3: Correggere Corrispondenze Errate

1. Seleziona una moneta con dati errati
2. Clicca su **Manual Search**
3. Trova la voce corretta del catalogo
4. Accetta la corrispondenza
5. I vecchi dati vengono sovrascritti

**Suggerimento:** Usa **Field Comparison** per verificare prima di accettare

---

## Consigli per i Migliori Risultati

### Consigli per la Ricerca

**Buone pratiche:**
- Inizia con monete che hanno informazioni complete (anno, paese, denominazione)
- Usa abbreviazioni di denominazione standard ("1 Cent" non "1c")
- Lascia che NumiSync normalizzi le denominazioni automaticamente

**Evita:**
- Cercare monete con campi critici mancanti (paese, denominazione)
- Modificare manualmente le query di ricerca a meno che non sia necessario
- Dare per scontato che la prima corrispondenza sia corretta — verifica sempre!

### Qualità dei Dati

**Buone pratiche:**
- Esamina il confronto dei campi prima di accettare
- Usa l'Issue Picker quando esistono più varianti
- Verifica che le immagini corrispondano alla tua moneta fisica

**Evita:**
- Accettare ciecamente tutte le corrispondenze
- Sovrascrivere buoni dati con dati incompleti del catalogo
- Dimenticare di fare un backup della tua collezione prima!

### Prestazioni

**Buone pratiche:**
- Abilita la cache (Settings → General → Cache)
- Lavora in gruppi di 10-20 monete
- Usa Fast Pricing Mode per aggiornamenti di grandi dimensioni (Licenza Supporter)

**Evita:**
- Cercare più di 1000 monete in una volta (rispetta i limiti di velocità, ma è lento)
- Disabilitare la cache (spreca chiamate API)
- Cercare la stessa moneta ripetutamente (usa la cache)

---

## Scorciatoie da Tastiera

**Windows/Linux:**
- `Ctrl+O` - Apri collezione
- `F2` - Search & Enrich delle monete selezionate
- `Ctrl+F` - Ricerca manuale
- `Enter` - Accetta corrispondenza
- `Escape` - Annulla/Chiudi finestra di dialogo
- `Ctrl+A` - Seleziona tutte le monete
- `Ctrl+,` - Apri impostazioni
- `F1` - Apri guida

**macOS:**
- `Cmd+O` - Apri collezione
- `F2` - Search & Enrich delle monete selezionate
- `Cmd+F` - Ricerca manuale
- `Enter` - Accetta corrispondenza
- `Escape` - Annulla/Chiudi finestra di dialogo
- `Cmd+A` - Seleziona tutte le monete
- `Cmd+,` - Apri impostazioni
- `F1` - Apri guida

---

## Cosa fare dopo?

### Esplora le Funzioni Premium

Ottieni una **[Licenza Supporter ($10)](/it/license)** per sbloccare:
- **Fast Pricing Mode** - Aggiornamento massivo dei prezzi per tutte le monete abbinate
- **Auto-Propagate** - Applica i dati di tipo alle monete corrispondenti automaticamente
- **Niente più notifiche fastidiose!**

### Funzioni Avanzate

- **Field Mapping** - Personalizza come i dati di Numista vengono mappati sui tuoi campi
- **Operazioni massive** - Elabora centinaia di monete in modo efficiente
- **Supporto multi-macchina** - Condividi la cache tra i dispositivi
- **Posizione cache personalizzata** - Salva la cache su un'unità di rete

### Scopri di più

- **[Manuale utente](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Documentazione completa delle funzioni
- **[FAQ](#)** - Risposte alle domande frequenti
- **[Video Tutorial](#)** - Prossimamente!

---

## Hai Bisogno di Aiuto?

### Problemi Comuni

**D: Perché la mia moneta non ha trovato corrispondenze?**
- R: Il paese o la denominazione potrebbero richiedere normalizzazione. Prova la ricerca manuale con variazioni.

**D: Perché alcuni campi non si aggiornano?**
- R: Controlla **Data Settings** — alcune categorie di dati potrebbero essere disabilitate.

**D: Posso annullare una corrispondenza accettata?**
- R: Non automaticamente. Ripristina da un backup o ripristina manualmente i dati.

**D: Come aggiorno i prezzi senza cambiare altri campi?**
- R: Settings → Data Settings → Deseleziona Basic e Issue, lascia Pricing selezionato.

**D: Cosa succede se cerco una moneta due volte?**
- R: NumiSync usa i risultati in cache (immediato) a meno che tu non clicchi su "Refresh from API".

### Ottieni Supporto

- **Problemi:** [Segnala su GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussioni:** [Chiedi alla comunità](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentazione:** [Documentazione completa](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/it/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← Guida all'Installazione</a>
  <a href="/it/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Torna alla home</a>
</div>
