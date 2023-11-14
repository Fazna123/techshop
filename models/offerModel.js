const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema({
  offerItem: {
    type: String,
    enum: ['product', 'category'],
    required: true,
  },
  selectedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  selectedCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  offerType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  offerName: {
    type: String,
    required: true,
  },
  offerValue: {
    type: Number,
    required: true,
  },
  is_cancelled:{
    type:Number,
    default:0
  }
  
});


const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
