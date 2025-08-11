const express = require("express");
const db = require("../db");
const router = express.Router();

router.post("/create", (req, res) => {
  const { name, stock, price } = req.body;
  if (!name || !stock || !price) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  const query = "INSERT INTO items (name, stock, price) VALUES (?, ?, ?)";
  db.run(query, [name, stock, price], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Gagal menambahkan item", error: err });
    }
    res
      .status(201)
      .json({ message: `Item ${name} berhasil ditambahkan`, id: this.lastID });
  });
});

router.get("/get-all", (req, res) => {
    const query = 'SELECT * FROM items';

    db.all(query, (err, rows) => {
        if(err) {
            return res.status(500).json({ message: 'Gagal mendapatkan data items', error: err });
        }
        res.status(200).json(rows);
    })
})

module.exports = router;
