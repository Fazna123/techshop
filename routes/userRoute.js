const express = require("express");
const user_route = express();

const session = require('express-session');

const path = require("path");


const config = require("../config/config");

const auth = require("../middleware/auth")


user_route.set('views','./views/users');

const nocache = require('nocache')


const uploaduserImage = require('../config/multer')

const userController = require('../controllers/userController')

const cartController = require('../controllers/cartController')

const couponController = require('../controllers/couponController')

const orderController = require('../controllers/orderController')

const paymentController = require('../controllers/paymentController')

const uploadproductImage = require('../config/multer')



user_route.get('/register',auth.isLogout,userController.loadRegister);

user_route.post('/register',uploaduserImage.uploaduserImage.single('userImage'),userController.insertUser);

user_route.get('/verify',userController.loadOtpVerify);

user_route.post('/verify',userController.verifyOtp);




user_route.get('/',userController.loadHome);

user_route.get('/home',nocache(),userController.loadHome);




user_route.get("/login",auth.isLogout,nocache(),userController.loginLoad)

user_route.post("/login",userController.verifyLogin)

user_route.get('/myprofile',auth.isLogin,nocache(),userController.loadProfile)

user_route.get('/logout',auth.isLogin,nocache(),userController.userLogout)



user_route.get('/forget',auth.isLogout,nocache(),userController.forgetLoad)

user_route.post('/forget',userController.forgetVerify)

user_route.get('/forget-password',auth.isLogout,nocache(),userController.forgetPasswordLoad)

user_route.post('/forget-password',userController.resetPassword)

user_route.get('/verification',nocache(),userController.verificationLoad)

user_route.post('/verification',userController.sendVerificationLink)




user_route.get('/edit',auth.isLogin,nocache(),userController.editLoad)

user_route.post('/edit',uploaduserImage.uploaduserImage.single("userImage"),userController.updateProfile)



user_route.get('/products',nocache(),userController.loadProducts)

user_route.get('/product-detail',nocache(),userController.productDetailLoad)

user_route.post('/product-detail',auth.isLogin,nocache(),cartController.addToCart)




user_route.get('/cart',auth.isLogin,nocache(),cartController.loadCart)

user_route.post('/update-cart',cartController.updateCart)

user_route.post('/cart',auth.isLogin,nocache(),cartController.loadCheckOut)

user_route.get('/delete-cartitem',auth.isLogin,nocache(),cartController.deleteCartItem)




user_route.get('/add-address',auth.isLogin,nocache(),userController.addressLoad);

user_route.post('/add-address',userController.addAddress)

user_route.get('/edit-address',auth.isLogin,nocache(),userController.loadEditAddress)

user_route.post('/edit-address',auth.isLogin,userController.updateAddress)




user_route.post('/apply-coupon',auth.isLogin,couponController.applyCoupon)




user_route.get('/checkout',auth.isLogin,nocache(),cartController.loadCheckOut)

user_route.get('/order-confirm',auth.isLogin,nocache(),orderController.loadOrderConfirm)



user_route.get('/my-orders',auth.isLogin,nocache(),orderController.loadMyOrders)

user_route.get('/see-order',auth.isLogin,nocache(),orderController.loadViewOrder)

user_route.get('/return-order',auth.isLogin,nocache(),orderController.loadReturnOrder)

user_route.get('/cancel-order',auth.isLogin,nocache(),orderController.loadCancelOrder)





user_route.get('/my-wallet',auth.isLogin,nocache(),orderController.loadMyWallet)

user_route.get('/invoice',auth.isLogin,nocache(),orderController.generateInvoice)


user_route.get('/wallet-history',auth.isLogin,nocache(),orderController.loadWalletHistory)










module.exports = user_route;

