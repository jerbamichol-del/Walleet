#!/bin/bash

# ========================================================
# WALLEET - STATUS COMPLETO PROGETTO
# ========================================================

# Imposta root del progetto
PROJECT_ROOT="/data/data/com.termux/files/home/Walleet"

echo "==============================="
echo "WALLEET - STATUS COMPLETO"
echo "==============================="
echo ""

# 1️⃣ Verifica presenza principali cartelle e file
echo "1️⃣ Controllo file e cartelle principali..."
declare -a paths=(
  "$PROJECT_ROOT/android/app/src/main/java/com/example/gestorespese/MainActivity.java"
  "$PROJECT_ROOT/android/app/src/main/assets/public"
  "$PROJECT_ROOT/android/app/src/main/assets/public/index.html"
  "$PROJECT_ROOT/android/app/src/main/assets/public/sw.js"
  "$PROJECT_ROOT/android/app/src/main/assets/public/manifest.json"
)

for path in "${paths[@]}"; do
  if [ -e "$path" ]; then
    echo "✅ Presente: $path"
  else
    echo "❌ Mancante: $path"
  fi
done
echo ""

# 2️⃣ Plugin Capacitor installati
echo "2️⃣ Plugin Capacitor installati:"
if [ -d "$PROJECT_ROOT/node_modules/@capacitor-community/speech-recognition" ]; then
  version=$(cat "$PROJECT_ROOT/node_modules/@capacitor-community/speech-recognition/package.json" | grep '"version"' | head -1)
  echo "✅ Speech Recognition plugin: $version"
else
  echo "❌ Speech Recognition plugin NON installato"
fi
echo ""

# 3️⃣ Permesso microfono runtime in MainActivity.java
echo "3️⃣ Controllo permesso microfono runtime..."
if grep -q "Manifest.permission.RECORD_AUDIO" "$PROJECT_ROOT/android/app/src/main/java/com/example/gestorespese/MainActivity.java"; then
  echo "✅ Permesso microfono gestito a runtime"
else
  echo "❌ Permesso microfono NON presente"
fi
echo ""

# 4️⃣ Service Worker disabilitato per debug
echo "4️⃣ Controllo Service Worker..."
if grep -q "caches.match" "$PROJECT_ROOT/android/app/src/main/assets/public/sw.js"; then
  echo "⚠️ Service Worker presente (verifica se disabilitato per debug)"
else
  echo "✅ Service Worker non presente / disabilitato"
fi
echo ""

# 5️⃣ Verifica build Android (debug)
echo "5️⃣ Controllo eventuali build Android:"
if [ -f "$PROJECT_ROOT/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
  echo "✅ APK debug già generato"
else
  echo "⚠️ APK debug NON trovato, puoi eseguire './gradlew assembleDebug'"
fi
echo ""

# 6️⃣ Stato git
echo "6️⃣ Stato Git:"
cd "$PROJECT_ROOT" || exit
git_status=$(git status -s)
if [ -z "$git_status" ]; then
  echo "✅ Tutti i file tracciati e committati"
else
  echo "⚠️ File non tracciati o modificati:"
  echo "$git_status"
fi
echo ""

# 7️⃣ Repository GitHub
echo "7️⃣ Repository GitHub:"
remote=$(git remote -v 2>/dev/null | head -1)
if [ -n "$remote" ]; then
  echo "✅ Remote: $remote"
else
  echo "❌ Remote non configurato"
fi
echo ""

echo "==============================="
echo "FINE STATUS"
echo "==============================="
