const express=require("express")
const router=express.Router()
const adminController=require('../../controller/adminController')
const {isAuthenticated,loginAuthentication}=require("../../middleware/adminAuth")
const categoryController=require("../../controller/categoryController")
const productController=require("../../controller/productController")
const upload=require("../../utils/multer")
const { ADMIN_ROUTES } = require("../../constants/routes")

// User Management
router.get(ADMIN_ROUTES.USER_MANAGEMENT,isAuthenticated,adminController.loadUsermanage)
router.get(ADMIN_ROUTES.USER_VIEW,isAuthenticated,adminController.loadUserView)
router.put(ADMIN_ROUTES.USER_BAN,adminController.userBan)

// Category Management
router.get(ADMIN_ROUTES.CATEGORY_MANAGEMENT,isAuthenticated,categoryController.loadCategoryManagement)
router.get(ADMIN_ROUTES.ADD_CATEGORY,isAuthenticated,categoryController.loadAddCategory)
router.get(ADMIN_ROUTES.UPDATE_CATEGORY,isAuthenticated,categoryController.loadUpdateCategory)
router.get(ADMIN_ROUTES.DELETE_CATEGORY,isAuthenticated,categoryController.loadDeleteCategory)
router.post(ADMIN_ROUTES.ADD_CATEGORY,upload.single('categoryImage'),categoryController.addCategory)
router.put(ADMIN_ROUTES.DELETE_CATEGORY,categoryController.deleteCategory)
router.put(ADMIN_ROUTES.REMOVE_CATEGORY_OFFER,categoryController.removeOffer)
router.post(ADMIN_ROUTES.APPLY_CATEGORY_OFFER,categoryController.applyOffer)
router.put(ADMIN_ROUTES.UPDATE_CATEGORY,categoryController.updateCategory)
router.put(ADMIN_ROUTES.RECOVER_CATEGORY,categoryController.recoverCategory)

// Product Management
router.get(ADMIN_ROUTES.PRODUCT_MANAGEMENT,isAuthenticated,productController.loadProductmanage)
router.get(ADMIN_ROUTES.ADD_PRODUCT,isAuthenticated,productController.loadAddProduct)
router.get(ADMIN_ROUTES.DELETE_PRODUCT,isAuthenticated,productController.loadProductDelete)
router.get(ADMIN_ROUTES.UPDATE_PRODUCT,isAuthenticated,productController.loadUpdateProduct)
router.post(ADMIN_ROUTES.ADD_PRODUCT,upload.fields([
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 },
    { name: "productImage4", maxCount: 1 }
  ]),productController.addProduct)
router.put(ADMIN_ROUTES.DELETE_PRODUCT,productController.deleteProduct)
router.put(ADMIN_ROUTES.RECOVER_PRODUCT,productController.recoverProduct)
router.put(ADMIN_ROUTES.UPDATE_PRODUCT,upload.fields([
  { name: "productImage1", maxCount: 1 },
  { name: "productImage2", maxCount: 1 },
  { name: "productImage3", maxCount: 1 },
  { name: "productImage4", maxCount: 1 }
]),productController.updateProduct);
router.put(ADMIN_ROUTES.UPDATE_SIZE_STOCKS, adminController.stockManagement);

// Admin Authentication
router.get(ADMIN_ROUTES.DASHBOARD,isAuthenticated,adminController.loadDashboard)
router.get(ADMIN_ROUTES.DASHBOARD_DATA,isAuthenticated,adminController.loadDashboardData)
router.get(ADMIN_ROUTES.SALES_REPORT,isAuthenticated,adminController.loadSalesReport)
router.get(ADMIN_ROUTES.DOWNLOAD_PDF,isAuthenticated,adminController.downloadPdf)
router.get(ADMIN_ROUTES.DOWNLOAD_EXCEL,isAuthenticated,adminController.downloadExcel)
router.get(ADMIN_ROUTES.LOGIN,loginAuthentication,adminController.loadAdminLogin)
router.post(ADMIN_ROUTES.LOGIN,adminController.loginAdmin)
router.get(ADMIN_ROUTES.LOGOUT,adminController.logout)

//Order Management
router.get(ADMIN_ROUTES.ORDER_MANAGEMENT,isAuthenticated,adminController.loadOrderManagement)
router.get(ADMIN_ROUTES.ORDER_VIEW,isAuthenticated,adminController.loadOrderView)
router.put(ADMIN_ROUTES.PROCESS_RETURN,adminController.proceedReturn)
router.put(ADMIN_ROUTES.PROCESS_ITEM_RETURN,adminController.processItemReturn)
router.put(ADMIN_ROUTES.UPDATE_STATUS,adminController.updateStatus)

//Coupon Management
router.get(ADMIN_ROUTES.COUPON_MANAGEMENT,isAuthenticated,adminController.loadCoupon)
router.get(ADMIN_ROUTES.ADD_COUPON,isAuthenticated,adminController.loadAddCoupon)
router.get(ADMIN_ROUTES.EDIT_COUPON,isAuthenticated,adminController.loadEditCoupon)
router.post(ADMIN_ROUTES.ADD_COUPON,adminController.addCoupon)
router.put(ADMIN_ROUTES.EDIT_COUPON,adminController.editCoupon)
router.get(ADMIN_ROUTES.DELETE_COUPON,isAuthenticated,adminController.deleteCoupon)
module.exports=router