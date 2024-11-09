const express = require('express');
const db = require('../db');
const router = express.Router();

// Endpoint untuk menambahkan transaksi baru
router.post('/', (req, res) => {
  const { nomorPolisi, jenisKendaraan, harga, petugas } = req.body;
  
  // Periksa apakah semua field ada
  if (!nomorPolisi || !jenisKendaraan || !harga || !petugas) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }

  const query = 'INSERT INTO transaksi (nomorPolisi, jenisKendaraan, harga, petugas) VALUES (?, ?, ?, ?)';
  db.run(query, [nomorPolisi, jenisKendaraan, harga, petugas], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to insert transaction', error: err });
    }
    res.status(201).json({ message: 'Transaction successfully added', id: this.lastID });
  });
});

// Endpoint untuk mengambil semua transaksi
router.get('/', (req, res) => {
    const query = 'SELECT * FROM transaksi';
  
    db.all(query, (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch transactions', error: err });
      }
      res.status(200).json(rows);
    });
  });

module.exports = router;
