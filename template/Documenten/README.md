# Documenten – opbergschema

Alle papieren van [OVERLEDENE] en [PARTNER], gescand en per onderwerp ingedeeld.
**[00_INDEX.md](00_INDEX.md) is de inhoudsopgave** – per document datum, afzender, onderwerp, persoon en het
belangrijke nummer (polis-, klant-, dossiernummer). Wie iets zoekt, zoekt daar, niet in het bestandssysteem.

## Mappen

| Map | Inhoud |
|---|---|
| `01_Persoonlijke_documenten` | Akte van overlijden, testament, CTR-uitslag, verklaring van erfrecht, huwelijksakte, ID-bewijzen, volmachten, levenstestament. Wat nog ontbreekt: `_TE_SCANNEN.md`. |
| `02_Uitvaart` | Uitvaartondernemer, offerte en factuur, crematorium/begraafplaats, grafrechten, kaarten. |
| `03_Pensioen_en_uitkeringen` | SVB (AOW, Anw, overlijdensuitkering), pensioenfondsen, nabestaandenpensioen, jaaropgaven. |
| `04_Verzekeringen` | Leven, uitvaart, ongevallen, inboedel, opstal, aansprakelijkheid, rechtsbijstand, reis. Overzicht: `00_Verzekeringsoverzicht.md`. |
| `05_Zorg_en_gezondheid` | Zorgverzekering, huisarts, specialist, apotheek, Wmo, thuiszorg. |
| `06_Woning_energie_en_gemeente` | Hypotheek of huur, energie, water, gemeentelijke belastingen, waterschap, onderhoud. Overzicht: `00_Leveranciersoverzicht.md`. |
| `07_Vervoer` | Kenteken (RDW), motorrijtuigenbelasting, APK, autoverzekering, garage. Alles over de auto op één plek. |
| `08_Belastingen` | Belastingdienst, aangiften, aanslagen, toeslagen, erfbelasting. |
| `09_Abonnementen_en_lidmaatschappen` | Kranten, streaming, verenigingen, goede doelen. |
| `10_Telecom_en_internet` | Vaste lijn, internet, mobiel. |
| `11_Bank_en_vermogen` | Banken, rekeningen, beleggingen, spaarrekeningen, toegangsmiddelen. |
| `_Origineel` | Onbewerkte exports (ZIP) als bewijs. Niet in git (zie `.gitignore`). |

## Wat wordt opgenomen, wat niet

Het archief is **geen bonnenarchief**, maar het dossier van de nalatenschap en de lopende administratie.
Opgenomen wordt wat aan één van deze voorwaarden voldoet:

1. **Contract of terugkerende verplichting** die nog loopt – ongeacht hoe oud het document is.
2. **Besluit of beschikking van een overheid, fonds of verzekeraar** (pensioen, belasting, toeslag, zorg).
3. **Stukken over het overlijden en de nalatenschap** (uitvaart, akten, notaris).

Niet opgenomen: eenmalige aankoopbonnen (kleding, cadeaus, elektronica, reizen), reclame, nieuwsbrieven.

## Bestandsnaam

```
JJJJ-MM-DD_Afzender_Onderwerp_Persoon.ext
2026-05-19_Voorbeeldverzekeraar_Polisblad-Inboedel-12345678_Partner.pdf
```

- **Datum = datum van het document**, niet van de scan.
- **Afzender en Onderwerp**: woorden met `-` verbonden, geen spaties, geen accenten (ë → e).
- **Onderwerp bevat het onderscheidende nummer** (polis-, klant-, factuurnummer), anders overschrijven gelijke namen elkaar.
- **Persoon**: voornaam, of `Naam1-Naam2` als beiden betrokken zijn.

## Een nieuw document indelen

1. Datum, afzender en nummer uit het document zelf lezen (`zsh _tools/ocr.sh bestand.pdf`).
2. Volgens schema hernoemen en in de juiste map zetten.
3. Doorzoekbaar maken: `python3 _tools/tekstlaag.py Documenten/<map>/<bestand>.pdf`.
4. Regel toevoegen in `00_INDEX.md` en de tellers bovenin bijwerken.
5. Gevolgen vastleggen: nieuwe termijn → `TODO.md` + `CLAUDE.md` §7; nieuw contact → `CLAUDE.md` §8.
6. `python3 _tools/controleer_archief.py` – moet schoon zijn.
7. Committen en pushen.

De skill `post-verwerken` doet stap 1–7 voor een hele inbox.

## Grenzen van tekstherkenning

Telefoonfoto's van brieven: woorden betrouwbaar, **cijferreeksen niet**. Elk nummer uit zo'n scan controleren tegen het
beeld of tegen een tweede document voordat het in een brief aan een instantie komt. Nummers in de index zijn
gecontroleerd. Flatbed- of ScanSnap-scans op 300 dpi zijn veel betrouwbaarder.

## Toegangsgegevens

Documenten met pincodes, activatiecodes of wachtwoorden (simkaart, DigiD-activatie, internet) worden in de index
gemarkeerd met 🔒. **Die bestanden gaan nooit per e-mail of naar een cloudmap.**

## Privacy

Deze stukken bevatten medische gegevens, BSN, polisnummers en het adres. Ze blijven in deze map en op de private
back-up. Aan instanties alleen het ene document geven dat gevraagd wordt.
