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

    // 1. Get current stock & price
    const [rows] = await connection.query(
      'SELECT quantity, price FROM items WHERE id = ? FOR UPDATE',
      [item_id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Item not found' });
    }
    const { quantity: currentQty, price } = rows[0];
    if (currentQty < quantity) {
      await connection.rollback();
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // 2. Update stock
    await connection.query(
      'UPDATE items SET quantity = quantity - ? WHERE id = ?',
      [quantity, item_id]
    );

    // 3. Insert order record
    await connection.query(
      'INSERT INTO orders (item_id, quantity, user_id) VALUES (?, ?, ?)',
      [item_id, quantity, user_id]
    );

    // 4. Insert log
    const description = `Item ID: ${item_id}, Qty: ${quantity}, Remaining: ${currentQty - quantity}`;
    await connection.query(
      'INSERT INTO logs (action, user_id, description) VALUES (?, ?, ?)',
      ['Order Placed', user_id, description]
    );

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully' });
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error placing order:", error);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    connection.release();
  }
});

// Sales report
router.get('/sales', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(SUM(o.quantity * i.price), 0) AS total_sales,
        COUNT(o.id) AS total_orders
      FROM orders o
      JOIN items i ON o.item_id = i.id
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Sales report error:", err);
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

module.exports = router;
