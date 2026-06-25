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

// GET /api/history/predictions - Fetch all predictions for the authenticated user
router.get("/predictions", auth, async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(predictions);
  } catch (error) {
    console.error("Error fetching prediction history:", error.message);
    res.status(500).json({ message: "Failed to fetch prediction history" });
  }
});

module.exports = router;
