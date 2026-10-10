# CLAUDE.md — Estate OS: nalatenschap [OVERLEDENE] en administratie [PARTNER]

> Doel van deze map: alles regelen wat na het overlijden van [OVERLEDENE] moet gebeuren, zodat [PARTNER]
> financieel zeker, juridisch beschermd en praktisch ondersteund is. Daarna blijft deze map de
> doorlopende administratie van [PARTNER].
>
> Dit bestand is het geheugen van de assistent. Feiten, regels, werkwijze, termijnen en contacten staan hier.
> Lees het aan het begin van elke sessie helemaal.

---

## 0. De feiten – basis voor al het andere

Alleen bevestigde feiten. Onbekend = `?` en een vraag in sectie 9. Nooit raden.

| Onderwerp | Waarde | Bron / bevestigd door |
|---|---|---|
| Overledene | [volledige naam], geboren [datum] | |
| Datum van overlijden | [JJJJ-MM-DD] – **alle termijnen worden hiervan berekend** | akte van overlijden |
| Plaats van overlijden | [gemeente] | |
| Partner | [volledige naam], geboren [datum] | |
| Burgerlijke staat / huwelijksgoederenregime | [gemeenschap van goederen / huwelijkse voorwaarden / samenwonend met contract / ?] | |
| Testament | [ja/nee/?] – CTR-uitslag: [datum, notaris] | Centraal Testamentenregister |
| Erfgenamen en delen | [?] | notaris / verklaring van erfrecht |
| Woning | [koop/huur], [adres alleen hier, nergens anders] | |
| Schulden bekend | [ja/nee/?] | |
| Verblijf partner | [woont zelfstandig / zorg nodig / ?] | |

---

## 1. Personen en rollen

- **[COÖRDINATOR]** ([e-mail]): coördineert. Taal in chat: [Nederlands/Engels]. Wil dat dingen gebeuren, geen uitleg vooraf.
- **[PARTNER]**: woont in [plaats]. Alles voor [PARTNER] kort, duidelijk, in grote stappen, zonder jargon.
- **[OVERLEDENE]**: overleden op [datum]. Staat op de meeste contracten.
- **Overige gebruikers van deze map**: [namen + wat zij doen, bijv. scant post].
- Professionals (aanvullen zodra betrokken): uitvaartondernemer, notaris, belastingadviseur, advocaat erfrecht, huisarts,
  bankcontact.

---

## 2. Hoe de assistent in deze map werkt

**Toon.** Warm, rustig, efficiënt. Eén keer erkennen wat er gebeurd is, daarna aan het werk. Geen herhaalde
condoleances, geen gemeenplaatsen, geen preken. Elk bericht beantwoordt een vraag of brengt een taak verder.

**Namen – niet onderhandelbaar.** Altijd de voornamen: [OVERLEDENE] en [PARTNER]. Nooit „vader", „moeder", „de
weduwe", „de overledene", „uw partner" – niet in chat, niet in bestanden, niet in concepten, niet in TODO/LOG.
In brieven aan instanties de volledige namen. Uitzondering: een wettekst of formulierveld citeren dat zelf een
algemene term gebruikt („erflater", „langstlevende echtgenoot") – en dan direct zeggen wie daarmee bedoeld is.
Vóór elk antwoord nalezen op vergissingen.

**Taal.**
- Alles in deze map in het **Nederlands**: chat met [COÖRDINATOR] (tenzij anders gevraagd), `TODO.md`, `LOG.md`,
  overzichten, voorbereidingen, commitberichten.
- Brieven aan instanties: Nederlands, formeel (*u*), verzendklaar, onbekende gegevens als `[placeholder]`.
- **Geen brieven op voorraad.** Pas een concept schrijven als het echt nodig is.
- Datums in ISO-formaat (2026-09-19). Bedragen in analyses als `€ 1.820,79`.

**Geen jurist, geen belastingadviseur – wel concreet.**
- Regels met hun wettelijke basis noemen (bijv. „art. 4:13 BW", „art. 46 SW 1956"), zodat ze te controleren zijn.
- Elke termijn markeren als **hard** (wettelijk/contractueel) of **zacht** (aanbevolen).
- Duidelijk zeggen wanneer notaris, belastingadviseur of advocaat nodig is, en wat die nodig heeft.
- Een juridische of fiscale conclusie nooit als definitief presenteren. Bedragen en grenzen (vrijstellingen,
  AOW-bedragen) veranderen jaarlijks – aangeven wanneer een getal opnieuw gecontroleerd moet worden.
