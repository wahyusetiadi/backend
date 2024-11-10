const express = require("express");
const db = require("../db");
const router = express.Router();

// Endpoint untuk menambahkan transaksi baru
router.post("/", (req, res) => {
  const { nomorPolisi, jenisKendaraan, harga, petugas } = req.body;

  // Periksa apakah semua field ada
  if (!nomorPolisi || !jenisKendaraan || !harga || !petugas) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  // Query untuk menambahkan transaksi baru (tanggalTransaksi akan otomatis terisi dengan CURRENT_TIMESTAMP)
  const query =
    "INSERT INTO transaksi (nomorPolisi, jenisKendaraan, harga, petugas) VALUES (?, ?, ?, ?)";

  db.run(query, [nomorPolisi, jenisKendaraan, harga, petugas], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to insert transaction", error: err });
    }
    res
      .status(201)
      .json({ message: "Transaction successfully added", id: this.lastID });
  });
});

// Endpoint untuk mengambil semua transaksi
router.get("/", (req, res) => {
  const query = "SELECT * FROM transaksi";

  db.all(query, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to fetch transactions", error: err });
    }
    res.status(200).json(rows);
  });
});

router.get("/transaksi-hari-ini", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const query = `
  SELECT COUNT(id) AS total_transaksi_harian
  FROM transaksi
  WHERE DATE(tanggalTransaksi) = ?`;

  db.get(query, [today], (err, row) => {
    if (err) {
      console.error("Error fetching total transaksi harian:", err);
      return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
    res.json({
      totalTransaksiHarian: row.total_transaksi_harian || 0,
      tanggal: today, // Menambahkan tanggal yang digunakan dalam response
    });
  });
});

// Endpoint untuk mendapatkan total pendapatan hari ini
router.get("/pendapatan-hari-ini", (req, res) => {
  const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
  console.log("Tanggal yang digunakan untuk query:", today); // Menambahkan log

  const query = `
    SELECT SUM(harga) AS total_pendapatan
    FROM transaksi
    WHERE DATE(tanggalTransaksi) = ?`; // Menggunakan kolom tanggalTransaksi

  db.get(query, [today], (err, row) => {
    if (err) {
      console.error("Error fetching pendapatan:", err);
      return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }

    // Mengirimkan response berupa total pendapatan
    res.json({
      totalPendapatan: row.total_pendapatan || 0,
      tanggal: today, // Menambahkan tanggal yang digunakan dalam response
    });
  });
});

module.exports = router;
