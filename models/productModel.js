const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type: String,
        ref: 'Category',
        required: true,
    },
    
    brand:{
        type:String,
        required:true
    },
    image:{
        type:Array,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    offer_price:{
        type:Number,
        default:0
    },
    is_featured:{
        type:Number,
        default:0
    },
    is_blocked:{
        type:Number,
        default:0
    }
    
})

module.exports = mongoose.model('Product',productSchema)