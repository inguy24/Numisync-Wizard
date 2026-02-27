---
layout: default
title: Gabay sa Mabilis na Pagsisimula
lang: tl
page_id: quickstart
---

# Gabay sa Mabilis na Pagsisimula

Magsimula sa NumiSync Wizard sa loob ng 5 minuto. Ang gabay na ito ay nagbibigay ng pangunahing workflow ng pagyayaman ng iyong koleksyon ng barya.

**Tandaan sa Platform:** Ang gabay na ito ay gumagana para sa Windows, macOS, at Linux. Ang mga keyboard shortcut ay ipinapakita para sa lahat ng platform kung saan nagkakaiba ang mga ito.

---

## Mga Paunang Kinakailangan

Bago magsimula, tiyaking mayroon kang:

- **NumiSync Wizard na naka-install** ([Gabay sa Pag-install](/tl/installation))
- **Koleksyon ng OpenNumismat** (file na .db na may ilang barya)
- **Numista API key** (libre mula sa [numista.com](https://www.numista.com/))

---

## Hakbang 1: Ilunsad at I-configure

### Buksan ang NumiSync Wizard

1. Ilunsad ang NumiSync Wizard:
   - **Windows:** Start Menu o desktop shortcut
   - **macOS:** Folder na Applications o Launchpad
   - **Linux:** Menu ng mga aplikasyon o patakbuhin ang `numisync-wizard` (kung naka-install sa pamamagitan ng .deb/.rpm)
2. Awtomatikong lilikha ng direktoryo ng cache ang unang paglulunsad

### Idagdag ang Iyong API Key

1. I-click ang **Settings** (icon ng gear) o pindutin ang:
   - **Windows/Linux:** `Ctrl+,`
   - **macOS:** `Cmd+,`
2. Pumunta sa tab na **API Settings**
3. I-paste ang iyong Numista API key
4. I-click ang **Save**

**Wala pang API key?** Kumuha ng libre sa [numista.com](https://www.numista.com/) → Profile → API Access

---

## Hakbang 2: Buksan ang Iyong Koleksyon

1. I-click ang **File → Open Collection** o pindutin ang:
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Pumunta sa iyong file na `.db` ng OpenNumismat
3. I-click ang **Open**
4. Mag-lo-load ang iyong mga barya sa pangunahing window

**Tip:** Naaalaala ng NumiSync ang mga kamakailang koleksyon. Gamitin ang **File → Recent Collections** para sa mabilis na pag-access.

---

## Hakbang 3: Maghanap ng Mga Tugma

### Pumili ng Mga Barya para Payamanin

Maaari kang magpayaman ng mga barya nang isa-isa o sa mga batch:

- **Isang barya:** I-click ang isang row ng barya upang piliin ito
- **Maramihang barya:** Hawakan ang modifier key at i-click ang maraming row
  - **Windows/Linux:** `Ctrl+Click`
  - **macOS:** `Cmd+Click`
- **Saklaw:** I-click ang unang barya, hawakan ang `Shift`, i-click ang huling barya
- **Lahat ng barya:** Piliin lahat
  - **Windows/Linux:** `Ctrl+A`
  - **macOS:** `Cmd+A`

### Simulan ang Paghahanap

1. I-click ang button na **Search & Enrich** (o pindutin ang `F2`)
2. Maghahanap ang NumiSync sa Numista para sa bawat napiling barya
3. Ipinapakita ng indicator ng progreso ang kasalukuyang status

**Ano ang nangyayari:**
- Naghahanap gamit ang denominasyon, bansa, taon, mint mark
- Hinahawakan ang mga variation (hal., "Cent" kumpara sa "Cents", "USA" kumpara sa "United States")
- Sumusuporta sa mga kalendaryo na hindi Gregoriano (mga taon ng Meiji, mga taon ng Hijri, atbp.)
- Gumagamit ng mga naka-cache na resulta kapag available (mas mabilis!)

---

## Hakbang 4: Suriin ang Mga Tugma

### Pag-unawa sa Mga Resulta ng Paghahanap

Pagkatapos maghanap, ang bawat barya ay nagpapakita ng isa sa tatlong status:

- **Match Found** - Nahanap ang entry sa katalogo ng Numista
- **Multiple Matches** - Maraming posibilidad (kinakailangan ang manu-manong pagpili)
- **No Match** - Walang nahanap na entry sa katalogo (subukan ang manu-manong paghahanap)

### Tingnan ang Paghahambing ng Field

1. I-click ang isang barya na may tugma
2. Ipinapakita ng **Field Comparison Panel** ang:
   - **Kaliwang kolumna:** Iyong kasalukuyang data
   - **Kanang kolumna:** Data ng katalogo ng Numista
   - **Mga pagkakaiba na naka-highlight** sa kulay
3. Suriin kung ano ang magbabago

---

## Hakbang 5: Tanggapin o I-refine ang Mga Tugma

### Tanggapin ang Lahat ng Pagbabago

Kung maganda ang hitsura ng tugma:
1. I-click ang button na **Accept Match** (o pindutin ang `Enter`)
2. Lahat ng data ng Numista ay agarang ina-update ang iyong barya
3. Minarkahan ang barya bilang pinayaman

### Pumili ng Mga Field Nang Isa-isa

Upang i-update lamang ang mga partikular na field:
1. Sa Field Comparison Panel, **alisin ang tsek** sa mga field na hindi mo gustong i-update
2. I-click ang **Accept Match**
3. Ang mga naka-check na field lamang ang maa-update

### Pumili ng Ibang Isyu

Maraming barya ang may maraming isyu (mga taon, mint mark, mga uri):

1. I-click ang button na **Choose Issue**
2. Ipinapakita ng **Issue Picker Dialog** ang lahat ng variant
3. Piliin ang tamang isyu para sa iyong barya
4. Ina-update ang paghahambing ng field gamit ang data ng isyung iyon
5. I-click ang **Accept Match**

### Manu-manong Paghahanap

Kung walang nahanap na tugma nang awtomatiko:
1. I-click ang button na **Manual Search** o pindutin ang:
   - **Windows/Linux:** `Ctrl+F`
   - **macOS:** `Cmd+F`
2. Baguhin ang mga parameter ng paghahanap (denominasyon, taon, bansa)
3. I-click ang **Search**
4. Mag-browse sa mga resulta at piliin ang tamang entry
5. I-click ang **Accept Match**

---

## Hakbang 6: Mag-download ng Mga Larawan (Opsyonal)

### Awtomatikong Pag-download ng Larawan

Kung ang **Data Settings → Images** ay pinagana:
- Awtomatikong dina-download ang mga larawan kapag tinanggap mo ang isang tugma
- Mga larawan ng harap, likod, at gilid (kung available)
- Iniimbak sa direktoryo ng larawan ng OpenNumismat

### Manu-manong Pag-download ng Larawan

1. Pumili ng isang pinayamang barya
2. I-click ang button na **Download Images**
3. Piliin kung aling mga larawan ang ida-download (harap, likod, gilid)
4. I-click ang **Download**

**Tip:** Gamitin ang **Image Comparison** upang i-preview bago tanggapin

---

## Mga Karaniwang Workflow

### Workflow 1: Payamanin ang Bagong Koleksyon

1. Buksan ang koleksyon na may maraming hindi pinayamang barya
2. Piliin ang lahat ng barya (`Ctrl+A`)
3. I-click ang **Search & Enrich** (o pindutin ang `F2`)
4. Suriin ang mga tugma nang isa-isa
5. Tanggapin ang mga tugma habang nagpapatuloy
6. Gamitin ang manu-manong paghahanap para sa mga barya na walang tugma

**Nakatipid ng oras:** 2-3 minuto bawat barya → 10-15 segundo bawat barya

### Workflow 2: I-update Lamang ang Presyo

1. Pumunta sa **Settings → Data Settings**
2. Alisin ang tsek sa **Basic** at **Issue** (iwanan ang **Pricing** na may tsek)
3. Piliin ang mga barya na ia-update
4. I-click ang **Search & Enrich**
5. Tanggapin ang mga tugma (ang mga presyo lamang ang maa-update)

**Pro Tip:** Kumuha ng [Supporter License](/tl/license) upang gamitin ang **Fast Pricing Mode** — agarang ina-update ang lahat ng naitugmang barya!

### Workflow 3: Ayusin ang Maling Mga Tugma

1. Pumili ng isang barya na may maling data
2. I-click ang **Manual Search**
3. Hanapin ang tamang entry sa katalogo
4. Tanggapin ang tugma
5. Nao-overwrite ang lumang data

**Tip:** Gamitin ang **Field Comparison** upang i-verify bago tanggapin

---

## Mga Tip para sa Pinakamahusay na Resulta

### Mga Tip sa Paghahanap

**Pinakamahusay na Gawi:**
- Magsimula sa mga barya na may kumpletong impormasyon (taon, bansa, denominasyon)
- Gumamit ng mga karaniwang abbreviation ng denominasyon ("1 Cent" hindi "1c")
- Hayaan ang NumiSync na awtomatikong i-normalize ang mga denominasyon

**Iwasan:**
- Paghahanap ng mga barya na may nawawalang kritikal na field (bansa, denominasyon)
- Manu-manong pag-edit ng mga parameter ng paghahanap malibang kinakailangan
- Pag-aakala na ang unang tugma ay tama — palaging i-verify!

### Kalidad ng Data

**Pinakamahusay na Gawi:**
- Suriin ang Field Comparison bago tanggapin
- Gamitin ang Issue Picker kapag may maraming variant na umiiral
- I-verify na ang mga larawan ay tumutugma sa iyong pisikal na barya

**Iwasan:**
- Bulag na pagtanggap ng lahat ng mga tugma
- Pag-overwrite ng magandang data gamit ang hindi kumpleto na data ng katalogo
- Pagkalimot na i-back up muna ang iyong koleksyon!

### Performance

**Pinakamahusay na Gawi:**
- Paganahin ang caching (Settings → General → Cache)
- Magtrabaho sa mga batch na 10-20 barya
- Gamitin ang Fast Pricing Mode para sa malalaking update (Supporter License)

**Iwasan:**
- Paghahanap ng 1000+ barya nang sabay-sabay (gumagalang sa mga limitasyon ng rate, ngunit mabagal)
- Pag-disable ng caching (nasasayang ang mga API call)
- Paulit-ulit na paghahanap ng parehong barya (gamitin ang cache)

---

## Mga Keyboard Shortcut

**Windows/Linux:**
- `Ctrl+O` - Buksan ang koleksyon
- `F2` - Search & Enrich sa mga napiling barya
- `Ctrl+F` - Manu-manong paghahanap
- `Enter` - Tanggapin ang tugma
- `Escape` - Kanselahin/Isara ang dialog
- `Ctrl+A` - Piliin ang lahat ng barya
- `Ctrl+,` - Buksan ang mga setting
- `F1` - Buksan ang tulong

**macOS:**
- `Cmd+O` - Buksan ang koleksyon
- `F2` - Search & Enrich sa mga napiling barya
- `Cmd+F` - Manu-manong paghahanap
- `Enter` - Tanggapin ang tugma
- `Escape` - Kanselahin/Isara ang dialog
- `Cmd+A` - Piliin ang lahat ng barya
- `Cmd+,` - Buksan ang mga setting
- `F1` - Buksan ang tulong

---

## Ano ang Susunod?

### I-explore ang Mga Premium na Tampok

Kumuha ng **[Supporter License ($10)](/tl/license)** upang i-unlock ang:
- **Fast Pricing Mode** - Batch update ng presyo para sa lahat ng naitugmang barya
- **Auto-Propagate** - Awtomatikong ilapat ang data ng uri sa mga katugmang barya
- **Walang mga nag prompt na!**

### Mga Advanced na Tampok

- **Field Mapping** - I-customize kung paano nag-map ang data ng Numista sa iyong mga field
- **Mga Batch Operation** - Iproseso nang mahusay ang daan-daang barya
- **Multi-Machine Support** - Ibahagi ang cache sa mga device
- **Custom Cache Location** - Iimbak ang cache sa network drive

### Matuto pa

- **[User Manual](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Kumpletong dokumentasyon ng tampok
- **[FAQ](#)** - Mga karaniwang tanong na nasagot
- **[Mga Video Tutorial](#)** - Malapit na!

---

## Kailangan ng Tulong?

### Mga Karaniwang Isyu

**T: Bakit hindi natugma ang aking barya?**
- S: Ang bansa o denominasyon ay maaaring kailangan ng normalisasyon. Subukan ang manu-manong paghahanap na may mga variation.

**T: Bakit hindi naa-update ang ilang field?**
- S: Suriin ang **Data Settings** — ang ilang kategorya ng data ay maaaring naka-disable.

**T: Maaari ko bang i-undo ang isang tinanggap na tugma?**
- S: Hindi awtomatiko. Mag-restore mula sa isang backup o manu-manong i-revert ang data.

**T: Paano ko ia-update lamang ang presyo nang hindi binabago ang ibang mga field?**
- S: Settings → Data Settings → Alisin ang tsek sa Basic at Issue, iwanan ang Pricing na may tsek.

**T: Ano ang mangyayari kung maghanap ako ng parehong barya nang dalawang beses?**
- S: Gumagamit ang NumiSync ng mga naka-cache na resulta (agaran) malibang i-click mo ang "Refresh from API".

### Kumuha ng Suporta

- **Mga Isyu:** [Iulat sa GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Mga Talakayan:** [Tanungin ang komunidad](https://github.com/inguy24/numismat-enrichment/discussions)
- **Dokumentasyon:** [Kumpletong docs](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/tl/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← Gabay sa Pag-install</a>
  <a href="/tl/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Bumalik sa Home</a>
</div>
