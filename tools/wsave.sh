#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
ROOT="$HOME/Walleet"
SNAP="$ROOT/_snapshots"; mkdir -p "$SNAP"
cd "$ROOT"

LABEL="${*:-snapshot}"
LABEL_SAFE="$(echo "$LABEL" | tr ' ' '_' | tr -cd '[:alnum:]_.-')"
TS="$(date +%Y-%m-%d_%H-%M-%S)"

ARCH="$SNAP/snapshot_${TS}_${LABEL_SAFE}.tar.gz"
LOG="$SNAP/status_${TS}_${LABEL_SAFE}.log"

{
  echo "Snapshot: $(basename "$ARCH")"
  echo "Date: $TS"
  echo "Label: $LABEL"
  echo
  echo "## Toolchain"
  echo -n "node: "; node -v 2>/dev/null || echo "n/a"
  echo -n "npm:  "; npm -v 2>/dev/null || echo "n/a"
  java -version 2>&1 | head -n 1 || true
  echo
  echo "## Git (opzionale)"
  git -C "$ROOT" status 2>/dev/null || echo "no git"
} | tee "$LOG"

tar --exclude="./_snapshots" --exclude="./.git" --exclude="./node_modules" \
    --exclude="./android/.gradle" --exclude="./android/app/build" \
    --exclude="./.gradle" --exclude="./.npm" --exclude="./_apk" \
    -czf "$ARCH" .

echo -e "$TS\t$(basename "$ARCH")\t$LABEL" >> "$SNAP/index.tsv"

if [ -d /sdcard/Download ]; then
  OUT="/sdcard/Download/Walleet-logs"; mkdir -p "$OUT"
  cp -f "$LOG" "$OUT/"
  echo "📄 Copiato: $OUT/$(basename "$LOG")"
fi

echo "✅ Salvato: $ARCH"
