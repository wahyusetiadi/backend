// src/routes/reportRoutes.js
const express = require('express');
const db = require('../db');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const authenticate = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/transactions/export', authenticate, (req, res) => {
  const query = 'SELECT * FROM transactions';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to get transactions', error: err });
    }

    // Convert data ke file Excel
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Transactions');

    const filePath = path.join(__dirname, '../../exports/transactions.xlsx');
    xlsx.writeFile(wb, filePath);

    // Kirim file Excel sebagai response
    res.download(filePath, 'transactions.xlsx', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Optional: Hapus file setelah diunduh
      fs.unlinkSync(filePath);
    });
  });
});

module.exports = router;
