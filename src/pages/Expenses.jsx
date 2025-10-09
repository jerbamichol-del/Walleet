import React, { useEffect, useState } from 'react';
import { getAllExpenses, deleteExpense } from '../db';

function euro(v){ return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(v||0); }
function fmt(d){ const x = new Date(d); return x.toLocaleDateString('it-IT'); }

export default function Expenses() {
  const [items, setItems] = useState([]);

  async function refresh(){ setItems(await getAllExpenses()); }
  useEffect(() => { refresh(); }, []);

  async function onDelete(id){
    await deleteExpense(id);
    await refresh();
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Spese</h2>
      {items.length === 0 && <p style={{color:'#666'}}>Nessuna spesa ancora.</p>}
      <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:10 }}>
        {items.map(it => (
          <li key={it.id} style={{ border:'1px solid #eee', borderRadius:12, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div><strong>{it.category}</strong> — {euro(it.amount)}</div>
                <div style={{ color:'#666', fontSize:12 }}>{fmt(it.date)} {it.note ? `· ${it.note}` : ''}</div>
              </div>
              <button onClick={() => onDelete(it.id)} style={{ border:'1px solid #c00', color:'#c00', background:'#fff', borderRadius:8, padding:'6px 10px' }}>
                Elimina
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
