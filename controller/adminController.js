const mongoose=require("mongoose")
const adminSchema=require("../models/adminModel")
const userSchema=require("../models/userModel")
const orderSchema=require("../models/orderModel")
const couponSchema=require("../models/couponModel")
const productSchema=require("../models/productModel")
const walletSchema=require("../models/walletModel")
const ejs=require("ejs")
const moment = require('moment');

const loadAdminLogin=(req,res)=>{
    res.render("admin-login")
}

const loadDashboard = async (req, res) => {
  try {
    const totalSales = await orderSchema.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
    ]);
    const totalOrders = await orderSchema.countDocuments();
    const totalUsers = await userSchema.countDocuments();
    const totalProducts = await productSchema.countDocuments();

    const productsSold = await orderSchema.aggregate([
      { $unwind: "$orderItems" },
      { $group: { _id: "$orderItems.productId", quantity: { $sum: "$orderItems.quantity" } } },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
      { $unwind: "$productDetails" },
      { $project: { productName: "$productDetails.name", quantity: 1 } }
    ]);

    return res.render("admin-dashboard", {
      totalSales: totalSales[0]?.totalSales || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      productsSold,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Failed to load dashboard");
  }
};

const loadDashboardData = async (req, res) => {
  try {
    let matchCondition = {};
    const { startDate, endDate, period } = req.query;
    console.log(startDate, endDate, period)

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    
      matchCondition.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    switch (period) {
      case 'daily':
        matchCondition.createdAt = {
          $gte: moment().startOf('day').toDate(),
          $lte: moment().endOf('day').toDate()
        };
        break;
        case 'weekly':
          const startOfWeek = moment().startOf('week').toDate();
          const endOfWeek = moment().endOf('day').toDate();
          matchCondition.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
          break;
      
          case 'monthly':
            const startOfMonth = moment().startOf('month').toDate();
            const endOfMonth = moment().endOf('month').toDate();
            matchCondition.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
            break;
                        
      case 'yearly':
        matchCondition.createdAt = {
          $gte: moment().startOf('year').toDate(),
          $lte: moment().endOf('year').toDate()
        };
        break;
      default:
        matchCondition.createdAt = {
          $gte: moment().startOf('year').toDate(),
          $lte: moment().endOf('year').toDate() 
        };
        break;
    }

    const productsSold = await orderSchema.aggregate([
      { $match: matchCondition },
      { $unwind: "$orderItems" },
      { 
        $group: { 
          _id: "$orderItems.productId", 
          totalProductsSold: { $sum: "$orderItems.quantity" } 
        } 
      },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
      { $unwind: "$productDetails" },
      { $project: { 
          productName: "$productDetails.name", 
          quantity: "$totalProductsSold" 
        } 
      },
      { $sort: { "productName": 1 } }
    ]);

    const totalSales = await orderSchema.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
    ]);
    const totalOrders = await orderSchema.countDocuments(matchCondition);
    const totalUsers = await userSchema.countDocuments();
    const totalProducts = await productSchema.countDocuments();

    return res.json({
      totalSales: totalSales[0]?.totalSales || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      productsSold,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Failed to fetch data");
  }
};

const loadSalesReport = async (req, res) => {
  if(!req.session.admin){
    return res.redirect("/admin/login")
  }
  try {
    const { startDate, endDate } = req.query;

    let orders = [];
    let totalSales = 0;
    let totalDiscounts = 0;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      orders = await orderSchema.find(
        { createdAt: { $gte: start, $lte: end } },
        'orderId createdAt totalAmount'
      );

      const salesData = await orderSchema.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ]);
      totalSales = salesData[0]?.totalSales || 0;

      totalDiscounts = 0;
    }

    res.render('salesreport', {
      orders,
      totalSales,
      totalDiscounts,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Error loading sales report:", error);
    res.status(500).send("Failed to load sales report");
  }
};



const salesReport=async(req, res) => {
  if(!req.session.admin){
    return res.redirect("/admin/login")
  }
  try {
    const { startDate, endDate } = req.query;
    let matchCondition = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      matchCondition.createdAt = { $gte: start, $lte: end };
    }

    const orders = await orderSchema.find(matchCondition, 'orderId createdAt totalAmount');
    const totalSales = await orderSchema.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
    ]);
    const totalDiscounts = 0;

    res.render('salesreport', {
      orders,
      totalSales: totalSales[0]?.totalSales || 0,
      totalDiscounts,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Error loading sales report:", error);
    res.status(500).send("Failed to load sales report");
  }
}


