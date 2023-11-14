

const User = require("../models/userModel");

const Product = require("../models/productModel");

const CartItem = require("../models/cartModel")

const Category = require('../models/categoryModel')

const Coupon = require('../models/couponModel')

const Address = require('../models/addressModel')

const Order = require('../models/orderModel')

const Wallet = require('../models/walletModel')

const Swal = require('sweetalert2');
const WalletHistory = require("../models/walletHistory");

const excelJS = require('exceljs')

const moment = require('moment')

const puppeteer = require('puppeteer');






//html to pdf

const ejs = require('ejs')
const pdf = require('puppeteer')
const fs = require('fs')
const path = require('path')

//.............................................................................................................

//...........................................................................................................

const loadOrderConfirm = async(req,res)=>{
    try{
      console.log('loadorderconfirm:',req.body)
        res.render('order-confirm')
    }catch(error){
      console.log(error.message)
    }
}


//..................................................................................................................


const loadMyOrders = async(req,res)=>{
  try{
    const userId = req.session.user_id
    const myOrders = await Order.find({userId:userId}).sort({createdAt:-1})
    res.render('myOrder',{order:myOrders})
  }catch(error){
    console.log(error.message)
  }
}


//.........................................................................................................................

const renderOrderProducts = async (items) => {
  try {
    const productIds = items.map((item) => item.productId);

    
    const productDetails = await Product.find({ _id: { $in: productIds } });

    // Pair product details with quantities from items
    const productsWithQuantity = items.map((item) => {
      const productDetail = productDetails.find((p) => p._id.toString() === item.productId.toString());
      return {
        product: productDetail,
        price:item.productPrice,
        quantity: item.quantity,
      };
    });

    return productsWithQuantity;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return [];
  }
}


//...................................................................................................

