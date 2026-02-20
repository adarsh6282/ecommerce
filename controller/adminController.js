const mongoose=require("mongoose")
const adminSchema=require("../models/adminModel")
const userSchema=require("../models/userModel")
const orderSchema=require("../models/orderModel")
const couponSchema=require("../models/couponModel")
const productSchema=require("../models/productModel")
const walletSchema=require("../models/walletModel")
const ejs=require("ejs")
const pdf = require('html-pdf');
const ExcelJS = require('exceljs');
const moment = require('moment');
const pdfDocument=require("pdfkit")
const path=require("path")
const { httpStatus } = require("../constants/httpStatus")


const loadAdminLogin=(req,res)=>{
    res.render("admin-login",{message:null})
}

const loadDashboard = async (req, res) => {
  try {
    const totalSales = await orderSchema.aggregate([
      { $match: { paymentStatus:"Completed" } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
    ]);
    const totalOrders = await orderSchema.countDocuments();
    const totalUsers = await userSchema.countDocuments();
    const totalProducts = await productSchema.countDocuments();

    const productsSold = await orderSchema.aggregate([
      { $unwind: "$orderItems" },
      { $group: { _id: "$orderItems.productId", quantity: { $sum: "$orderI  ty" } } },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
      { $unwind: "$productDetails" },
      { $project: { productName: "$productDetails.name", quantity: 1 } }
    ])

    const categoriesSold = await orderSchema.aggregate([
      { $unwind: "$orderItems" },
      { $lookup: {from: "products",localField: "orderItems.productId",foreignField: "_id",as: "productDetails"}},
      { $unwind: "$productDetails" },
      { $lookup: {from: "categories",localField: "productDetails.category",foreignField: "_id",as: "categoryDetails"}},
      { $unwind: "$categoryDetails" },
      { $group: { _id: "$categoryDetails._id",categoryName: { $first: "$categoryDetails.name" }, quantity: { $sum: "$orderItems.quantity" } }},
      { $project: {categoryName: 1,quantity: 1}}
    ])
    
      return res.render("admin-dashboard", {
      totalSales: totalSales[0]?.totalSales || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      productsSold,
      categoriesSold
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Failed to load dashboard");
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

    const categoriesSold = await orderSchema.aggregate([
      {$match:{...matchCondition}},
      { $unwind: "$orderItems" },
      { $lookup: {from: "products",localField: "orderItems.productId",foreignField: "_id",as: "productDetails"}},
      { $unwind: "$productDetails" },
      { $lookup: {from: "categories",localField: "productDetails.category", foreignField: "_id",as: "categoryDetails"}},
      { $unwind: "$categoryDetails" },
      { $group: { _id: "$categoryDetails._id",categoryName: { $first: "$categoryDetails.name" },quantity: { $sum: "$orderItems.quantity" }}},
      { $project: {categoryName: 1,quantity: 1}}
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
      categoriesSold
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Failed to fetch data");
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

      orders = await orderSchema.find({ createdAt: { $gte: start, $lte: end } },'orderId createdAt totalAmount paymentStatus couponDiscount').populate('userId', 'username')

      const salesData = await orderSchema.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ]);
      totalSales = salesData[0]?.totalSales || 0;

      const discountData = await orderSchema.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, isCouponApplied: true } },
        { $group: { _id: null, totalDiscounts: { $sum: "$couponDiscount" } } },
      ]);
      totalDiscounts = discountData[0]?.totalDiscounts || 0;
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
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Failed to load sales report");
  }
};

