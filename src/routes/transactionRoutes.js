const express = require("express");
const db = require("../db");
const multer = require("multer");
const authenticate = require("../middlewares/authMiddleware");
const path = require("path");
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Endpoint untuk menambahkan transaksi baru
// router.post("/", upload.single("gambar"), (req, res) => {
//   // const adminCabang = req.user?.cabang;
//   // console.log("cabang", adminCabang);

//   const { nomorPolisi, jenisKendaraan, biaya, petugas, cabang } = req.body;

//   // Periksa apakah semua field ada
//   if (!nomorPolisi || !jenisKendaraan || !biaya || !petugas ||!cabang) {
//     return res.status(400).json({ message: "Semua field harus diisi" });
//   }

//   const gambar = req.file ? `/uploads/${req.file.filename}` : null;

//   const waktuTransaksi = new Date().toISOString();
//   // Query untuk menambahkan transaksi baru
//   const query =
//     "INSERT INTO transaksi (nomorPolisi, jenisKendaraan, biaya, gambar, petugas, cabang) VALUES (?, ?, ?, ?, ?, ?)";

//   db.run(
//     query,
//     [nomorPolisi, jenisKendaraan, biaya, gambar, petugas, cabang],
//     function (err) {
//       if (err) {
//         return res
//           .status(500)
//           .json({ message: "Gagal menambahkan transaksi", error: err });
//       }
//       console.log(`[LOG] Transaksi ditambahkan - Petugas: ${petugas}, Cabang: ${cabang}, Waktu: ${waktuTransaksi}`);
//       res
//         .status(201)
//         .json({ message: "Transaksi berhasil ditambahkan", id: this.lastID });
//     }
//   );
// });
router.post("/", upload.single("gambar"), (req, res) => {
  const { nomorPolisi, jenisKendaraan, biaya, petugas, cabang } = req.body;

  if (!nomorPolisi || !jenisKendaraan || !biaya || !petugas || !cabang) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  const gambar = req.file ? `/uploads/${req.file.filename}` : null;
  const waktuTransaksi = new Date().toISOString();

  // Mendapatkan tanggal hari ini dalam zona waktu UTC+7
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Query untuk mengecek apakah ada transaksi dengan nomor polisi yang sama dan tanggal yang sama
  const checkQuery = `
    SELECT * FROM transaksi 
    WHERE nomorPolisi = ? AND tanggal = DATE('now', '+7 hours')
  `;

  db.get(checkQuery, [nomorPolisi], (err, row) => {
    if (err) {
      console.log("Error checking for duplicate transaction:", err);
      return res
        .status(500)
        .json({ message: "Gagal memeriksa duplikasi", error: err });
    }

    if (row) {
      // Jika ada data dengan nomor polisi yang sama dan tanggal transaksi yang sama
      return res
        .status(400)
        .json({
          message:
            "Transaksi dengan nomor polisi yang sama sudah ada pada hari ini",
        });
    }

    // Jika tidak ada duplikasi, lanjutkan proses transaksi
    const query =
      "INSERT INTO transaksi (nomorPolisi, jenisKendaraan, biaya, gambar, petugas, cabang, tanggal, waktu) VALUES (?, ?, ?, ?, ?, ?, DATE('now', '+7 hours'), TIME('now', '+7 hours'))";

    db.run(
      query,
      [nomorPolisi, jenisKendaraan, biaya, gambar, petugas, cabang],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ message: "Gagal menambahkan transaksi", error: err });
        }
        console.log(
          `[LOG] Transaksi ditambahkan - Petugas: ${petugas}, Cabang: ${cabang}, Waktu: ${waktuTransaksi}`
        );
        res
          .status(201)
          .json({ message: "Transaksi berhasil ditambahkan", id: this.lastID });
      }
    );
  });
});

router.get("/gambar/:filename", (req, res) => {
  const { filename } = req.params;
  const filePah = path.join(__dirname, "../../uploads", filename);

  res.send(filePah, (err) => {
    if (err) {
      console.error("File not found", err);
      res.status(404).json({ message: "File gambar tidak ditemukan" });
    }
  });
});

