#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
ROOT="$HOME/Walleet"
SNAP="$ROOT/_snapshots"
cd "$ROOT" || exit 1
[ -d "$SNAP" ] || { echo "Nessun _snapshots/"; exit 0; }

echo "ID | Data               | File"
ls -1t "$SNAP"/snapshot_*.tar.gz 2>/dev/null | nl -w2 -s"  " | while read -r N F; do
  BASE="$(basename "$F")"
  DATE="$(echo "$BASE" | sed -n 's/^snapshot_\([0-9-]\+_[0-9-]\+\).*/\1/p')"
  printf "%2s | %-19s | %s\n" "$N" "${DATE:-?}" "$BASE"
done
