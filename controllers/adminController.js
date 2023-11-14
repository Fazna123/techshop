const User = require("../models/userModel")

const Product = require("../models/productModel")

const Category = require('../models/categoryModel')

const Banner = require('../models/bannerModel')

const Order = require('../models/orderModel')

const bcryptjs = require('bcryptjs')

const randomstring = require("randomstring")

const config = require('../config/config')

const nodemailer = require("nodemailer")

const excelJS = require('exceljs')

const sharp = require('sharp');

const path = require('path')

const fs = require('fs');


require('dotenv').config()



const uploaduserImage = require('../config/multer');
const uploadproductImage = require('../config/multer')

const securePassword = async(password)=>{
    try{

        const passwordHash = await bcryptjs.hash(password,10);
        return passwordHash;

    }catch(error){
        console.log(error.message);
        
    }
}



const sendResetPasswordMailAdmin = async(name,email,token)=>{

    try{
        const transporter = nodemailer.createTransport({
            host: process.env.host,
            port: process.env.host,
            secure:process.env.secure,
            requireTLS:true,
            auth:{
                user:process.env.emailUser,
                pass:process.env.emailPassword
            }
        })
        const mailOptions = {
            from: process.env.emailUser,
            to:email,
            subject: 'For Reset Password ',
            html: '<p>Hii '+name+' , please click here to <a href="http://127.0.0.1:3000/admin/forget-password?token=' +token+'">Reset</a> your password.</p>'

        }
        transporter.sendMail(mailOptions, async function(error,info){
            if(error){
                console.log(error)
            }else{
                console.log("Email has been sent:-",info.response)
            }
        })

    }catch(error){
        console.log(error.message)
    }
}

const addUserMail = async(name,email,password,user_id)=>{

    try{
        const transporter = nodemailer.createTransport({
            host: process.env.host,
            port: process.env.host,
            secure:process.env.secure,
            requireTLS:true,
            auth:{
                user:process.env.emailUser,
                pass:process.env.emailPassword
            }
        })
        const mailOptions = {
            from: process.env.emailUser,
            to:email,
            subject: 'Verification mail',
            html: '<p>Hii '+name+' , Admin added you, so please click here to <a href="http://127.0.0.1:3000/verify?id='+user_id+' " >Verify</a> your mail </p><br><br><b>Email:</b>'+email+'<br><b>Password: </b>'+password,
        }
        transporter.sendMail(mailOptions, async function(error,info){
            if(error){
                console.log(error)
            }else{
                console.log("Email has been sent:-",info.response)
            }
        })

    }catch(error){
        console.log(error.message)
    }
}

const loadLogin = async(req,res)=>{

    try{

        res.render('login')

    }catch(error){
        console.log(error.message)
    }
}

const verifyLogin = async(req,res)=>{

    try{

        const email = req.body.email
        const password = req.body.password
        const userData = await User.findOne({email:email})
        if(userData){

            const passwordMatch = await bcryptjs.compare(password,userData.password)

            if(passwordMatch){

                if(userData.is_admin === 0 ){

                    res.render('login',{message:"Not an Admin..Login restricted.."})
                }else{

                    req.session.admin_id = userData._id;
                    res.redirect("/admin/dashboard")
                }


            }else{

                res.render('login',{message:"Invalid Email/Password"})
            }


        }else{
            res.render('login'),{message:"Invalid Email/Password"};
        }

    }catch(error){
        console.log(error.message)
    }
}


const loadAdminProfile = async(req,res)=>{

    try{

        const userData = await User.findById({_id:req.session.admin_id})
        res.render('adminprofile',{admin:userData})

    }catch(error){
        console.log(error.message)
    }
}

const logout = async(req,res)=>{

    try{

        //req.session.destroy();
        req.session.admin_id = null
        res.redirect('/admin')

    }catch(error){

        console.log(error.message)
    }
}

