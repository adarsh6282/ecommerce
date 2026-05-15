const USER_ROUTES = {
    REGISTER: "/register",
    LOGIN: "/login",
    REQUEST_OTP: "/requestotp",
    RESEND_OTP: "/resend",
    VERIFY: "/verify",

    FORGOT_PASSWORD: "/forgotpassword",
    FORGOT_VERIFY: "/forgotverify",
    SUBMIT_PASSWORD: "/submitpassword",

    HOME: "/",
    USER_BAN: "/userban",

    MY_ACCOUNT: "/myaccount",

    ADDRESS: "/address",
    ADD_ADDRESS: "/address/add/:id",
    CHECKOUT_ADD_ADDRESS: "/checkaddress/add/:id",

    UPDATE_PROFILE: "/updateprofile/:id",
    UPDATE_PASSWORD: "/updatepassword/:id",

    EDIT_ADDRESS: "/address/edit/:id",
    CHECKOUT_EDIT_ADDRESS: "/checkaddress/edit/:id",

    DELETE_ADDRESS: "/address/delete/:id",

    PRODUCT_DETAIL: "/productdetail/:id",
    SHOP: "/shop",

    CART: "/cart",
    REMOVE_CART: "/cart/remove",

    WISHLIST: "/wishlist",
    REMOVE_WISHLIST: "/wishlist/remove",
    ADD_WISHLIST: "/wishlist/add",

    ADD_TO_CART: "/addtocart",
    UPDATE_CART: "/updatecart",
    WISHLIST_TO_CART: "/wishtocart",

    CHECKOUT: "/checkout",

    PLACE_ORDER: "/placeorder",
    RAZORPAY_ORDER: "/razorpayorder",
    RETRY_PAYMENT: "/retrypayment/:orderId",
    VERIFY_PAYMENT: "/verifypayment",

    COUPON: "/coupon",
    APPLY_COUPON: "/applycoupon",
    REMOVE_COUPON: "/removecoupon",

    GOOGLE_AUTH: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",

    ORDER_COMPLETE: "/ordercomplete",
    MY_ORDERS: "/myaccountorder",
    ORDER_VIEW: "/userorderview/:id",

    CANCEL_ORDER: "/cancelorder/:id",
    CANCEL_ITEM: "/cancelitem/:orderId/:productId",

    REQUEST_RETURN: "/requestreturn",
    REQUEST_ITEM_RETURN: "/requestitemreturn",

    WALLET: "/wallet",

    DOWNLOAD_RECEIPT: "/download/:id",

    LOGOUT: "/logout"
};

const ADMIN_ROUTES = {

    LOGIN: "/login",
    LOGOUT: "/logout",

    DASHBOARD: "/dashboard",
    DASHBOARD_DATA: "/dashboard/data",

    SALES_REPORT: "/salesreport",
    DOWNLOAD_PDF: "/downloadpdf",
    DOWNLOAD_EXCEL: "/downloadexcel",

    USER_MANAGEMENT: "/usermanagement",
    USER_VIEW: "/usermanagement/view",
    USER_BAN: "/usermanagement/ban",

    CATEGORY_MANAGEMENT: "/categorymanagement",
    ADD_CATEGORY: "/categorymanagement/add",
    UPDATE_CATEGORY: "/categorymanagement/update/:id",
    DELETE_CATEGORY: "/categorymanagement/delete",
    RECOVER_CATEGORY: "/categorymanagement/recover",
    REMOVE_CATEGORY_OFFER: "/categorymanagement/remove-offer/:catId",
    APPLY_CATEGORY_OFFER: "/applyoffer/:currentCategoryId",

    PRODUCT_MANAGEMENT: "/productmanagement",
    ADD_PRODUCT: "/productmanagement/add",
    UPDATE_PRODUCT: "/productmanagement/update/:id",
    DELETE_PRODUCT: "/productmanagement/delete",
    RECOVER_PRODUCT: "/productmanagement/recover",
    UPDATE_SIZE_STOCKS: "/updatesizestocks/:id",

    ORDER_MANAGEMENT: "/ordermanagement",
    ORDER_VIEW: "/orderview/:id",
    PROCESS_RETURN: "/processreturn/:id",
    PROCESS_ITEM_RETURN: "/processitemreturn/:id",
    UPDATE_STATUS: "/updatestatus/:id",

    COUPON_MANAGEMENT: "/couponmanagement",
    ADD_COUPON: "/couponmanagement/add",
    EDIT_COUPON: "/couponmanagement/edit/:id",
    DELETE_COUPON: "/couponmanagement/delete/:id"

};

module.exports = {
    USER_ROUTES,
    ADMIN_ROUTES
};