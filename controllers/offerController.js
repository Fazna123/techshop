const User = require("../models/userModel");

const Product = require("../models/productModel");

//const CartItem = require("../models/cartModel")

const Category = require('../models/categoryModel')

const Offer = require('../models/offerModel')




/////////////////////////////////////////////////////////////////////////////////////


const loadAddOffer = async(req,res)=>{
    try{
        const products = await Product.find({}).sort({name:1})
        const categories = await Category.find({}).sort({name:1})
        res.render('addOffer',{products,categories})
    }catch(error){
        console.log(error)
    }
}


////////////////////////////////////////////////////////////////////////////////////


const insertOffer = async (req, res) => {
    try {
      const { offerItem, selectedProduct, selectedCategory, offerType, offerName, offerValue } = req.body;
      console.log(req.body)
      if(selectedCategory){
        const newOffer = new Offer({
            offerItem, 
            selectedCategory, 
            offerType,
            offerName,
            offerValue,
          });
          await newOffer.save();
      }else{
        const newOffer = new Offer({
            offerItem,
            selectedProduct,  
            offerType,
            offerName,
            offerValue,
          });
          await newOffer.save();
      }
    
      res.status(201).redirect('/admin/offer'); // Offer saved successfully
    } catch (err) {
        console.log(err)
      res.status(500).json({ error: 'Failed to save the offer.' });
    }
  };

///////////////////////////////////////////////////////////////////////////////////////////////////////

const loadOffer = async (req, res) => {
  try {
    const message = req.query.message;
    const offers = await Offer.find()
      .populate({
        path: "selectedProduct",
        model: "Product", // Assuming 'Product' is the name of your product model
      })
      .populate({
        path: "selectedCategory",
        model: "Category", // Assuming 'Category' is the name of your category model
      })
      .exec();

    res.render("offer", { offers, message });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data from the database");
  }
};


//////////////////////////////////////////////////////////////////////////////////////////////////////

const applyOffer = async(req,res)=>{
    try{
        //console.log('apply offer function')
        //console.log(req.query)
        const offerId = req.query.id
        //console.log(offerId)
        const offer = await Offer.findById(offerId);

    if (!offer) {
      return res.status(404).send('Offer not found');
    }

    if (offer.offerItem === 'product') {
      const product = await Product.findById(offer.selectedProduct);

      if (!product) {
        return res.status(404).send('Product not found');
      }

      if (offer.offerType === 'percentage') {
        const discountedPrice = product.price - Math.floor((product.price * (offer.offerValue / 100)));
        product.offer_price = discountedPrice;
      } else if (offer.offerType === 'fixed') {
        product.offer_price = product.price - offer.offerValue;
      }

      await product.save();
      res.redirect('/admin/offer?message=Offer Applied');
      
    } else if (offer.offerItem === 'category') {

        const category = await Category.findById(offer.selectedCategory)
        
        const productsInCategory = await Product.find({ category: category.name });
  
        if (productsInCategory.length === 0) {
          return res.status(404).send('No products found in the selected category');
        }
  
        productsInCategory.forEach(async (product) => {
          if (offer.offerType === 'percentage') {
            const discountedPrice = product.price - Math.floor((product.price * (offer.offerValue / 100)));
            product.offer_price = discountedPrice;
          } else if (offer.offerType === 'fixed') {
            product.offer_price = product.price - offer.offerValue;
          }

          await product.save();
        });

        res.redirect('/admin/offer?message=Offer Applied');
        //return res.status(200).json({ message: 'Offer applied to all products in the category' });
      } else {
        return res.status(400).send('Offer is not applicable to a category');
      }

    }catch(error){
        console.log(error)
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////


const cancelOffer = async (req, res) => {
    try {
      const offerId = req.query.id;
      const offer = await Offer.findById(offerId);
  
      if (!offer) {
        return res.status(404).send('Offer not found');
      }
  
      if (offer.offerItem === 'product') {
        const product = await Product.findById(offer.selectedProduct);
  
        if (!product) {
            res.redirect('/admin/offer?message=No Product Found');
          //return res.status(404).send('Product not found');
        }
  
        
        product.offer_price = 0;
  
        await product.save();
  
        
        offer.is_cancelled = 1;
        await offer.save();
        res.redirect('/admin/offer')
        //return res.status(200).json({ message: 'Offer cancelled for the product' });
      } else if (offer.offerItem === 'category') {

        const category = await Category.findById(offer.selectedCategory)

        const productsInCategory = await Product.find({ category: category.name });
  
        if (productsInCategory.length === 0) {
            res.redirect('/admin/offer?message=No Products in selected category');
          //return res.status(404).send('No products found in the selected category');
        }
  
        // Set offer_price to zero for all products in the category
        productsInCategory.forEach(async (product) => {
          product.offer_price = 0;
          await product.save();
        });
  
        // Update the corresponding offer model's is_cancelled field to 1
        offer.is_cancelled = 1;
        const dataSaved = await offer.save();
        if (dataSaved){
            res.redirect('/admin/offer')
        }
        
        //return res.status(200).json({ message: 'Offer cancelled for all products in the category' });
      } else {
        res.redirect('/admin/offer');
        //return res.status(400).send('Offer is not applicable to a category');
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send('Error cancelling the offer');
    }
  };

  
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const activateOffer = async(req,res)=>{
    try{

        const offerId = req.query.id
        const offer = await Offer.findByIdAndUpdate(offerId,{$set:{is_cancelled:0}})
        if(offer){
            res.redirect('/admin/offer')
        }
    }catch(error){
        console.log(error)
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const deleteOffer = async(req,res)=>{
    try{

        const offerId = req.query.id
        const offer = await Offer.findByIdAndRemove(offerId)
        if(offer){
            res.redirect('/admin/offer')
        }
    }catch(error){
        console.log(error)
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



module.exports = {
    loadAddOffer,
    insertOffer,
    loadOffer,
    applyOffer,
    cancelOffer,
    activateOffer,
    deleteOffer
}
















