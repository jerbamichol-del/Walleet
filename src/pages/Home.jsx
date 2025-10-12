import BiometricButton from '@/components/BiometricButton.jsx';
import React, { useEffect, useState } from 'react';
import { getAllExpenses, groupByDateDay, sumTotal } from '../db';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

function euro(v) { return new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' }).format(v || 0); }

export default function Home() {
  const [items, setItems] = useState([]);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    (async () => {
      const all = await getAllExpenses();
      setItems(all);
      setSeries(groupByDateDay(all).sort((a,b) => a.date.localeCompare(b.date)));
    })();
  }, []);

  return (
    <div style={{marginBottom:12}}><BiometricButton/></div>
    <div style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Walleet</h1>
      <div style={{ marginBottom: 16, fontSize: 16 }}>
        Totale spese: <strong>{euro(sumTotal(items))}</strong>
      </div>
      <div style={{ width: '100%', height: 260, border: '1px solid #eee', borderRadius: 12, padding: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p style={{ color:'#666', marginTop: 12 }}>Grafico: somma giornaliera delle spese.</p>
    </div>
  );
}

