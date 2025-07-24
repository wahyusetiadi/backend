const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../batch_uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/batch", upload.array("foto", 50), (req, res) => {
  // console.log("======= Incoming Request =======");
  // console.log("Body:", req.body);         // data non-file
  // console.log("Files:", req.files);       // data file (upload.array)
  // console.log("Field Names in Files:", req.files.map(f => f.fieldname));
  // console.log("================================");
  const { tanggal, cabang } = req.body;
  const files = req.files;

  if (!tanggal || !cabang) {
    return res.status(400).json({ message: "Tanggal dan Cabang harus diisi!" });
  }

  if (files.length > 0) {
    const stmt = db.prepare(`
        INSERT INTO upload_batch (cabang, tanggal, filename, originalname)
        VALUES (?, ?, ?, ?)
      `);

    files.forEach((file) => {
      stmt.run(cabang, tanggal, file.filename, file.originalname);
    });

    stmt.finalize();
  }

  res.status(201).json({
    message:
      "Data berhasil disimpan" + (files.length > 0 ? "dan file diupload" : ""),
    uploaded: files.map((file) => ({
      originalname: file.originalname,
      filename: file.filename,
      path: `/batch_uploads/${file.filename}`,
    })),
  });
});

// GET /upload/list
router.get("/get-all", (req, res) => {
  db.all("SELECT * FROM upload_batch", [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Gagal mengambil data", error: err.message });
    }

    res.json({
      count: rows.length,
      data: rows,
    });
  });
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM upload_batch WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "gagal menghapus data", error: err });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.status(200).json({ message: `Data dengan id ${id} berhasil di hapus` });
  });
});

module.exports = router;
