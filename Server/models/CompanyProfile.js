const mongoose = require("mongoose");

const CompanyProfileSchema = new mongoose.Schema({
  companyKey: {
    type: String,
    required: true,
    unique: true
  },
  companyName: {
    type: String,
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
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CompanyProfile", CompanyProfileSchema);