const loadDashBoard = async(req,res)=>{

    try{

        // const limit = 5
        // var page = 1
        // const usersData = await User.find({
        //     is_admin:0
            // $or:[
            //     {name:{$regex:'.*'+search+'.*',$options:'i'}},
            //     {email:{$regex:'.*'+search+'.*',$options:'i'}},
            //     { mobile: { $regex:'.*' + sanitizedSearch +'.*' ,$options:'i'} }
            // ]
        // })
        // .limit(limit*1)
        // .skip((page-1)*limit)
        // .exec();

        // const productsData = await Product.find({
        //     is_blocked:0
            // $or:[
            //     {name:{$regex:'.*'+search+'.*',$options:'i'}},
            //     {email:{$regex:'.*'+search+'.*',$options:'i'}},
            //     { mobile: { $regex:'.*' + sanitizedSearch +'.*' ,$options:'i'} }
            // ]
        // })
        // .limit(limit*1)
        // .skip((page-1)*limit)
        // .exec();
        //res.render('dashboard',{users:usersData,products:productsData})
        const productCount = await Product.countDocuments()
        const userCount = await User.find({is_admin:0}).countDocuments()
        const orderCount = await Order.countDocuments()
        const orderData = await Order.find()
        const totalAmountPayable = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amountPayable" }
                }
            }
        ]);
        // if (totalAmountPayable.length > 0) {
            const revenue = totalAmountPayable[0].total;
        //}
        res.render('dashboard',{
            productCount,
            userCount,
            orderCount,
            orderData,
            revenue
        })

    }catch(error){
        console.log(error.message)
    }
}

const loadEditProfile = async(req,res)=>{

    try{
        const id = req.query.id
        console.log(req.query.id)

        const adminData = await User.findById({_id:id});

        if(adminData){

            res.render('edit-profile',{ admin:adminData })

        }else{

            res.redirect('/admin/adminprofile')
        }

    }catch(error){
        console.log(error.message)
    }
}

const updateProfile = async (req,res)=>{

    try{
        
        if(req.file){

            const userData = await User.findByIdAndUpdate({_id:req.body.user_id},
                {$set:{name:req.body.name,email:req.body.email,mobile:req.body.mbno,image:req.file.filename}})

        }else{
            const userData = await User.findByIdAndUpdate({_id:req.body.user_id},
                {$set:{name:req.body.name,email:req.body.email,mobile:req.body.mbno}})
        }

        res.redirect('/admin/adminprofile')

    }catch(error){
        console.log(error.message)
    }   
}

const forgetLoad = async(req,res)=>{

    try{

        res.render('forget-admin')

    }catch(error){
        console.log(error.message)
    }
}


const forgetVerify = async(req,res)=>{

    try{

       const email = req.body.email
       const adminData = await User.findOne({email:email})
       if(adminData){

            if(adminData.is_admin == 0){

                res.render("forget-admin",{message:"Not an Admin Mail Address"})


             }else{
                
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{token:randomString}})
                sendResetPasswordMailAdmin(adminData.name, adminData.email, randomString);
                res.render('forget-admin',{message:"Please check your mail to reset password"})

            }

        }else{

            res.render("forget-admin",{message:"Email is incorrect"})
       }

    }catch(error){
        console.log(error.message)
    }
}

const forgetPasswordLoad = async(req,res)=>{

    try{

        const token = req.query.token

        const tokenData = await User.findOne({token:token})
        if(tokenData){

            res.render('forget-password',{admin_id:tokenData._id})

        }else{

            res.render("404",{message:"Invalid Link"})
        }

    }catch(error){
        console.log(error.message)
    }
}


const resetPassword = async(req,res)=>{

    try{

        const password = req.body.password
        const admin_id = req.body.admin_id

        const securepassword = await securePassword(password)
        const updatedData = await User.findByIdAndUpdate({_id:admin_id},{$set:{password:securepassword,token:""}})

        res.redirect('/admin/dashboard')

    }catch(error){
        console.log(error.message)
    }
}

