const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name:{
    type:String,
    required:true
  },
  addressLine:{
    type:String,
    required:true
  },
  street:{
    type:String,
    required:true
  },
  city:{
    type:String
  },
  state:{
    type:String
  },
  pin:{
    type:String,
    required:true
  },
  addressType:{
    type:String,
    required:true
  },
  is_permenant:{
    type:Boolean,
    default:false
  }
  
});


module.exports = mongoose.model("Address", addressSchema);