const loadViewOrder = async (req, res) => {
  try {
    const order_id = req.query.id;
    // let walletAmt = 0;
    // const walletDiscount = await WalletHistory.find({orderId:order_id})
    // if(walletDiscount){
    //   walletAmt = walletDiscount.debitAmt
    // }
    const orderData = await Order.findById(order_id);

    if (!orderData) {
      return res.status(404).send('Order not found');
    }

    const productDetails = await renderOrderProducts(orderData.items);
    console.log('product details',productDetails)

    res.render('viewMyOrder', { order: orderData, products: productDetails});
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}

//..............................................................................................

const loadCancelOrder = async (req, res) => {
  try {
    console.log("cancel order function called");
    const userId = req.session.user_id;
    console.log("user", userId);
    const orderId = req.query.id;
    const orderData = await Order.findById(orderId);
    const myOrders = await Order.find({ userId: userId }).sort({
      createdAt: -1,
    });

    if (
      orderData.orderStatus == "Pending" ||
      orderData.orderStatus == "Processing"
    ) {
      const updateOrder = await Order.findByIdAndUpdate(orderId, {
        $set: { orderStatus: "Cancelled" },
      });
      console.log("updateorder", updateOrder);
      const productIds = orderData.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      for (let i = 0; i < productIds.length; i++) {
        const productData = await Product.findById(productIds[i].productId);
        const newQuantity = productData.quantity + productIds[i].quantity;
        const updateQuantity = await Product.findByIdAndUpdate(
          productData._id,
          {
            $set: { quantity: newQuantity },
          }
        );
        if (updateQuantity) {
          console.log("old Quantity:", productData.quantity);
          console.log("return quantity", productIds[i].quantity);
          const produpdated = await Product.findById(productData._id);
          console.log("new prod Data", produpdated);
        }
      }
      if (
        orderData.paymentMethod == "razorpay" ||
        orderData.paymentMethod == "wallet"
      ) {
        if (updateOrder) {
          const wallet = await Wallet.findOne({ userId: userId });

          if (!wallet) {
            const walletModel = new Wallet({
              userId: userId,
              walletBalance: orderData.amountPayable,
            });

            const newModel = await walletModel.save();

            if (newModel) {
              const newHistory = new WalletHistory({
                userId: userId,
                walletBalance: orderData.amountPayable,
                creditAmt: orderData.amountPayable,
                orderId: orderId,
              });
  
              await newHistory.save();
              res.redirect("/my-orders");
            }
          } else {
            const newBalance = wallet.walletBalance + orderData.amountPayable;
            await Wallet.findByIdAndUpdate(wallet._id, {
              $set: { walletBalance: newBalance },
            });

            const newHistory = new WalletHistory({
              userId: userId,
              walletBalance: newBalance,
              creditAmt: orderData.amountPayable,
              orderId: orderId,
            });

            await newHistory.save();
            res.redirect("/my-orders");
          }
        }
      } else {
        res.redirect("/my-orders");
      }
    } else {
      res.render("myOrder", {
        order: myOrders,
        message: "You can't cancel the product now",
      });
    }
  } catch (error) {
    console.log(error);
  }
};




// ....................................................................................

// const loadReturnOrder = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     console.log('user',userId)
//     const orderId = req.query.id;
//     const orderData = await Order.findById(orderId);
//     const updateOrder = await Order.findByIdAndUpdate(orderId, {
//       $set: { orderStatus: 'Returned' },
//     });
//     console.log('updateorder',updateOrder)
//     const productIds = orderData.items.map((item) => ({
//       productId: item.productId,
//       quantity: item.quantity,
//     }))
//     for(let i = 0;i< productIds.length;i++){
//       const productData = await Product.findById(productIds[i].productId)
//       const newQuantity = productData.quantity + productIds[i].quantity
//       const updateQuantity = await Product.findByIdAndUpdate(productData._id,{
//         $set:{quantity:newQuantity}
//       })
//       if(updateQuantity){
//         console.log('old Quantity:',productData.quantity)
//         console.log('return quantity',productIds[i].quantity)
//         const produpdated = await Product.findById(productData._id)
//         console.log('new prod Data',produpdated)
//       }
//     }

//     if (updateOrder) {
//       // console.log('updateorder2',updateOrder)
//       const wallet = await Wallet.findOne({ userId: userId });

//       if (!wallet) {
//         const walletModel = new Wallet({
//           userId: userId,
//           walletBalance: orderData.amountPayable,
//         });

//         const newModel = await walletModel.save();

//         if (newModel) {
//           res.redirect('/my-orders');
//         }
//       } else {
//         const newBalance = wallet.walletBalance + orderData.amountPayable;
//         await Wallet.findByIdAndUpdate(wallet._id, { $set: { walletBalance: newBalance } });

//         const newHistory = new WalletHistory({
//           userId: userId,
//           walletBalance: newBalance,
//           creditAmt: orderData.amountPayable,
//           orderId: orderId,
//         });

//         await newHistory.save();
//         res.redirect('/my-orders');
//       }
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };

//.....................................................................................................

const loadReturnOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log("user", userId);
    const orderId = req.query.id;
    const orderData = await Order.findById(orderId);
    const myOrders = await Order.find({ userId: userId }).sort({
      createdAt: -1,
    });

    if (orderData.orderStatus !== "Delivered") {
      res.render("myOrder", {
        order: myOrders,
        message: "You can't return the product now",
      });
    } else {
      const updateOrder = await Order.findByIdAndUpdate(orderId, {
        $set: { orderStatus: "Returned" },
      });
      console.log("updateorder", updateOrder);
      const productIds = orderData.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      for (let i = 0; i < productIds.length; i++) {
        const productData = await Product.findById(productIds[i].productId);
        const newQuantity = productData.quantity + productIds[i].quantity;
        const updateQuantity = await Product.findByIdAndUpdate(
          productData._id,
          {
            $set: { quantity: newQuantity },
          }
        );
        if (updateQuantity) {
          console.log("old Quantity:", productData.quantity);
          console.log("return quantity", productIds[i].quantity);
          const produpdated = await Product.findById(productData._id);
          console.log("new prod Data", produpdated);
        }
      }

      if (updateOrder) {
        // console.log('updateorder2',updateOrder)
        const wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
          const walletModel = new Wallet({
            userId: userId,
            walletBalance: orderData.amountPayable,
          });

          const newModel = await walletModel.save();

          if (newModel) {
            res.redirect("/my-orders");
          }
        } else {
          const newBalance = wallet.walletBalance + orderData.amountPayable;
          await Wallet.findByIdAndUpdate(wallet._id, {
            $set: { walletBalance: newBalance },
          });

          const newHistory = new WalletHistory({
            userId: userId,
            walletBalance: newBalance,
            creditAmt: orderData.amountPayable,
            orderId: orderId,
          });

          await newHistory.save();
          res.redirect("/my-orders");
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};



//...................................................................................................


const loadMyWallet = async(req,res)=>{
  try{
    const userId = req.session.user_id
    const mywallet = await Wallet.findOne({userId:userId})
    res.status(200).json({message:`Your Wallet balance is ${mywallet.walletBalance} INR`})
  }catch(error){
    console.log(error.message)
  }
}

//......................................................................................................



const loadAllOrders = async(req,res)=>{
  try{
      const orderData = await Order.find().sort({createdAt:-1});
      res.render('orderList',{order:orderData})
  }catch(error){
    console.log(error.message)
  }
}


//.......................................................................................................


const changeOrderStatus = async (req, res) => {
  try {
    console.log("change order status function");
    const { orderId, status } = req.query;
    console.log(req.query);
    if (status === "Deivered") {
      const order = await Order.findByIdAndUpdate(orderId, {
        $set: { orderStatus: status, paidStatus: true },
      });
      if (order) {
        res.redirect("/admin/order");
      }
    } else {
      const order = await Order.findByIdAndUpdate(orderId, {
        $set: { orderStatus: status },
      });
      if (order) {
        res.redirect("/admin/order");
      }
    }

    //console.log(order)
  } catch (error) {
    console.log(error.message);
  }
};

//............................................................................................................

const exportOrdersExcel = async (req, res) => {
  try {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
      { header: 'Invoice ID', key: 'orderSerialNumber' },
      { header: 'Date', key: 'createdAt' },
      { header: 'Customer Name', key: 'userName' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Amount (INR)', key: 'amountPayable' },
      { header: 'Paid Status', key: 'paidStatus' },
    ];

    let counter = 1;

    const orderData = await Order.find({ orderStatus: 'Delivered' })
      .sort({ createdAt:-1 })
      .exec();

    orderData.forEach((order) => {
      const formattedDate = order.createdAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const formattedOrder = { ...order.toObject(), createdAt: formattedDate };
      worksheet.addRow(formattedOrder);
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=salesreport.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred while exporting the sales report.');
  }
};



//.....................................................................................................................................

const loadSalesReport = async (req, res) => {
  try {
    const orderData = await Order.find({orderStatus:"Delivered"}).sort({createdAt:-1});
    res.render("salesReport", { order: orderData });
  } catch (error) {
    console.log(error);
  }
};

//....................................................................................................................................


const downloadSalesReport = async(req,res)=>{
  try{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();    

    const dailyOrders = await Order.find({}).sort({ createdAt: -1 });

    let htmlContent = `
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
      <table>
        <tr>
          <th>Sl No.</th>
          <th>Date</th>
          <th>Invoice ID</th>
          <th>Customer Name</th>
          <th>Payment Method</th>
          <th>Amount</th>
          
        </tr>
    `;

    let serialNumber = 1; // Initialize the serial number

    dailyOrders.forEach((order) => {
      htmlContent += `
        <tr>
          <td>${serialNumber}</td>
          <td>${new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}</td>
          <td>${order.orderSerialNumber}</td>
          <td>${order.userName}</td>
          <td>${order.paymentMethod}</td>
          <td>${order.amountPayable}</td>
        </tr>`;
      serialNumber++; // Increment the serial number for the next order
    });

    htmlContent += '</table>';

    // Generate the PDF
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=daily_sales_report.pdf');
    res.send(pdfBuffer);

  }catch(error){
    console.log(error)
  }
}





//.....................................................................................................................................


//''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

const loadSalesReportWeekly = async (req, res) => {
  try {
    const currentDate = moment().endOf('day');
    const startDate = moment(currentDate).subtract(7, 'days').startOf('day');

    
    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);



    res.render('salesReportWeekly', { order,totalSales });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
};
//.................................................................................................................................

// const loadSalesReportDaily = async (req, res) => {
//   try {
//     const selectedDate = req.query.selectedDate;
//     console.log('selected date:', selectedDate);

//     const selectedMoment = moment(selectedDate).startOf('day');
//     console.log('selected moment:', selectedMoment.format());

//     const startDate = selectedMoment.clone().startOf('day');
//     const endDate = selectedMoment.clone().endOf('day');

//     console.log('startDate:', startDate.format());
//     console.log('endDate:', endDate.format());

//     const order = await Order.find({
//       createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
//     })

//     console.log('orders:', order);

//     const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

//     res.render("salesReportDaily", { order, totalSales, selectedDate });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("An error occurred.");
//   }
// };

const loadSalesReportRange = async (req, res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    console.log('Start date:', startDate);
    console.log('End date:', endDate);

    const startMoment = moment(startDate).startOf('day');
    const endMoment = moment(endDate).endOf('day');

    console.log('Start moment:', startMoment.format());
    console.log('End moment:', endMoment.format());

    const order = await Order.find({
      createdAt: { $gte: startMoment.toDate(), $lte: endMoment.toDate() },
    }).sort({createdAt:-1});

    console.log('Orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

    res.render("salesReportDaily", { order, totalSales, startDate, endDate });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
};





//..................................................................................................................................

const loadSalesReportMonthly = async (req, res) => {
  try {
    const currentDate = moment().endOf('day');

    const startDate = moment(currentDate).startOf('month');

    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

    res.render("salesReportMonthly", { order, totalSales });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
};


//......................................................................................................................................

const exportOrdersExcelMonthly = async(req,res)=>{
  try {
    const currentDate = moment().endOf('day');

    const startDate = moment(currentDate).startOf('month');

    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
      { header: 'Invoice ID', key: 'orderSerialNumber' },
      { header: 'Date', key: 'createdAt' },
      { header: 'Customer Name', key: 'userName' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Amount (INR)', key: 'amountPayable' },     
    ];


    order.forEach((order) => {
      const formattedDate = order.createdAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const formattedOrder = { ...order.toObject(), createdAt: formattedDate };
      worksheet.addRow(formattedOrder);
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=salesreport.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
}


//...........................................................................................

const exportOrdersExcelWeekly = async(req,res)=>{
  try {
    const currentDate = moment().endOf('day');
    const startDate = moment(currentDate).subtract(7, 'days').startOf('day');
    
    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
      { header: 'Invoice ID', key: 'orderSerialNumber' },
      { header: 'Date', key: 'createdAt' },
      { header: 'Customer Name', key: 'userName' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Amount (INR)', key: 'amountPayable' },
    ];


    order.forEach((order) => {
      const formattedDate = order.createdAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const formattedOrder = { ...order.toObject(), createdAt: formattedDate };
      worksheet.addRow(formattedOrder);
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=salesreport.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }

}

//..........................................................................................

const downloadPdfWeekly = async (req, res) => {
  try {
    const currentDate = moment().endOf('day');
    const startDate = moment(currentDate).subtract(7, 'days').startOf('day');

    
    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let htmlContent = `
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
      <br><br><br>
      <h2>Sales Report(Last 7 days)</h2>
      <br><br>
      <table>
        <tr>
          <th>Sl No.</th>
          <th>Date</th>
          <th>Invoice ID</th>
          <th>Customer Name</th>
          <th>Payment Method</th>
          <th>Amount</th>
          
        </tr>
    `;

    let serialNumber = 1; // Initialize the serial number

    order.forEach((order) => {
      htmlContent += `
        <tr>
          <td>${serialNumber}</td>
          <td>${new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}</td>
          <td>${order.orderSerialNumber}</td>
          <td>${order.userName}</td>
          <td>${order.paymentMethod}</td>
          <td>${order.amountPayable}</td>
          
        </tr>`;
      serialNumber++; // Increment the serial number for the next order
    });

    htmlContent += `
      <tr>
        <td colspan="5">Total Sales:</td>
        <td colspan="2">${totalSales}</td>

      </tr>`;
    htmlContent += '</table>';

    // Generate the PDF
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report_last7days.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
};
//............................................................................................

const downloadPdfMonthly = async (req, res) => {
  try {
    const currentDate = moment().endOf('day');

    const startDate = moment(currentDate).startOf('month');

    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let htmlContent = `
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
      <br><br><br>
      <h2>Sales Report</h2>
      <br><br>
      <table>
        <tr>
          <th>Sl No.</th>
          <th>Date</th>
          <th>Invoice ID</th>
          <th>Customer Name</th>
          <th>Payment Method</th>
          <th>Amount</th>
          
        </tr>
    `;

    let serialNumber = 1; // Initialize the serial number

    order.forEach((order) => {
      htmlContent += `
        <tr>
          <td>${serialNumber}</td>
          <td>${new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}</td>
          <td>${order.orderSerialNumber}</td>
          <td>${order.userName}</td>
          <td>${order.paymentMethod}</td>
          <td>${order.amountPayable}</td>
          
        </tr>`;
      serialNumber++; // Increment the serial number for the next order
    });

    htmlContent += `
      <tr>
        <td colspan="5">Total Sales:</td>
        <td colspan="2">${totalSales}</td>

      </tr>`;
    htmlContent += '</table>';

    // Generate the PDF
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=salesreport_thisMonth.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
};
//............................................................................................

const exportOrdersExcelDaily = async (req,res)=>{
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    console.log('Start date:', startDate);
    console.log('End date:', endDate);

    const startMoment = moment(startDate).startOf('day');
    const endMoment = moment(endDate).endOf('day');

    console.log('Start moment:', startMoment.format());
    console.log('End moment:', endMoment.format());

    const order = await Order.find({
      createdAt: { $gte: startMoment.toDate(), $lte: endMoment.toDate() },
    }).sort({createdAt:-1});

    console.log('Orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
      { header: 'Invoice ID', key: 'orderSerialNumber' },
      { header: 'Date', key: 'createdAt' },
      { header: 'Customer Name', key: 'userName' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Amount (INR)', key: 'amountPayable' },
    ];

    let counter = 1;

    order.forEach((order) => {
      const formattedDate = order.createdAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const formattedOrder = { ...order.toObject(), createdAt: formattedDate };
      worksheet.addRow(formattedOrder);
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=salesreport.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
}
//...........................................................................................

const downloadPdfDaily = async(req,res)=>{
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    console.log('Start date:', startDate);
    console.log('End date:', endDate);

    const startMoment = moment(startDate).startOf('day');
    const endMoment = moment(endDate).endOf('day');

    console.log('Start moment:', startMoment.format());
    console.log('End moment:', endMoment.format());

    const order = await Order.find({
      createdAt: { $gte: startMoment.toDate(), $lte: endMoment.toDate() },
    }).sort({createdAt:-1});

    console.log('Orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let htmlContent = `
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
      <br><br><br>
      <h2>Sales Report(${startDate} to ${endDate})</h2>
      <br><br>
      <table>
        <tr>
          <th>Sl No.</th>
          <th>Date</th>
          <th>Invoice ID</th>
          <th>Customer Name</th>
          <th>Payment Method</th>
          <th>Amount</th>
        </tr>
    `;

    let serialNumber = 1; // Initialize the serial number

    order.forEach((order) => {
      htmlContent += `
        <tr>
          <td>${serialNumber}</td>
          <td>${new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}</td>
          <td>${order.orderSerialNumber}</td>
          <td>${order.userName}</td>
          <td>${order.paymentMethod}</td>
          <td>${order.amountPayable}</td>
        </tr>`;
      serialNumber++; // Increment the serial number for the next order
    });

    htmlContent += `
      <tr>
        <td colspan="5">Total Sales:</td>
        <td colspan="2">${totalSales}</td>

      </tr>`;
    htmlContent += '</table>';

    // Generate the PDF
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=daily_sales_report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
}
//.............................................................................................

const loadViewOrderAdmin = async (req, res) => {
  try {
    const order_id = req.query.id;
    const orderData = await Order.findById(order_id);

    if (!orderData) {
      return res.status(404).send('Order not found');
    }

    const productDetails = await renderOrderProducts(orderData.items);
    console.log('product details',productDetails)

    res.render('viewOrder', { order: orderData, products: productDetails });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}


//............................................................................................


//..............................................................................................

const generateInvoice = async (req, res) => {
  try {
    const orderId = req.query.id;
    const orderData = await Order.findById(orderId)
      .populate("address")
      .populate("userId")
      .exec();

    if (!orderData) {
      return res.status(404).json({ error: "Order not found" });
    }
    const options = { year: "numeric", month: "short", day: "numeric" };
    const createdDate = new Date(orderData.createdAt).toLocaleDateString(
      undefined,
      options
    );
    // Create an HTML template for the invoice
    const htmlContent = `
<html>
	<head>
		<meta charset="utf-8" />
		<title>Invoice</title>
		<style>
    .invoice-box {
      max-width: 800px;
      margin: auto;
      padding: 30px;
      border: 1px solid #eee;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
      font-size: 16px;
      line-height: 24px;
      font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
      color: #800000;
    }

    .invoice-box table {
      width: 100%;
      line-height: inherit;
      text-align: left;
    }

    .invoice-box table td {
      padding: 5px;
      vertical-align: top;
    }

    .invoice-box table tr td:nth-child(2) {
      text-align: right;
    }

    .invoice-box table tr.top table td {
      padding-bottom: 20px;
    }

    .invoice-box table tr.top table td.title {
      font-size: 45px;
      line-height: 45px;
      color: #800000;
    }

    .invoice-box table tr.information table td {
      padding-bottom: 40px;
    }

    .invoice-box table tr.heading td {
      background: #eee;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
    }

    .invoice-box table tr.details td {
      padding-bottom: 20px;
    }

    .invoice-box table tr.item td {
      border-bottom: 1px solid #eee;
    }

    .invoice-box table tr.item.last td {
      border-bottom: none;
    }

    .invoice-box table tr.total td:nth-child(2) {
      border-top: 2px solid #eee;
      font-weight: bold;
    }

    @media only screen and (max-width: 600px) {
      .invoice-box table tr.top table td {
        width: 100%;
        display: block;
        text-align: center;
      }

      .invoice-box table tr.information table td {
        width: 100%;
        display: block;
        text-align: center;
      }
    }

    /** RTL **/
    .invoice-box.rtl {
      direction: rtl;
      font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
    }

    .invoice-box.rtl table {
      text-align: right;
    }

    .invoice-box.rtl table tr td:nth-child(2) {
      text-align: left;
    }
		</style>
	</head>

	<body>
		<div class="invoice-box">
			<table cellpadding="0" cellspacing="0">
				<tr class="top">
					<td colspan="4">
						<table>
							<tr>
								<td class="title">
									<img src="data:image/webp;base64,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" style="width: 70%; max-width: 150px">
								</td>
								<td>
									Invoice #: ${orderData.orderSerialNumber}<br />
									Date: ${createdDate}<br />
									
								</td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="information">
					<td colspan="4">
						<table>
            <hr>
							<tr>

								<td>
									${orderData.address.name}<br />
									${orderData.address.addressLine}<br />
									${orderData.address.city}, ${orderData.address.state} ${orderData.address.pin}
								</td>
								<td>
									TechShoppie<br />
									ABC Line<br />
									techshoppie@example.com
								</td>
							</tr>
              
						</table>
					</td>
				</tr>

        <br><br><br>
				<tr class="heading">							
                <td>Item</td>
                <td>Unit Price</td>
                
                <td>Quantity</td>
                
                <td>Price</td>        
				</tr>
`;

    const itemsHtml = orderData.items
      .map(
        (item, index) =>
          `<tr class="details">							
                    <td>${item.productName}</td>          
                    <td>₹ ${item.productPrice.toFixed(2)}</td>
                    
                    <td>  ${item.quantity}</td>
                    
                    <td>₹ ${item.subtotal.toFixed(2)}</td>
            
                </tr>`
      )
      .join("");

    const totalHtml = `
                  <tr class="details">
                      <td></td>
                      <td></td>
                      ${
                        orderData.walletDiscount
                          ? `<td>Wallet Discount:</td><td>₹ ${orderData.walletDiscount.toFixed(
                              2
                            )}</td>`
                          : ""
                      }
                  </tr>
                  <tr class="details">
                      <td></td>
                      <td></td>
                      ${
                        orderData.discountAmt
                          ? `<td>Discount:</td><td>₹ ${orderData.discountAmt.toFixed(
                              2
                            )}</td>`
                          : ""
                      }
                  </tr>
                  <tr class="details">
                      <td></td>
                      <td></td>
                      <td>Shipping:</td>
                      <td>₹ 100</td>
                  </tr>
                  <tr class="heading">
                      <td></td>
                      <td></td>
                      <td>Total: </td>
                      <td>₹ ${orderData.amountPayable.toFixed(2)}</td>
                  </tr>
            </table>
        </div>
    </body>
</html>`;

    const fullHtmlContent = htmlContent + itemsHtml + totalHtml;

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setContent(fullHtmlContent);

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    // Set response headers to make the PDF downloadable
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    //res.end(Buffer.from(pdfBuffer));

    res.status(200).end(pdfBuffer);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the invoice" });
  }
};
//................................................................................................

const loadWalletHistory = async(req,res)=>{
  try{
      const userId = req.session.user_id
      const wallet = await WalletHistory.find({userId:userId}).sort({createdAt:-1})
      res.render('walletHistory',{wallet})
  }catch(error){
    console.log(error)
  }
}


//................................................................................................

const loadSalesReportLastTwoMonths = async (req, res) => {
  try {
    
    const currentDate = moment().endOf('day');

    const startDate = moment(currentDate).subtract(2, 'months').startOf('month');

    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

    res.render("salesReportLastTwoMonths", { order, totalSales });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
};

//...............................................................................................

const exportOrdersExcelLastTwoMonths = async(req,res)=>{

  try {
    const currentDate = moment().endOf('day');

    const startDate = moment(currentDate).subtract(2, 'months').startOf('month');

    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
      { header: 'Invoice ID', key: 'orderSerialNumber' },
      { header: 'Date', key: 'createdAt' },
      { header: 'Customer Name', key: 'userName' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Amount (INR)', key: 'amountPayable' },
    ];


    order.forEach((order) => {
      const formattedDate = order.createdAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const formattedOrder = { ...order.toObject(), createdAt: formattedDate };
      worksheet.addRow(formattedOrder);
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=salesreport.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }

}

//..............................................................................................

const downloadPdfLastTwoMonths = async(req,res)=>{
  try {
    const currentDate = moment().endOf('day');

    const startDate = moment(currentDate).subtract(2, 'months').startOf('month');

    const endDate = currentDate;

    console.log('startDate:', startDate.format());
    console.log('endDate:', endDate.format());

    const order = await Order.find({
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).sort({ createdAt: -1 });

    console.log('orders:', order);

    const totalSales = order.reduce((total, order) => total + order.totalPrice, 0);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let htmlContent = `
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
      <br><br><br>
      <h2>Sales Report</h2>
      <br><br>
      <table>
        <tr>
          <th>Sl No.</th>
          <th>Date</th>
          <th>Invoice ID</th>
          <th>Customer Name</th>
          <th>Payment Method</th>
          <th>Amount</th>
          
        </tr>
    `;

    let serialNumber = 1; // Initialize the serial number

    order.forEach((order) => {
      htmlContent += `
        <tr>
          <td>${serialNumber}</td>
          <td>${new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}</td>
          <td>${order.orderSerialNumber}</td>
          <td>${order.userName}</td>
          <td>${order.paymentMethod}</td>
          <td>${order.amountPayable}</td>
          
        </tr>`;
      serialNumber++; // Increment the serial number for the next order
    });

    htmlContent += `
      <tr>
        <td colspan="5">Total Sales:</td>
        <td colspan="2">${totalSales}</td>

      </tr>`;
    htmlContent += '</table>';

    // Generate the PDF
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=salesreport_lastTwoMonths.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
}


//................................................................................................

module.exports = {

    loadOrderConfirm,
    loadMyOrders,
    loadViewOrder,
    loadReturnOrder,
    loadCancelOrder,
    loadMyWallet,
    loadAllOrders,
    changeOrderStatus,
    exportOrdersExcel,
    //loadSalesReportDaily,
    loadSalesReport,
    loadSalesReportWeekly,
    loadSalesReportMonthly,
    exportOrdersExcelDaily,
    exportOrdersExcelMonthly,
    exportOrdersExcelWeekly,
    downloadPdfWeekly,
    downloadPdfMonthly,
    downloadPdfDaily,
    loadViewOrderAdmin,
    generateInvoice,
    loadWalletHistory,
    downloadSalesReport,
    loadSalesReportLastTwoMonths,
    exportOrdersExcelLastTwoMonths,
    downloadPdfLastTwoMonths,
    loadSalesReportRange 
  
}