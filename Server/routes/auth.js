const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    const user = new User({
      fname,
      lname,
      email,
      password
    });

    await user.save();

    res.json({
      message: "User Registered"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;