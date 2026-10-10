---
name: sessie-afsluiten
description: Een werksessie netjes afsluiten - LOG, TODO, controles, commit en push. Gebruik bij "klaar voor vandaag", "afsluiten", "sla alles op", of aan het eind van elke sessie die bestanden heeft veranderd.
---

# Sessie afsluiten

1. **LOG.md**: blok voor vandaag aanwezig en volledig (wat gedaan, wat verstuurd en door wie, wat geleerd)?
2. **TODO.md**: afgeronde punten doorgehaald met datum en naam; nieuwe punten met wie/uiterlijk/stand;
   „Stand"-datum bovenaan bijgewerkt.
3. **CLAUDE.md**: nieuwe feiten → §0, nieuwe termijnen → §7, nieuwe contacten → §8, nieuwe valkuil → §2c,
   §2a „Stand van zaken" bijgewerkt als er iets wezenlijks veranderde.
4. **Namen-controle**: zoek in alles wat vandaag geschreven is naar „vader", „moeder", „weduwe", „overledene",
   „partner" als aanduiding van een persoon – vervangen door de voornaam.
5. **Privacy-controle**: geen volledige IBAN, kaartnummer of BSN in LOG/TODO/chat.
6. `python3 _tools/controleer_archief.py` – schoon.
7. `git pull --rebase` (iemand anders kan tegelijk werken; conflicten in TODO/LOG: beide versies houden).
8. `git add -A`, dan **`git diff --cached --name-only --diff-filter=D`** – staat daar een onbedoelde verwijdering:
   stoppen en melden.
9. Commit met een korte Nederlandse boodschap, push naar de enige remote.
10. Eén regel aan de gebruiker: wat is vastgelegd, wat is het eerstvolgende met termijn.
