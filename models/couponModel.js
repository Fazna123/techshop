const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String, 
        unique: true, 
        required: true
    },
    discount: { 
        type: Number, 
        required: true 
    },
    minPurchaseAmt:{
        type:Number,
        default:5000
    },
    maxDeduction:{
        type:Number,
        default:10000
    },
    createdDate:{
        type:Date
    },
    expiryDate: { 
        type: Date,
        required: true 
    },
    is_cancelled:{
        type:Number,
        default:0
    }
});


module.exports = mongoose.model('Coupon', couponSchema);;
