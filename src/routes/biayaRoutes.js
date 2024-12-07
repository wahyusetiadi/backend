const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
  db.all("SELECT * FROM biaya", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ biaya: rows });
  });
});

router.post("/", (req, res) => {
  const { biaya } = req.body;
  if (typeof biaya != "number") {
    return res.status(400).json({ error: "biaya harus berupa angka" });
  }
  db.run("INSERT INTO biaya (biaya) VALUES (?)", [biaya], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, biaya });
  });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { biaya } = req.body;

  if (typeof biaya !== "number") {
    return res.status(400).json({ error: "biaya harus berupa angka!" });
  }
  db.run(
    "UPDATE biaya SET biaya = ? WHERE id = ?",
    [biaya, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(500).json({ error: "ID tidak ditemukan" });
      }
      res.json({ id, biaya });
    }
  );
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run(' DELETE FROM biaya WHERE id = ?', [id], function(err) {
        if(err) {
            return res.status(500).json({ error: err.message})
        }
        if(this.changes === 0) {
            return res.status(404).json({ error: "ID tidak ditemukan" });
        }
        res.json({ message: 'Data berhasil dihapus'})
    })
})

module.exports = router;