const downloadPdf=async(req,res)=>{
  if(!req.session.admin){
    return res.redirect("/admin/login")
  }
  try {
    const { startDate, endDate } = req.query;
    let matchCondition = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      matchCondition.createdAt = { $gte: start, $lte: end };
    }

    const orders = await orderSchema.find(matchCondition).populate('userId', 'username').populate('orderItems.productId', 'name price').exec();
    const totalSales = await orderSchema.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
    ]);

    const totalDiscounts = 0;

    const html = await ejs.renderFile('views/salesreport.ejs', {
      orders,
      totalSales: totalSales[0]?.totalSales || 0,
      totalDiscounts,
      startDate,
      endDate,
    });

    const pdf = require('html-pdf');
    pdf.create(html).toStream((err, stream) => {
      if (err) return res.status(500).send("PDF generation failed");
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="salesreport.pdf"',
      });
      stream.pipe(res);
    });
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).send("Failed to download PDF");
  }
}

const downloadExcel=async(req,res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchCondition = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      matchCondition.createdAt = { $gte: start, $lte: end };
    }

    const orders = await orderSchema.find(matchCondition, 'orderId createdAt totalAmount');

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Order Date', key: 'createdAt', width: 20 },
      { header: 'Amount', key: 'totalAmount', width: 15 },
    ];

    orders.forEach(order => {
      worksheet.addRow({
        orderId: order.id,
        createdAt: order.createdAt.toLocaleDateString(),
        totalAmount: order.totalAmount,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error downloading Excel:", error);
    res.status(500).send("Failed to download Excel");
  }
}
  

const loadUsermanage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4; 
        const skip = (page - 1) * limit;

        const users = await userSchema.find({ role: "user" }).skip(skip).limit(limit);

        const totalUsers = await userSchema.countDocuments({ role: "user" });
        const totalPages = Math.ceil(totalUsers / limit);

        if (!users || users.length === 0) {
            return res.render("admin-usermanagement", { message: "No users found", user: [], currentPage: page, totalPages });
        }

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
            const page = parseInt(req.query.page) || 1;
            const limit = 4;
            const skip = (page - 1) * limit;

            const orders = await orderSchema.find().sort({createdAt:-1}).skip(skip).limit(limit).populate("userId");

            const totalOrders = await orderSchema.countDocuments();
            const totalPages = Math.ceil(totalOrders / limit);
    
            orders.forEach(order => {
                order.quantity = order.orderItems.length;
            });
    
            if (!orders || orders.length === 0) {
                return res.render("orderManagement", { message: "No orders found", orders, quantity: [], currentPage: page, totalPages });
            }

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


    const updateStatus = async (req, res) => {
      const orderId = req.params.id;
      const { status } = req.body;
  
      try {
          const order = await orderSchema.findById(orderId);
  
          if (!order) {
              return res.status(404).json({ success: false, message: 'Order not found' });
          }
  
          if (order.paymentMethod === "COD" && status === "Delivered") {
              order.status = status;
              order.paymentStatus = "Completed";
          } else {
              order.status = status;
          }
          if(order.status === "Delivered") {
            order.orderItems.forEach(item => {
              item.itemStatus = "Delivered";
          });
          }
          await order.save();
  
          return res.status(200).json({
              success: true,
              message: 'Successfully updated status',
              status: order.status,
              paymentStatus: order.paymentStatus
          });
      } catch (error) {
          console.error('Error updating status:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
  };
  

  const loadCoupon = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;
  
      const totalCoupons = await couponSchema.countDocuments();
      const coupons = await couponSchema.find({}).skip(skip).limit(limit);
  
      if (!coupons.length) {
        return res.render("couponManagement", {
          message: "No coupons found",
          coupons: [],
          currentPage: page,
          totalPages: Math.ceil(totalCoupons / limit),
        });
      }
  
      return res.render("couponManagement", {
        coupons,
        currentPage: page,
        totalPages: Math.ceil(totalCoupons / limit),
      });
    } catch (error) {
      console.error("Error while loading coupons:", error);
      return res.status(500).render("couponManagement", { message: "An error occurred." });
    }
  };
  

    const loadAddCoupon=async(req,res)=>{
        try {
            return res.render('addCoupon')
        } catch (error) {
            console.error(error)
        }
    }

    const loadEditCoupon=async(req,res)=>{
       const {id}=req.params
       const coupon=await couponSchema.findById(id)
       if(!coupon){
           return res.status(404).json({success:false,message:"Coupon not found"})
       }
       return res.render('editCoupon',{coupon})
    }

    const editCoupon=async(req,res)=>{
      const {id}=req.params
      const {code,discount,minpurchase,maxdiscount,expire,maxcount}=req.body

      try{

      const coupon=await couponSchema.findById(id)
      if(!coupon){
        return res.status(404).json({success:false,message:"Coupon not found"})
      }
       coupon.code=code
       coupon.discount=discount
       coupon.minPurchase=minpurchase
       coupon.maxDiscount=maxdiscount
       coupon.expirationDate=expire
       coupon.maxCount=maxcount

       await coupon.save()
      return res.status(200).json({success:true,message:"Coupon updated successfully"})
    }catch(error)
    {
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


const proceedReturn = async (req, res) => {
  console.log("proceeding")
  try {
    const { id } = req.params;
    const { action } = req.body; 

    const order = await orderSchema.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.refundStatus !== "Requested") {
      return res.status(400).json({
        success: false,
        message: "Refund has already been processed or is not requested.",
      });
    }

    if (action === "approve") {
      order.refundStatus = "Approved";
      order.orderItems.forEach(item =>{
        item.itemStatus = "Approved";
      })
      order.orderItems.forEach(item => {
        item.itemStatus = "Returned";
      })
      order.status = "Returned";
      

      const wallet = await walletSchema.findOne({ userId: order.userId });

      if (wallet) {
        wallet.balance += order.totalAmount;
        wallet.transactions.push({
          amount: order.totalAmount,
          type: "Credit",
          description: `Refund for returned products in order ${order._id}`,
        });

        wallet.updatedAt = new Date();

        await wallet.save();
      } else {
        const newWallet = new walletSchema({
          userId: order.userId,
          balance: order.totalAmount,
          transactions: [
            {
              amount: order.totalAmount,
              type: "Credit",
              description: `Refund for returned products in order ${order._id}`,
            },
          ],
        });

        await newWallet.save();
      }

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Return approved and refund processed successfully.",
        order,
      });
    }

    else if (action === "reject") {
      order.refundStatus = "Rejected";
      order.status = "Delivered";

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Return request has been rejected.",
        order,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action specified. Use 'approve' or 'reject'.",
      });
    }
  } catch (error) {
    console.error("Error processing return:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};

const processItemReturn = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id + "sjhdncsdnc");
    const { action, items } = req.body;
    console.log(action, items);

    const order = await orderSchema.findById(id).lean();
    console.log(order.orderItems);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let totalRefundAmount = 0;

    const productIds = order.orderItems.map(item => item.productId);
    const products = await productSchema.find({ '_id': { $in: productIds } }).lean();

    const productMap = products.reduce((acc, product) => {
      acc[product._id.toString()] = product;
      return acc;
    }, {});

    for (let itemId of items) {
      const item = order.orderItems.find(item => item.productId.toString() === itemId);
      console.log(itemId, item ? item.productId : null);
      console.log(item);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item with ID ${itemId} not found in the order.`,
        });
      }

      const product = productMap[item.productId.toString()];

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found.`,
        });
      }

      if (action === "approve") {
        if (item.itemStatus === "Requested") {
          item.refundStatus = "Approved";
          item.itemStatus = "Returned";
          totalRefundAmount += product.offerPrice;
        } else {
          return res.status(400).json({
            success: false,
            message: `Item with ID ${itemId} cannot be approved as it is already ${item.itemStatus}.`,
          });
        }
      } else if (action === "reject") {
        if (item.itemStatus === "Requested") {
          item.refundStatus = "Rejected";
          item.itemStatus = "Rejected";
        } else {
          return res.status(400).json({
            success: false,
            message: `Item with ID ${itemId} cannot be rejected as it is already ${item.itemStatus}.`,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid action specified. Use 'approve' or 'reject'.",
        });
      }
    }

    const allItemsProcessed = order.orderItems.every(
      item => item.refundStatus === "Approved" || item.refundStatus === "Rejected"
    );
    if (allItemsProcessed) {
      order.status = "Returned";
    } else {
      order.status = "Delivered";
    }

    order.refundStatus = totalRefundAmount > 0 ? "Returned" : "Rejected";

    await orderSchema.findByIdAndUpdate(id, {
      status: order.status,
      refundStatus: order.refundStatus,
      orderItems: order.orderItems,
    }, { new: true });

    if (totalRefundAmount > 0) {
      const wallet = await walletSchema.findOne({ userId: order.userId });

      if (wallet) {
        wallet.balance += totalRefundAmount;
        wallet.transactions.push({
          amount: totalRefundAmount,
          type: "Credit",
          description: `Refund for returned products in order ${order._id}`,
        });
        wallet.updatedAt = new Date();

        await wallet.save();
      } else {
        const newWallet = new walletSchema({
          userId: order.userId,
          balance: totalRefundAmount,
          transactions: [
            {
              amount: totalRefundAmount,
              type: "Credit",
              description: `Refund for returned products in order ${order._id}`,
            },
          ],
        });

        await newWallet.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Return request processed successfully. ${
        totalRefundAmount > 0 ? `Refund of ${totalRefundAmount} added to your wallet.` : ''
      }`,
      order,
    });
  } catch (error) {
    console.error("Error processing return:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the return. Please try again later.",
    });
  }
};

module.exports={
    loadAdminLogin,
    loadUsermanage,
    loginAdmin,
    loadDashboard,
    loadDashboardData,
    loadSalesReport,
    salesReport,
    downloadPdf,
    downloadExcel,
    userBan,
    loadUserView,
    loadOrderManagement,
    loadOrderView,
    updateStatus,
    loadCoupon,
    loadAddCoupon,
    loadEditCoupon,
    addCoupon,
    editCoupon,
    deleteCoupon,
    proceedReturn,
    processItemReturn
}