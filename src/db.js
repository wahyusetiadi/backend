// src/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Buat koneksi ke database SQLite (db.sqlite)
const db = new sqlite3.Database(
  path.join(__dirname, "..", "data", "new_database.db"),
  (err) => {
    if (err) {
      console.error("Error opening database", err);
    } else {
      console.log("Connected to SQLite database.");
    }
  }
);

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
      isDeleted INTEGER DEFAULT 0,
      dibuat_tanggal DATE DEFAULT (DATE('now', '+7 hours')),
      dibuat_jam TIME DEFAULT (TIME('now' , '+7 hours'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
    
    
      branch TEXT NOT NULL,
      isDeleted INTEGER DEFAULT 0,
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
      isDeleted INTEGER DEFAULT 0,
      tanggal DATE DEFAULT (DATE('now', '+7 hours')),
      waktu TIME DEFAULT (TIME('now', '+7 hours'))
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS transaksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomorPolisi TEXT NOT NULL,
    jenis TEXT NOT NULL,
    tipe TEXT NOT NULL,
    biaya INTEGER,
    petugas TEXT NOT NULL,
    cabang TEXT NOT NULL,
    fee TEXT NOT NULL,
    confirm INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    tanggal DATE DEFAULT (DATE('now', '+7 hours')),
    waktu TIME DEFAULT (TIME('now', '+7 hours'))
  )
`);

  db.run(`
    CREATE TABLE IF NOT EXISTS transaksi_lain (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jenis TEXT NOT NULL,
  item TEXT NOT NULL,
  harga INTEGER,
  amount INTEGER DEFAULT 1,
  gambar TEXT,
  cabang TEXT NOT NULL,
  isDeleted INTEGER DEFAULT 0,
  tanggal DATE DEFAULT (DATE('now', '+7 hours')),
  waktu TIME DEFAULT (TIME('now', '+7 hours'))
)
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS biaya (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  biaya INTEGER
  )
  `);

  db.run(`CREATE TABLE IF NOT EXISTS upload_batch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cabang TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    filename TEXT NOT NULL,
    originalname TEXT NOT NULL,
    isDeleted INTEGER DEFAULT 0,
    createdAt TIME DEFAULT (TIME('now', '+7 hours'))
  )`);

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
