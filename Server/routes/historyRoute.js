const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Bill = require("../models/Bill");
const Prediction = require("../models/Prediction");

// GET /api/history/bills - Fetch all extracted bills for the authenticated user
router.get("/bills", auth, async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error("Error fetching bill history:", error.message);
    res.status(500).json({ message: "Failed to fetch bill history" });
  }
});

// DELETE /api/history/bills - Clear all extracted bills for the authenticated user
router.delete("/bills", auth, async (req, res) => {
  try {
    await Bill.deleteMany({ user: req.user.id });
    res.json({ message: "Bill history cleared successfully" });
  } catch (error) {
    console.error("Error clearing bill history:", error.message);
    res.status(500).json({ message: "Failed to clear bill history" });
  }
});

module.exports = router;
