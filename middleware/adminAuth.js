const isLogin = async (req, res, next) => {
    try {
      if (req.session.admin_id) {
       
        
      } else {
        
        return  res.redirect('/admin');
      }
      next();
    } catch (error) {
      console.error(error.message);
      
    }
  };
  
  const isLogout = async (req, res, next) => {
    try {
      if (req.session.admin_id) {
        return res.redirect('/admin/dashboard');
      }
  
      next();
    } catch (error) {
      console.log(error.message);
    }
  };
  
  
  



module.exports = {
    isLogin,
    isLogout
}









// const isLogin = async(req,res,next)=>{

//     try{

//         if(req.session.user_id){

//         }else{

//             res.redirect('/admin')
//         }
//         next();

//     }catch(error){
//         console.log(error.message)
//     }
// }

// const isLogout = async(req,res,next)=>{

//     try{

//         if(req.session.user_id){

//             res.redirect('/admin/dashboard')

//         }
//         next();

//     }catch(error){
//         console.log(error.message)
//     }
// }

// module.exports = {
//     isLogin,
//     isLogout
// }
