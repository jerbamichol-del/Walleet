import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// Shim web: usa Web Speech API quando il nativo fallisce o è disabilitato
function webShimStart({ lang = 'it-IT', onResult, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onError?.(new Error('Web Speech non disponibile')); return { stop(){} }; }
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = true;
  rec.onresult = (e) => {
    const i = e.resultIndex;
    const text = e.results[i][0].transcript;
    onResult?.(text, e.results[i].isFinal);
  };
  rec.onerror = (e) => onError?.(new Error(e.error || 'SR error'));
  rec.start();
  return { stop: () => rec.stop() };
}

export async function startSpeech({ lang = 'it-IT', onResult, onError } = {}) {
  const preferShim = localStorage.getItem('voiceShimEnabled') === '1';
  const isAndroid = Capacitor.getPlatform() === 'android';

  if (preferShim) return webShimStart({ lang, onResult, onError });

  if (isAndroid) {
    try {
      const avail = await SpeechRecognition.available();
      if (avail?.available === false) throw new Error('Speech non disponibile sul device');

      const perm = await SpeechRecognition.hasPermission();
      if (!perm?.permission) {
        const req = await SpeechRecognition.requestPermission();
        if (!req?.permission) throw new Error('Permesso microfono negato');
      }

      await SpeechRecognition.start({
        language: lang,
        partialResults: true,
        popup: false,
        maxResults: 1,
      });

      const handler = (r) => {
        const text = r?.matches?.[0] || '';
        onResult?.(text, !!text);
      };
      SpeechRecognition.addListener('partialResults', handler);
      SpeechRecognition.addListener('result', handler);

      return {
        stop: async () => {
          try { await SpeechRecognition.stop(); } catch {}
          SpeechRecognition.removeAllListeners();
        }
      };
    } catch (e) {
      console.warn('[speech] nativo fallito, fallback shim:', e);
      return webShimStart({ lang, onResult, onError });
    }
  }

  return webShimStart({ lang, onResult, onError });
}
