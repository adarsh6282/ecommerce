const  express=require("express")
const router=express.Router()
const userController=require("../../controller/userController")
const passport = require("passport")


router.get("/register",userController.loadRegister)
router.get("/login",userController.loadLogin)
router.post("/login",userController.loginUser)
router.post("/verify",userController.requestOtp)
router.get("/verify",userController.loadVerify)
router.post("/home",userController.registerUser)
router.get("/",userController.loadHome)
router.post("/resend",userController.resendOtp)
router.get("/userban",userController.loaduserBan)
router.get("/myaccount",userController.loadMyAccount)
router.get("/address",userController.loadAddress)
router.get("/address/add/:id",userController.loadAddAddress)
router.post("/address/add/:id",userController.addAddress)
router.get("/updateprofile/:id",userController.loadEditProfile)
router.put("/updateprofile/:id",userController.editProfile)
router.get("/address/edit/:id",userController.loadEditAddress)
router.put("/address/edit/:id",userController.editAddress)
router.get("/address/delete/:id",userController.deleteAddress)
router.get("/productdetail/:id",userController.loadProductDetail)
router.get("/shop",userController.loadShop)
router.get("/cart",userController.loadCart)
router.get('/auth/google',passport.authenticate('google',{scope: ['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/register'}),(req, res) => 
    {
        req.session.user=true
        res.redirect('/');
    }
)

module.exports=router