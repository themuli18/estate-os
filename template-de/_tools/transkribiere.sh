#!/bin/zsh
# Eine Audiodatei (Sprachmemo, aufgezeichnetes Telefonat) lokal transkribieren mit mlx_whisper (Apple Silicon).
# Nichts verlässt den Rechner; nur beim ersten Lauf wird das Modell von Hugging Face geladen.
#
# Aufruf:   zsh _tools/transkribiere.sh <audiodatei> [sprache] [zielordner]
#   sprache     Standard: de. Pro Aufnahme frei wählbar, z. B. en, nl.
#   zielordner  Standard: Ordner der Audiodatei. Ergebnis: <name>.txt und <name>.srt (mit Zeitmarken).
# Einstellungen (Umgebung):
#   ESTATE_VENV     Python-venv mit mlx-whisper   (Standard: <repo>/.venv)
#   WHISPER_MODEL   Standard mlx-community/whisper-large-v3-turbo
#   WHISPER_PROMPT  Namen und Fachbegriffe, damit sie richtig geschrieben werden – Namen aus CLAUDE.md eintragen.
#
# Vor jeder Gesprächsaufnahme das Einverständnis einholen (§ 201 StGB).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
VENV="${ESTATE_VENV:-$HERE/../.venv}"
IN="${1:?Audiodatei angeben}"
SPRACHE="${2:-de}"
ZIEL="${3:-$(dirname "$IN")}"
MODELL="${WHISPER_MODEL:-mlx-community/whisper-large-v3-turbo}"
PROMPT="${WHISPER_PROMPT:-Sterbeurkunde, Erbschein, Witwenrente, Versicherungsnummer, Vertragsnummer, Bezugsrecht, Nachlassgericht, Notar.}"
mkdir -p "$ZIEL"
for f in txt srt; do
  "$VENV/bin/mlx_whisper" "$IN" --model "$MODELL" --language "$SPRACHE" \
    --initial-prompt "$PROMPT" --output-format "$f" --output-dir "$ZIEL" >/dev/null
done
echo "Transkript: $ZIEL/$(basename "${IN%.*}").txt"
