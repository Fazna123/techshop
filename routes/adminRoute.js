const express = require('express');

const admin_route = express();

const session = require('express-session')
const config = require('../config/config')

require('dotenv').config()

const auth = require("../middleware/adminAuth")

const nocache = require('nocache')


// const multer =  require("multer");


const adminController = require("../controllers/adminController")

const categoryController = require('../controllers/categoryController')

const couponController = require('../controllers/couponController')

const orderController = require('../controllers/orderController')

const bannerController = require('../controllers/bannerController')

const dashboardController = require('../controllers/dashboardController')

const offerController = require('../controllers/offerController')

const path = require("path");

const uploaduserImage = require('../config/multer');

const uploadproductImage = require('../config/multer')





// admin_route.use(express.json())

// admin_route.use(express.urlencoded({extended:true}))




// admin_route.use(session({
//     secret:config.sessionSecret,
//     resave:false,
//     saveUninitialized:false
// }))

// admin_route.set('views',path.join(__dirname,'views'))
//admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')


// admin_route.use(express.static('public'))

admin_route.get('/',auth.isLogout,adminController.loadLogin)

admin_route.post('/',adminController.verifyLogin)

admin_route.get('/dashboard',auth.isLogin,nocache(),adminController.loadDashBoard)


admin_route.get('/adminprofile',auth.isLogin,nocache(),adminController.loadAdminProfile)


admin_route.get('/logout',auth.isLogin,nocache(),adminController.logout)

admin_route.get('/forget-admin',auth.isLogout,nocache(),adminController.forgetLoad)

admin_route.post('/forget-admin',adminController.forgetVerify)

admin_route.get('/forget-password',nocache(),adminController.forgetPasswordLoad)

admin_route.post('/forget-password',auth.isLogout,adminController.resetPassword)

admin_route.get('/edit-profile',auth.isLogin,nocache(),adminController.loadEditProfile)

admin_route.post('/edit-profile',uploaduserImage.uploaduserImage.single('userImage'),adminController.updateProfile)

admin_route.get('/userlist',nocache(),adminController.loadUserList)

admin_route.get('/new-user',auth.isLogin,nocache(),adminController.newUserLoad)

admin_route.post('/new-user',uploaduserImage.uploaduserImage.single('userImage'),adminController.addUser)

admin_route.get('/edit-user',auth.isLogin,nocache(),adminController.editUserLoad)

admin_route.post('/edit-user',adminController.updateUsers)

admin_route.get('/block-user',auth.isLogin,nocache(),adminController.blockUser)

admin_route.get('/delete-user',auth.isLogin,nocache(),adminController.deleteUser)







admin_route.get('/new-product',auth.isLogin,nocache(),adminController.newProductLoad)

admin_route.post('/new-product',uploadproductImage.uploadproductImage.array('productImage',4),adminController.addProduct)

admin_route.get('/productlist',auth.isLogin,nocache(),adminController.loadProductList)

admin_route.get('/edit-product',auth.isLogin,nocache(),adminController.editProductLoad)

admin_route.post('/edit-product',uploadproductImage.uploadproductImage.array('productImage',4),adminController.updateProduct)

admin_route.get('/block-product',auth.isLogin,nocache(),adminController.blockProduct)

admin_route.get('/delete-product',auth.isLogin,nocache(),adminController.deleteProduct)







admin_route.get('/category',auth.isLogin,nocache(),categoryController.loadCategory)

admin_route.get('/new-category',auth.isLogin,nocache(),categoryController.addCategory)

admin_route.post('/new-category',uploadproductImage.uploadproductImage.single('productImage'),categoryController.insertCategory)

admin_route.get('/edit-category',auth.isLogin,nocache(),categoryController.editCategory)

admin_route.post('/edit-category',uploadproductImage.uploadproductImage.single('productImage'),categoryController.updateCategory)

admin_route.get('/delete-category',auth.isLogin,nocache(),categoryController.deleteCategory)








admin_route.get('/coupon',auth.isLogin,nocache(),couponController.loadCouponList)

admin_route.get('/new-coupon',auth.isLogin,nocache(),couponController.loadCouponAdd)

admin_route.post('/new-coupon',couponController.insertCoupon)

admin_route.get('/edit-coupon',auth.isLogin,nocache(),couponController.loadEditCoupon)

