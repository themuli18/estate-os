---
name: sitzung-abschliessen
description: Eine Arbeitssitzung sauber abschließen - LOG, TODO, Prüfungen, Commit und Push. Verwenden bei "fertig für heute", "abschließen", "alles sichern", oder am Ende jeder Sitzung, die Dateien geändert hat.
---

# Sitzung abschließen

1. **LOG.md**: Eintrag für heute vorhanden und vollständig (was getan, was gesendet und von wem, was gelernt)?
2. **TODO.md**: Erledigtes mit Datum und Name durchgestrichen; Neues mit wer/bis wann/Stand; „Stand"-Datum oben aktualisiert.
3. **CLAUDE.md**: neue Fakten → 0, neue Fristen → 7, neue Kontakte → 8, neuer Fallstrick → 2c,
   2a „Stand der Arbeit" aktualisiert, wenn sich Wesentliches geändert hat.
4. **Namensprüfung**: in allem heute Geschriebenen nach „Vater", „Mutter", „Witwe", „Verstorbene/r", „Partner/in" als
   Bezeichnung einer Person suchen – durch den Vornamen ersetzen.
5. **Datenschutzprüfung**: keine vollständige IBAN, Kartennummer, Steuer-ID oder Rentenversicherungsnummer in LOG/TODO/Chat.
6. `python3 _tools/pruefe_archiv.py` – sauber.
7. `git pull --rebase` (andere arbeiten vielleicht parallel; Konflikte in TODO/LOG: beide Fassungen behalten).
8. `git add -A`, dann **`git diff --cached --name-only --diff-filter=D`** – steht dort eine ungewollte Löschung:
   anhalten und melden.
9. Commit mit kurzer deutscher Nachricht, Push zum einzigen Remote.
10. Eine Zeile an die Nutzer: was gesichert ist, was als Nächstes mit Frist ansteht.
