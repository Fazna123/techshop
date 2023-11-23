const User = require("../models/userModel");

const Product = require("../models/productModel")

const Category = require('../models/categoryModel')

const Banner = require('../models/bannerModel')

const Address = require('../models/addressModel')

const Wallet = require('../models/walletModel')

const bcryptjs = require("bcryptjs");

const nodemailer = require("nodemailer");

const config = require("../config/config");

const randomstring = require("randomstring");

const sharp = require('sharp');


require('dotenv').config()
// console.log('SMTP_USERNAME:', process.env.emailUser);
// console.log('SMTP_PASSWORD:', process.env.emailPassword);
// console.log('SMTP_host:', process.env.host);
// console.log('SMTP_port:', process.env.port);
// console.log('SMTP_secure:', process.env.secure);





const securePassword = async (password) => {
  try {
    const passwordHash = await bcryptjs.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

const isLoggedIn = (req) => {
  return req.session && req.session.user_id; // Check if a userId is stored in the session
};

const sendOtpMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.host,
      port: process.env.host,
      secure: process.env.secure,
      requireTLS: true,
      auth: {
        user: process.env.emailUser,
        pass: process.env.emailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: process.env.emailUser,
      to: email,
      subject: "Verification mail",
      html: `<p>Hii ${name} , your OTP is ${otpObject.otp}, please click here to enter<a href="http://www.techshoppie.in/verify?id=${user_id}&email=${email}">OTP</a> recieved.</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:-", info.response);
      }
      return otpObject.otp;
    });
  } catch (error) {
    console.log(error.message);
  }
};

//.........OTP.............

const otpObject = {
  otp: Math.floor(1000 + Math.random() * 9000),
  id: "otp",
};

//................................................................................................................
const loadOtpVerify = async (req, res) => {
  try {
    const email = req.query.email;
    //console.log(email)
    //console.log(otpObject.otp)
    res.render("otp-verification", { email });
  } catch (error) {
    console.log(error.message);
  }
};

//...................................................................................................................

const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

//.....reset psswrd......................................................................................................

const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.host,
      port: process.env.host,
      secure: process.env.secure,
      requireTLS: true,
      auth: {
        user: process.env.emailUser,
        pass: process.env.emailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: process.env.emailUser,
      to: email,
      subject: "For Reset Password ",
      html:
        "<p>Hii " +
        name +
        ' , please click here to <a href="http://www.techshoppie.in/forget-password?token=' +
        token +
        '">Reset</a> your password.</p>',
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

//..........................................................................................................................


const generateUniqueReferralCode = async () => {
  const codeLength = 8;

  while (true) {
    const referralCode = generateReferralCode(codeLength);
    const existingUser = await User.findOne({ referralCode });

    if (!existingUser) {
      return referralCode;
    }
  }
};

const generateReferralCode = (codeLength) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode = '';

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }
  return referralCode;
};




//............................................................................................................................
const insertUser = async (req, res) => {
  try {
    const { email, name } = req.body;

    console.log(req.body);
    const spassword = await securePassword(req.body.password);

    if (!email || !name || email.trim() === '' || name.trim() === '') {
      return res.render("registration", {
        message: "Email and name are required fields",
      });
    }

    const checkuser = await User.findOne({ email: email });

    if (checkuser) {
      res.render("registration", {
        message: "Account already exists with this email",
      });
    } else {

      let referredById = null;
      if (req.body.referralCode) {
        const referredUser = await User.findOne({ referralCode: req.body.referralCode });
        
        if (referredUser) {
          referredById = referredUser._id;
          
          const walletData = await Wallet.findOne({userId:referredById})
          if (!walletData) {
            const wallet = new Wallet({
              userId:referredById,
              walletBalance:500
            });
            await wallet.save()
          }else{
            walletData.walletBalance += 500
            await walletData.save()
          }
        }
      }


      const user = new User({
        name,
        email,
        mobile: req.body.mbno,
        image: req.file.filename,
        password: spassword,
        referralCode: await generateUniqueReferralCode(),
        referredBy: referredById,
        is_admin: 0,
        is_blocked: 0,
      });

      const userData = await user.save();

      if (userData) {
        sendOtpMail(req.body.name, req.body.email, userData._id);

        const wallet = new Wallet({
          userId:userData._id,
          walletBalance:500
        })
        await wallet.save();
        
        return res.render("registration", {
          message: "An OTP has been sent to your mail. Please check your mail",
        });
      } else {
        res.render("registration", {
          message: "Your registration has failed",
        });
      }
    }
  } catch (error) {
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error, statusCode });
    console.log(error);
  }
};



//..........................................................................................................................


// const insertUser = async (req, res) => {
//   try {
//     const { email, name } = req.body;

//     console.log(req.body);
//     const spassword = await securePassword(req.body.password);

//     if (!email || !name || email.trim() === '' || name.trim() === '') {
//       return res.render("registration", {
//         message: "Email and name are required fields",
//       });
//     }

//     const checkuser = await User.findOne({ email: email });
//     if (checkuser) {
//       res.render("registration", {
//         message: "Account already exists in this email",
//       });
//     } else {
//       const user = new User({
//         name,
//         email,
//         mobile: req.body.mbno,
//         image: req.file.filename,
//         password: spassword,
//         referralCode:await generateUniqueReferralCode(),
//         is_admin: 0,
//         is_blocked:0
//       });

//       const userData = await user.save();

//       if (userData) {
//         sendOtpMail(req.body.name, req.body.email, userData._id);
        
//           return res.render("registration", {
//           message: "An OTP has been sent to your mail. Please check your mail",
//         });
      
//       } else {
        
//         res.render("registration", {
//           message: "Your registration has been failed",
//         });
      
//       }
//     }
//   } catch (error) {
//     //console.log(error.message);
//     const statusCode = getStatusCode(error);
//     res.status(statusCode).render("error", { error: error,statusCode });
//     console.log(error);
//   }
// };


//..........................................................................................................................

const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const enteredOtp = req.body.otp;

    console.log(otpObject);
    console.log(req.body);

    const otp = otpObject.otp;
    console.log(otp);
    if (enteredOtp == otpObject.otp) {
      const updateInfo = await User.updateOne(
        { email: email },
        { $set: { is_verified: 1 } }
      );
      console.log("Update Info:", updateInfo);
      res.redirect("/login");
    }
    if (otpObject.otp === 0) {
      res.render("otp-verification", {
        message: "Your OTP expired please click Resend OTP",
      });
    }
  } catch (error) {
    console.error("Error updating verification status:", error);
    res.status(500).send("Internal Server Error");
  }
};

const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    //console.log(error.message);
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcryptjs.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_verified === 0) {
          res.render("login", { message: "Please verify your mail." });
        } else if(userData.is_admin === 1){
          res.render("login", { message: "Please check your mail address" });
        }
        else{
          
          req.session.user_id = userData._id;
          // res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          // res.setHeader('Pragma', 'no-cache');
          // res.setHeader('Expires', '0');
          const loggedIn = isLoggedIn(req);
          const categoryData = await Category.find({ is_active: true });
          const banner = await Banner.find({active:true})
          const productData = await Product.find({ is_featured: 1 });
          res.render("home", { loggedIn,categories:categoryData,products:productData,banner});
          
        }
      } else {
        res.render("login", { message: "Passwords do not match" });
      }
    } else {
      res.render("login", { message: "Invalid Email/Password" });
    }
  } catch (error) {
    //console.log(error.message);
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error ,statusCode});
    console.log(error);
  }
};

const loadProfile = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    const addressData = await Address.find({userId:req.session.user_id})
    res.render("myprofile", { user: userData,address:addressData });
  } catch (error) {
    // console.log(error.message);
    // return res.status(500).send("An error occurred.");
    const statusCode =getStatusCode(error);
    res.status(statusCode).render("error", { error: error ,statusCode});
    console.log(error);
  }
};

const userLogout = async (req, res) => {
  try {
    //req.session.destroy();
    req.session.user_id = null
    res.redirect("/");
  } catch (error) {
    //console.log(error.message);
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};

const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    //console.log(error.message);
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.is_verified === 0) {
        res.render("forget", {
          message: "Please verify your email address to reset password",
        });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomString);
        res.render("forget", {
          message: "Please check your mail to reset your password",
        });
      }
    } else {
      res.render("forget", { message: "User email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Reset token is invalid" });
    }
  } catch (error) {
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const secure_password = await securePassword(password);

    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } }
    );
    res.redirect("/");
  } catch (error) {
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};

//mail verification
const verificationLoad = async (req, res) => {
  try {
    res.render("verification");
  } catch (error) {
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};

const sendVerificationLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      sendOtpMail(userData.name, userData.email, userData._id);
      res.render("verification", {
        message: "The OTP has been  sent. Please check your mail.",
      });
    } else {
      res.render("verification", {
        message: "Invalid Email Address.Please register your mail address",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//user profile editt

const editLoad = async (req, res) => {
  try {
    const id = req.query.id;

    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render("edit", { user: userData });
    } else {
      res.redirect("/myprofile");
    }
  } catch (error) {
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};

//....................................................................................

// const updateProfile = async (req, res) => {
//   try {
//     if (req.file) {
//       const userData = await User.findByIdAndUpdate(
//         { _id: req.body.user_id },
//         {
//           $set: {
//             name: req.body.name,
//             email: req.body.email,
//             mobile: req.body.mbno,
//             image: req.file.filename,
//           },
//         }
//       );
//     } else {
//       const userData = await User.findByIdAndUpdate(
//         { _id: req.body.user_id },
//         {
//           $set: {
//             name: req.body.name,
//             email: req.body.email,
//             mobile: req.body.mbno,
//           },
//         }
//       );
//     }

//     res.redirect("/myprofile");
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      // Use the same file name as the uploaded image
      const imagePath = req.file.filename;

      await sharp(req.file.path)
        .resize({ width: 200, height: 200 })
        .toFile(imagePath);

      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mbno,
            image: imagePath,
          },
        }
      );
    } else {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mbno,
          },
        }
      );
    }

    // Redirect to the appropriate route after updating the profile
    res.redirect("/myprofile");
  } catch (error) {
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error ,statusCode});
    console.log(error);
  }
};


//...............................................................................................

const loadHome = async (req, res) => {
  try {
    const loggedIn = isLoggedIn(req);
    const banner = await Banner.find({active:true})
    const categoryData = await Category.find({ is_active: true });
    const productData = await Product.find({}).sort({price:-1});

    // Render the EJS template with the retrieved data
    res.render("home", { loggedIn, categories: categoryData ,products:productData,banner});
  } catch (error) {
    // console.log(error);
    // res.status(500).send('Internal Server Error');
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};




const productDetailLoad = async(req,res)=>{
  try{
      
       const loggedIn = isLoggedIn(req)
       const productData = await Product.findOne({_id:req.query._id})

      const categoryData = await Product.find({category:productData.category})

       if (!productData) {
        return res.status(404).send('Product not found');
      }
      res.render('product-detail',{loggedIn,product:productData,products:categoryData})
  }catch(error){
    
    // console.error('Error in productDetailLoad:', error);
    // res.status(500).send(`Internal Server Error: ${error.message}`);
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
}


const addressLoad = async(req,res)=>{
  try{
      res.render('add-address')
  }catch(error){
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
}


const addAddress=async(req,res)=>{
  try{

    const{name,addressLine,street,city,state,pin,addressType}=req.body
    const userId = req.session.user_id;
    const permenantAddress = await Address.findOne({ userId: userId, is_permenant: true });

    if(!permenantAddress){
      const address = new Address ({
        userId,
        name,
        addressLine,
        street,
        city,
        state,
        pin,
        addressType,
        is_permenant:true
      });
      const addressData = await address.save();
      if(addressData){
        res.render('add-address',{message:'Address added successfully'})
      }else{
        res.render('add-address',{message:'Error!.Try adding again.'})
      }
    }else{
      const address = new Address({
        userId,
        name,
        addressLine,
        street,
        city,
        state,
        pin,
        addressType,
        is_permenant:false
      });
      const addressData  = await address.save();
      if(addressData){
        res.render('add-address',{message:'Address added successfully'})
      }else{
        res.render('add-address',{message:'Error!.Try adding again.'})
      }
    }    
  }catch(error){
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
}


const loadEditAddress = async(req,res)=>{
  try{
      const addressId = req.query.id;
      console.log(addressId)
      const userId = req.session.user_id
      console.log(userId)
      const address = await Address.findOne({_id:addressId,userId:userId})
      console.log(address)
      res.render('edit-address',{address:address})
  }catch(error){
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
}

const updateAddress = async (req, res) => {
  try {
    const { addressId, name, addressLine, street, city, state, pin, addressType } = req.body;

    const updatedAddress = await Address.findByIdAndUpdate(
      { _id: addressId },
      {
        $set: {
          name,
          addressLine,
          street,
          city,
          state,
          pin,
          addressType
        }
      },
      { new: true } // This ensures that the updated address is returned after the update
    );

    res.redirect('/checkout')
  } catch (error) {
    // console.error(error.message);
    // res.status(500).json({ success: false, message: 'Internal Server Error' });
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};


const loadProducts = async (req, res) => {
  try {
    const loggedIn = isLoggedIn(req)
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 16;
    const productsData = await Product.find({
      is_blocked: 0,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { category: { $regex: ".*" + search + ".*", $options: "i" } },
        { brand: { $regex: ".*" + search + ".*", $options: "i" } },        
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments({
      is_blocked: 0,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { category: { $regex: ".*" + search + ".*", $options: "i" } },
        { brand: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    });

    res.render("products", {
      products: productsData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      loggedIn
    });
  } catch (error) {
    const statusCode = getStatusCode(error);
    res.status(statusCode).render("error", { error: error,statusCode });
    console.log(error);
  }
};



//............................................................................................


function getStatusCode(err) {
  switch (err.code) {
    case "ERR_ASSERTION":
      return 500;
    case "ERR_CHILD_PROCESS_IPC_REQUIRED":
      return 500;
    case "ERR_MODULE_NOT_FOUND":
      return 404;
    case "ERR_SOCKET_CLOSED":
      return 500;
    case "ERR_SYNTAX_ERROR":
      return 500;

    // HTTP errors
    case "ECONNREFUSED":
      return 503;
    case "EHOSTUNREACH":
      return 503;
    case "EPIPE":
      return 500;
    case "ETIMEDOUT":
      return 504;

    // Other errors
    case "ENOENT":
      return 404;
    case "EPERM":
      return 403;

    // New errors
    case "ERR_INVALID_ARG_TYPE":
      return 400;
    case "ERR_INVALID_CALLBACK":
      return 400;
    case "ERR_INVALID_HTTP_MESSAGE":
      return 400;
    case "ERR_INVALID_JSON_STRING":
      return 400;
    case "ERR_INVALID_URL":
      return 400;
    case "ERR_MISSING_ARGS":
      return 400;
    case "ERR_OUT_OF_RANGE":
      return 400;
    case "ERR_TIMEOUT":
      return 408;
    case "ERR_UNHANDLED_REJECTION":
      return 500;
    default:
      return 500;
  }
}



//////////////////////////////////////////////////////////////////////////////////////////////////



module.exports = {
  loadRegister,
  insertUser,
  verifyOtp,
  loginLoad,
  loadProfile,
  verifyLogin,
  userLogout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  verificationLoad,
  sendVerificationLink,
  editLoad,
  updateProfile,
  loadOtpVerify,
  loadHome,
  productDetailLoad,
  addressLoad,
  addAddress,
  loadEditAddress,
  updateAddress,
  loadProducts
}
