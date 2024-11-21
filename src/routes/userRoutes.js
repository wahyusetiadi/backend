// src/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authenticate = require('../middlewares/authMiddleware');
const router = express.Router();

// Register User (Admin cabang dan admin besar)
router.post('/register', (req, res) => {
  const { name, email, password, role, cabang } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8); // Hash password
  
  const query = 'INSERT INTO users (name, email, password, role, cabang) VALUES (?, ?, ?, ?, ?)';
  db.get(`
    SELECT * FROM users WHERE name = ? OR email = ?
    `, [name, email], (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Terjadi kesalahan pada server."});
      }

      if(row) {
        return res.status(400).json({ message: 'User sudah terdaftar!'})
      }
      db.run(query, [name, email, hashedPassword, role, cabang], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Gagal mendaftarkan user', error: err });
        }
        res.status(201).json({ message: 'Registrasi user berhasil', id: this.lastID });
      });
    })
});

// Login User (Admin cabang atau admin besar)
router.post('/login', (req, res) => {
  const { name, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE name = ?';
  db.get(query, [name], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Verifikasi password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Username atau password salah!' });
    }

    // Generate token JWT
    const token = jwt.sign({ id: user.id, role: user.role, cabang: user.cabang }, 'jwt_token_secret', { expiresIn: '12h' });
    
    // Respons sukses dengan status 200
    res.status(200).json({
      message: 'Login Berhasil',
      token: token,
    });
  });
});

router.get('/', (req, res) => {
  const query = `SELECT * FROM users`;

  db.all(query, (err, rows) => {
    if(err) {
      return res.status(500).json({ message: "Gagal GET users", error: err });
    }
    res.status(200).json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM users WHERE id = ?`;

  db.run(query, [id], function(err) {
    if(err) {
      return res.status(500).json({ message: `Gagal menghapus user`, error: err });
    }
    if(this.changes === 0) {
      return res.status(404).json({ message: "User tidak ditemukan "});
    }
    res.status(200).json({ message: `Berhasil menghapus user id: ${id}`});
  });
});

//endpoint untuk GET user
router.get('/data', authenticate, (req, res) => {
  res.json(req.user);
})

module.exports = router;
