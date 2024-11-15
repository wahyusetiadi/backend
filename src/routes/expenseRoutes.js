const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/', (req, res) => {
  const adminCabang = req.user?.cabang;
  console.log("cabang", adminCabang);
  
  const { keperluan, biaya, petugas } = req.body;

  if(!keperluan || ! biaya || !petugas) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }

  const query = 'INSERT INTO pengeluaran (keperluan, biaya, petugas, cabang) VALUES (?, ?, ?, ?)';
  db.run(query, [keperluan, biaya, petugas, adminCabang], function(err) {
    if(err) {
      return res.status(500).json({ message: "Gagal Input Transaksi", error: err });
    }
    res.status(201).json({ message: "Input pengeluaran berhasil", id: this.lastID });
  });
});

router.get('/', (req, res) => {
  const query = 'SELECT * FROM pengeluaran';

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
  SELECT SUM(biaya) AS total_pengeluaran
  FROM pengeluaran
  WHERE DATE(tanggal) = ?`;

  db.get(query, [today], (err, row) => {
    if (err) {
      console.error("Gagal GET pengeluaran:", err);
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

  const query = "DELETE FROM pengeluaran WHERE id = ?";

  db.run(query, [id], function (err) {
    if (err) {
      return res
      .status(500)
      .json({ message: "Gagal menghapus pengeluaran", error: err });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Pengeluaran tidak ditemukan! "});
    }
    res.status(200).json({ message: "Berhasil menghapus pengeluaran "});
  });
});
  

module.exports = router;
