const express = require('express');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: read DB
function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

// Helper: write DB
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// API: get fish list
app.get('/api/fish', (req, res) => {
  const db = readDB();
  res.json(db.fish);
});

// API: add a fish (simple admin endpoint)
app.post('/api/fish', (req, res) => {
  const { name, price, qty, desc } = req.body;
  if (!name || !price || qty == null) {
    return res.status(400).json({ error: 'name, price and qty required' });
  }
  const db = readDB();
  const ids = db.fish.map(f => f.id);
  const id = ids.length ? Math.max(...ids) + 1 : 1;
  const newFish = { id, name, price: Number(price), qty: Number(qty), desc: desc || '' };
  db.fish.push(newFish);
  writeDB(db);
  res.json(newFish);
});

// API: place order
// Expected body: { customerName: "Ali", items: [{id:1, qty:2}, ...] }
app.post('/api/order', (req, res) => {
  const { customerName, items } = req.body;
  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customerName and items required' });
  }

  const db = readDB();

  // Check availability
  for (const it of items) {
    const fish = db.fish.find(f => f.id === it.id);
    if (!fish) {
      return res.status(400).json({ error: `Fish with id ${it.id} not found` });
    }
    if (it.qty <= 0 || it.qty > fish.qty) {
      return res.status(400).json({ error: `Insufficient quantity for ${fish.name}` });
    }
  }

  // Deduct quantities
  let total = 0;
  for (const it of items) {
    const fish = db.fish.find(f => f.id === it.id);
    fish.qty -= it.qty;
    total += fish.price * it.qty;
  }

  const orderId = db.orders.length ? Math.max(...db.orders.map(o => o.id)) + 1 : 1;
  const newOrder = {
    id: orderId,
    customerName,
    items,
    total: Number(total.toFixed(2)),
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  writeDB(db);

  res.json({ message: 'Order placed', order: newOrder });
});

// API: get orders
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

