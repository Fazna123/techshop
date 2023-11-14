const User = require("../models/userModel");

const Product = require("../models/productModel");

const CartItem = require("../models/cartModel")

const Category = require('../models/categoryModel')

const Coupon = require('../models/couponModel')

const Address = require('../models/addressModel')

const bcryptjs = require("bcryptjs");

const nodemailer = require("nodemailer");

const config = require("../config/config");

const randomstring = require("randomstring");

const session = require('express-session');

require('dotenv').config()


const isLoggedIn = (req) => {
    return req.session && req.session.user_id; // Check if a userId is stored in the session
};

const addToCart = async (req,res)=>{

    try {
    //     console.log("req.body:",req.body)
      
   
      const userId = req.session.user_id;
    //   console.log('userId:',userId)
      const loggedIn = isLoggedIn(req);
      

      const productId = req.body.product_id;

      let price = 0
      
      const productData = await Product.findById({ _id: productId });
      if(productData.offer_price !== undefined && productData.offer_price !== 0){
          price = productData.offer_price
      }else{
        price = productData.price
      }
    //   console.log('product is:',productData)
      const categoryData = await Product.find({
        category: productData.category,
      });

      if (productData.quantity == 0) {
        res.render("product-detail", {
          loggedIn,
          product: productData,
          products: categoryData,
          message: "Product Out of Stock",
        });

      } else {

        const prodInCart = await CartItem.findOne({
          userId: userId,
          productId: productId,
        });

        //console.log('prod in cart:',prodInCart)

        if (!prodInCart) {
          const cartItem = new CartItem({
            productId: productId,
            name: productData.name,
            price,
            quantity: req.body.numproduct,
            userId: userId,
            subtotal: price*parseInt(req.body.numproduct),
            
          });
          const cartData = await cartItem.save();
          if (cartData) {
            res.render("product-detail", {
              loggedIn,
              product: productData,
              products: categoryData,
              message: "Product Added to Cart",
            });
          }

        } else {
          const newQuantity = parseInt(prodInCart.quantity) + parseInt(req.body.numproduct);

          const newPrice = newQuantity * price
          const updateData = await CartItem.findOneAndUpdate(
            { userId: userId, productId: productId },
            { $set: { quantity: newQuantity,subtotal: newPrice} }
          );
          if (updateData) {
            res.render("product-detail", {
              loggedIn,
              product: productData,
              products: categoryData,
              message: "Product updated in Cart",
            });
          }
        }
      }
    } catch (error) {
      console.log(error.message);
    }
}


const loadCart = async (req, res) => {
    try {
        const loggedIn = isLoggedIn(req);
        const userId = req.session.user_id;

        
        const cartData = await CartItem.find({ userId: userId });
        const cartItemId = cartData._id

        
        const productIds = cartData.map(item => item.productId);

        
        const productData = await Product.find({ _id: { $in: productIds } });

        
        const productsInCart = cartData.map(item => {
            const productDetails = productData.find(product => product._id.equals(item.productId));
            return {
                product: productDetails,
                quantity: item.quantity,
                price:item.price,
                productId:item.productId,
                subtotal:item.subtotal
            };
        });

        const subtotal = productsInCart.reduce((acc, item) => {
            return acc + item.subtotal;
        }, 0);

        const coupons = await Coupon.find({is_cancelled:0})

        
        const total = subtotal + 100;

        res.render('cart', { loggedIn, products: productsInCart,subtotal,total,cartItemId,coupons});
    } catch (error) {
        console.log(error.message);
        
        res.status(500).send('Error loading cart data');
    }
};




const updateCart = async (req, res) => {
  try {
      const numProduct = req.body.numproduct;
      const productId = req.body.product_id;
      const userId = req.session.user_id;

      // Find the product data for the given productId
      const productData = await Product.findOne({ _id: productId });
      if (!productData) {
          return res.status(404).json({ error: 'Product not found' });
      }

      // Update the cart item with the new quantity and calculate the subtotal
      const quantity = parseInt(numProduct);
      let price = 0
      if (
        productData.offer_price !== undefined &&
        productData.offer_price !== 0
      ) {
        price = productData.offer_price;
      } else {
        price = productData.price;
      }

      const subtotal = quantity * price;

      const updatedData = await CartItem.findOneAndUpdate(
          { userId: userId, productId },
          { quantity, subtotal }
      );

      if (!updatedData) {
          return res.status(404).json({ error: 'Cart item not found' });
      }

      // Retrieve all cart items for the user
      const cartData = await CartItem.find({ userId });

      // Calculate the nettotal by summing the subtotal values of all cart items
      const nettotal = cartData.reduce((acc, cartItem) => acc + cartItem.subtotal, 0);

      // Calculate the total by adding the nettotal and shipping cost
      const total = nettotal + 100;

      res.status(200).json({ total, subtotal, nettotal });
  } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


const loadCheckOut = async(req,res)=>{
  try{
    //console.log(req.body)
    const userId = req.session.user_id
    const address = await Address.find({userId:userId})
    const cartData = await CartItem.find({userId:userId})
    console.log(cartData)
    const coupons = await Coupon.find({is_cancelled:0})


    const subtotal = cartData.reduce((acc, item) => acc + item.subtotal, 0);
    const total = subtotal+100
    //if(cartData.length==0){
      //res.redirect('/products')    
    //}else{
      res.render('checkout',{address:address,cart:cartData,subtotal,total,coupons})
   // }
  }catch(error){
    console.log(error.message)
  }
}




const deleteCartItem = async(req,res)=>{
  try{
      const id = req.query.id
      const cartItem = await CartItem.findOneAndDelete({productId:id})
      if(cartItem){
        console.log('item deleted')
        res.redirect('/cart')
      }
  }catch(error){
    console.log(error.message)
  }
}



module.exports = {
    addToCart,
    loadCart,
    updateCart,
    loadCheckOut,
    deleteCartItem
}