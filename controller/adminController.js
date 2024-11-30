const mongoose=require("mongoose")
const adminSchema=require("../models/adminModel")
const userSchema=require("../models/userModel")
const orderSchema=require("../models/orderModel")
const couponSchema=require("../models/couponModel")

const loadAdminLogin=(req,res)=>{
    res.render("admin-login")
}

const loadDashboard=async(req,res)=>{
    res.render("admin-dashboard")
}

const loadUsermanage = async (req, res) => {
    try {
        // Get the page number and limit from the query parameters, or set defaults
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = 4; // Number of users per page
        const skip = (page - 1) * limit;

        // Fetch users with pagination
        const users = await userSchema.find({ role: "user" })
            .skip(skip)
            .limit(limit);

        // Get the total count of users to calculate the total number of pages
        const totalUsers = await userSchema.countDocuments({ role: "user" });
        const totalPages = Math.ceil(totalUsers / limit);

        if (!users || users.length === 0) {
            return res.render("admin-usermanagement", { message: "No users found", user: [], currentPage: page, totalPages });
        }

        // Pass users and pagination data to the EJS template
        return res.render("admin-usermanagement", {
            user: users,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error("Error while loading users:", error);
        res.status(500).send("Internal Server Error");
    }
};


const loginAdmin=async(req,res)=>{
    const {email,password}=req.body
    
    try {
        const admin=await userSchema.findOne({email:email,password:password,role:"admin"})
        if(admin){
            req.session.admin=true
            res.redirect("/admin/dashboard")
        }else{
            return res.render("admin-login",{message:"admin not found"})
        }
        
    } catch (error) {
        console.log(error)
    }
}

const userBan = async (req, res) => {
    try {
        const email = req.query.email;

        const user = await userSchema.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isDeleted = !user.isDeleted;
        await user.save();

        const status = user.isDeleted ? 'banned' : 'unbanned';
        return res.status(200).json({ message: `User ${status} successfully`,isDeleted:user.isDeleted});
    } catch (error) {
        console.error('Error banning/unbanning user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const loadUserView = async (req, res) => {
    try {
        const {email}=req.query;
        
        const user = await userSchema.findOne({ email:email });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('Error fetching user information:', error.message);
        res.status(500).json({ message: 'Error fetching user information' });
      }
    };

    const loadOrderManagement = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; // Default to page 1
            const limit = 4; // Number of orders per page
            const skip = (page - 1) * limit;
    
            // Fetch orders with pagination and populate the user details
            const orders = await orderSchema.find()
                .skip(skip)
                .limit(limit)
                .populate("userId");
    
            // Get the total count of orders to calculate the total number of pages
            const totalOrders = await orderSchema.countDocuments();
            const totalPages = Math.ceil(totalOrders / limit);
    
            // Add quantity (orderItems length) to each order
            orders.forEach(order => {
                order.quantity = order.orderItems.length;
            });
    
            if (!orders || orders.length === 0) {
                return res.render("orderManagement", { message: "No orders found", orders, quantity: [], currentPage: page, totalPages });
            }
    
            // Render the order management page with orders and pagination data
            res.render("orderManagement", {
                orders,
                quantity: orders.map(order => order.quantity),
                currentPage: page,
                totalPages
            });
        } catch (error) {
            console.error("Error loading orders:", error);
            res.status(500).send("Internal Server Error");
        }
    };
       

    const loadOrderView= async (req, res) => {
        const id=req.params.id
        const order=await orderSchema.findById(id).populate("userId").populate({path:"orderItems.productId"}).populate("addressId")
        if(!order){
            return res.status(404).json({success:false,message:"Order not found"})
        }
        res.render("orderView",{order})
    }

    const updateStatus= async (req, res) => {
        const orderId=req.params.id
        const {status}=req.body
        try {
            const order=await orderSchema.findByIdAndUpdate(orderId, {status:status}, {new: true})

            if(!order){
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            return res.status(200).json({ success: true, message: 'Successfully updated status', status:order.status });
        } catch (error) {
            console.error('Error updating status:', error);
            res.status(500).json({ success:false, message: 'Internal Server Error' });
        }
    }

    const loadCoupon=async(req,res) => {
        try {
            const coupons=await couponSchema.find({})
            if(!coupons){
                return res.render("couponManagement",{message:"no coupons found"})
            }
            return res.render("couponManagement",{coupons})
        } catch (error) {
            console.error("error while loading coupons",error)
        }
    }

    const loadAddCoupon=async(req,res)=>{
        try {
            return res.render('addCoupon')
        } catch (error) {
            console.error(error)
        }
    }

    const addCoupon=async(req,res)=>{
        try{
            const{code,discount,minpurchase,maxdiscount,expire,maxcount}=req.body
            const existingCoupon = await couponSchema.findOne({ code });
        if (existingCoupon) {
            return res.status(409).json({ success: false, message: "Coupon code already exists." });
        }

        const newCoupon = new couponSchema({
            code:code,
            discount:discount,
            expirationDate:expire,
            minPurchase:minpurchase,
            maxDiscount:maxdiscount,
            isActive: true,
            maxCount:maxcount,
            usedCount: 0,
            createdAt: new Date()
        });

       const savedCoupon= await newCoupon.save();

        res.status(201).json({ success: true, message: "Coupon created successfully.", coupon: savedCoupon });
    } catch (error) {
        console.error("Error adding coupon:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};


const deleteCoupon = async (req, res) => {
    try {
        console.log("deleting coupon");
        const couponId = req.params.id;
        console.log(couponId);
        
        const deletedCoupon = await couponSchema.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.redirect("/admin/couponmanagement");
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error deleting coupon" });
    }
};


module.exports={
    loadAdminLogin,
    loadUsermanage,
    loginAdmin,
    loadDashboard,
    userBan,
    loadUserView,
    loadOrderManagement,
    loadOrderView,
    updateStatus,
    loadCoupon,
    loadAddCoupon,
    addCoupon,
    deleteCoupon
}