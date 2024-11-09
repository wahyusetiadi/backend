const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/', (req, res) => {
  const { keperluan, nominal, petugas } = req.body;

  if(!keperluan || ! nominal || !petugas) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }

  const query = 'INSERT INTO expanse (keperluan, nominal, petugas) VALUES (?, ?, ?)';
  db.run(query, [keperluan, nominal, petugas], function(err) {
    if(err) {
      return res.status(500).json({ message: "Gagal Input Transaksi", error: err });
    }
    res.status(201).json({ message: "Input pengeluaran berhasil", id: this.lastID });
  });
});

router.get('/', (req, res) => {
  const query = 'SELECT * FROM expanse';

  db.all(query, (err, rows) => {
    if(err) {
      return res.status(500).json({ message: 'Gagal get data pengeluaran', errror: err });
    }
    res.status(200).json(rows);
  });
});
  

module.exports = router;
