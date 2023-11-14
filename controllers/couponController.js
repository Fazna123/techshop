const Coupon = require('../models/couponModel')

const CouponHistory = require('../models/couponHistory')

const User = require("../models/userModel");

const Product = require("../models/productModel");

const CartItem = require("../models/cartModel")





const loadCouponList = async(req,res)=>{
    try{
        const couponData = await Coupon.find({})
        res.render('coupon',{coupons:couponData})
    }catch(error){
        console.log(error.message)
    }
}

const loadCouponAdd = async(req,res)=>{
    try{
        res.render('new-coupon')
    }catch(error){
        console.log(error.message)
    }
}

const insertCoupon = async(req,res)=>{
    try{
        const {code,discount,expiryDate,minPurchaseAmt,maxDeduction}=req.body
        console.log(req.body)
        const  couponExist = await Coupon.find({code:code})
        console.log(couponExist)
        const dateNow = new Date();
        console.log(dateNow)
        if(couponExist && couponExist.expiryDate > dateNow){
            res.render('new-coupon',{message:'Coupon already exists!!'})
        }else{
            const coupon = new Coupon({
                code,
                discount,
                createdDate:dateNow,
                minPurchaseAmt,
                maxDeduction,
                expiryDate,
                is_cancelled:0
            });
            const couponData = await coupon.save();
            console.log(couponData)
            if(couponData){
                res.render('new-coupon',{message:'Coupon has been added successfully!'})
            }
        }

    }catch(error){
        console.log(error.message)
    }
}

const loadEditCoupon = async(req,res)=>{
    try{
        const id = req.query.id
        const coupon = await Coupon.findById(id)
        if (!coupon) {
            return res.status(404).send('Coupon not found'); // Handle case where coupon is not found
        }
        res.render('edit-coupon',{coupon})

    }catch(error){
        console.log(error.message)
    }
}


const updateCoupon = async(req,res)=>{
    try{
        const {code,discount,minPurchaseAmt,maxDeduction,expiryDate}=req.body
        const couponId = req.body.coupon_id; 
        const couponData = await Coupon.findOneAndUpdate({_id: couponId},
            {$set:{code:code,
                discount:discount,
                expiryDate:expiryDate,
                minPurchaseAmt:minPurchaseAmt,
                maxDeduction:maxDeduction            
            }})
        if(couponData){
            res.redirect('/admin/coupon')
        }else{
            return res.status(404).send('Error updating coupon');
        }

    }catch(error){
        console.log(error.message)
    }
}

const blockCoupon = async(req,res)=>{
    try{
        const id = req.query.id;
        const couponData = await Coupon.findOneAndUpdate({_id:id},{$set:{is_cancelled:1}})
        if(couponData){
            res.redirect('/admin/coupon')
        }
        else{
            return res.status(400).send('Error in cancelling coupon!')
        }
    }catch(error){
        console.log(error.message)
    }
}


const deleteCoupon = async(req,res)=>{
    try{

        const id=req.query.id
        const couponData = await Coupon.findByIdAndDelete(id)
        if(couponData){
            res.redirect('/admin/coupon')
        }else{
            return res.status(400).send('Error in deleting coupon!')
        }
    }catch(error){
        console.log(error.message)
    }
}




const applyCoupon = async (req, res) => {
    try {
        
        const userId = req.session.user_id;
        const appliedCouponId = req.body.couponId; 

        const couponData = await Coupon.findOne({ _id: appliedCouponId }); 
        const currentDate = Date.now();

        if (currentDate > couponData.expiryDate) {
            console.log('Coupon is expired already');
            res.status(200).json({ message: 'Coupon is expired already' });
        } else {
            const userCoupons = await CouponHistory.findOne({ codeId: couponData._id,codeName:couponData.code,userId: userId });
            //console.log('coupon history:',userCoupons)
            if (userCoupons) {
                console.log('Coupon has already been used');
                res.status(200).json({ message: 'Coupon has already been used' });
            } else {

                const cartItemData = await CartItem.find({ userId: userId });
                let subtotal = 0;

                if (cartItemData) {
                    subtotal = cartItemData.reduce((acc, cartItem) => {
                        return acc + cartItem.subtotal;
                    }, 0);
                }

                if(subtotal < couponData.minPurchaseAmt){
                    res.status(200).json({message:`Minimum Purchase Amount should be ${couponData.minPurchaseAmt}`})
                }else{

                const coupon = new CouponHistory({
                    codeId:couponData._id,
                    codeName:couponData.code,
                    userId:userId
                })
                const newCoupon = await coupon.save();

                
                let couponDiscount = Math.floor(subtotal * couponData.discount / 100);
                if(couponDiscount > couponData.maxDeduction){
                    couponDiscount = couponData.maxDeduction
                }
                console.log('discount in controller:',couponDiscount)
                subtotal = subtotal - couponDiscount;
                console.log('subtotal in controller:',subtotal)
                const total = subtotal + 100;
                console.log('total in controller:',total)
                //console.log('subtotal',subtotal)
                //console.log('total',total)
                res.status(200).json({ total, subtotal, couponDiscount});
            }
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




module.exports={
    loadCouponAdd,
    loadCouponList,
    insertCoupon,
    loadEditCoupon,
    updateCoupon,
    blockCoupon,
    deleteCoupon,
    applyCoupon
}