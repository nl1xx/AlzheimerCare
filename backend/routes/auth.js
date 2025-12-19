const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/auth');

// Register
router.post('/register', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Missing fields' });

  const hashedPassword = bcrypt.hashSync(password, 8);
  
  const sql = 'INSERT INTO users (phone, password) VALUES (?, ?)';
  db.run(sql, [phone, hashedPassword], function(err) {
    if (err) {
      return res.status(400).json({ error: 'User already exists or invalid data' });
    }
    const token = jwt.sign({ id: this.lastID, phone }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ message: 'User registered', userId: this.lastID, token });
  });
});

// Login
router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  const sql = 'SELECT * FROM users WHERE phone = ?';
  db.get(sql, [phone], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row && bcrypt.compareSync(password, row.password)) {
      const token = jwt.sign({ id: row.id, phone: row.phone }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ message: 'Login successful', userId: row.id, token, user: { id: row.id, phone: row.phone } });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

module.exports = router;
