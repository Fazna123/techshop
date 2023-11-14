const User = require("../models/userModel");

const Product = require("../models/productModel");

const CartItem = require("../models/cartModel")

const Category = require('../models/categoryModel')

const Coupon = require('../models/couponModel')

const Address = require('../models/addressModel')

const Order = require('../models/orderModel')

const Wallet = require('../models/walletModel')

const WalletHistory = require('../models/walletHistory')

const Razorpay = require('razorpay')


var instance = new Razorpay({
    key_id: process.env.razorPayId,
    key_secret: process.env.razorPayKeySecret
})




const placeOrder = async(req,res)=>{
    try{
        console.log('placeOrder function called')
        const {
            selectedAddress,
            couponEntered,
            paymentMethod,
            discountAmount,
            totalBeforeDiscount,
            total,
        } = req.body;

        console.log('selected payment method',paymentMethod)
      
          const userId = req.session.user_id;
      
          const user = await User.findById(userId);
          const address = await Address.findById(selectedAddress);
          const productsInCart = await CartItem.find({ userId });
      
          const productsOrdered = productsInCart.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productPrice:item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          }));
          
        const orderCreate = async()=>{
            console.log('ordercreate function called')
            if (couponEntered) {
                
                const coupon = await Coupon.findById(couponEntered);
                console.log("coupon:", coupon);
                if (!coupon) {
                  return res.status(400).json({ message: "Invalid coupon code" });
                }

                const discountedTotal = totalBeforeDiscount - discountAmount;
          
                const order = new Order({
                  userId,
                  userName: user.name,
                  items: productsOrdered,
                  totalPrice: totalBeforeDiscount,
                  address,
                  couponUsed: true,
                  coupon: coupon.code,
                  discountAmt: discountAmount,
                  amountPayable: discountedTotal,
                  paymentMethod,
                  paidStatus:true,
                  orderStatus:"Processing"
                });
          
                const orderSave = await order.save();
          
                console.log("orderSaved");
          
                if (orderSave) {
                  
                  for (const item of productsOrdered) {
                    const existingProduct = await Product.findById(item.productId);
                    if (existingProduct) {
                      const newQuantity = existingProduct.quantity - item.quantity;
                      await Product.findByIdAndUpdate(item.productId, {
                        $set: { quantity: newQuantity },
                      });
                    }
                  }
                  

                }
                await CartItem.deleteMany({ userId: userId });
                    console.log("cart items deleted");
                    console.log("orderID:",order._id)
                    return order._id
                
                
                  
            }
            
            else{

                const order = new Order({
                    userId,
                    userName: user.name,
                    items: productsOrdered,
                    totalPrice: totalBeforeDiscount,
                    address,
                    couponUsed: false,
                    amountPayable: total,
                    paymentMethod,
                    paidStatus:true,
                    orderStatus:"Processing"
                  });
            
                  const orderSave = await order.save();
                  console.log('order save:',orderSave)
                  if (orderSave) {
                    console.log("orderSaved");
                    for (const item of productsOrdered) {
                      const existingProduct = await Product.findById(item.productId);
                      if (existingProduct) {
                        const newQuantity = existingProduct.quantity - item.quantity;
                        await Product.findByIdAndUpdate(item.productId, {
                          $set: { quantity: newQuantity },
                        });
                      }
                    }
                   
                    await CartItem.deleteMany({ userId: userId });
                    console.log("cart items deleted");
                    console.log("orderID:",order._id)
                    return order._id
                  } 
                
                  

            }
        }

        if (productsInCart) {

                if (paymentMethod === "COD") {   
                    console.log('paymentmethod cod in controller')
                    
                  const orderId = await orderCreate();
                  if(orderId){
                  console.log("returned id:",orderId)
                  const orderupdate = await Order.findOneAndUpdate({_id:orderId},
                    {$set:{paidStatus:false,orderStatus:'Pending'}})
                    if(orderupdate){
                      console.log('order-confirm page loading')
                      res.status(200).json({message:'Order has been placed'})
                    }
                  }
          
                } else if (paymentMethod === "razorpay") {
                    console.log('paymentmethod razorpay in controller')
                    const amounttotal =req.body.total

                    const options = {
                    amount: amounttotal* 100,
                    currency: "INR",
                    receipt: "razormail@gmail.com",
                    };

                    //orderCreate();
                    instance.orders.create(options, async(err, order) => {
                        if (!err) {

                        await orderCreate()
                        // const orderupdate = await Order.findOneAndUpdate({userId:userId},
                        //         {$set:{paidStatus:true,orderStatus:'Processing'}})
                        //         if(orderupdate){
                                  
                                  
                          res.status(200).send({
                            success: true,
                            msg: "Order Created",
                            order_id: order.id,
                            amount: amounttotal,
                            key_id: process.env.razorPayId,
                            //product_name:req.body.name,
                            //description:req.body.description,
                            contact: "8848888888",
                            name: "Tech-Shoppie",
                            email: "techshoppie@gmail.com",
                          });
                         //}
                        }else {
                            res
                              .status(500)
                              .json({message: "Something went wrong!" });
                          }
                      });

                  
            
                }else if(paymentMethod=='wallet') {

                  console.log('payment method wallet in controller')
                      
                    const wallet = await Wallet.findOne({userId:userId})
                    //const order = await Order.findOne({userId:userId})
                    if(wallet.walletBalance<=0){
                        res.status(200).json({message:'Your wallet is Empty'})
                    }else if(wallet.walletBalance >= total){
                        const orderId = await orderCreate()
                        const newBalance = wallet.walletBalance - total
                        console.log('new balance in wallet',newBalance)
                        const walletUpdate = await Wallet.updateOne({userId:userId},
                            {$set:{walletBalance:newBalance}})
                        if(walletUpdate){
                          const newHistory = new WalletHistory({
                            userId: userId,
                            walletBalance: newBalance,
                            debitAmt: total,
                            orderId: orderId,
                          });
                  
                          await newHistory.save();
                            res.status(200).json({message:'Your Order has been placed'})
                        }                   
                    }else if(wallet.walletBalance < total ){
                        //orderCreate()
                        const newBalance = total - wallet.walletBalance
                        console.log('amount to be paid after wallet',newBalance)
                        // const walletUpdate = await Wallet.updateOne({userId:userId},
                        //   {$set:{walletBalance:0}})
                          // if(walletUpdate){
                          //   const newHistory = new WalletHistory({
                          //     userId: userId,
                          //     walletBalance: newBalance,
                          //     debitAmt: wallet.walletBalance,
                          //     orderId: order._id,
                          //   });
                    
                          //   await newHistory.save();

                          res.status(200).json({
                            message: `Your wallet balance is ${wallet.walletBalance}. Balance amount is ${newBalance}`,
                            newBalance,
                          });
                      //}
                    }    
                    
                } 
                else {
                    res.status(500).json({ message: "Invalid Payment Option" });
               }
            }
            else {
                res.status(500).json({ message: "cant save order" });
           }
             
    }catch(error){
        console.log(error.message)
    }
}



