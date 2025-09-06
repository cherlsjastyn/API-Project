require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express(); // <-- Declare app first


app.use(cors());
app.use(express.json());

// Import routes after app is declared
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const orderRoutes = require('./routes/orders');
const logRoutes = require('./routes/logs');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/logs', logRoutes);

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('Inventory Management API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));