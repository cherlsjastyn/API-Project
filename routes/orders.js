// routes/orders.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Place a new order
router.post('/', async (req, res) => {
  const { item_id, quantity, user_id } = req.body;

  if (!item_id || !quantity || !user_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get current stock
    const [rows] = await connection.query(
      'SELECT quantity FROM items WHERE id = ? FOR UPDATE',
      [item_id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentQty = rows[0].quantity;
    if (currentQty < quantity) {
      await connection.rollback();
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // 2. Subtract quantity from stock
    await connection.query(
      'UPDATE items SET quantity = quantity - ? WHERE id = ?',
      [quantity, item_id]
    );

    // 3. Insert order record
    await connection.query(
      'INSERT INTO orders (item_id, quantity, user_id) VALUES (?, ?, ?)',
      [item_id, quantity, user_id]
    );

    // 4. Insert log with remaining stock
    await connection.query(
      'INSERT INTO logs (action, user_id, description) VALUES (?, ?, ?)',
      [
        'order placed',
        user_id,
        `Item ID: ${item_id}, Quantity Ordered: ${quantity}, Remaining Stock: ${currentQty - quantity}`
      ]
    );

    await connection.commit();
    res.status(201).json({ message: 'Order placed, stock updated, and log created' });

  } catch (error) {
    await connection.rollback();
    console.error("❌ Error placing order:", error);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    connection.release();
  }
});

module.exports = router;
