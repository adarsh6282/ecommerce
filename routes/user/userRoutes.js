const  express=require("express")
const router=express.Router()
const userController=require("../../controller/userController")
const passport = require("passport")


router.get("/register",userController.loadRegister)
router.get("/login",userController.loadLogin)
router.post("/login",userController.loginUser)
router.post("/requestotp",userController.requestOtp)
router.get("/verify",userController.loadVerify)
router.get("/forgotpassword",userController.loadForgotPassword)
router.post("/verify",userController.registerUser);
router.get("/",userController.loadHome)
router.post("/resend",userController.resendOtp)
router.get("/userban",userController.loaduserBan)
router.get("/myaccount",userController.loadMyAccount)
router.get("/address",userController.loadAddress)
router.get("/address/add/:id",userController.loadAddAddress)
router.post("/address/add/:id",userController.addAddress)
router.get("/checkaddress/add/:id",userController.loadCheckoutAddAddress)
router.post("/checkaddress/add/:id",userController.checkoutaddAddress)
router.get("/updateprofile/:id",userController.loadEditProfile)
router.put("/updateprofile/:id",userController.editProfile)
router.get("/address/edit/:id",userController.loadEditAddress)
router.get("/checkaddress/edit/:id",userController.loadCheckoutEditAddress)
router.put("/address/edit/:id",userController.editAddress)
router.put("/checkaddress/edit/:id",userController.checkouteditAddress)
router.get("/address/delete/:id",userController.deleteAddress)
router.get("/productdetail/:id",userController.loadProductDetail)
router.get("/shop",userController.loadShop)
router.get("/cart",userController.loadCart)
router.delete("/cart/remove",userController.removeFromCart)
router.delete("/wishlist/remove",userController.removeFromWishlist)
router.post("/addtocart",userController.addToCart)
router.get("/checkout",userController.loadCheckout)
router.post("/placeorder",userController.placeOrder)
router.post("/razorpayorder",userController.razorPayOrder)
router.post("/verifypayment",userController.verifyPayment)
router.post("/applycoupon",userController.applyCoupon)
router.get('/auth/google',passport.authenticate('google',{scope: ['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/register'}),(req, res) => 
    {
        req.session.user=true
        res.redirect('/');
    }
)
router.get("/ordercomplete",userController.loadOrderComplete)
router.get("/myaccountorder",userController.loadOrder)
router.get("/userorderview/:id",userController.loadOrderView)
router.put("/cancelorder/:id",userController.cancelOrder)
router.put('/returnorder/:id',userController.returnOrder);
router.get("/wishlist",userController.loadWishlist)
router.post("/wishlist/add",userController.addToWishlist)
router.get("/wallet",userController.loadWallet)
router.get("/logout",userController.logout)

module.exports=router                                                                                                                                                                                                                                                                                                                                                                                       