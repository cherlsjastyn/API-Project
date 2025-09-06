const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

// GET /api/items - protected
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

// POST /api/items - protected
router.post('/', auth, async (req, res) => {
  const { name, quantity, status, price } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO items (name, quantity, status, price) VALUES (?, ?, ?, ?)',
      [name, quantity, status, price]
    );

    console.log('✅ Item inserted:', { id: result.insertId, name });

    res.status(201).json({
      id: result.insertId,
      name,
      quantity,
      status,
      price
    });
  } catch (error) {
    console.error('❌ Database error in POST /items:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/items/:id - protected
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