const loadWallet = async(req,res)=>{
  try{

    const {
      selectedAddress,
      couponEntered,
      paymentMethod,
      discountAmount,
      totalBeforeDiscount,
      total,
  } = req.body;

  const userId = req.session.user_id

  console.log('paymentmethod load wallet')  
  const wallet = await Wallet.findOne({userId:userId})

  if (!wallet || wallet.walletBalance === undefined){
      res.status(200).json({message:'Your wallet is Empty'})

  }else if(wallet.walletBalance >= total){
     
    console.log('wallet balance is higher')
      const walletAmt = wallet.walletBalance
      res.status(200).json({message:`Your wallet balance is ${walletAmt}`,
      method:"wallet"
    })
                        
      }else if(wallet.walletBalance < total ){
        console.log('wallet balance is lower')
        const walletAmt = wallet.walletBalance
        const newBalance = total-wallet.walletBalance
        // const walletUpdate = await Wallet.updateOne({userId:userId},
        //   {$set:{walletBalance:0}})
        // if(walletUpdate){
          // const newHistory = new WalletHistory({
          //   userId: userId,
          //   walletBalance: 0,
          //   debitAmt: wallet.walletBalance,
          //   orderId: order._id,
          // });
  
          // await newHistory.save();
        res.status(200).json({
          message: `Your wallet balance is ${wallet.walletBalance}. Balance amount is ${newBalance}`,
          newBalance,
        });
      }
        
  

  }catch(error){
    console.log(error)
  }
}



