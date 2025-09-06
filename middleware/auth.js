const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const SECRET_KEY = 'my_fixed_secret_key';
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("✅ Decoded JWT:", decoded);

    const [users] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) return res.status(401).json({ message: 'User not found' });

    req.user = users[0];
    next();
  } catch (err) {
    console.error("❌ JWT verification error:", err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorizeRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { auth, authorizeRole };
