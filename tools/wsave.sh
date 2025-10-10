#!/data/data/com.termux/files/usr/bin/bash
# ========================================
# WALLEET SNAPSHOT — versione migliorata (non si blocca)
# ========================================

STAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTDIR="/data/data/com.termux/files/home/Walleet/_snapshots"
mkdir -p "$OUTDIR"

echo ""
echo "🧠 Inserisci una breve descrizione dello stato stabile (es: 'fix audio' o 'post build OK'):"
read NOTE

TAG_NOTE=$(echo "$NOTE" | tr ' ' '-' | tr -cd '[:alnum:]-_')
TAG="stable-$STAMP-$TAG_NOTE"

echo ""
echo "📦 Creazione snapshot Walleet ($TAG)..."
sleep 0.5

# --- 1️⃣ Esegue wstatus e salva il log
LOGFILE="$OUTDIR/status_$STAMP.log"
bash /data/data/com.termux/files/home/Walleet/android/walleet_status.sh > "$LOGFILE" 2>&1 &
PID=$!

spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
i=0
while kill -0 $PID 2>/dev/null; do
  i=$(( (i+1) % 10 ))
  printf "\r🧩 Generazione log %s" "${spin:$i:1}"
  sleep 0.2
done
wait $PID
printf "\r✅ Log generato: $LOGFILE\n"

# --- 2️⃣ Verifica stato Git
GITDIR="/data/data/com.termux/files/home/Walleet"
CHANGES=$(git -C "$GITDIR" status --porcelain)

if [ -z "$CHANGES" ]; then
  echo "ℹ️ Nessuna modifica da salvare nel repository Git."
else
  echo "🗃️  Aggiungo modifiche al repository..."
  git -C "$GITDIR" add . >/dev/null 2>&1
  git -C "$GITDIR" commit -m "snapshot: stato stabile $STAMP ($NOTE)" --no-edit >/dev/null 2>&1
  echo "✅ Commit completato."
fi

# --- 3️⃣ Crea tag sempre, anche se non ci sono modifiche
git -C "$GITDIR" tag -f "$TAG" >/dev/null 2>&1
git -C "$GITDIR" push origin main --tags >/dev/null 2>&1

echo ""
echo "✅ Snapshot salvato con successo!"
echo "   → File: $LOGFILE"
echo "   → Tag Git: $TAG"
echo ""