// Endpoint untuk mengambil semua transaksi
// router.get("/", authenticate, (req, res) => {
//   const adminCabang = req.user.cabang;
//   const userRole = req.user.role;
//   const userName = req.user.name; // Mendapatkan nama pengguna

//   let query = "SELECT * FROM transaksi";
//   let queryParams = [];

//   if (userRole === "admin_besar") {
//     // Admin besar bisa melihat semua transaksi
//     query = "SELECT * FROM transaksi";
//     queryParams = [];
//   } else if (userRole === "admin_cabang") {
//     // Admin cabang hanya bisa melihat transaksi sesuai dengan cabang dan petugas
//     query = "SELECT * FROM transaksi WHERE cabang = ? AND petugas = ?";
//     queryParams = [adminCabang, userName];
//   } else {
//     return res.status(403).json({ message: "Akses tidak diizinkan" });
//   }

//   db.all(query, queryParams, (err, rows) => {
//     if (err) {
//       return res
//         .status(500)
//         .json({ message: "Gagal GET transaksi", error: err });
//     }
//     res.status(200).json(rows);
//   });
// });
router.get("/", authenticate, (req, res) => {
  const adminCabang = req.user.cabang;
  const userRole = req.user.role;
  const userName = req.user.name; // Get the user's name

  let query = "SELECT * FROM transaksi";
  let queryParams = [];

  if (userRole === "admin_besar") {
    // Admin besar can view all transactions
    query = "SELECT * FROM transaksi";
    queryParams = [];
  } else if (userRole === "admin_cabang") {
    // Admin cabang can only view transactions made by their own name (petugas)
    query = "SELECT * FROM transaksi WHERE petugas = ?";
    queryParams = [userName];
  } else {
    return res.status(403).json({ message: "Access not allowed" });
  }

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to fetch transactions", error: err });
    }
    res.status(200).json(rows);
  });
});