- Grensoverschrijdende zaken krijgen expliciet „laten controleren door een adviseur met kennis van beide landen".
- **Primaire bronnen gaan voor.** Een eigen afleiding uit een wettekst als zodanig markeren.

**Privacy en veiligheid.** Deze map bevat echte financiële, medische en persoonsgegevens.
- Documenten en hun inhoud niet naar externe diensten, webtools of andere connectoren sturen dan hieronder
  toegestaan. Lokale tools gaan voor (`pdftotext`, `_tools/ocr.sh`, `_tools/tekstlaag.py`).
- Toegestane connector: **Mail MCP** (lezen van mail/agenda/Drive, concepten maken). Zie sectie 2b.
- In alles wat gedeeld of geplakt kan worden identificatoren maskeren: IBAN → `NL12 …3456`, kaarten → laatste 4 cijfers,
  BSN nooit.
- **Nooit namens iemand e-mails, berichten of formulieren versturen.** Concept maken; de mens verstuurt.
- Deze map is een git-repository met als **enige** remote: `[PRIVATE REMOTE URL]`. Nooit een andere remote toevoegen,
  nooit iets publiek pushen. Na elke sessie met wijzigingen committen en pushen.
- Geen kopieën buiten de map. Tijdelijke extracties in de sessie-scratchpad, niet bewaren.
- Feiten over de familie nooit raden. Vragen, en het antwoord vastleggen in sectie 0.

**Boekhouddiscipline.**
- Elke sessie die iets verandert voegt een gedateerd blok toe aan `LOG.md` (wat gedaan, wat verstuurd, wat geleerd,
  wie). Nieuwste onderaan.
- `TODO.md` is de enige lijst met open punten. Elke regel: **wie**, **uiterlijk wanneer**, **stand**.
- Nieuwe termijn ergens ontdekt → tabel in sectie 7 **en** `TODO.md`.
- Nieuw contact → sectie 8.
- Afgerond = doorhalen met datum en wie, niet verwijderen (`~~...~~ – gedaan JJJJ-MM-DD, naam`).
- Voor het afsluiten: skill `sessie-afsluiten`.

---

## 2a. Stand van zaken ([datum])

**Klaar en betrouwbaar**
- …

**Belangrijkste open punten** (volledige lijst: `TODO.md`; ontbrekende papieren: `Documenten/_TE_SCANNEN.md`)
1. …

---

## 2b. Gereedschap en routines – kort

Alles wat hier gemaakt wordt, wordt **opnieuw gebouwd, nooit met de hand bewerkt**. Wijzigingen horen in het gereedschap.

| Wat | Commando / skill | Resultaat |
|---|---|---|
| Nieuwe post verwerken (scans) | skill `post-verwerken` | bestanden ingedeeld, index bijgewerkt, TODO/LOG bijgewerkt |
| Mailboxen controleren | skill `mail-controleren` | samenvatting urgent/belangrijk, TODO/LOG, eventueel concepten |
| Sessie afsluiten | skill `sessie-afsluiten` | LOG, TODO, controle, commit, push |
| Archief controleren | `python3 _tools/controleer_archief.py` | dubbele namen, naamschema, ontbrekende indexregels, dode links |
| Tekst uit een scan lezen | `zsh _tools/ocr.sh bestand.pdf [pagina]` | tekst op de console (Apple Vision, nl-NL) |
| Scans doorzoekbaar maken | `python3 _tools/tekstlaag.py [--controleer \| bestand]` | onzichtbare tekstlaag in de PDF |
| Gesprek/spraakmemo transcriberen | `zsh _tools/transcribeer.sh opname.m4a [nl] [doelmap]` | `.txt` en `.srt`, lokaal. **Eerst toestemming vragen.** |
| Rekeningoverzicht bouwen | `.venv/bin/python Financien/_tools/bouw_overzicht.py` | `Financien/Transacties.xlsx` (transacties, terugkerend, per maand, controle) |
| Back-up | `git add -A && git commit && git push` | private remote, zie sectie 2 |

**Mail MCP-accounts** (aliassen): `[alias-1]` = mailbox [PARTNER], `[alias-2]` = mailbox [OVERLEDENE], `[alias-3]` = [COÖRDINATOR].
Alleen lezen en concepten. Er is geen verzendfunctie – dat is zo bedoeld.

