// src/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Buat koneksi ke database SQLite
const db = new sqlite3.Database(path.join(__dirname, "db.sqlite"), (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Membuat tabel jika belum ada
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      cabang TEXT NOT NULL, 
      dibuat_tanggal DATE DEFAULT (DATE('now')),
      dibuat_jam TIME DEFAULT (TIME('now' , '+7 hours'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pengeluaran (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keperluan TEXT NOT NULL,
      biaya INTEGER,
      petugas TEXT NOT NULL,
      cabang TEXT NOT NULL,
      tanggal DATE DEFAULT (DATE('now')),
      waktu TIME DEFAULT (TIME('now', '+7 hours'))
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS transaksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomorPolisi TEXT NOT NULL,
    jenisKendaraan TEXT NOT NULL,
    biaya INTEGER,
    gambar TEXT,
    petugas TEXT NOT NULL,
    cabang TEXT NOT NULL,
    tanggal DATE DEFAULT (DATE('now')),
    waktu TIME DEFAULT (TIME('now', '+7 hours'))
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS biaya (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  biaya INTEGER
  )
  `);

  // db.run(`
  //   CREATE TABLE IF NOT EXISTS transactions (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     branch_id INTEGER,
  //     user_id INTEGER,
  //     amount INTEGER,
  //     status TEXT,
  //     transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //     FOREIGN KEY(branch_id) REFERENCES branches(id),
  //     FOREIGN KEY(user_id) REFERENCES users(id)
  //   )
  // `);
});

module.exports = db;
