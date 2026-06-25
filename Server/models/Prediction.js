const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  prediction_type: {
    type: String,
    enum: ["history", "appliances"],
    default: "history"
  },
  month: {
    type: String,
    required: true
  },
  inputUnit: {
    type: Number,
    default: 0
  },
  inputAmount: {
    type: Number,
    default: 0
  },
  predictUnit: {
    type: Number,
    required: true
  },
  predictAmount: {
    type: Number,
    required: true
  },
  fixedCharge: {
    type: String,
    default: ""
  },
  energyRate: {
    type: String,
    default: ""
  },
  fac: {
    type: String,
    default: ""
  },
  duty: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Prediction", PredictionSchema);
