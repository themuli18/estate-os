#!/bin/zsh
# Tekst uit een scan lezen met Apple Vision (lokaal, Nederlands + Engels).
# Gebruik:  zsh _tools/ocr.sh bestand.pdf|foto.jpg [pagina]
# Waarom niet Tesseract: meestal alleen het Engelse model geïnstalleerd, alleen CPU, slechter op Nederlandse namen.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
BIN="$HERE/.ocr-bin"
LANGS="${OCR_LANGS:-nl-NL,en-US}"
[[ -x "$BIN" && "$BIN" -nt "$HERE/ocr.swift" ]] || swiftc -O "$HERE/ocr.swift" -o "$BIN"
F="$1"; PAGE="${2:-}"
[[ -f "$F" ]] || { echo "niet gevonden: $F" >&2; exit 1 }
if [[ "${F:l}" == *.pdf ]]; then
  TMP=$(mktemp -d)
  if [[ -n "$PAGE" ]]; then pdftoppm -r 200 -png -f "$PAGE" -l "$PAGE" "$F" "$TMP/p"
  else pdftoppm -r 200 -png "$F" "$TMP/p"; fi
  for p in "$TMP"/p*.png; do
    [[ $(ls "$TMP"/p*.png | wc -l) -gt 1 ]] && echo "--- ${p:t:r} ---"
    "$BIN" "$p" "$LANGS"
  done
  rm -rf "$TMP"
else
  "$BIN" "$F" "$LANGS"
fi
