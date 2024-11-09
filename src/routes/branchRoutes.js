const express = require("express");
const db = require("../db");

const authenticate = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorizedMiddleware");

const router = express.Router();

router.get("/", authenticate, authorize(["admin_besar"]), (req, res) => {
  const query = "SELECT * FROM branches";
  db.all(query, [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to get branches", error: err });
    }
    res.json(rows);
  });
});

router.post("/", authenticate, authorize(["admin_besar"]), (req, res) => {
  const { name, location } = req.body;
  const query = "INSERT INTO branches (name, location) VALUES (?, ?)";
  db.run(query, [name, location], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to add branch", error: err });
    }
  });
});

router.put("/:id", authenticate, authorize(["admin_besar"]), (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;
  const query = "UPDATE branches SET name = ?, location = ? WHERE id = ?";
  db.run(query, [name, location, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to update branch", error: err });
    }
    res.json({ message: "Branch update successfully" });
  });
});

router.delete("/:id", authenticate, authorize(["admin_besar"]), (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM branches WHERE id = ?";
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to delete branch", error: err });
    }
    res.json({ message: "Branch deleted successfully" });
  });
});

router.post("/", authenticate, (req, res) => {
  const { branch_id, user_id, amount, status } = req.body;
  const query =
    "INSERT INTO transactions (branch_id, user_id, amount, status) VALUES (?, ?, ?, ?)";
  db.run(query, [branch_id, user_id, amount, status], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to create transaction", error: err });
    }
  });
});

router.get("/", authenticate, (req, res) => {
  const { branch_id, user_id } = req.query;

  let query = "SELECT * FROM transactions WHERE 1=1";
  const params = [];

  if (branch_id) {
    query += " AND branch_id = ?";
    params.push(branch_id);
  }
  if (user_id) {
    query += " AND user_id = ?";
    params.push(user_id);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to get transactions", error: err });
    }
    res.json(rows);
  });
});

router.put("/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const query = "UPDATE transactions SET status = ? WHERE id = ?";
  db.run(query, [status, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to update transaction", error: err });
    }
    res.json({ message: "Transaction updated successfully" });
  });
});

module.exports = router;
