const Category = require('../models/categoryModel')

const Product = require("../models/productModel")

const uploaduserImage = require('../config/multer');
const uploadproductImage = require('../config/multer')

const sharp = require('sharp')




const loadCategory = async(req,res)=>{
    try{
        var search =""
        if(req.query.search){

            search = req.query.search

        }
        var page = 1
        if(req.query.page){

            page = req.query.page

        }

        const limit = 5

        const sanitizedSearch = search.replace(/[-\s]/g, '');
        const categories = await Category.find({
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {category:{$regex:'.*'+search+'.*',$options:'i'}},
                {subcategory: { $regex:'.*' + sanitizedSearch +'.*' ,$options:'i'} }
            ]
        })
        res.render('category',{categories});

    }catch(error){
        console.log('error')
    }
}



const insertCategory = async (req, res) => {
    try {
      const { name } = req.body;
  
      if (!name || name.trim() === '') {
        return res.render('new-category', { message: 'Category name is required' });
      }
  
      const nameRegex = new RegExp(name, 'i');
      const existingCategory = await Category.findOne({ name: nameRegex });
  
      if (existingCategory) {
        res.render('new-category', { message: 'Category already exists!!' });
      } else {
        
        if (req.file) {
          const imagePath = req.file.filename;
  
          await sharp(req.file.path)
            .resize({ width: 200, height: 200 })
            .toFile(imagePath);
  
          const category = new Category({
            name,
            image: imagePath,
            is_active: true,
          });
  
          const categoryData = await category.save();
  
          if (categoryData) {
            res.render('new-category', { message: 'Category has been added' });
          } else {
            res.render('new-category', { message: 'Failed entering new category' });
          }
        } else {
          res.render('new-category', { message: 'Image is required for the category' });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  



const addCategory = async(req,res)=>{
    try{
       res.render('new-category') 
    }catch(error){
        console.log(error.message)
    }
}

const editCategory = async(req,res)=>{
    try{
        const id = req.query.id
        //console.log(id)
        const categoryData = await Category.findById(id)
        if(categoryData){

            res.render('edit-category',{category:categoryData})

        }else{

            res.redirect('/admin/category')
        }
    }catch(error){
        console.log(error)
    }
}



const updateCategory = async (req, res) => {
    try {
      if (req.body.category_id) {
        const categoryId = req.body.category_id;
  
        if (req.file) {
          // Process and save the uploaded image using Sharp
          const imagePath = req.file.filename;
          await sharp(req.file.path)
            .resize({ width: 200, height: 200 })
            .toFile(imagePath);
  
          await Category.findByIdAndUpdate(categoryId, {
            $set: {
              name: req.body.name,
              image: imagePath,
              is_active: req.body.active,
            },
          });
        } else {
          await Category.findByIdAndUpdate(categoryId, {
            $set: {
              name: req.body.name,
              is_active: req.body.active,
            },
          });
        }
  
        res.redirect('/admin/category');
      } else {
        console.log('Invalid category ID');
        res.redirect('/admin/category');
      }
    } catch (error) {
      console.log(error.message);
    }
};



const deleteCategory = async(req,res)=>{

    try{

         const id = req.query.id;
         await Category.deleteOne({_id:id})     
         res.redirect('/admin/category')

    }catch(error){
        console.log(error.message)
    }
}





module.exports = {
    loadCategory,
    insertCategory,
    addCategory,
    editCategory,
    updateCategory,
    deleteCategory
}