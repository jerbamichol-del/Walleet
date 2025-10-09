import React, { useState } from 'react';
import { addExpense } from '../db';

const CATS = ['Spesa', 'Trasporti', 'Ristorante', 'Casa', 'Svago', 'Altro'];

export default function AddExpense({ onSaved }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [category, setCategory] = useState('Altro');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const canSave = date && amount;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    try {
      await addExpense({ date, category, amount: Number(amount), note });
      setAmount('');
      setNote('');
      onSaved?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display:'grid', gap: 12, padding: 16 }}>
      <label>
        Data<br/>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputStyle}/>
      </label>
      <label>
        Categoria<br/>
        <select value={category} onChange={e=>setCategory(e.target.value)} style={inputStyle}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>
        Importo (€)<br/>
        <input type="number" step="0.01" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} style={inputStyle}/>
      </label>
      <label>
        Nota (opzionale)<br/>
        <input type="text" value={note} onChange={e=>setNote(e.target.value)} style={inputStyle}/>
      </label>
      <button type="submit" disabled={!canSave || busy} style={btnStyle}>
        {busy ? 'Salvataggio...' : 'Salva'}
      </button>
    </form>
  );
}

const inputStyle = { width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:10 };
const btnStyle = { padding:'10px 14px', borderRadius:10, border:'1px solid #333', background:'#f5f5f5' };