const downloadPdf = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
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

    const orders = await orderSchema.find(matchCondition)
      .populate('userId', 'username')
      .populate('orderItems.productId', 'name price')
      .exec();

    const totalSales = await orderSchema.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
    ]);

    const discountData = await orderSchema.aggregate([
      { $match: { ...matchCondition, isCouponApplied: true } },
      { $group: { _id: null, totalDiscounts: { $sum: "$couponDiscount" } } }
    ]);

    const totalDiscounts = discountData[0]?.totalDiscounts || 0;

    const doc = new pdfDocument({
      margin: 50,
      size: 'A4',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="salesreport.pdf"');
    doc.pipe(res);

    doc.fontSize(24).text('Sales Report', { align: 'center' }).moveDown(0.5);
    doc.fontSize(14).text(`Report from: ${startDate || 'All Time'} to ${endDate || 'Present'}`, { align: 'center' }).moveDown(1.5);

    const tableTop = 200;
    const columns = {
      orderID: { x: 50, width: 160 },
      customerName: { x: 220, width: 120 },
      totalAmount: { x: 280, width: 80 },
      discount: { x: 380, width: 80 },
      finalAmount: { x: 500, width: 80 }
    };

    doc.fontSize(12)
    doc.text('Order ID', columns.orderID.x, tableTop);
    doc.text('Customer Name', columns.customerName.x, tableTop);
    doc.text('Total', columns.totalAmount.x, tableTop, { align: 'right', width: columns.totalAmount.width });
    doc.text('Discount', columns.discount.x, tableTop, { align: 'center', width: columns.discount.width });
    doc.text('Final', columns.finalAmount.x, tableTop, { align: 'right', width: columns.finalAmount.width });

    doc.moveTo(50, tableTop + 20).lineTo(600, tableTop + 20).stroke();

      let rowTop = tableTop + 40;
      orders.forEach(order => {
      const amount = order.totalAmount;
      const discount = order.couponDiscount || 0;
      const final = amount - discount;

      doc.fontSize(10);
      doc.text(order._id.toString(), columns.orderID.x, rowTop, { width: columns.orderID.width });
      doc.text(order.userId.username, columns.customerName.x, rowTop, { width: columns.customerName.width });
      doc.text(`₹${amount.toFixed(2)}`, columns.totalAmount.x, rowTop, { align: 'right', width: columns.totalAmount.width });
      doc.text(`₹${discount.toFixed(2)}`, columns.discount.x, rowTop, { align:"center" , width: columns.discount.width });
      doc.text(`₹${final.toFixed(2)}`, columns.finalAmount.x, rowTop, { align: 'right', width: columns.finalAmount.width });

      rowTop += 25;
    });

      doc.moveTo(50, rowTop).lineTo(600, rowTop).stroke();

      rowTop += 30;
      doc.fontSize(12);
      const summaryX = 400;
      const summaryValueX = 530;
      const summaryWidth = 80;

      doc.text(`Total Sales:`, summaryX, rowTop);
      doc.text(`₹${totalSales[0]?.totalSales.toFixed(2) || '0.00'}`, summaryValueX, rowTop, { width: summaryWidth });
      
      doc.text(`Total Discounts:`, summaryX, rowTop + 25);
      doc.text(`₹${totalDiscounts.toFixed(2)}`, summaryValueX, rowTop + 25, { width: summaryWidth });
      
      doc.text(`Total Final Amount:`, summaryX, rowTop + 50);
      doc.text(`₹${(totalSales[0]?.totalSales - totalDiscounts).toFixed(2)}`, summaryValueX, rowTop + 50, { width: summaryWidth });

      doc.end();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Failed to download PDF");
    }
};

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

    const orders = await orderSchema.find(matchCondition, 'orderId createdAt totalAmount paymentStatus').populate("userId", "username");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 25 },
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Order Date', key: 'createdAt', width: 20 },
      { header: 'Payment Status', key:'paymentStatus', width: 15 },
      { header: 'Amount', key: 'totalAmount', width: 15 },
    ];

    orders.forEach(order => {
      worksheet.addRow({
        orderId: order.id,
        username:order.userId.username,
        createdAt: order.createdAt.toLocaleDateString(),
        paymentStatus:order.paymentStatus,
        totalAmount: order.totalAmount,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error downloading Excel:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Failed to download Excel");
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
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
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
        return res.status(httpStatus.OK).json({ message: `User ${status} successfully`,isDeleted:user.isDeleted});
    } catch (error) {
        console.error('Error banning/unbanning user:', error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
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
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching user information' });
      }
};

const loadOrderManagement = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1
            const limit = 4
            const skip = (page - 1) * limit

            const orders = await orderSchema.find().sort({createdAt:-1}).skip(skip).limit(limit).populate("userId")

            const totalOrders = await orderSchema.countDocuments()
            const totalPages = Math.ceil(totalOrders / limit)
    
            orders.forEach(order => {
                order.quantity = order.orderItems.length
            })
    
            if (!orders || orders.length === 0) {
                return res.render("orderManagement", { message: "No orders found", orders, quantity: [], currentPage: page, totalPages })
            }

            res.render("orderManagement", {
                orders,
                quantity: orders.map(order => order.quantity),
                currentPage: page,
                totalPages
            });
        } catch (error) {
            console.error("Error loading orders:", error)
            res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error")
        }
};
       
const loadOrderView= async (req, res) => {
        const id=req.params.id
        const order=await orderSchema.findById(id).populate("userId").populate({path:"orderItems.productId"}).populate("addressId")
        if(!order){
            return res.status(404).json({success:false,message:"Order not found"})
        }
       return res.render("orderview",{order})
}

const updateStatus = async (req, res) => {
      const orderId = req.params.id;
      const { status } = req.body;
  
      try {
          const order = await orderSchema.findById(orderId);
  
          if (!order) {
              return res.status(404).json({ success: false, message: 'Order not found' });
          }
          
          if(order.paymentMethod=="Razorpay"&&order.status=="Pending"&&order.paymentStatus!="Completed"){
           return res.status(httpStatus.BAD_REQUEST).json({success:false,message:"Status cannot be changed until the payment is completed"})
          }
          
          if (order.paymentMethod === "COD" && status === "Delivered") {
              order.status = status;
              order.orderItems.forEach(item=>{
                item.paymentStatus="Completed"
              })
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
  
          return res.status(httpStatus.OK).json({
              success: true,
              message: 'Successfully updated status',
              status: order.status,
              paymentStatus: order.paymentStatus
          });
      } catch (error) {
          console.error('Error updating status:', error);
          res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
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
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).render("couponManagement", { message: "An error occurred." });
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
       const formattedDate = new Date(coupon.expirationDate).toISOString().split('T')[0];
       if(!coupon){
           return res.status(404).json({success:false,message:"Coupon not found"})
       }
       return res.render('editCoupon',{coupon,formattedDate})
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
      return res.status(httpStatus.OK).json({success:true,message:"Coupon updated successfully"})
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
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal Server Error." });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        console.log(couponId);
        
        const deletedCoupon = await couponSchema.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.redirect("/admin/couponmanagement");
    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error deleting coupon" });
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
      return res.status(httpStatus.BAD_REQUEST).json({
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

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Return approved and refund processed successfully.",
        order,
      });
    }

    else if (action === "reject") {
      order.refundStatus = "Rejected";
      order.status = "Delivered";

      await order.save();

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Return request has been rejected.",
        order,
      });
    } else {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid action specified. Use 'approve' or 'reject'.",
      });
    }
  } catch (error) {
    console.error("Error processing return:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred",
    });
  }
};

const processItemReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, items } = req.body;

    const order = await orderSchema.findById(id).lean();

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
          return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: `Item with ID ${itemId} cannot be approved as it is already ${item.itemStatus}.`,
          });
        }
      } else if (action === "reject") {
        if (item.itemStatus === "Requested") {
          item.refundStatus = "Rejected";
          item.itemStatus = "Delivered";
        } else {
          return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: `Item with ID ${itemId} cannot be rejected as it is already ${item.itemStatus}.`,
          });
        }
      } else {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Invalid action specified. Use 'approve' or 'reject'.",
        });
      }
    }

    order.totalAmount-=totalRefundAmount

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

    return res.status(httpStatus.OK).json({
      success: true,
      message: `Return request processed successfully. ${
        totalRefundAmount > 0 ? `Refund of ${totalRefundAmount} added to your wallet.` : ''
      }`,
      order,
    });
  } catch (error) {
    console.error("Error processing return:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the return. Please try again later.",
    });
  }
};

const stockManagement = async (req, res) => {
  const { id } = req.params;
  let { sizes, stockQuantities } = req.body;

  try {
    const product = await productSchema.findById(id);

    if (!product) {
      return res.status(404).json({success:false, message: "Product not found" });
    }

    sizes.forEach((size, index) => {
      let stock = stockQuantities[index];
      stock=parseInt(stock)
      const variantIndex = product.variants.findIndex((variant) => variant.size == size);
      
      if (variantIndex !== -1) {
        product.variants[variantIndex].stock = stock;
      } else {
        product.variants.push({ size, stock });
      }

    });
    
    product.totalStock = product.variants.reduce((total, variant) => total + variant.stock, 0);
    await product.save();

    res.status(httpStatus.OK).json({success:true, message: "Product stock updated successfully", product });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({success:false, message: "Server error" });
  }
};

const logout=(req,res)=>{
  req.session.admin=null
  res.redirect("/admin/login")
}

module.exports={
    loadAdminLogin,
    loadUsermanage,
    loginAdmin,
    loadDashboard,
    loadDashboardData,
    loadSalesReport,
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
    processItemReturn,
    stockManagement,
    logout
}