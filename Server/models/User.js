const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true
  },
  lname: {
    type: String,
    required: true
  },
  email: {
  type: String,
  unique: true,
  required: true
  },
  password: {
    type: String,
    required: true
  } }, {
  
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create initials dynamically from the name (e.g., "Amit Kumar" becomes "AK")
UserSchema.virtual('initials').get(function() {
  if (!this.name) return '';
  const parts = this.name.split(' ');
  const initials = parts.map(part => part.charAt(0).toUpperCase()).join('');
  return initials.slice(0, 2); // Get first two letters max
});

module.exports = mongoose.model("User", UserSchema);