#!/bin/zsh
# Een audiobestand (spraakmemo, opgenomen telefoongesprek) lokaal transcriberen met mlx_whisper (Apple Silicon).
# Er verlaat niets de computer; alleen bij de eerste run wordt het model van Hugging Face gedownload.
#
# Gebruik:   zsh _tools/transcribeer.sh <audiobestand> [taal] [doelmap]
#   taal      standaard: nl. Per opname te kiezen, bijv. de, en.
#   doelmap   standaard: map van het audiobestand. Resultaat: <naam>.txt en <naam>.srt (met tijdcodes).
# Instellingen (omgeving):
#   ESTATE_VENV     Python-venv met mlx-whisper   (standaard: <repo>/.venv)
#   WHISPER_MODEL   standaard mlx-community/whisper-large-v3-turbo
#   WHISPER_PROMPT  namen en vaktermen, zodat ze goed gespeld worden. Zet hier de namen uit CLAUDE.md in.
#
# Vóór elke opname van een gesprek: toestemming vragen aan de andere partij.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
VENV="${ESTATE_VENV:-$HERE/../.venv}"
IN="${1:?audiobestand opgeven}"
TAAL="${2:-nl}"
DOEL="${3:-$(dirname "$IN")}"
MODEL="${WHISPER_MODEL:-mlx-community/whisper-large-v3-turbo}"
PROMPT="${WHISPER_PROMPT:-Akte van overlijden, verklaring van erfrecht, nabestaandenpensioen, polisnummer, klantnummer, notaris, Belastingdienst, SVB.}"
mkdir -p "$DOEL"
for f in txt srt; do
  "$VENV/bin/mlx_whisper" "$IN" --model "$MODEL" --language "$TAAL" \
    --initial-prompt "$PROMPT" --output-format "$f" --output-dir "$DOEL" >/dev/null
done
echo "Transcript: $DOEL/$(basename "${IN%.*}").txt"
