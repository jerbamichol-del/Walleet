#!/data/data/com.termux/files/usr/bin/bash
# ========================================
# WALLEET SNAPSHOT LIST — versione migliorata
# Mostra snapshot con data, ora e descrizione
# ========================================

SNAPDIR="/data/data/com.termux/files/home/Walleet/_snapshots"
GITDIR="/data/data/com.termux/files/home/Walleet"

echo ""
echo "📜 LISTA SNAPSHOT DISPONIBILI:"
echo "=============================="
echo ""

# --- Lista tag Git
TAGS=$(git -C "$GITDIR" tag | grep '^stable-' | sort -r)

if [ -z "$TAGS" ]; then
  echo "❌ Nessuno snapshot Git trovato."
else
  i=1
  echo "🗃️  SNAPSHOT GIT:"
  echo ""
  for tag in $TAGS; do
    # Estrai data/ora e descrizione dal tag
    DATE=$(echo "$tag" | cut -d'-' -f2-3 | tr '_' ' ')
    DESC=$(echo "$tag" | cut -d'-' -f4- | tr '-' ' ')
    printf "[%d] %s\n     📅 Data/Ora: %s\n     📝 Descrizione: %s\n\n" "$i" "$tag" "$DATE" "$DESC"
    ((i++))
  done
fi

# --- Lista log locali
if [ -d "$SNAPDIR" ]; then
  LOGS=$(ls -1t "$SNAPDIR" | grep '^status_')
  if [ -z "$LOGS" ]; then
    echo "❌ Nessun log locale trovato."
  else
    echo "🗂️  LOG LOCALI (più recenti in alto):"
    echo ""
    i=1
    for log in $LOGS; do
      # Estrai data e ora dal nome del file
      FILE_DATE=$(echo "$log" | sed 's/status_//' | sed 's/\.log//')
      printf "[%d] %s    📅 %s\n" "$i" "$log" "$FILE_DATE"
      ((i++))
    done
    echo ""
  fi
fi
