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

//   const { nomorPolisi, tipe, biaya, petugas, cabang } = req.body;

//   // Periksa apakah semua field ada
//   if (!nomorPolisi || !tipe || !biaya || !petugas ||!cabang) {
//     return res.status(400).json({ message: "Semua field harus diisi" });
//   }

//   const gambar = req.file ? `/uploads/${req.file.filename}` : null;

//   const waktuTransaksi = new Date().toISOString();
//   // Query untuk menambahkan transaksi baru
//   const query =
//     "INSERT INTO transaksi (nomorPolisi, tipe, biaya, gambar, petugas, cabang) VALUES (?, ?, ?, ?, ?, ?)";

//   db.run(
//     query,
//     [nomorPolisi, tipe, biaya, gambar, petugas, cabang],
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
  const { nomorPolisi, jenis, tipe, biaya, petugas, cabang } = req.body;

  if (!nomorPolisi || !jenis || !tipe || !biaya || !petugas || !cabang) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  const gambar = req.file ? `/uploads/${req.file.filename}` : null;
  const waktuTransaksi = new Date().toISOString();

  // Mendapatkan tanggal hari ini dalam zona waktu UTC+7
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Query untuk mengecek apakah ada transaksi dengan nomor polisi yang sama dan tanggal yang sama
  const checkQuery = `
    SELECT nomorPolisi, tanggal FROM transaksi 
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
      return res.status(400).json({
        message:
          "Transaksi dengan nomor polisi yang sama sudah ada pada hari ini",
      });
    }

    // Jika tidak ada duplikasi, lanjutkan proses transaksi
    const query =
      "INSERT INTO transaksi (nomorPolisi, jenis, tipe, biaya, gambar, petugas, cabang, tanggal, waktu) VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now', '+7 hours'), TIME('now', '+7 hours'))";

    db.run(
      query,
      [nomorPolisi, jenis, tipe, biaya, gambar, petugas, cabang],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ message: "Gagal menambahkan transaksi", error: err });
        }
        console.log(`[LOG] Transaksi ditambahkan:
          Nomor Polisi: ${nomorPolisi},
          Jenis: ${jenis},
          Tipe: ${tipe},
          Biaya: ${biaya},
          Petugas: ${petugas},
          Cabang: ${cabang},
          Waktu: ${waktuTransaksi}`);
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
  const userName = req.user.name;

  const { petugas, tanggalAwal, tanggalAkhir } = req.query; // Ambil filter dari query params

  let query = "SELECT * FROM transaksi WHERE 1=1";
  let queryParams = [];

  if (userRole === "admin_besar") {
    if (petugas) {
      query += " AND petugas = ?";
      queryParams.push(petugas);
    }
    if (tanggalAwal && tanggalAkhir) {
      query += " AND tanggal BETWEEN ? AND ?";
      queryParams.push(tanggalAwal, tanggalAkhir);
    }
  } else if (userRole === "admin_cabang") {
    query += " AND petugas = ?";
    queryParams.push(userName);
  } else {
    return res.status(403).json({ message: "Access not allowed" });
  }

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch transactions", error: err });
    }
    res.status(200).json(rows);
  });
});

// Misalnya di backend, buat endpoint khusus untuk leaderboard
router.get("/leaderboard", authenticate, (req, res) => {
  const userRole = req.user.role;

  // Jika role adalah admin_besar atau admin_cabang, kita masih bisa fetch transaksi semua petugas
  if (userRole !== "admin_besar" && userRole !== "admin_cabang") {
    return res.status(403).json({ message: "Access not allowed" });
  }

  // Ambil data transaksi semua petugas
  db.all("SELECT petugas, jenis FROM transaksi", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch transactions", error: err });
    }

    // Proses transaksi untuk leaderboard
    const pointsMap = {};

    rows.forEach((transaction) => {
      const { petugas, jenis } = transaction;
      const points = jenis === "Motor" ? 1 : jenis === "Mobil" ? 2 : 0;
      pointsMap[petugas] = (pointsMap[petugas] || 0) + points;
    });

    // Urutkan berdasarkan poin terbanyak
    const leaderboardData = Object.keys(pointsMap)
      .map((petugasId) => ({
        petugasId,
        totalPoin: pointsMap[petugasId],
      }))
      .sort((a, b) => b.totalPoin - a.totalPoin);

    res.status(200).json(leaderboardData);
  });
});


router.get("/transaksi-hari-ini", (req, res) => {
  const adminCabang = req.user.cabang;
  const userName = req.user.name;
  // console.log("transaksi admin cabang: ", adminCabang);

  const userRole = req.user.role;
  const today = new Date();
  today.setHours(today.getHours() + 7);
  const formattedToday = today.toISOString().split("T")[0];

  let query = `SELECT COUNT(id) AS total_transaksi_harian
  FROM transaksi WHERE DATE(tanggal) = ?`;
  let queryParams = [formattedToday];

  if (userRole === "admin_besar") {
    query = `SELECT COUNT(id) AS total_transaksi_harian
    FROM transaksi WHERE DATE(tanggal) = ?`;
    queryParams = [formattedToday];
  } else if (userRole === "admin_cabang") {
    query = `SELECT COUNT(id) AS total_transaksi_harian
    FROM transaksi WHERE DATE(tanggal) = ? AND petugas = ?`;
    queryParams = [formattedToday, userName];
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
      tanggal: formattedToday, // Menambahkan tanggal yang digunakan dalam response
    });
  });
});

router.get("/transaksi-by-date", (req, res) => {
  const adminCabang = req.user.cabang;
  const useName = req.user.name;
  const userRole = req.user.role;

  const startDate = req.query.start_date; // e.g., '2025-01-01'
  const endDate = req.query.end_date; // e.g., '2025-01-06'
  const tanggal = req.query.tanggal; // e.g., '2025-01-01'

  if (!startDate && !tanggal) {
    // Jika startDate dan tanggal tidak disediakan, set default 1 bulan terakhir
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1); // Mundur 1 bulan
    const lastMonthStartDate = new Date(
      lastMonthDate.getFullYear(),
      lastMonthDate.getMonth(),
      1
    ); // Tanggal 1 bulan lalu
    const lastMonthEndDate = new Date(
      lastMonthDate.getFullYear(),
      lastMonthDate.getMonth() + 1,
      0
    ); // Tanggal terakhir bulan lalu

    // Format menjadi 'YYYY-MM-DD'
    const formattedStartDate = lastMonthStartDate.toISOString().split("T")[0];
    const formattedEndDate = lastMonthEndDate.toISOString().split("T")[0];

    // Set startDate dan endDate untuk query
    startDate = formattedStartDate;
    endDate = formattedEndDate;
  }

  if (!startDate && !tanggal) {
    return res
      .status(400)
      .json({ message: "Tanggal atau rentang tanggal harus disediakan" });
  }

  let query = `
  SELECT 
    COUNT(id) AS total_transaksi_harian,
    SUM(CASE WHEN jenis = 'Mobil' THEN 1 ELSE 0 END) AS total_mobil,
    SUM(CASE WHEN jenis = 'Motor' THEN 1 ELSE 0 END) AS total_motor,
    SUM(biaya) AS total_pendapatan
  FROM transaksi`;

  let queryParams = [];

  // Case 1: If only a single date is provided (tanggal)
  if (tanggal) {
    query += ` WHERE DATE(tanggal) = ?`;
    queryParams = [tanggal];
  }
  // Case 2: If a date range is provided (start_date and end_date)
  else if (startDate && endDate) {
    query += ` WHERE DATE(tanggal) BETWEEN ? AND ?`;
    queryParams = [startDate, endDate];
  }

  // Handle user role filtering
  if (userRole === "admin_besar") {
    // Admin besar can see all data within the date range or specific date
  } else if (userRole === "admin_cabang") {
    query += ` AND petugas = ?`;
    queryParams.push(useName);
  } else {
    return res.status(403).json({ message: "Akses tidak diizinkan" });
  }

  db.get(query, queryParams, (err, row) => {
    if (err) {
      console.error("Gagal GET total transaksi berdasarkan tanggal:", err);
      return res.status(500).json({ error: "Terjadi Kesalahan pada server" });
    }

    res.json({
      totalTransaksiHarian: row.total_transaksi_harian || 0,
      totalMobil: row.total_mobil || 0,
      totalMotor: row.total_motor || 0,
      totalPendapatan: row.total_pendapatan ||0,
      startDate: startDate,
      endDate: endDate,
      tanggal: tanggal,
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

  // Ambil waktu saat ini dan sesuaikan dengan zona waktu +7 jam (WIB)
  const today = new Date();
  today.setHours(today.getHours() + 7); // Menambahkan 7 jam ke waktu UTC
  const formattedToday = today.toISOString().split("T")[0]; // Format YYYY-MM-DD

  // console.log("Pendapatan admin cabang:", adminCabang);
  // console.log("Tanggal pendapatan:", formattedToday);

  let query = `SELECT SUM(biaya) AS total_pendapatan
               FROM transaksi
               WHERE DATE(tanggal) = ?`;
  let queryParams = [formattedToday];

  // Cek role dan tentukan query
  if (userRole === "admin_besar") {
    query = `SELECT SUM(biaya) AS total_pendapatan
             FROM transaksi
             WHERE DATE(tanggal) = ?`;
    queryParams = [formattedToday];
  } else if (userRole === "admin_cabang") {
    query = `SELECT SUM(biaya) AS total_pendapatan
             FROM transaksi
             WHERE DATE(tanggal) = ? AND petugas = ?`;
    queryParams = [formattedToday, userName];
  } else {
    return res.status(403).json({ message: "Akses ditolak!" });
  }

  // Jalankan query ke database untuk menghitung pendapatan
  db.get(query, queryParams, (err, row) => {
    if (err) {
      console.error("Gagal GET pendapatan:", err);
      return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }

    const totalPendapatan = row.total_pendapatan || 0;
    const saldoBersih = totalPendapatan / 3;

    // Mengirimkan response berupa total pendapatan dan saldo bersih
    res.json({
      totalPendapatan: totalPendapatan, // Pendapatan total yang dihitung
      saldoBersih: saldoBersih, // Saldo bersih setelah dibagi 3
      tanggal: formattedToday, // Menggunakan tanggal yang sudah disesuaikan
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
  const { nomorPolisi, tipe, biaya, cabang, tanggal } = req.body; // Data yang ingin diupdate

  // Memastikan data yang diperlukan ada
  if (!nomorPolisi || !tipe || !biaya || !cabang) {
    return res
      .status(400)
      .json({ message: "Data yang diperlukan tidak lengkap" });
  }

  // Validasi hak akses berdasarkan peran
  let query =
    "UPDATE transaksi SET nomorPolisi = ?, tipe = ?, biaya = ?, cabang = ?, tanggal = ? WHERE id = ?";
  let queryParams = [nomorPolisi, tipe, biaya, cabang, tanggal, transactionId];

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
      return res.status(404).json({
        message: "Transaksi tidak ditemukan atau tidak ada perubahan",
      });
    }
    res.status(200).json({ message: "Transaksi berhasil diperbarui" });
  });
});

module.exports = router;
