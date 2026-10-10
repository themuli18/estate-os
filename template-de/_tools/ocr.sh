#!/bin/zsh
# Text aus einem Scan lesen mit Apple Vision (lokal, Deutsch + Englisch).
# Aufruf:  zsh _tools/ocr.sh datei.pdf|foto.jpg [seite]
# Warum nicht Tesseract: meist nur das englische Modell installiert, nur CPU; liest Umlaute falsch („Größe" wird „Grobe").
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
BIN="$HERE/.ocr-bin"
LANGS="${OCR_LANGS:-de-DE,en-US}"
[[ -x "$BIN" && "$BIN" -nt "$HERE/ocr.swift" ]] || swiftc -O "$HERE/ocr.swift" -o "$BIN"
F="$1"; PAGE="${2:-}"
[[ -f "$F" ]] || { echo "nicht gefunden: $F" >&2; exit 1 }
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
