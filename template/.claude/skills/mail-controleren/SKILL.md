---
name: mail-controleren
description: De gekoppelde mailboxen (via Mail MCP) controleren op berichten die belangrijk of urgent zijn voor de nalatenschap of de administratie. Gebruik bij "check de mail", "is er iets binnengekomen", "dagelijkse controle", of als geplande routine.
---

# Mail controleren

Doel: niets dat een termijn, geld of een besluit bevat blijft ongezien in een mailbox liggen.

## Stappen

1. `list_accounts` – welke mailboxen zijn er, welke hebben „needs reconnect"? Meld een verbroken koppeling direct.
2. **Periode**: vanaf de laatste `mail-controleren`-regel in `LOG.md` (anders 7 dagen). Zoeken met
   `gmail_search` en `account: "all"`:
   - `after:JJJJ/MM/DD -category:promotions -category:social -in:sent`
   - plus gericht op afzenders uit `CLAUDE.md` §8 (instanties, notaris, verzekeraars, bank, pensioenfonds,
     Belastingdienst, SVB, gemeente) – ook als ze in een andere categorie zijn beland.
   - plus woorden: `aanmaning OR herinnering OR termijn OR "uiterlijk" OR incasso OR deurwaarder OR
     "laatste waarschuwing" OR beschikking OR aanslag OR "akte" OR "nabestaanden"`.
3. **Indelen** (alleen lezen, niets verwijderen, niets als gelezen markeren):
   - **Urgent** – termijn binnen 14 dagen, betalingsachterstand, incasso, deurwaarder, opzegging, blokkade,
     beveiligingsmelding van een bank of DigiD, verzoek om een document.
   - **Belangrijk** – elke instantie uit §8, elke beslissing, polis, jaaropgave, factuur van een lopend contract,
     bevestiging van iets dat in `TODO.md` openstaat.
   - **Info** – nieuwsbrieven van bekende leveranciers met inhoud (tariefwijziging, voorwaarden).
   - **Negeren** – reclame, sociale media, privécorrespondentie die niets met de administratie te maken heeft.
     **Privéberichten niet samenvatten en niet loggen.**
4. **Verwerken**:
   - Bijlagen die aan de opnamecriteria voldoen (`Documenten/README.md`): met `gmail_get_attachment` ophalen en
     archiveren zoals in `post-verwerken` stap 4.
   - Acties en termijnen → `TODO.md` (en §7). Bevestigingen → TODO-regel doorhalen.
   - Antwoord nodig? Alleen een **concept** maken met `gmail_create_draft` in de juiste mailbox, en melden dat de
     gebruiker het moet nalezen en versturen. Er wordt nooit verstuurd.
5. **LOG.md**: `## JJJJ-MM-DD — Mailboxen gecontroleerd` – per relevant bericht één regel (afzender, datum, kern,
   gevolg), en „verder niets nieuw van: …" met de instanties waar op gewacht wordt.
6. Committen en pushen als er bestanden veranderd zijn.

## Verslag aan de gebruiker

Eerst **Urgent** (met termijn en voorgestelde actie), dan **Belangrijk**, dan één regel „verder niets".
Geen inhoud van privéberichten.
