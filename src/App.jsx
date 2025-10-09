import React, { useState } from 'react';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import AddExpense from './pages/AddExpense.jsx';
import Expenses from './pages/Expenses.jsx';

export default function App() {
  const [tab, setTab] = useState('home');
  return (
    <div style={{ maxWidth: 720, margin:'0 auto' }}>
      <NavBar current={tab} onChange={setTab} />
      {tab === 'home' && <Home />}
      {tab === 'add' && <AddExpense onSaved={() => setTab('list')} />}
      {tab === 'list' && <Expenses />}
      <div style={{ height: 24 }} />
    </div>
  );
}
