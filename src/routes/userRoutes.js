// src/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Register User (Admin cabang dan admin besar)
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8); // Hash password
  
  const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
  db.run(query, [name, email, hashedPassword, role], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to register user', error: err });
    }
    res.status(201).json({ message: 'User registered successfully', id: this.lastID });
  });
});

// Login User (Admin cabang atau admin besar)
router.post('/login', (req, res) => {
  const { name, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE name = ?';
  db.get(query, [name], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verifikasi password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate token JWT
    const token = jwt.sign({ id: user.id, role: user.role }, 'your_jwt_secret', { expiresIn: '60s' });
    
    // Respons sukses dengan status 200
    res.status(200).json({
      message: 'Login successful',
      token: token
    });
  });
});

router.get('/', (req, res) => {
  const query = `SELECT * FROM users`;

  db.all(query, (err, rows) => {
    if(err) {
      return res.status(500).json({ message: "gagal GET users", error: err });
    }
    res.status(200).json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM users WHERE id = ?`;

  db.run(query, [id], function(err) {
    if(err) {
      return res.status(500).json({ message: "Gagal menghapus user id:", error: err });
    }
    if(this.changes === 0) {
      return res.status(404).json({ message: "User not found "});
    }
    res.status(200).json({ message: "Berhasil menghapus user id:"});
  });
});

module.exports = router;
