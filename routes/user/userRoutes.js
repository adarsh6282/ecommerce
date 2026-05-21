const  express=require("express")
const router=express.Router()
const userController=require("../../controller/userController")
const passport = require("passport")
const {USER_ROUTES} = require("../../constants/routes")

router.get(USER_ROUTES.REGISTER,userController.loadRegister)
router.get("/health",userController.getHealth)
router.get(USER_ROUTES.LOGIN,userController.loadLogin)
router.post(USER_ROUTES.LOGIN,userController.loginUser)
router.post(USER_ROUTES.REQUEST_OTP,userController.requestOtp)
router.post(USER_ROUTES.RESEND_OTP,userController.resendOtp)
router.get(USER_ROUTES.VERIFY,userController.loadVerify)
router.get(USER_ROUTES.FORGOT_PASSWORD,userController.loadForgotPassword)
router.post(USER_ROUTES.FORGOT_PASSWORD,userController.forgotPassword)
router.get(USER_ROUTES.FORGOT_VERIFY,userController.loadForgotVerify)
router.post(USER_ROUTES.FORGOT_VERIFY,userController.forgotVerify)
router.post(USER_ROUTES.SUBMIT_PASSWORD,userController.forgotSuccess)
router.post(USER_ROUTES.VERIFY,userController.registerUser);
router.get(USER_ROUTES.HOME,userController.loadHome)
router.get(USER_ROUTES.USER_BAN,userController.loaduserBan)
router.get(USER_ROUTES.MY_ACCOUNT,userController.loadMyAccount)
router.get(USER_ROUTES.ADDRESS,userController.loadAddress)
router.get(USER_ROUTES.ADD_ADDRESS,userController.loadAddAddress)
router.post(USER_ROUTES.ADD_ADDRESS,userController.addAddress)
router.get(USER_ROUTES.CHECKOUT_ADD_ADDRESS,userController.loadCheckoutAddAddress)
router.post(USER_ROUTES.CHECKOUT_ADD_ADDRESS,userController.checkoutaddAddress)
router.get(USER_ROUTES.UPDATE_PROFILE,userController.loadEditProfile)
router.patch(USER_ROUTES.UPDATE_PROFILE,userController.editProfile)
router.get(USER_ROUTES.UPDATE_PASSWORD,userController.loadUpdatePassword)
router.post(USER_ROUTES.UPDATE_PASSWORD,userController.updatePassword)
router.get(USER_ROUTES.EDIT_ADDRESS,userController.loadEditAddress)
router.get(USER_ROUTES.CHECKOUT_EDIT_ADDRESS,userController.loadCheckoutEditAddress)
router.put(USER_ROUTES.EDIT_ADDRESS,userController.editAddress)
router.put(USER_ROUTES.CHECKOUT_EDIT_ADDRESS,userController.checkouteditAddress)
router.get(USER_ROUTES.DELETE_ADDRESS,userController.deleteAddress)
router.get(USER_ROUTES.PRODUCT_DETAIL,userController.loadProductDetail)
router.get(USER_ROUTES.SHOP,userController.loadShop)
router.get(USER_ROUTES.CART,userController.loadCart)
router.delete(USER_ROUTES.REMOVE_CART,userController.removeFromCart)
router.delete(USER_ROUTES.REMOVE_WISHLIST,userController.removeFromWishlist)
router.post(USER_ROUTES.ADD_TO_CART,userController.addToCart)
router.post(USER_ROUTES.UPDATE_CART,userController.updateCart)
router.post(USER_ROUTES.WISHLIST_TO_CART,userController.wishlistToCart)
router.get(USER_ROUTES.CHECKOUT,userController.loadCheckout)
router.post(USER_ROUTES.PLACE_ORDER,userController.placeOrder)
router.post(USER_ROUTES.RAZORPAY_ORDER,userController.razorPayOrder)
router.put(USER_ROUTES.RETRY_PAYMENT,userController.retryPayment)
router.post(USER_ROUTES.VERIFY_PAYMENT,userController.verifyPayment)
router.get(USER_ROUTES.COUPON,userController.getCoupons)
router.post(USER_ROUTES.APPLY_COUPON,userController.applyCoupon)
router.post(USER_ROUTES.REMOVE_COUPON,userController.removeCoupon)
router.get(USER_ROUTES.GOOGLE_AUTH,passport.authenticate('google',{scope: ['profile','email']}));
router.get(USER_ROUTES.GOOGLE_CALLBACK,passport.authenticate('google',{failureRedirect:'/register'}), async (req, res) => {
    try {
        const user = req.user;
        req.session.user = true;
        req.session.userData = {
            email: user.email,
            isDeleted: user.isDeleted || false,
        };
        res.redirect('/');
    } catch (error) {
        console.error("Error during Google login:", error);
        res.redirect('/login');
    }
});
router.get(USER_ROUTES.ORDER_COMPLETE,userController.loadOrderComplete)
router.get(USER_ROUTES.MY_ORDERS,userController.loadOrder)
router.get(USER_ROUTES.ORDER_VIEW,userController.loadOrderView)
router.put(USER_ROUTES.CANCEL_ORDER,userController.cancelOrder)
router.post(USER_ROUTES.CANCEL_ITEM,userController.cancelOrderItem)
router.post(USER_ROUTES.REQUEST_RETURN,userController.requestReturn);
router.post(USER_ROUTES.REQUEST_ITEM_RETURN,userController.requestItemReturn);
router.get(USER_ROUTES.WISHLIST,userController.loadWishlist)
router.post(USER_ROUTES.ADD_WISHLIST,userController.addToWishlist)
router.get(USER_ROUTES.WALLET,userController.loadWallet)
router.get(USER_ROUTES.DOWNLOAD_RECEIPT,userController.downloadReceipt)
router.get(USER_ROUTES.LOGOUT,userController.logout)

module.exports=router                                                                                                                                                                                                                                                                                                                                                               