router.get("/transaksi-hari-ini", (req, res) => {
  const adminCabang = req.user.cabang;
  const userName = req.user.name;
  console.log("transaksi admin cabang: ", adminCabang);

  const userRole = req.user.role;
  const today = new Date().toISOString().split("T")[0];

  let query = `SELECT COUNT(id) AS total_transaksi_harian
  FROM transaksi WHERE DATE(tanggal) = ?`;
  let queryParams = [today];

  if (userRole === "admin_besar") {
    query = `SELECT COUNT(id) AS total_transaksi_harian
    FROM transaksi WHERE DATE(tanggal) = ?`;
    queryParams = [today];
  } else if (userRole === "admin_cabang") {
    query = `SELECT COUNT(id) AS total_transaksi_harian
    FROM transaksi WHERE DATE(tanggal) = ? AND petugas = ?`;
    queryParams = [today, userName];
  } else {
    return res.status(403).json({ message: "Akses tidak diizinkan" });
  }

  // const query = `
  // SELECT COUNT(id) AS total_transaksi_harian
  // FROM transaksi
  // WHERE DATE(tanggal) = ?`;

  db.get(query, queryParams, (err, row) => {
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
// router.get("/pendapatan-hari-ini", (req, res) => {
//   const adminCabang = req.user.cabang;
//   console.log("pendapatan admin cabang", adminCabang);

//   userRole = req.user.role;
//   const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
//   console.log("Tanggal pendapatan:", today); // Menambahkan log

//   let query = `SELECT SUM(biaya) AS total_pendapatan
//     FROM transaksi
//     WHERE DATE(tanggal) = ?`;
//   let queryParams = [today];

//   if(userRole === "admin_besar") {
//     query = `SELECT SUM(biaya) AS total_pendapatan
//     FROM transaksi
//     WHERE DATE(tanggal) = ?`;
//     queryParams = [today];
//   } else if(userRole === "admin_cabang") {
//     query = `SELECT SUM(biaya) AS total_pendapatan
//     FROM transaksi
//     WHERE DATE(tanggal) = ? AND cabang = ?`;
//     queryParams = [today, adminCabang];
//   } else {
//     return res.status(403).json({ message: "Akses di tolak!" });
//   }

//   // const query = `;
//   //   SELECT SUM(biaya) AS total_pendapatan
//   //   FROM transaksi
//   //   WHERE DATE(tanggal) = ?`;

//   db.get(query, queryParams, (err, row) => {
//     if (err) {
//       console.error("Gagal GET pendapatan:", err);
//       return res.status(500).json({ error: "Terjadi kesalahan pada server" });
//     }

//     // Mengirimkan response berupa total pendapatan
//     res.json({
//       totalPendapatan: row.total_pendapatan || 0,
//       tanggal: today, // Menambahkan tanggal yang digunakan dalam response
//     });
//   });
// });

router.get("/pendapatan-hari-ini", (req, res) => {
  const adminCabang = req.user.cabang;
  const userName = req.user.name;
  const userRole = req.user.role;
  const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD

  console.log("Pendapatan admin cabang:", adminCabang);
  console.log("Tanggal pendapatan:", today);

  let query = `SELECT SUM(biaya) AS total_pendapatan
               FROM transaksi
               WHERE DATE(tanggal) = ?`;
  let queryParams = [today];

  // Cek role dan tentukan query
  if (userRole === "admin_besar") {
    // Admin besar bisa melihat semua pendapatan tanpa batasan petugas
    query = `SELECT SUM(biaya) AS total_pendapatan
             FROM transaksi
             WHERE DATE(tanggal) = ?`;
    queryParams = [today];
  } else if (userRole === "admin_cabang") {
    // Admin cabang hanya bisa melihat pendapatan dari petugas yang terkait
    query = `SELECT SUM(biaya) AS total_pendapatan
             FROM transaksi
             WHERE DATE(tanggal) = ? AND petugas = ?`;
    queryParams = [today, userName];
  } else {
    return res.status(403).json({ message: "Akses ditolak!" });
  }

  // Jalankan query ke database untuk menghitung pendapatan
  db.get(query, queryParams, (err, row) => {
    if (err) {
      console.error("Gagal GET pendapatan:", err);
      return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }

    // Akumulasi total pendapatan
    const totalPendapatan = row.total_pendapatan || 0;

    // Pembagian total pendapatan dengan 3
    const saldoBersih = totalPendapatan / 3;

    // Mengirimkan response berupa total pendapatan dan saldo bersih
    res.json({
      totalPendapatan: totalPendapatan, // Pendapatan total yang dihitung
      saldoBersih: saldoBersih, // Saldo bersih setelah dibagi 3
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

router.put("/:id", authenticate, (req, res) => {
  const adminCabang = req.user.cabang;
  const userRole = req.user.role;
  const transactionId = req.params.id; // ID transaksi yang akan diupdate
  const { nomorPolisi, jenisKendaraan, biaya, cabang } = req.body; // Data yang ingin diupdate

  // Memastikan data yang diperlukan ada
  if (!nomorPolisi || !jenisKendaraan || !biaya || !cabang) {
    return res
      .status(400)
      .json({ message: "Data yang diperlukan tidak lengkap" });
  }

  // Validasi hak akses berdasarkan peran
  let query =
    "UPDATE transaksi SET nomorPolisi = ?, jenisKendaraan = ?, biaya = ?, cabang = ? WHERE id = ?";
  let queryParams = [nomorPolisi, jenisKendaraan, biaya, cabang, transactionId];

  if (userRole === "admin_besar") {
    // Admin besar dapat mengubah transaksi apa pun
  } else if (userRole === "admin_cabang") {
    // Admin cabang hanya dapat mengubah transaksi milik cabang mereka
    query += " AND cabang = ?";
    queryParams.push(adminCabang);
  } else {
    return res.status(403).json({ message: "Akses tidak diizinkan" });
  }

  // Menjalankan query untuk memperbarui transaksi
  db.run(query, queryParams, function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Gagal memperbarui transaksi", error: err });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({
          message: "Transaksi tidak ditemukan atau tidak ada perubahan",
        });
    }
    res.status(200).json({ message: "Transaksi berhasil diperbarui" });
  });
});

module.exports = router;
