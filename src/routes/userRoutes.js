// src/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const authenticate = require('../middlewares/authMiddleware');
const router = express.Router();

// Register User (Admin cabang dan admin besar)
router.post('/register', (req, res) => {
  const { name, email, password, role, cabang } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8); // Hash password
  
  const query = 'INSERT INTO users (name, email, password, role, cabang) VALUES (?, ?, ?, ?, ?)';
  db.get(`
    SELECT id, name, email, role, cabang FROM users WHERE name = ? OR email = ?
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

  const query = 'SELECT name, password, role, cabang FROM users WHERE name = ?';
  db.get(query, [name], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Verifikasi password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Username atau password salah!' });
    }

    const now = new Date();
    const formattedDate = now.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');

    // Generate token JWT
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role, cabang: user.cabang }, 'jwt_token_secret', { expiresIn: '12h' });

    // Log activity ke file
    const logMessage = `${formattedDate}\nUser [${name}] dari cabang [${user.cabang}] berhasil login\n`;
    fs.appendFile(path.join(__dirname, '..', '..', 'data', 'login_logs.txt'), logMessage, (err) => {
      if (err) {
        console.error('Failed to write log:', err);
      }
    });
    console.log(logMessage);

    // Respons sukses dengan status 200
    res.status(200).json({
      message: 'Login Berhasil',
      token: token,
    });
  });
});


router.get('/', (req, res) => {
  const query = `SELECT id, name, role, cabang, dibuatTanggal, dibuatJam FROM users`;

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

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, cabang } = req.body;

  if (!name || !email || !role || !cabang) {
    return res.status(400).json({ message: 'Semua field wajib diisi (name, email, role, cabang).' });
  }

  let updatedPassword = null;
  if (password) {
    updatedPassword = bcrypt.hashSync(password, 8);
  }

  const checkQuery = 'SELECT * FROM users WHERE email = ? AND id != ?';
  db.get(checkQuery, [email, id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
    if (row) {
      return res.status(400).json({ message: 'Email sudah digunakan oleh user lain.' });
    }

    const updateQuery = `
      UPDATE users
      SET name = ?, email = ?, password = ?, role = ?, cabang = ?
      WHERE id = ?
    `;

    db.run(updateQuery, [name, email, updatedPassword || null, role, cabang, id], function (err) {
      if (err) {
        return res.status(500).json({ message: "Gagal memperbarui user", error: err });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      res.status(200).json({ message: `User dengan ID ${id} berhasil diperbarui.` });
    });
  });
});

//endpoint untuk GET user
router.get('/data', authenticate, (req, res) => {
  const { name, role, cabang } = req.user; // Ambil hanya kolom name, role, cabang
  res.json({ name, role, cabang }); // Kirimkan sebagai response
});

// Endpoint logout
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Ambil token dari header Authorization

  if (!token) {
    return res.status(400).json({ message: 'Token tidak ditemukan' });
  }

  // Verifikasi token
  jwt.verify(token, 'jwt_token_secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid' });
    }

    const now = new Date();
    const formattedDate = now.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');

    // Log aktivitas logout ke file
    const username = decoded.name;
    const logMessage = `${formattedDate}\nUser [${username}] berhasil logout\n`;

    fs.appendFile(path.join(__dirname, '..', '..', 'data', 'logout_logs.txt'), logMessage, (err) => {
      if (err) {
        console.error('Gagal menulis log:', err);
      }
    });
    console.log(logMessage);

    res.status(200).json({ message: 'Logout berhasil' });
  });
});

// Endpoint untuk mengambil logout logs
router.get('/logout-logs', (req, res) => {
  const logFilePath = path.join(__dirname, '..', '..', 'data', 'logout_logs.txt');

  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal membaca file log' });
    }

    // Kirimkan isi file log ke frontend
    res.status(200).json({ logs: data.split('\n').filter(line => line !== '') });
  });
});

router.get('/login-logs', (req, res) => {
  const logFilePath = path.join(__dirname, '..', '..', 'data', 'login_logs.txt');

  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal membaca file log' });
    }

    // Kirimkan isi file log ke frontend
    res.status(200).json({ logs: data.split('\n').filter(line => line !== '') });
  });
});

module.exports = router;
