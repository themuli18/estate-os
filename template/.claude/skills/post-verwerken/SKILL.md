---
name: post-verwerken
description: Nieuwe post verwerken die met de ScanSnap is gescand. Gebruik bij "nieuwe post", "ik heb gescand", "verwerk de scans", "staat er iets nieuws in de scan-inbox", of als onderdeel van de dagelijkse controle.
---

# Post verwerken

Doel: elke nieuwe scan staat binnen één sessie correct benoemd in het archief, met indexregel, en elke actie of
termijn eruit staat in `TODO.md`.

## Stappen

1. **Inbox lezen.** Lokatie staat in `CLAUDE.md` §2b.
   - Lokale map: bestanden direct lezen.
   - Google Drive: met Mail MCP `drive_search` / `drive_list_recent` (account uit §2b) de nieuwe bestanden zoeken,
     met `drive_read_file` lezen. Bestanden die al in `00_INDEX.md` staan overslaan.
2. **Per document**: tekst lezen (`pdftotext`; bij lege tekst `zsh _tools/ocr.sh bestand.pdf`). Bepaal:
   documentdatum, afzender, onderwerp, persoon, onderscheidend nummer, map (zie `Documenten/README.md`).
   Voldoet het niet aan de opnamecriteria → niet archiveren, wel noemen in het verslag.
3. **Dubbel?** Zoek het nummer en de datum in `00_INDEX.md`. Tweede scan van hetzelfde blad → overslaan.
4. **Archiveren**: kopiëren naar `Documenten/<map>/JJJJ-MM-DD_Afzender_Onderwerp_Persoon.pdf`,
   `python3 _tools/tekstlaag.py <pad>` als er nog geen tekstlaag is, indexregel toevoegen, tellers bijwerken.
   Bij Drive: het bestand downloaden kan alleen als de omgeving dat toelaat; anders de gebruiker vragen het
   bestand in `~/Downloads` te zetten (of via de browser te downloaden) en dan verder.
5. **Inhoud verwerken** – dit is het belangrijkste:
   - Wordt er iets gevraagd (formulier, betaling, reactie)? → `TODO.md` met wie/uiterlijk/stand.
   - Termijn? Hard of zacht, met bron → `TODO.md` **en** `CLAUDE.md` §7.
   - Bevestigt het iets dat open stond? → TODO-regel doorhalen met datum.
   - Nieuwe instantie of nummer → `CLAUDE.md` §8.
   - Cijfers uit telefoonfoto's controleren tegen een tweede bron.
6. `python3 _tools/controleer_archief.py` – moet schoon zijn.
7. **LOG.md**: blok `## JJJJ-MM-DD — Nieuwe post (naam)` met per document één regel: afzender, datum, kern, gevolg.
8. Inbox opruimen: verwerkte bestanden naar de submap `Verwerkt` (nooit verwijderen).
9. Committen (`git diff --cached --name-only --diff-filter=D` eerst leeg!) en pushen.

## Verslag aan de gebruiker

Kort, in het Nederlands: per document één regel, dan **wat er nu moet gebeuren** met termijn. Urgent bovenaan.
