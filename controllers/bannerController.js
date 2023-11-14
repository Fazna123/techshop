const Banner = require('../models/bannerModel')

const sharp = require('sharp')



const loadAddBanner = async (req, res) => {
    try {
        const banners = await Banner.find({})
        res.render('new-banner',banners)
    } catch (error) {
        console.log(error.message)
    }
}


const addBanner = async (req, res) => {
    try {
      const { title, url, subtitle } = req.body;
  
      if (/^\s*$/.test(url)) {
        return res.render("new-banner", {
          message: "Banner url must not be empty or contain only spaces",
        });
      }
  
      if (req.file) {
        const image = req.file.filename;
  
        // Process and save the uploaded image using Sharp
        await sharp(req.file.path)
          .resize({ width: 200, height: 200 })
          .toFile(image);
  
        const banner = await new Banner({
          title,
          subtitle,
          url,
          image,
        }).save();
  
        if (banner) {
          console.log('Banner saved');
          return res.render("new-banner", { message: "Banner has been added" });
        }
      } else {
        return res.render("new-banner", { message: "Banner image is required" });
      }
    } catch (error) {
      console.log(error.message);
    }
};
  

const deleteBanner = async(req,res)=>{
    try{
        const id = req.query.id;
        console.log(id);
         await Banner.deleteOne({_id:id})     
         res.redirect('/admin/banner')

    }catch(error){
        console.log(error)
    }
}


const loadBanner = async (req, res) => {
    try {

        const banner = await Banner.find()
        res.render('banner', { banner })
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    loadAddBanner,
    addBanner,
    loadBanner,
    deleteBanner
}
