const express=require("express")
const router=express.Router()
const adminController=require('../../controller/adminController')
const {isAuthenticated,loginAuthentication}=require("../../middleware/adminAuth")
const categoryController=require("../../controller/categoryController")
const productController=require("../../controller/productController")
const upload=require("../../utils/multer")

// User Management
router.get("/usermanagement",isAuthenticated,adminController.loadUsermanage)
router.get("/usermanagement/view",isAuthenticated,adminController.loadUserView)
router.put("/usermanagement/ban",adminController.userBan)

// Category Management
router.get("/categorymanagement",isAuthenticated,categoryController.loadCategoryManagement)
router.get("/categorymanagement/add",isAuthenticated,categoryController.loadAddCategory)
router.get("/categorymanagement/update/:id",isAuthenticated,categoryController.loadUpdateCategory)
router.get("/categorymanagement/delete",isAuthenticated,categoryController.loadDeleteCategory)
router.post("/categorymanagement/add",upload.single('categoryImage'),categoryController.addCategory)
router.put("/categorymanagement/delete",categoryController.deleteCategory)
router.put("/categorymanagement/update/:id",categoryController.updateCategory)
router.put("/categorymanagement/recover",categoryController.recoverCategory)

// Product Management
router.get("/productmanagement",isAuthenticated,productController.loadProductmanage)
router.get("/productmanagement/add",isAuthenticated,productController.loadAddProduct)
router.get("/productmanagement/delete",isAuthenticated,productController.loadProductDelete)
router.get("/productmanagement/update/:id",isAuthenticated,productController.loadUpdateProduct)
router.post("/productmanagement/add",upload.fields([
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 },
    { name: "productImage4", maxCount: 1 }
  ]),productController.addProduct)
router.put("/productmanagement/delete",productController.deleteProduct)
router.put("/productmanagement/recover",productController.recoverProduct)
router.put("/productmanagement/update/:id",upload.fields([
  { name: "productImage1", maxCount: 1 },
  { name: "productImage2", maxCount: 1 },
  { name: "productImage3", maxCount: 1 },
  { name: "productImage4", maxCount: 1 }
]),productController.updateProduct)

// Admin Authentication
router.get("/dashboard",isAuthenticated,adminController.loadDashboard)
router.get("/login",loginAuthentication,adminController.loadAdminLogin)
router.post("/login",adminController.loginAdmin)


module.exports=router