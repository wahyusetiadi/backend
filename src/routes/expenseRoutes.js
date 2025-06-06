const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/', (req, res) => {
  // const adminCabang = req.user?.cabang;
  // console.log("cabang", adminCabang);
  
  const { keperluan, biaya, petugas, cabang } = req.body;

  if(!keperluan || ! biaya || !petugas ||!cabang) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }
  const waktuTransaksi = new Date().toISOString();


  const query = 'INSERT INTO pengeluaran (keperluan, biaya, petugas, cabang) VALUES (?, ?, ?, ?)';
  db.run(query, [keperluan, biaya, petugas, cabang], function(err) {
    if(err) {
      return res.status(500).json({ message: "Gagal Input Transaksi", error: err });
    }
    console.log(`[LOG] Pengeluaran ditambahkan - Petugas: ${petugas}, Cabang: ${cabang}, Waktu: ${waktuTransaksi}`);

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
  const adminCabang = req.user.cabang;
  const userName = req.user.name;
  // console.log("pengeluaran admin cabang:", adminCabang);

  const userRole = req.user.role;
  const today = new Date();
  today.setHours(today.getHours() + 7);
  const formattedToday = today.toISOString().split("T")[0];
  // console.log("Tanggal yang digunakan untuk query:", today);
  
  let query = `SELECT SUM(biaya) AS total_pengeluaran
  FROM pengeluaran
  WHERE DATE(tanggal) = ?`;
  let queryParams = [formattedToday];

  if(userRole === "admin_besar") {
    query = `SELECT SUM(biaya) AS total_pengeluaran 
    FROM pengeluaran 
    WHERE DATE(tanggal) = ?`;
    queryParams = [formattedToday];
  }
  else if(userRole === "admin_cabang") {
    query = `SELECT SUM(biaya) AS total_pengeluaran
    FROM pengeluaran
    WHERE DATE(tanggal) = ? AND petugas = ?`;
    queryParams = [formattedToday, userName];
  }
  else {
    return res.status(403).json({ message: "Akses tidak diizinkan" });
  }
  // const query = `
  // SELECT SUM(biaya) AS total_pengeluaran
  // FROM pengeluaran
  // WHERE DATE(tanggal) = ?`;

  db.get(query, queryParams, (err, row) => {
    if (err) {
      console.error("Gagal GET pengeluaran:", err);
      return res.status(500).json({ error: "Terjadi kesalahan pada server" });      
    }
    res.json({
      totalPengeluaran: row.total_pengeluaran || 0,
      tanggal: formattedToday,
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
