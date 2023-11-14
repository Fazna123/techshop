const multer = require('multer')

const path = require('path') 

const userImageStorage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/userImages'));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
})
const uploaduserImage = multer({
  storage: userImageStorage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|jfif)$/)) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null,true)
  },
});


const productImageStorage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/productImages'));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
    // filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    //   cb(null, uniqueSuffix + '-' + file.originalname);
    // }
})
const uploadproductImage = multer({
  storage: productImageStorage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(webp|jpg|jpeg|png|gif|jfif)$/)) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null,true)
  },
});


module.exports = {
    uploadproductImage,
    uploaduserImage
}