const loadUserList = async(req,res)=>{

    try{

        var search =""
        if(req.query.search){

            search = req.query.search

        }
        var page = 1
        if(req.query.page){

            page = req.query.page

        }

        const limit = 10

        const sanitizedSearch = search.replace(/[-\s]/g, '');
        const usersData = await User.find({
            is_admin:0,
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {email:{$regex:'.*'+search+'.*',$options:'i'}},
                { mobile: { $regex:'.*' + sanitizedSearch +'.*' ,$options:'i'} }
            ]
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();


        const count = await User.find({
            is_admin:0,
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {email:{$regex:'.*'+search+'.*',$options:'i'}},
                { mobile: { $regex:'.*' + sanitizedSearch +'.*' ,$options:'i'} }
            ]
        }).countDocuments();


        res.render('userList',{
            users:usersData,
            totalPages: Math.ceil(count/limit),
            currentPage: page
        })

    }catch(error){
        console.log(error.message)
    }
}

//Adding new users
const newUserLoad = async(req,res)=>{

    try{

        res.render('new-user');       

    }catch(error){
        console.log(error.message)
    }
}


const addUser = async(req,res)=>{

    try{

        const {name,email}= req.body
        const mobile = req.body.mbno
        const image = req.file.filename
        const password = randomstring.generate(8);
        const spassword = await securePassword(password)
        
        const user = new User({

            name:name,
            email:email,
            mobile:mobile,
            image:image,
            password:spassword,
            is_admin:0,
            is_blocked:0
        
        })

        const userData = await user.save()

        if(userData){

            addUserMail(name,email,password,userData._id)
            res.redirect('/admin/userlist')

        }else{

            res.render('new-user',{message:"Something Wrong"})

        }



    }catch(error){
        console.log(error.message)
    }
}


const editUserLoad = async(req,res)=>{

    try{

        const id = req.query.id
        const userData = await User.findById(id)
        if(userData){

            res.render('edit-user',{user:userData})

        }else{

            res.redirect('/admin/userlist')
        }
        

    }catch(error){
        console.log(error.message)
    }

}


const updateUsers = async(req,res)=>{

    try{

        const userData = await User.findByIdAndUpdate({_id:req.body.id},
            {$set:{name:req.body.name,email:req.body.email,mobile:req.body.mbno,is_verified:req.body.verify}})
        res.redirect('/admin/userlist')

    }catch(error){
        console.log(error.message)
    }
}

const blockUser = async(req,res)=>{

    try{

         const id = req.query.id;
         const userData = await User.findByIdAndUpdate(id, { $set: { is_blocked: 1 } });   
         if(userData){
            console.log('user blocked')
            res.redirect('/admin/userlist')
         }else{
            console.log('error blocking user')
            res.status(500).send('Internal Server Error');
         }

    }catch(error){
        console.log(error.message)
    }
}


const deleteUser = async(req,res)=>{

    try{

         const id = req.query.id;
         await User.deleteOne({_id:id})     
         res.redirect('/admin/userlist')

    }catch(error){
        console.log(error.message)
    }
}


//.....add products....

const newProductLoad = async(req,res)=>{

    try{

        const categoryData = await Category.find({})
        console.log()
        res.render('new-product',{categories:categoryData});       

    }catch(error){
        console.log(error.message)
    }
}



////////////////////////////////////////////////////////////////////////////////////////


