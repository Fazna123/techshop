const mongoose = require('mongoose')

const CouponHistorySchema = new mongoose.Schema({
    codeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Coupon',
        required:true
    },
    codeName:{
        type:String
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
});

module.exports = mongoose.model('CouponHistory',CouponHistorySchema);