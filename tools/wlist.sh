#!/data/data/com.termux/files/usr/bin/bash
# =============================================
# WALLEET — LIST SNAPSHOTS
# =============================================

SNAPDIR="/data/data/com.termux/files/home/Walleet/_snapshots"
GITDIR="/data/data/com.termux/files/home/Walleet"

echo ""
echo "📜 LISTA SNAPSHOT DISPONIBILI:"
echo "=============================="

# --- Lista tag Git
i=1
echo "🗃️  SNAPSHOT GIT:"
for tag in $(git -C "$GITDIR" tag | grep '^stable-' | sort -r); do
  TAG_DATE=$(echo "$tag" | cut -d'-' -f2-4 | tr '_' ' ')
  TAG_DESC=$(echo "$tag" | cut -d'-' -f5- | tr '-' ' ')
  printf "[%d] %s\n     📅 Data/Ora: %s\n     📝 Descrizione: %s\n\n" "$i" "$tag" "$TAG_DATE" "$TAG_DESC"
  ((i++))
done

# --- Lista log locali
if [ -d "$SNAPDIR" ]; then
  LOGS=$(ls -1t "$SNAPDIR" | grep '^status_')
  if [ ! -z "$LOGS" ]; then
    echo "🗂️  LOG LOCALI (più recenti in alto):"
    echo ""
    i=1
    for log in $LOGS; do
      FILE_DATE=$(echo "$log" | sed 's/status_//' | sed 's/\.log//' | awk -F'-' '{printf "%s-%s-%s %s:%s:%s", $1,$2,$3,$4,$5,$6}')
      FILE_DESC=$(echo "$log" | sed 's/status_.*-//' | sed 's/\.log//')
      printf "[%d] %s\n     📅 Data/Ora: %s\n     📝 Descrizione: %s\n\n" "$i" "$log" "$FILE_DATE" "$FILE_DESC"
      ((i++))
    done
  fi
fi