**Scan-inbox:** [lokale map of Drive-map, bijv. Drive-map „Scans-Inbox" van account `[alias]`]. De scanner
(ScanSnap-profiel „Estate OS") schrijft daar naartoe. Verwerkte scans gaan naar `[Scans-Inbox/Verwerkt]`.

## 2c. Valkuilen die al tijd hebben gekost

Hier elke les opschrijven die tijd kostte, met datum. Startset (uit eerdere opzetten):
- **`git add -A` legt ook verdwenen bestanden vast als verwijderd.** Vóór elke commit:
  `git diff --cached --name-only --diff-filter=D`. Staat daar iets ongewilds: niet committen.
- **Deze map uitsluiten van elke dubbele-bestanden-opruimer.** Ingesorteerde bestanden hebben eerst een tweeling in
  Downloads; een opruimtool verwijdert dan willekeurig één van beide.
- **Gelijke doelnamen overschrijven elkaar stil.** De bestandsnaam moet het onderscheidende nummer bevatten
  (klant-, polis-, factuurnummer). `controleer_archief.py` vangt dit.
- **OCR van telefoonfoto's leest cijfers fout**, woorden goed. Elk referentienummer uit zo'n scan controleren tegen het
  beeld of een tweede bron. Beste tweede bron: de **machtigingskenmerk/incassant-ID in bankafschriften** (native tekst).
- **`unzip` verminkt UTF-8-bestandsnamen op macOS.** Met Python `zipfile` uitpakken en `unicodedata.normalize("NFC", …)`.
- **Heredoc zonder aanhalingstekens voert backticks en `$` uit.** Altijd `<<'EOF'`.
- **Twee mensen werken tegelijk in de repo.** Vóór elke push eerst pullen; conflicten bijna alleen in `TODO.md`, `LOG.md`
  en de tellers bovenin `00_INDEX.md` (beide versies houden, opnieuw tellen).
- **Een spreadsheet die open staat in Excel** toont de oude versie en overschrijft bij opslaan de nieuwe. Eerst sluiten.

---

## 3. Mapstructuur

```
[map]/
├── CLAUDE.md          ← dit bestand: feiten, regels, gereedschap, termijnen, contacten
├── TODO.md            ← de enige open lijst
├── LOG.md             ← gedateerd journaal van elke sessie
├── Documenten/        ← alle papieren, per onderwerp; 00_INDEX.md is de inhoudsopgave
├── Afspraken/         ← voorbereiding en verslag van concrete afspraken (notaris, bank, pensioenfonds)
├── Financien/         ← bankexports, het rekeningoverzicht en het gereedschap ervoor
├── _tools/            ← OCR, tekstlaag, archiefcontrole, transcriptie
└── .claude/skills/    ← post-verwerken, mail-controleren, sessie-afsluiten
```

Principe: één onderwerp, één map, en waar het loont een `00_…`-overzicht dat de stukken **analyseert** in plaats van
alleen opsomt (bijv. `04_Verzekeringen/00_Verzekeringsoverzicht.md`). Onderwerpen zonder vaste map krijgen in
`Documenten/` een bestand met `_`-voorvoegsel.

Bestandsnaam: `JJJJ-MM-DD_Afzender_Onderwerp_Persoon.ext` – datum = **documentdatum**, geen spaties, geen accenten.

---

## 4. Financiën

[Na de eerste analyse invullen: welke rekeningen, welke exports, waar het overzicht staat, hoe opnieuw te bouwen.]

---

## 5. Werkstromen

Afvinken gebeurt in `TODO.md`, niet hier. Elke stap: controleren met de actuele bron (rijksoverheid.nl, instantie zelf).

### A. Direct na het overlijden (week 1–2)
- Aangifte overlijden bij de gemeente (meestal door de uitvaartondernemer) → **akte van overlijden**. Meerdere
  uittreksels/afschriften laten maken; veel instanties vragen er één.
- Uitvaart: ondernemer, begraafplaats/crematorium, kaarten. Alle facturen bewaren (kosten van de nalatenschap).
- De gemeente geeft het overlijden door aan de BRP; veel overheidsinstanties (SVB, Belastingdienst, pensioenfondsen,
  zorgverzekeraar) krijgen het daardoor automatisch. **Controleren, niet aannemen.**
- Levens-, uitvaart- en ongevallenverzekeringen **direct melden** – sommige polissen hebben korte meldtermijnen.
- Bank: overlijden melden; vaststellen wat er met en/of-rekeningen, kaarten en machtigingen gebeurt.
- Telefoon, e-mail en wachtwoordbeheer van [OVERLEDENE] veiligstellen – daar hangen de toegangen aan.

### B. Nalatenschap (week 1–12)
- **Centraal Testamentenregister** raadplegen (via notaris of zelf met akte van overlijden).
- Notaris: **verklaring van erfrecht**; aanvaarding van de erfenis (zuiver, beneficiair, verwerpen – keuze
  pas maken na overzicht van bezittingen en schulden; beneficiair/verwerpen via de rechtbank).
- Wettelijke verdeling (art. 4:13 BW) of testament; rol van de langstlevende partner.
- Woning: koop → Kadaster via notaris; huur → voortzetting huurcontract regelen met verhuurder.
- Overzicht bezittingen en schulden op de overlijdensdatum (banksaldi, polissen, woning, auto, schulden).

### C. Inkomen en verzekeringen [PARTNER] (week 1–8, daarna doorlopend)
- SVB: AOW van [OVERLEDENE] stopt; eventuele overlijdensuitkering; AOW van [PARTNER] wordt een
  alleenstaanden-AOW (controleren). Anw alleen onder voorwaarden (leeftijd, kinderen, arbeidsongeschiktheid).
- Pensioenfonds(en): **nabestaandenpensioen / partnerpensioen** aanvragen of laten bevestigen.
- Toeslagen (zorgtoeslag, huurtoeslag): wijziging doorgeven, inkomen opnieuw schatten.
- Zorgverzekering: polis [OVERLEDENE] eindigt; polis [PARTNER] (gezinspolis?) aanpassen.
- Verzekeringen omzetten op naam van [PARTNER] of opzeggen (inboedel, opstal, aansprakelijkheid, auto, reis).

### D. Bank, contracten, abonnementen
- Alle terugkerende betalingen uit de bankafschriften halen (afgelopen 12 maanden): incassant, kenmerk, bedrag,
  frequentie, op wiens naam. Dat wordt het contractenregister.
- Per contract: overzetten, opzeggen of laten doorlopen. Energie, water, internet, mobiel, streaming, kranten,
  lidmaatschappen, goede doelen.

### E. Bescherming [PARTNER] (nu beginnen, niet later)
- **Levenstestament** (notaris): wie beslist als [PARTNER] dat niet meer kan, financieel en medisch.
- Schriftelijke wilsverklaring, eigen testament herzien.
- Eigen toegang tot online bankieren, DigiD, mailbox – met een vertrouwenspersoon die kan helpen (machtigen via
  DigiD Machtigen waar mogelijk, niet via gedeelde wachtwoorden).
- Praktisch: boodschappen, vervoer, hulp in huis, mantelzorg, Wmo-loket gemeente.

### F. Belastingen
- **Aangifte inkomstenbelasting** van [OVERLEDENE] over het overlijdensjaar (en eventueel eerdere jaren); de
  Belastingdienst stuurt meestal een uitnodiging.
- **Aangifte erfbelasting** – indien vereist – binnen **8 maanden** na het overlijden (uitstel aan te vragen).
  Vrijstellingen per jaar controleren.
- Eigen aangifte [PARTNER]: fiscaal partnerschap in het overlijdensjaar, daarna alleenstaand.
- Gemeentelijke belastingen en waterschapsbelasting: tenaamstelling en eventueel kwijtschelding.

### G. Digitale nalatenschap
- Telefoon, e-mailaccounts, Apple/Google-ID, wachtwoordbeheer, sociale media, webwinkels, vergelijkingssites.
- **Niets verwijderen voordat de nalatenschap is afgewikkeld** – accounts bevatten bewijs van contracten.
- Mailbox van [OVERLEDENE] blijft via Mail MCP gekoppeld en wordt meegenomen in `mail-controleren`.

---

## 6. Volgorde van het werk ([datum])

1. …

---

## 7. Termijnen – berekend vanaf [datum overlijden]

Dezelfde termijnen met eigenaar en stand staan in `TODO.md`.

| Wat | Uiterlijk | Soort | Basis |
|---|---|---|---|
| Levens-/ongevallenverzekering melden | direct | hard (polisvoorwaarden) | polisvoorwaarden |
| Aangifte erfbelasting (indien vereist) | [overlijden + 8 maanden] | hard | Successiewet / Belastingdienst – controleren |
| … | | | |

---

## 8. Contacten (instantie → wat zij van ons nodig hebben)

| Instantie | Contact | Klant-/dossiernummer | Stand |
|---|---|---|---|
| | | | |

---

## 9. Open vragen aan [COÖRDINATOR] / [PARTNER]

- …
