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

router.get("/pengeluaran-hari-ini", (req,res) => {
  const today = new Date().toISOString().split("T")[0];
  console.log("Tanggal yang digunakan untuk query:", today);
  
  const query = `
  SELECT SUM(nominal) AS total_pengeluaran
  FROM expanse
  WHERE DATE(tanggal) = ?`;

  db.get(query, [today], (err, row) => {
    if (err) {
      console.error("Error fetching pengeluaran:", err);
      return res.status(500).json({ error: "Terjadi kesalahan pada server" });      
    }
    res.json({
      totalPengeluaran: row.total_pengeluaran || 0,
      tanggal: today,
    });
  });
});

router.delete("/:id", (req,res) => {
  const { id } = req.params;

  const query = "DELETE FROM expanse WHERE id = ?";

  db.run(query, [id], function (err) {
    if (err) {
      return res
      .status(500)
      .json({ message: "Failed to delete expanse", error: err });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Expanse not found "});
    }
    res.status(200).json({ message: "Expanse successfully delete "});
  });
});
  

module.exports = router;
