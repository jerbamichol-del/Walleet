import React, { useRef, useState } from 'react';
import { voiceMode } from '@/config';
import { startSpeech, stopSpeech } from '@/services/speech';

export default function AddExpense(){
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const descRef = useRef(null);

  async function handleMic(){
    if (voiceMode === 'plugin'){
      try {
        await startSpeech({ lang:'it-IT', popup:true, onResult:(t)=>setDesc(t), onError:(e)=>console.log('speech err', e), logger:console.log });
      } catch(e){ console.log('startSpeech failed', e); }
    } else {
      // keyboard mode (default): metti a fuoco l'input → l'utente usa 🎤 della tastiera
      try { descRef.current?.focus(); } catch(_) {}
    }
  }
  async function handleStop(){
    if (voiceMode === 'plugin') await stopSpeech(console.log);
  }

  return (
    <div style={{padding:16}}>
      <h2>Aggiungi spesa</h2>

      <label>Descrizione</label>
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
        <input
          ref={descRef}
          value={desc}
          onChange={(e)=>setDesc(e.target.value)}
          placeholder="Es: Caffè bar"
          style={{flex:1, padding:'10px 12px', border:'1px solid #ccc', borderRadius:8}}
        />
        <button onClick={handleMic} title={voiceMode==='plugin'?'Detta con Google (popup)':'Usa 🎤 della tastiera'}>
          🎤
        </button>
        {voiceMode==='plugin' && <button onClick={handleStop} title="Stop riconoscimento">⏹️</button>}
      </div>

      <small style={{opacity:0.75,display:'block',marginBottom:12}}>
        {voiceMode==='plugin'
          ? 'Se il popup non restituisce testo, chiudi il popup: l\'app forza lo stop per flush dei risultati.'
          : 'Suggerimento: tocca 🎤 sulla tastiera (Gboard) per dettare direttamente in questo campo.'}
      </small>

      <label>Importo</label>
      <input
        value={amount}
        onChange={(e)=>setAmount(e.target.value)}
        placeholder="Es: 1.20"
        inputMode="decimal"
        style={{display:'block', width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8, marginTop:8}}
      />

      {/* Qui i tuoi bottoni di salvataggio originali */}
    </div>
  );
}
