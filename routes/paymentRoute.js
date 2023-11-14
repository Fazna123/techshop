const express = require("express");

const payment_route = express();

const session = require('express-session');

const path = require("path");

const config = require("../config/config");

const auth = require("../middleware/auth")

require('dotenv').config()


payment_route.set('views','./views/users');




const uploaduserImage = require('../config/multer')

const userController = require('../controllers/userController')

const cartController = require('../controllers/cartController')

const couponController = require('../controllers/couponController')

const orderController = require('../controllers/orderController')

const paymentController = require('../controllers/paymentController')


payment_route.post('/create-order',auth.isLogin,paymentController.placeOrder)


payment_route.post('/wallet-route',auth.isLogin,paymentController.loadWallet)

payment_route.post('/razorpay-wallet',auth.isLogin,paymentController.payRazorpayWallet)

payment_route.post('/cod-wallet',auth.isLogin,paymentController.payCodWallet)



module.exports = payment_route