const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all logs
router.get('/', async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT l.id, l.action, l.user_id, l.description, l.timestamp, u.username
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC
    `);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Add a new log manually
router.post('/', async (req, res) => {
  const { action, user_id, item_id, quantity } = req.body;
  const description = `Item ID: ${item_id}, Quantity: ${quantity}`;
  try {
    await pool.query(
      'INSERT INTO logs (action, user_id, description) VALUES (?, ?, ?)',
      [action, user_id, description]
    );
    res.status(201).json({ message: 'Log entry added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add log entry' });
  }
});

module.exports = router;
