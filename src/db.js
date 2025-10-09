import { openDB } from 'idb';

const DB_NAME = 'walleet';
const DB_VERSION = 1;
const STORE = 'expenses';

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('by-date', 'date');
      }
    },
  });
}

export async function addExpense({ date, category, amount, note }) {
  const db = await getDb();
  const id = crypto.randomUUID();
  const toSave = {
    id,
    date: new Date(date).toISOString(),
    category: category || 'Altro',
    amount: Number(amount) || 0,
    note: note || '',
    createdAt: new Date().toISOString(),
  };
  await db.put(STORE, toSave);
  return toSave;
}

export async function getAllExpenses() {
  const db = await getDb();
  return (await db.getAll(STORE)).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function deleteExpense(id) {
  const db = await getDb();
  await db.delete(STORE, id);
}

export function groupByDateDay(items) {
  const map = new Map();
  items.forEach(it => {
    const d = new Date(it.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    map.set(key, (map.get(key) || 0) + Number(it.amount));
  });
  return Array.from(map.entries()).map(([date, total]) => ({ date, total }));
}

export function sumTotal(items) {
  return items.reduce((acc, it) => acc + Number(it.amount), 0);
}
