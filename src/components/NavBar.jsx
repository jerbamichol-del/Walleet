import React from 'react';

export default function NavBar({ current, onChange }) {
  const tabs = [
    { key: 'home', label: 'Home' },
    { key: 'add', label: 'Aggiungi' },
    { key: 'list', label: 'Spese' },
  ];
  return (
    <nav style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid #ddd', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: current === t.key ? '2px solid #111' : '1px solid #ccc',
            background: current === t.key ? '#f5f5f5' : '#fff',
            fontWeight: current === t.key ? 700 : 400
          }}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
