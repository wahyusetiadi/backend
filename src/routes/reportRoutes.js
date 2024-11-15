// src/routes/reportRoutes.js
const express = require("express");
const db = require("../db");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const authenticate = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/transaksi/export", authenticate, (req, res) => {
  const cabang = req.query.cabang;
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  let query = "SELECT * FROM transaksi";
  const params = [];

  if (cabang) {
    query += " WHERE cabang = ?";
    params.push(cabang);
  }

  if (fromDate && toDate) {
    query += cabang ? " AND tanggal BETWEEN ? AND ?" : " WHERE tanggal BETWEEN ? AND ";
    params.push(fromDate, toDate);
  } else if (fromDate) {
    query += cabang ? " AND tanggal >= ?" : " WHERE tanggal >= ?";
    params.push(fromDate);
  } else if (toDate) {
    query += cabang ? " AND tanggal <= ?" : " WHERE tanggal <=?";
    params.push(toDate);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to get transactions", error: err });
    }

    if (rows.length === 0) {
      res
        .status(404)
        .send("Tidak ada data yang ditemukan untuk cabang yang diminta!");
      return;
    }
    // Convert data ke file Excel
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Transaksi");

    const filePath = path.join(
      __dirname,
      cabang ? `exported_data_${cabang}.xlsx` : "exported_data_all.xlsx"
    );
    xlsx.writeFile(wb, filePath);

    // Kirim file Excel sebagai response
    res.download(filePath, "transaksi.xlsx", (err) => {
      if (err) {
        console.error("Error downloading file:", err);
      }
      // Optional: Hapus file setelah diunduh
      fs.unlinkSync(filePath);
    });
  });
});

router.get("/pengeluaran/export", authenticate, (req, res) => {
  const cabang = req.query.cabang;
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  let query = "SELECT * FROM pengeluaran";
  const params = [];

  if (cabang) {
    query += " WHERE cabang = ?";
    params.push(cabang);
  }

  if (fromDate && toDate) {
    query += cabang ? " AND tanggal BETWEEN ? AND ?" : " WHERE tanggal BETWEEN ? AND ";
    params.push(fromDate, toDate);
  } else if (fromDate) {
    query += cabang ? " AND tanggal >= ?" : " WHERE tanggal >= ?";
    params.push(fromDate);
  } else if (toDate) {
    query += cabang ? " AND tanggal <= ?" : " WHERE tanggal <=?";
    params.push(toDate);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to get expanse", error: err });
    }

    if (rows.length === 0) {
      res
        .status(404)
        .send("Tidak ada data yang ditemukan untuk cabang yang diminta!");
      return;
    }
    // Convert data ke file Excel
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Pengeluaran");

    const filePath = path.join(
      __dirname,
      cabang ? `exported_data_pengeluaran_${cabang}.xlsx` : "exported_data_pengeluaran_all.xlsx"
    );
    xlsx.writeFile(wb, filePath);

    // Kirim file Excel sebagai response
    res.download(filePath, "pengeluaran.xlsx", (err) => {
      if (err) {
        console.error("Error downloading file:", err);
      }
      // Optional: Hapus file setelah diunduh
      fs.unlinkSync(filePath);
    });
  });
});

module.exports = router;
