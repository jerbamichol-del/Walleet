#!/data/data/com.termux/files/usr/bin/bash
# ========================================
# WALLEET STATUS — Diagnostica completa (manuale)
# ========================================
# Percorsi assoluti già impostati
# Non salva più automaticamente
# Esegui con:
#   bash /data/data/com.termux/files/home/Walleet/android/walleet_status.sh
# o alias: wstatus
# ========================================

echo "==============================="
echo "WALLEET — STATUS COMPLETO"
echo "==============================="

# --- 1️⃣ Ambiente ---
echo "1️⃣ Ambiente"
echo "• Termux: rilevato"
echo "  - Device: $(getprop ro.product.manufacturer) $(getprop ro.product.model)"
echo "  - Model: $(getprop ro.product.model)"
echo "  - SDK: $(getprop ro.build.version.sdk)"
echo "  - Arch: $(uname -m)"
echo "  - Shell: $SHELL"
echo "  - Termux Variables:"
env | grep TERMUX_ || echo "  ⚠️ nessuna variabile TERMUX trovata"
echo "  - Node: $(node -v 2>/dev/null)"
echo "  - npm: $(npm -v 2>/dev/null)"
echo "  - Java: $(java -version 2>&1 | head -n1)"
echo "  - Vite: $(npx vite -v 2>/dev/null)"
echo "  - gh CLI: $(gh --version 2>/dev/null | head -n1)"

# --- 2️⃣ File chiave & entrypoint ---
echo ""
echo "2️⃣ File chiave & entrypoint"
FILES=(
"/data/data/com.termux/files/home/Walleet/index.html"
"/data/data/com.termux/files/home/Walleet/vite.config.js"
"/data/data/com.termux/files/home/Walleet/capacitor.config.json"
"/data/data/com.termux/files/home/Walleet/package.json"
"/data/data/com.termux/files/home/Walleet/src/main.jsx"
"/data/data/com.termux/files/home/Walleet/src/App.jsx"
"/data/data/com.termux/files/home/Walleet/src/components/NavBar.jsx"
"/data/data/com.termux/files/home/Walleet/public/index.css"
"/data/data/com.termux/files/home/Walleet/public/manifest.json"
"/data/data/com.termux/files/home/Walleet/www/index.html"
"/data/data/com.termux/files/home/Walleet/dist/index.html"
"/data/data/com.termux/files/home/Walleet/legacy_www_final/index.html"
"/data/data/com.termux/files/home/Walleet/android/app/src/main/java/com/example/gestorespese/MainActivity.java"
"/data/data/com.termux/files/home/Walleet/android/app/build.gradle"
"/data/data/com.termux/files/home/Walleet/android/gradle/wrapper/gradle-wrapper.properties"
)
for f in "${FILES[@]}"; do
  [ -f "$f" ] && echo "✅ $f" || echo "❌ $f"
done

# --- 3️⃣ Bundle web ---
echo ""
echo "3️⃣ Bundle web"
BUNDLES=(
"/data/data/com.termux/files/home/Walleet/legacy_www_final"
"/data/data/com.termux/files/home/Walleet/www"
)
for d in "${BUNDLES[@]}"; do
  [ -d "$d" ] && echo "✅ $d" || echo "❌ $d"
done

# --- 4️⃣ Capacitor ---
echo ""
echo "4️⃣ Capacitor config"
CONFIG="/data/data/com.termux/files/home/Walleet/capacitor.config.json"
if [ -f "$CONFIG" ]; then
  grep -E '"appId"|"appName"' "$CONFIG"
else
  echo "⚠️ capacitor.config.json non trovato"
fi

# --- 5️⃣ Gradle / Android ---
echo ""
echo "5️⃣ Android / Gradle"
GRADLE="/data/data/com.termux/files/home/Walleet/android/app/build.gradle"
if [ -f "$GRADLE" ]; then
  grep 'applicationId' "$GRADLE" || echo "⚠️ Nessun applicationId rilevato"
  grep 'compileSdk' "$GRADLE"
  grep 'targetSdk' "$GRADLE"
else
  echo "⚠️ build.gradle non trovato"
fi

# --- 6️⃣ Git ---
echo ""
echo "6️⃣ Git"
cd /data/data/com.termux/files/home/Walleet || exit
echo "• Branch attuale: $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
echo "• Ultimi 5 commit:"
git log -5 --oneline 2>/dev/null
echo "• Modifiche locali:"
git status --short

# --- 7️⃣ Service Worker ---
echo ""
echo "7️⃣ Service Worker"
SWS=(
"/data/data/com.termux/files/home/Walleet/legacy_www_final/service-worker.js"
"/data/data/com.termux/files/home/Walleet/legacy_www_final/sw.js"
)
for f in "${SWS[@]}"; do
  [ -f "$f" ] && echo "✅ $f" || echo "❌ $f"
done

# --- 8️⃣ Manifest / Icone ---
echo ""
echo "8️⃣ Manifest / Icone"
ICONS=(
"/data/data/com.termux/files/home/Walleet/legacy_www_final/manifest.json"
"/data/data/com.termux/files/home/Walleet/legacy_www_final/icons/icon-192.png"
"/data/data/com.termux/files/home/Walleet/legacy_www_final/icons/icon-512.png"
)
for f in "${ICONS[@]}"; do
  [ -f "$f" ] && echo "✅ $f" || echo "❌ $f"
done

echo ""
echo "==============================="
echo "FINE STATUS"
echo "==============================="