const addProduct = async (req, res) => {
    try {
      const { name, description, category, brand, price } = req.body;
  
      if (!name || name.trim() === '') {
        const categories = await Category.find({});
        return res.render('new-product', { message: 'Product name is required', categories });
      }
  
      const nameRegex = new RegExp(name, 'i');
      const quantity = parseInt(req.body.quantity, 10) || 0;
      const productImage = [];
  
      const filePromises = req.files.map(async (file) => {
        const image = file.filename;
  
        await sharp(file.path)
          .resize({ width: 200, height: 200 })
          .toFile(image);
  
        productImage.push(image);
      });
  
      // Wait for all file processing to complete
      await Promise.all(filePromises);
  
      const existingProduct = await Product.findOne({ name: nameRegex });
      const categories = await Category.find({});
  
      if (existingProduct) {
        existingProduct.quantity += quantity;
        await existingProduct.save();
        res.render('new-product', { message: 'Product quantity updated successfully', categories });
      } else {
        const product = new Product({
          name,
          description,
          category,
          brand,
          image: productImage,
          price,
          is_featured: 0,
          is_blocked: 0,
          quantity,
        });
  
        await product.save();
        res.render('new-product', { message: 'Product has been added successfully', categories });
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };
  
  
  
  
  
  

/////////////////////////////////////////////////////////////////////////////////////////////

const loadProductList = async(req,res)=>{

    try{

        var search =""
        if(req.query.search){

            search = req.query.search

        }
        var page = 1
        if(req.query.page){

            page = req.query.page

        }

        const limit = 10

        const sanitizedSearch = new RegExp(`.*${search.replace(/[-\s]/g, '')}.*`, 'i');

        // const sanitizedSearch = search.replace(/[-\s]/g, '');
        const productsData = await Product.find({
            // is_blocked: 0,
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {category:{$regex:'.*'+search+'.*',$options:'i'}},
                {brand:{$regex:'.*'+search+'.*',$options:'i'}}
                //{price: { $regex:'.*' + sanitizedSearch +'.*' ,$options:'i'} }
            ]
          })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
      
          const count = await Product.countDocuments({
            is_blocked: 0,
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {category:{$regex:'.*'+search+'.*',$options:'i'}},
                {brand:{$regex:'.*'+search+'.*',$options:'i'}}
                //{price: { $regex:'.*' + sanitizedSearch +'.*' ,$options:'i'} }
            ]
          });


        res.render('productList',{
            products:productsData,
            totalPages: Math.ceil(count/limit),
            currentPage: page
        })

    }catch(error){
        console.log(error.message)
    }
}

const editProductLoad = async(req,res)=>{

    try{

        const id = req.query.id
        console.log(id)
        const productData = await Product.findById(id)
        const  categories = await Category.find({})
        if(productData){

            res.render('edit-product',{product:productData,categories:categories})

        }else{

            res.redirect('/admin/productlist')
        }
        

    }catch(error){
        console.log(error.message)
    }

}


const updateProduct = async (req, res) => {
    try {

        console.log(req.body);
        console.log(req.files);

        const images = req.files.map((file) => file.filename);

        // Get the image index from the request
        const imageIndexToReplace = req.body.updatedImageIndex;

        console.log(images);
        console.log('imageindextoreplace:',imageIndexToReplace)


        const {name,category,price,brand,description,quantity}=req.body
        const is_featured=req.body.featured
        const is_blocked = req.body.blocked

    const updateData = {
        name,
        category,
        price,
        brand,
        description,
        is_featured,
        is_blocked,
        quantity
      };


        if (imageIndexToReplace !== undefined && imageIndexToReplace >= 0) {
            // Replace the image at the specified index
            updateData['$set'] = { [`image.${imageIndexToReplace}`]: images[0] };
        } else {
            // Add new images
            updateData['$push'] = { image: { $each: images } };
        }

        const productData = await Product.findByIdAndUpdate(
          { _id: req.body.product_id },
          updateData,
          { new: true } // To return the updated document
        );

        console.log(productData);

        res.redirect("/admin/productlist");
                 

    } catch (error) {
        console.log(error.message);
        
    }
};

  


const blockProduct = async(req,res)=>{

    try{

         const id = req.query.id;
         await Product.findByIdAndUpdate({_id:id},{$set:{is_blocked:1}})     
         res.redirect('/admin/productlist')

    }catch(error){
        console.log(error.message)
    }
}



const deleteProduct = async(req,res)=>{

    try{

         const id = req.query.id;
         await Product.deleteOne({_id:id})     
         res.redirect('/admin/productlist')

    }catch(error){
        console.log(error.message)
    }
}



module.exports = {
    loadLogin,
    verifyLogin,
    loadDashBoard,
    logout,
    forgetLoad,
    forgetVerify,
    sendResetPasswordMailAdmin,
    forgetPasswordLoad,
    resetPassword,
    //securePassword,
    loadUserList,
    newUserLoad,
    addUser,
    //addUserMail,
    editUserLoad,
    updateUsers,
    deleteUser,
    loadAdminProfile,
    loadEditProfile,
    updateProfile,
    newProductLoad,
    addProduct,
    loadProductList,
    editProductLoad,
    updateProduct,
    blockProduct,
    deleteProduct,
    blockUser
}