const payCodWallet = async(req,res)=>{
  try{
    console.log('cod wallet')
    console.log(req.body)
    console.log('placeOrder function called')
        const {
            selectedAddress,
            couponEntered,
            discountAmount,
            totalBeforeDiscount,
            total,
        } = req.body;

        const paymentMethod = "COD"

        console.log('selected payment method',paymentMethod)
      
          const userId = req.session.user_id;
          const walletDiscount = totalBeforeDiscount - total
      
          const user = await User.findById(userId);
          const address = await Address.findById(selectedAddress);
          const productsInCart = await CartItem.find({ userId });
      
          const productsOrdered = productsInCart.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productPrice:item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          }));
          const order = new Order({
            userId,
            userName: user.name,
            items: productsOrdered,
            totalPrice: totalBeforeDiscount,
            address,
            couponUsed: false,
            amountPayable: total,
            paymentMethod,
            walletDiscount,
            paidStatus:false,
            orderStatus:"Pending"
          });
    
          const orderSave = await order.save();
          if (orderSave) {
            //const newBalance = order.totalPrice - order.amountPayable
            const walletUpdate = await Wallet.updateOne({userId:userId},
              {$set:{walletBalance:0}})
            const newHistory = new WalletHistory({
              userId: userId,
              walletBalance: 0,
              debitAmt: walletDiscount,
              orderId: order._id,
            });
    
            await newHistory.save();
            console.log("orderSaved");
            for (const item of productsOrdered) {
              const existingProduct = await Product.findById(item.productId);
              if (existingProduct) {
                const newQuantity = existingProduct.quantity - item.quantity;
                await Product.findByIdAndUpdate(item.productId, {
                  $set: { quantity: newQuantity },
                });
              }
            }
           
            await CartItem.deleteMany({ userId: userId });
            console.log("cart items deleted");
            
          } 
          console.log('paymentmethod cod-wallet in controller')  
          // const orderupdate = await Order.findOneAndUpdate({userId:userId},
          //   {$set:{paidStatus:false,orderStatus:'Pending'}})
          //   if(orderupdate){
              console.log('order-confirm page loading')
              res.status(200).json({message:'Order has been placed'})
            //}
  }catch(error){
    console.log(error)
  }
}

const payRazorpayWallet = async(req,res)=>{
  try{
    console.log('razorpay wallet')
    console.log(req.body)
    console.log('placeOrder function called')
        const {
            selectedAddress,
            couponEntered,
            discountAmount,
            totalBeforeDiscount,
            total,
        } = req.body;

        const paymentMethod = "razorpay"

        console.log('selected payment method',paymentMethod)
      
          const userId = req.session.user_id;
          const walletDiscount = totalBeforeDiscount - total
      
          const user = await User.findById(userId);
          const address = await Address.findById(selectedAddress);
          const productsInCart = await CartItem.find({ userId });
      
          const productsOrdered = productsInCart.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productPrice:item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          }));
          const order = new Order({
            userId,
            userName: user.name,
            items: productsOrdered,
            totalPrice: totalBeforeDiscount,
            address,
            couponUsed: false,
            amountPayable: total,
            paymentMethod,
            walletDiscount,
            paidStatus:false,
            orderStatus:"Pending"
          });
    
          const orderSave = await order.save();
          if (orderSave) {
            //const newBalance = order.totalPrice - order.amountPayable
            const walletUpdate = await Wallet.updateOne({userId:userId},
              {$set:{walletBalance:0}})
            const newHistory = new WalletHistory({
              userId: userId,
              walletBalance: 0,
              debitAmt: walletDiscount,
              orderId: order._id,
            });    
            await newHistory.save();
            console.log("orderSaved");
            for (const item of productsOrdered) {
              const existingProduct = await Product.findById(item.productId);
              if (existingProduct) {
                const newQuantity = existingProduct.quantity - item.quantity;
                await Product.findByIdAndUpdate(item.productId, {
                  $set: { quantity: newQuantity },
                });
              }
            }
           
            await CartItem.deleteMany({ userId: userId });
            console.log("cart items deleted");
            
          } 
          console.log("paymentmethod razorpay-wallet in controller");
          const amounttotal = req.body.total;

          const options = {
            amount: amounttotal * 100,
            currency: "INR",
            receipt: "razormail@gmail.com",
          };

          
          instance.orders.create(options, async (err, order) => {
            if (!err) {
              const orderupdate = await Order.findOneAndUpdate(
                { _id: orderSave._id},
                { $set: { paidStatus: true, orderStatus: "Processing" } }
              );
              if (orderupdate) {
                res.status(200).send({
                  success: true,
                  msg: "Order Created",
                  order_id: order.id,
                  amount: amounttotal,
                  key_id: process.env.razorPayId,
                  //product_name:req.body.name,
                  //description:req.body.description,
                  contact: "8848888888",
                  name: "Tech-Shoppie",
                  email: "techshoppie@gmail.com",
                });
              }
            } else {
              res.status(500).json({ message: "Something went wrong!" });
            }
          });
  
          
              
  }catch(error){
    console.log(error)
  }
}



module.exports = {
    placeOrder,
    loadWallet,
    payCodWallet,
    payRazorpayWallet
    
}