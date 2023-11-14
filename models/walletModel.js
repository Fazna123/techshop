const mongoose = require("mongoose");
const User = require("../models/userModel");


const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  walletBalance: {
    type: Number,
    default: 0,
    required: true,
  },

  createdAt: {
    type: Date,
    default: new Date(),
  },

  // amount: {
  //   type: Number,
  //   default: 0
  // },

  status: {
    type: String,
    default: 'active'
  }

  
});

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
