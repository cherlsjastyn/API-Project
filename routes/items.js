const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

// ✅ GET /api/items - protected
router.get('/', auth, async (req, res) => {
  try {
    console.log('✅ GET /api/items - User:', req.user.username);
    const [rows] = await pool.query('SELECT * FROM items');
    res.json(rows);
  } catch (error) {
    console.error('❌ Database error in GET /items:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ POST /api/items - protected
router.post('/', auth, async (req, res) => {
  const { name, quantity, status, price } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO items (name, quantity, status, price) VALUES (?, ?, ?, ?)',
      [name, quantity, status, price]
    );
    console.log('✅ Item inserted:', { id: result.insertId, name });
    res.status(201).json({ id: result.insertId, name, quantity, status, price });
  } catch (error) {
    console.error('❌ Database error in POST /items:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ DELETE /api/items/:id - protected
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('❌ Database error in DELETE /items/:id:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ PUT /api/items/:id - update status, quantity, price
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { status, quantity, price } = req.body;

  const validStatuses = ['available', 'under maintenance', 'not available'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE items SET status = ?, quantity = ?, price = ? WHERE id = ?',
      [status, quantity, price, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

await pool.query(
  'INSERT INTO logs (action, user_id, description) VALUES (?, ?, ?)',
  [
    'item updated',
    req.user.id || null,
    `Item ID: ${id}, Status: ${status}, Quantity: ${quantity}, Price: ₱${price}`
  ]
);


    res.json({ message: 'Item updated' });
  } catch (error) {
    console.error('❌ Database error in PUT /items/:id:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ Low stock route
router.get('/low-stock', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM items WHERE quantity <= 5 ORDER BY quantity ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching low-stock items:', err);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

module.exports = router;
