const User = require("../models/userModel");

const Product = require("../models/productModel");

const CartItem = require("../models/cartModel")

const Category = require('../models/categoryModel')

const Coupon = require('../models/couponModel')

const Address = require('../models/addressModel')

const Order = require('../models/orderModel')

const Wallet = require('../models/walletModel')

const WalletHistory = require('../models/walletHistory')

const Color = require('color')




const loadLineChart = async (req, res) => {
    try {
        const categories = await Category.distinct("name");
        const paymentMethodData = await Order.aggregate([
        {
            $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            },
        },
        ]);

        // Extract payment method labels and data
        const labels = paymentMethodData.map((method) => method._id);
        const data = paymentMethodData.map((method) => method.count);

        const barChartData = {
            labels: labels,
            data: data,
        };
        //console.log(barChartData);

        res.json(barChartData);

    } catch (error) {
        console.error(error);
        res
        .status(500)
        .json({ error: "An error occurred while fetching chart data." });
    }
};



const loadPieChart = async(req,res)=>{
    try{
        const categories = await Category.distinct('name');
        const productCount = await Product.aggregate([
            {
                $group:{
                    _id:"$category",
                    count:{$sum:1}
                }
            }
        ])
        const labels = productCount.map((item)=>item._id);
        const data = productCount.map((item)=>item.count);
        const chartData ={
            labels:labels,
            data:data
        }
        //console.log('pie chart data',chartData)
        res.json(chartData)

    }catch(error){
        console.log(error.message)
    }
}






const loadAreaChart = async (req, res) => {
    try {
      const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Returned"];
      const months = ["June", "July", "August", "September", "October","November"];
      const data = [];
  
      for (let i = 0; i < orderStatuses.length; i++) {
        const status = orderStatuses[i];
        const counts = [];
        for (const month of months) {
          const startDate = new Date(`${month} 1, 2023 00:00:00`);
          const endDate = new Date(`${month} 31, 2023 23:59:59`);
          const count = await Order.aggregate([
            {
              $match: {
                orderStatus: status,
                createdAt: {
                  $gte: startDate,
                  $lt: endDate,
                },
              },
            },
            {
              $count: "count",
            },
          ]);
          counts.push(count.length > 0 ? count[0].count : 0);
        }
  
  
        data.push({
          label: status,
          data: counts,
          fill: true,
        });
      }
  
      const chartData = {
        labels: months,
        datasets: data,
      };
  
      res.json(chartData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while fetching chart data." });
    }
  };


const loadBarChart = async (req, res) => {
    try {
        const paymentMethods = ["COD", "razorpay", "wallet"];
        const months = ["June", "July", "August", "September", "October","November"];
        const data = [];

        for (const method of paymentMethods) {
            const counts = [];
            for (const month of months) {
                const startDate = new Date(`${month} 1, 2023 00:00:00`);
                const endDate = new Date(`${month} 31, 2023 23:59:59`);
                const count = await Order.aggregate([
                    {
                        $match: {
                            paymentMethod: method,
                            createdAt: {
                                $gte: startDate,
                                $lt: endDate,
                            },
                        },
                    },
                    {
                        $count: "count",
                    },
                ]);
                counts.push(count.length > 0 ? count[0].count : 0);
            }
            data.push({
              label: method,
              data: counts,
              fill: true,
            });
        }

        const chartData = {
            labels: months,
            datasets: data,
        };

        //console.log(chartData)

        res.json(chartData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching chart data." });
    }
};



// const loadWeeklyEarningsChart2 = async (req, res) => {
//     try {
        
//         const today = new Date();
//         const lastWeek = new Date(today);
//         lastWeek.setDate(today.getDate() - 6);

        
//         const result = await Order.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: lastWeek, $lte: today }
//                 }
//             },
//             {
//                 $group: {
//                     _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//                     orderCount: { $sum: 1 },
//                     totalEarnings: { $sum: "$totalPrice" }
//                 }
//             },
//             {
//                 $sort: { _id: 1 }
//             }
//         ]);

//         const labels = result.map(item => item._id); // Dates
//         const orderCounts = result.map(item => item.orderCount);
//         const totalEarnings = result.map(item => item.totalEarnings);

//         const chartData = {
//             labels: labels,
//             datasets: [
//                 {
//                     label: 'Order Count',
//                     data: orderCounts,
//                     fill: false,
//                     borderColor: 'rgba(0, 0, 255, 0.6)', // Blue with opacity
//                     borderWidth: 1.5,
//                     tention:0
//                 },
//                 {
//                     label: 'Total Earnings',
//                     data: totalEarnings,
//                     fill: false,
//                     borderColor: 'rgba(0, 128, 0, 0.6)', // Green with opacity
//                     borderWidth: 2,
//                     tention:0
//                 }
//             ]
//         };

//         res.json(chartData);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'An error occurred while fetching chart data.' });
//     }
// };


const loadWeeklyEarningsChart = async (req, res) => {
    try {
        // Calculate the date range for the last 7 days
        const today = new Date();
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 6);

        // Use MongoDB aggregation to group orders by day and calculate total price
        const result = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days, $lte: today }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalPrice: { $sum: "$totalPrice" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const labels = result.map(item => item._id); // Dates
        const totalPrices = result.map(item => item.totalPrice);

        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Total Price',
                    data: totalPrices,
                    fill: false,
                    //backgroundColor: 'rgba(128, 0, 128, 0.2)',
                    borderColor: 'rgba(128, 0, 128)', // Green with opacity
                    borderWidth: 2
                }
            ]
        };

        res.json(chartData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching chart data.' });
    }
};


const loadWeeklyOrderCount = async(req,res)=>{
    try {
        // Calculate the date range for the current week
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Go back to the start of the week

        // Use MongoDB aggregation to group orders by payment method and calculate order counts
        const result = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfWeek, $lte: today }
                }
            },
            {
                $group: {
                    _id: "$paymentMethod",
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        const paymentMethods = result.map(item => item._id); // Payment methods
        const orderCounts = result.map(item => item.orderCount);

        const chartData = {
            labels: paymentMethods,
            datasets: [
                {
                    label: 'Order Count',
                    data: orderCounts,
                    fill: true,
                    backgroundColor: 'rgba(128, 0, 128, 0.4)',
                    borderColor: 'rgba(128, 0, 128, 0.4)', // Blue with opacity
                    borderWidth: 1.5
                }
            ]
        };

        res.json(chartData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching chart data.' });
    }
};




module.exports = {
    loadLineChart,
    loadPieChart,
    loadAreaChart,
    loadBarChart,
    loadWeeklyEarningsChart,
    loadWeeklyOrderCount
    
}