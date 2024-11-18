function isAuthenticated(req,res,next){
    if(req.session.admin){
       return next()
    }
   return res.redirect("/admin/login")
}

function loginAuthentication(req,res,next){
    if(!req.session.admin){
       return next()
    }
   return res.redirect("/admin/dashboard")
}

module.exports={isAuthenticated,loginAuthentication}