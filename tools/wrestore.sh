#!/data/data/com.termux/files/usr/bin/bash
# =============================================
# WALLEET — RESTORE SNAPSHOT
# =============================================

SNAPSHOT_DIR="/data/data/com.termux/files/home/Walleet/_snapshots"
PROJECT_DIR="/data/data/com.termux/files/home/Walleet"

echo "📦 Ripristino snapshot Walleet"
echo "----------------------------------------"

# Controlla che esistano snapshot
if [ ! -d "$SNAPSHOT_DIR" ] || [ -z "$(ls -A "$SNAPSHOT_DIR" 2>/dev/null)" ]; then
  echo "❌ Nessuno snapshot trovato in $SNAPSHOT_DIR"
  exit 1
fi

# --- Lista tag Git
declare -A TAG_DESC_ARRAY
i=1
echo ""
echo "🗃️  SNAPSHOT DISPONIBILI:"
for tag in $(git -C "$PROJECT_DIR" tag | grep '^stable-' | sort -r); do
  TAG_DATE=$(echo "$tag" | cut -d'-' -f2-4 | tr '_' ' ')
  TAG_DESC=$(echo "$tag" | cut -d'-' -f5- | tr '-' ' ')
  TAG_DESC_ARRAY[$i]="$tag"
  printf "[%d] %s\n     📅 Data/Ora: %s\n     📝 Descrizione: %s\n\n" "$i" "$tag" "$TAG_DATE" "$TAG_DESC"
  ((i++))
done

# --- Scelta dell’utente
read -p "👉 Inserisci il numero dello snapshot da ripristinare: " NUM

TAG_SELECTED=${TAG_DESC_ARRAY[$NUM]}
if [ -z "$TAG_SELECTED" ]; then
  echo "❌ Numero non valido."
  exit 1
fi

echo "🔄 Ripristino snapshot: $TAG_SELECTED"
git -C "$PROJECT_DIR" fetch --tags >/dev/null 2>&1
git -C "$PROJECT_DIR" checkout "$TAG_SELECTED" >/dev/null 2>&1
echo "✅ Ripristino completato con successo!"
