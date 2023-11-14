const mongoose = require("mongoose");
const shortid = require("shortid");
const moment = require('moment');
const ALPHANUMERIC_LENGTH = 8; 



const orderSchema = new mongoose.Schema({


  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: String,
  
  orderSerialNumber: {
    type: String,
    //default: shortid.generate,
    unique: true
  },
  
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      productName: {
        type: String,
        required: true
      },
      productPrice:{
        type:Number,
        required:true
      },
      quantity: {
        type: Number,
        required: true
      },
      subtotal: {
        type: Number,
        required: true
      },
    }
  ],

  totalPrice: {
    type: Number,
    required: true
  },

  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address"
  },
  
  couponUsed: {
    type: Boolean,
    default: false
  },

  coupon: {
    type: String
  },

  discountAmt: {
    type: Number
  },
  walletDiscount:{
    type:Number
  },
  amountPayable: {
    type: Number  
  },

  paymentMethod: {
    type: String,
    default: "cash on delivery"
  },

  paidStatus: {
    type: Boolean,
    default: false
  },

  orderStatus: {
    type: String,
    enum: ["Pending","Processing", "Shipped", "Delivered", 'Cancelled', 'Returned'],
    default: "Pending"
  },

  invoice: { type: String, default: "" },
  
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
});


orderSchema.pre('save', function (next) {
  if (!this.orderSerialNumber) {
      const timestamp = moment().format('YYYYMMDDHHmmss'); // Use a timestamp
      const randomAlphanumeric = generateRandomAlphanumeric(ALPHANUMERIC_LENGTH);
      this.orderSerialNumber = `${timestamp}${randomAlphanumeric}`;
  }
  next();
});

// Function to generate random alphanumeric string
function generateRandomAlphanumeric(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

module.exports = mongoose.model("Order", orderSchema);
