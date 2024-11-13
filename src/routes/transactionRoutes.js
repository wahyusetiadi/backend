const express = require("express");
const db = require("../db");
const router = express.Router();

// Endpoint untuk menambahkan transaksi baru
router.post("/", (req, res) => {
  const { nomorPolisi, jenisKendaraan, biaya, petugas } = req.body;

  // Periksa apakah semua field ada
  if (!nomorPolisi || !jenisKendaraan || !biaya || !petugas) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  // Query untuk menambahkan transaksi baru
  const query =
    "INSERT INTO transaksi (nomorPolisi, jenisKendaraan, biaya, petugas) VALUES (?, ?, ?, ?)";

  db.run(query, [nomorPolisi, jenisKendaraan, biaya, petugas], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Gagal menambahkan transaksi", error: err });
    }
    res
      .status(201)
      .json({ message: "Transaksi berhasil ditambahkan", id: this.lastID });
  });
});

// Endpoint untuk mengambil semua transaksi
router.get("/", (req, res) => {
  const query = "SELECT * FROM transaksi";

  db.all(query, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Gagal GET transaksi", error: err });
    }
    res.status(200).json(rows);
  });
});

router.get("/transaksi-hari-ini", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const query = `
  SELECT COUNT(id) AS total_transaksi_harian
  FROM transaksi
  WHERE DATE(tanggal) = ?`;

  db.get(query, [today], (err, row) => {
    if (err) {
      console.error("Gagal GET total transaksi harian:", err);
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
    SELECT SUM(biaya) AS total_pendapatan
    FROM transaksi
    WHERE DATE(tanggal) = ?`;

  db.get(query, [today], (err, row) => {
    if (err) {
      console.error("Gagal GET pendapatan:", err);
      return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }

    // Mengirimkan response berupa total pendapatan
    res.json({
      totalPendapatan: row.total_pendapatan || 0,
      tanggal: today, // Menambahkan tanggal yang digunakan dalam response
    });
  });
});

// Endpoint untuk menghapus transaksi berdasarkan ID
router.delete("/:id", (req, res) => {
  const { id } = req.params; // Mendapatkan ID dari parameter URL

  // Query untuk menghapus transaksi berdasarkan ID
  const query = "DELETE FROM transaksi WHERE id = ?";

  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Gagal menghapus transaksi", error: err });
    }

    if (this.changes === 0) {
      // Jika tidak ada transaksi yang dihapus (ID tidak ditemukan)
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    // Jika berhasil menghapus transaksi
    res.status(200).json({ message: "Berhasil menghapus transaksi" });
  });
});

module.exports = router;
