const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  company: {
    type: String,
    default: "—"
  },
  consumerName: {
    type: String,
    default: "—"
  },
  billDate: {
    type: String,
    default: "—"
  },
  dueDate: {
    type: String,
    default: "—"
  },
  units: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Bill", BillSchema);
