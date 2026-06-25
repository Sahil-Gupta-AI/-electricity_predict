const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "ElectricityAnalyser";

router.post("/register", async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fname, lname, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

    console.log(`New user registered: ${email}`);
    res.json({ message: "Registration successful!", token });

  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

    console.log(`User logged in: ${email}`);
    res.status(200).json({
        message: "Login successful!",
        token,
        user: {
            name: user.fname + " " + user.lname,
            initials: user.fname.charAt(0).toUpperCase() + user.lname.charAt(0).toUpperCase()
        }
    });
    

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
