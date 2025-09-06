const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ error: 'Username already exists' });

    await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role || 'staff']
    );
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login - with JWT token generation
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];

    // Simple password check (consider hashing for production)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable not set!');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
const SECRET_KEY = 'my_fixed_secret_key';

const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;