admin_route.post('/edit-coupon',couponController.updateCoupon)

admin_route.get('/block-coupon',auth.isLogin,nocache(),couponController.blockCoupon)

admin_route.get('/delete-coupon',auth.isLogin,nocache(),couponController.deleteCoupon)




admin_route.get('/order',auth.isLogin,nocache(),orderController.loadAllOrders)

admin_route.get('/update-order-status',auth.isLogin,nocache(),orderController.changeOrderStatus)

admin_route.get('/see-order',auth.isLogin,nocache(),orderController.loadViewOrderAdmin)





admin_route.get('/banner',auth.isLogin,nocache(),bannerController.loadBanner)

admin_route.get('/add-banner',auth.isLogin,nocache(),bannerController.loadAddBanner)

admin_route.post('/add-banner',uploadproductImage.uploadproductImage.single('bannerImage'),bannerController.addBanner)

admin_route.get('/delete-banner',auth.isLogin,nocache(),bannerController.deleteBanner)




admin_route.get('/line-chart',auth.isLogin,nocache(),dashboardController.loadLineChart)

admin_route.get('/pie-chart',auth.isLogin,nocache(),dashboardController.loadPieChart)

admin_route.get('/area-chart',auth.isLogin,nocache(),dashboardController.loadAreaChart)

admin_route.get('/bar-chart',auth.isLogin,nocache(),dashboardController.loadBarChart)

admin_route.get('/week-earnings',auth.isLogin,nocache(),dashboardController.loadWeeklyEarningsChart)

admin_route.get('/week-ordercount',auth.isLogin,nocache(),dashboardController.loadWeeklyOrderCount)




admin_route.get('/sales-report',auth.isLogin,nocache(),orderController.loadSalesReport)

admin_route.get('/download-pdf-salesreport',auth.isLogin,nocache(),orderController.downloadSalesReport)

admin_route.get('/export-excel',auth.isLogin,nocache(),orderController.exportOrdersExcel)




//admin_route.get('/sales-report-daily',auth.isLogin,nocache(),orderController.loadSalesReportDaily)

admin_route.get('/sales-report-range',auth.isLogin,nocache(),orderController.loadSalesReportRange)

admin_route.get('/export-excel-daily',auth.isLogin,nocache(),orderController.exportOrdersExcelDaily)

admin_route.get('/download-pdf-daily',auth.isLogin,nocache(),orderController.downloadPdfDaily)





admin_route.get('/sales-report-weekly',auth.isLogin,nocache(),orderController.loadSalesReportWeekly)

admin_route.get('/export-excel-weekly',auth.isLogin,nocache(),orderController.exportOrdersExcelWeekly)

admin_route.get('/download-pdf-weekly',auth.isLogin,nocache(),orderController.downloadPdfWeekly)






admin_route.get('/sales-report-this-month',auth.isLogin,nocache(),orderController.loadSalesReportMonthly)

admin_route.get('/export-excel-this-month',auth.isLogin,nocache(),orderController.exportOrdersExcelMonthly)

admin_route.get('/download-pdf-this-month',auth.isLogin,nocache(),orderController.downloadPdfMonthly)




admin_route.get('/sales-report-last-two-months',auth.isLogin,nocache(),orderController.loadSalesReportLastTwoMonths)

admin_route.get('/export-excel-last-two-months',auth.isLogin,nocache(),orderController.exportOrdersExcelLastTwoMonths)

admin_route.get('/download-pdf-last-two-months',auth.isLogin,nocache(),orderController.downloadPdfLastTwoMonths)




admin_route.get('/new-offer',auth.isLogin,nocache(),offerController.loadAddOffer)

admin_route.post('/new-offer',offerController.insertOffer)

admin_route.get('/offer',auth.isLogin,nocache(),offerController.loadOffer)

admin_route.get('/apply-offer',auth.isLogin,nocache(),offerController.applyOffer)

admin_route.get('/cancel-offer',auth.isLogin,nocache(),offerController.cancelOffer)

admin_route.get('/activate-offer',auth.isLogin,nocache(),offerController.activateOffer)

admin_route.get('/delete-offer',auth.isLogin,nocache(),offerController.deleteOffer)






// admin_route.get('*',function(req,res){

//     res.redirect('/admin')
// })

module.exports = admin_route;