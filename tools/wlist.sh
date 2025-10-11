#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
ROOT="$HOME/Walleet"; SNAP="$ROOT/_snapshots"
[ -d "$SNAP" ] || { echo "Nessun _snapshots/"; exit 0; }
echo "ID | Data               | Etichetta                      | File"
if [ -f "$SNAP/index.tsv" ]; then
  nl -w2 -s"  " "$SNAP/index.tsv" | awk -F'\t' '{printf "%2s | %-19s | %-28s | %s\n",$1,$2,$4,$3}'
else
  ls -1t "$SNAP"/snapshot_*.tar.gz 2>/dev/null | nl -w2 -s"  " | while read -r N F; do
    BASE="$(basename "$F")"
    DATE="$(echo "$BASE" | sed -n 's/^snapshot_\([0-9-]\+_[0-9-]\+\).*/\1/p')"
    LABEL="$(echo "$BASE" | sed -n 's/^snapshot_[0-9-]\+_[0-9-]\+_\(.*\)\.tar\.gz/\1/p')"
    printf "%2s | %-19s | %-28s | %s\n" "$N" "${DATE:-?}" "${LABEL:-?}" "$BASE"
  done
fi
