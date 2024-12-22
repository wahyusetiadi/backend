// app.js
const express = require("express");
// const bodyParser = require('body-parser');
const cors = require("cors"); // Import CORS
// const db = require("./src/db"); // Pastikan path ini benar
const userRoutes = require("./src/routes/userRoutes");
const branchRoutes = require("./src/routes/branchRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");
const expanseRoutes = require("./src/routes/expenseRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const biayaRoutes = require("./src/routes/biayaRoutes")
const authenticate = require("./src/middlewares/authMiddleware");
const path = require("path");
const dbPath = path.join(__dirname, '..', 'data', 'db.sqlite');

require('dotenv').config();

const app = express();
const port = 4301;

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Gunakan middleware CORS untuk mengizinkan akses dari domain frontend tertentu
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Ganti dengan URL frontend Anda
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middleware untuk parsing JSON request body
app.use(express.json());

// Rute untuk API
app.use("/users", userRoutes);
app.use("/admin/branches", branchRoutes);
app.use("/transaksi", authenticate, transactionRoutes);
app.use("/pengeluaran", authenticate, expanseRoutes);
app.use("/biaya", biayaRoutes);
app.use("/report", reportRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
