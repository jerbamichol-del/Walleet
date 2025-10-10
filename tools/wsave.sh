#!/data/data/com.termux/files/usr/bin/bash
# =============================================
# WALLEET — SAVE SNAPSHOT
# =============================================

PROJECT_DIR="/data/data/com.termux/files/home/Walleet"
SNAPSHOT_DIR="$PROJECT_DIR/_snapshots"

mkdir -p "$SNAPSHOT_DIR"

echo "🧠 Inserisci una breve descrizione dello stato stabile (es: fix-audio, post-build OK):"
read DESC

# Genera timestamp completo: giorno-mese-anno_ora-minuti-secondi
TIMESTAMP=$(date +"%d-%m-%Y_%H-%M-%S")

# Nome log e tag Git
LOG_FILE="$SNAPSHOT_DIR/status_${TIMESTAMP}-${DESC}.log"
TAG_NAME="stable-${TIMESTAMP}-${DESC}"

# Salva lo stato git e l'elenco dei file principali
echo "📦 Creazione snapshot Walleet ($TAG_NAME)..."
{
  echo "Tag Git: $TAG_NAME"
  echo "Data: $TIMESTAMP"
  echo "Descrizione: $DESC"
  echo ""
  git -C "$PROJECT_DIR" status
} > "$LOG_FILE"

# Crea tag Git
git -C "$PROJECT_DIR" add .
git -C "$PROJECT_DIR" commit -m "Snapshot $TAG_NAME" >/dev/null 2>&1
git -C "$PROJECT_DIR" tag "$TAG_NAME"

echo "✅ Snapshot creato: $LOG_FILE"
