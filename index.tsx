import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthGate from './AuthGate';

// ✅ Debug iniziale
console.log("✅ Avvio dell'app React...");

window.onerror = (msg, url, line, col, error) => {
  const message = [
    "❌ ERRORE JAVASCRIPT:",
    `Messaggio: ${msg}`,
    `URL: ${url}`,
    `Linea: ${line}, Colonna: ${col}`,
    `Errore: ${error}`
  ].join("\n");
  alert(message);
  console.error(message);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  alert("❌ ERRORE: elemento #root non trovato nel DOM!");
  throw new Error("Could not find root element");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <AuthGate />
    </React.StrictMode>
  );
  console.log("✅ App React renderizzata correttamente.");
} catch (err) {
  alert("❌ Errore durante il rendering: " + err);
  console.error("Errore durante il rendering React:", err);
}
