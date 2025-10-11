#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
ROOT="$HOME/Walleet"
SNAP="$ROOT/_snapshots"
cd "$ROOT" || { echo "❌ Manca $ROOT"; exit 1; }

choose_archive() {
  local arg="${1:-}"
  if [ -z "$arg" ]; then
    echo "Uso: wrestore <ID|frammento-nome>"
    return 1
  fi
  if [[ "$arg" =~ ^[0-9]+$ ]]; then
    mapfile -t files < <(ls -1t "$SNAP"/snapshot_*.tar.gz 2>/dev/null)
    local idx=$((arg-1))
    echo "${files[$idx]}"
  else
    ls -1t "$SNAP"/snapshot_*"$arg"*.tar.gz 2>/dev/null | head -1
  fi
}

ARCH="$(choose_archive "${1:-}")" || exit 1
[ -n "$ARCH" ] || { echo "❌ Snapshot non trovato"; exit 1; }
echo "Ripristino da: $ARCH"

TS="$(date +%Y-%m-%d_%H-%M-%S)"
SAFE="$SNAP/autobackup_before_restore_${TS}.tar.gz"

echo "Creo backup attuale: $SAFE"
tar \
  --exclude="./_snapshots" \
  --exclude="./.git" \
  --exclude="./node_modules" \
  --exclude="./android/.gradle" \
  --exclude="./android/app/build" \
  --exclude="./.gradle" \
  --exclude="./.npm" \
  --exclude="./_apk" \
  -czf "$SAFE" .

echo "⚠️  Chiudi eventuali anteprime (CTRL+C o wpreview-stop)."
sleep 1

echo "Estrazione..."
tar -xzf "$ARCH" -C "$ROOT"

echo "✅ Ripristino completato."
echo "Suggerito: npm ci && npm run build && npx cap sync android"
