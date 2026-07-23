const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.warn("MongoDB connection warning (offline/DNS error):", error.message);
  }
};

module.exports = connectDB;