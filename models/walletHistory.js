const mongoose = require("mongoose");
const User = require("../models/userModel");

const walletHistorySchema = new mongoose.Schema({

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
    default: Date.now,
    required: true,
  },

  debitAmt:{
    type:Number,
    default:0
  },
  creditAmt:{
    type:Number,
    default:0
  },

  orderId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"

  },

  message: {
    type: String,
  }

});

const WalletHistory = mongoose.model("WalletHistory", walletHistorySchema);

module.exports = WalletHistory;
