const mongoose = require("mongoose")
const userSchema = require("../models/userModel")
const { sentOtpEmail } = require("../utils/otpservice")
const { generateOtp, otpExpiry } = require("../utils/otpGenerator")
const otpSchema=require("../models/otpModel")
const productSchema = require("../models/productModel")
const { name } = require("ejs")
const addressSchema=require("../models/addressModel")
const bcrypt=require("bcrypt")
const cartSchema=require("../models/cartModel")
const orderSchema=require("../models/orderModel")
const categorySchema=require("../models/categoryModel")
const wishlistSchema = require("../models/wishlistSchema")
const walletSchema=require("../models/walletModel")
const couponSchema=require("../models/couponModel")
const razorpay=require("../utils/razorpay")
const crypto=require("crypto")

const loadRegister = (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.render("register",{message:null})
}

const loadVerify=(req,res)=>{
    res.set('Cache-Control', 'no-store');
    res.render("verify",{message:null,email:req.session.email})
}

const loadHome=async(req,res)=>{
    res.set('Cache-Control', 'no-store');
    const product=await productSchema.find({isDeleted:false}).sort({createdAt: -1})
    res.render("home",{product})
}

const loadLogin=(req,res)=>{
    res.set('Cache-Control', 'no-store');
    res.render("login")
}

const loaduserBan=async(req,res)=>{
    res.render("userban")
}

const loadEditProfile=async(req,res)=>{
    if (!req.session.userData || !req.session.userData.email) {
        return res.redirect('/login');
    }
    const profileId=req.params.id
    const user=await userSchema.findById(profileId)
    res.render("updateprofile",{user:user})
}

const editProfile=async(req,res)=>{
    try {
        const saltround=10
        const { username,Phone,password} = req.body
        
        const userId = req.params.id
        const user=await userSchema.findById(userId)
        if(!user)
        {
           return res.status(404).json({success:false,message:"User not found"})
        }
        user.username=username
        user.Phone=Phone
 
        const hashedPassword = await bcrypt.hash(password, saltround)
        user.password = hashedPassword
  
        await user.save()
        return res.status(200).json({success:true,message:"Profile Updated successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:"Error updating profile"})
    }

}

const loadMyAccount = async (req, res) => {
    try {
        if (!req.session || !req.session.userData) {
            return res.redirect('/login');
        }

        const user = await userSchema.findOne({ email: req.session.userData.email });
        if (!user) {
            return res.redirect('/login');
        }

        res.render("myaccountprofile", {user});
    } catch (error) {
        console.error('Error loading My Account:', error);
        res.status(500).send("Something went wrong.");
    }
    
};

const loadForgotPassword = async (req, res) => {
    res.render("forgotpassword")
}


const requestOtp = async (req, res) => {
    try {
        const { username, email, password, Phone, confirmpassword } = req.body
        
        req.session.userData=req.body
        req.session.email=email
        
        const userEmail = await userSchema.findOne({email})
        const userName = await userSchema.findOne({username})

        if (userEmail) {
            return res.render("register", { message: "Email Already Exists" })
        } else if (userName) {
            return res.render("register", { message: "Username Already Exists" })
        }
        await otpSchema.deleteOne({email})
        const newOtp=generateOtp()
        
        sentOtpEmail(email,newOtp)
        
        const otpmodel=new otpSchema({
            email,
            otp:newOtp,
            createdAt:Date.now(),
            expiresAt:otpExpiry
        })
        await otpmodel.save()
        return res.redirect("/verify")

    } catch (error) {
        console.error(error)
    }
}


const registerUser=async(req,res)=>{
    try {
        console.log(1)
        const {otp}=req.body
        const { username, password , email ,Phone} = req.session.userData;
        
        const otpDoc = await otpSchema.findOne({ email });

        if (!otpDoc || otpDoc.otp !== otp) {
            return res.render("verify", { message: "Invalid OTP. Please try again.",email:req.session.email});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser=new userSchema({
            username,
            email,
            password:hashedPassword,
            Phone

        })
        await newUser.save()

        await otpSchema.deleteOne({ email });
        req.session.user=true
        req.session.userData={
            email:email,
            name:username
        }

        return res.redirect("/");
    } catch (error) {

        console.error(error);
        return res.render("verify", { message: "An error occurred during verification.",email:req.session.email});
    }
}

const resendOtp=async(req,res)=>{
    try {
        const email=req.session.userData?req.session.userData.email:null
        await otpSchema.deleteMany({email})
        const newOtp=generateOtp()
            
        sentOtpEmail(email,newOtp)
        
        const otpmodel=new otpSchema({
            email,
            otp:newOtp,
            createdAt:Date.now(),
            expiresAt:otpExpiry
        })
        await otpmodel.save()
        return res.redirect("/verify")
    } catch (error) {
        console.log(error)
    }
}

const loginUser=async(req,res)=>{
    const {email,password}=req.body

    const user=await userSchema.findOne({email})
    if(!user)
    {
        return res.render("login",{message:"user doesn't exist please register"})
    }   

    const isMatch=await bcrypt.compare(password,user.password)
    

    if(!isMatch)
    {
        return res.render("login",{message:"password doesn't match"})
    }
    
    req.session.user=true
    req.session.userData={email:user.email}
    return res.redirect("/")
}

const loadProductDetail=async(req,res)=>{
    if (!req.session.userData || !req.session.userData.email) {
        return res.redirect('/login');
    }
    const user=await userSchema.findOne({email:req.session.userData.email})
    const userId=user.id
    const id=req.params.id
    const product=await productSchema.findById(id)
    
    const relatedProducts = await productSchema.find({ category: product.category,_id: { $ne: id }}).limit(4)
    res.render("product-detail",{product,relatedProducts,userId})
}

const loadShop=async(req,res)=>{
    try{
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }
    const categories = await categorySchema.find({ isDeleted: false });
    const { category, priceRange, sortBy, search } = req.query;
    let filter = { isDeleted: false };
    if (category && category !== 'All Categories') {
        const selectedCategory = await categorySchema.findOne({ name: category });
        if (selectedCategory) filter.category = selectedCategory._id;
    }

    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filter.price = max ? { $gte: min, $lte: max } : { $gte: min };
    }

    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }
    let productData = await productSchema.find(filter);

    if (sortBy) {
        switch (sortBy) {
            case 'popularity':
                productData.sort((a, b) => b.popularity - a.popularity);
                break;
            case 'average-rating':
                productData.sort((a, b) => b.rating - a.rating);
                break;
            case 'latest':
                productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'price-low-to-high':
                productData.sort((a, b) => a.price - b.price);
                break;
            case 'price-high-to-low':
                productData.sort((a, b) => b.price - a.price);
                break;
            default:
                productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    } else {
        productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.render("shop", { productData, categories, priceRange, sortBy, search ,selectedCategory:category});
      }catch(error){
        console.error(error);
      }
    }

const loadAddress=async(req,res)=>{
    const {email}=req.session.userData
    
    try{
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }
        const user=await userSchema.findOne({email:email});
        const address=await addressSchema.find({userId:user._id})

    res.render("address",{user:user,address:address})
    }catch(error){
        console.log(error)
    }
}

const loadAddAddress=async(req,res)=>{
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }
        const id=req.params.id
        const user=await userSchema.findById(id)
        if(!user){
            return res.redirect("/login")
        }
        res.render("addAddress",{user:user})
    } catch (error) {
        console.log(error)   
    }
}

const addAddress=async(req,res)=>{
    try{
        console.log("fathah");
        
    const {housename,city,district,state,country,pincode}=req.body;
    const {email} = req.session.userData;
    const user=await userSchema.findOne({email})
    if(!user){
        return res.redirect("/login")
    }

    const address=new addressSchema({
        userId:user._id,
        housename:housename,
        city:city,
        district:district,
        state:state,
        country:country,
        pincode:pincode
    })
    await address.save()
    res.redirect("/address")

}catch(error){
    console.log(error)
}}


const loadEditAddress = async(req,res)=>{
    if (!req.session.userData || !req.session.userData.email) {
        return res.redirect('/login');
    }
    const id=req.params.id
    const address=await addressSchema.findById(id)
    if(!address){
        return res.redirect("/address")
    }
    res.render("editAddress",{address:address})
}

const loadCheckoutEditAddress= async(req,res)=>{
    if (!req.session.userData || !req.session.userData.email) {
        return res.redirect('/login');
    }
    const id=req.params.id
    const address=await addressSchema.findById(id)
    if(!address){
        return res.redirect("/address")
    }
    res.render("checkouteditAddress",{address:address})
}

const checkouteditAddress= async(req,res)=>{
    try {
        const {housename,city,district,state,country,pincode}=req.body
        const addressid=req.params.id
        
        const address=await addressSchema.findById(addressid)
        if(!address){
            return res.status(404).json({success:false ,message:"Address not found"})
        }
        address.housename=housename
        address.city=city
        address.district=district
        address.state=state
        address.country=country
        address.pincode=pincode
        await address.save()
        
        res.status(200).json({success:true,message:"Address updated successfully"})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:"Error updating address"})
    }
}

const loadCheckoutAddAddress=async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }
        const id=req.params.id
        const user=await userSchema.findById(id)
        if(!user){
            return res.redirect("/login")
        }
        res.render("checkoutaddAddress",{user:user})
    } catch (error) {
        console.log(error)   
    }
}

const checkoutaddAddress=async(req,res)=>{
    try{
        const {housename,city,district,state,country,pincode}=req.body;
        const {email} = req.session.userData;
        console.log(email)
        const user=await userSchema.findOne({email})
        if(!user){
            return res.redirect("/login")
        }
    
        const address=new addressSchema({
            userId:user._id,
            housename:housename,
            city:city,
            district:district,
            state:state,
            country:country,
            pincode:pincode
        })
        await address.save()
        res.redirect("/checkout")
    
    }catch(error){
        console.log(error)
    }
}

const editAddress=async(req,res)=>{
    
    try {
        const {housename,city,district,state,country,pincode}=req.body
        const addressid=req.params.id
        
        const address=await addressSchema.findById(addressid)
        if(!address){
            return res.status(404).json({success:false ,message:"Address not found"})
        }
        address.housename=housename
        address.city=city
        address.district=district
        address.state=state
        address.country=country
        address.pincode=pincode
        await address.save()
        
        res.status(200).json({success:true,message:"Address updated successfully"})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:"Error updating address"})
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const deletedAddress = await addressSchema.findByIdAndDelete(addressId);

        if (!deletedAddress) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        res.redirect("/address");
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error deleting address" });
    }
};

const loadCart = async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }

        const user=await userSchema.findOne({email:req.session.userData.email})
        const userId=user._id
        const cart = await cartSchema.findOne({ userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.render('cart', { items: [], total: 0 });
        }

        const filteredItems = cart.items.filter(item => !item.productId.isDeleted);
        cart.items = filteredItems;
        await cart.save();

        const total = cart.items.reduce((acc, item) => {
            return acc + item.productId.offerPrice * item.quantity;
        }, 0);

        res.render('cart', { items: cart.items, total });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};


const addToCart = async (req, res) => {
    try {
        const user = await userSchema.findOne({ email: req.session.userData.email });


        if (!user) {
            return res.status(400).json({ success: false, message: 'User not logged in' });
        }


        const userId = user._id;
        const { productId, quantity ,size } = req.body;
        

        if (!size) {
            return res.status(400).json({ success: false, message: 'Size is required' });
        }

        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.stock === 0) {
            return res.status(400).json({ success: false, message: 'Product is out of stock' });
        }

        if (quantity > product.stock) {
            return res.status(400).json({ 
                success: false, 
                message: `Only ${product.stock} items are available in stock`
            });
        }

        let cart = await cartSchema.findOne({ userId });


        if (!cart) {
            cart = new cartSchema({ userId, items: [] });
        }

        const existingProductIndex = cart.items.findIndex(
            item => item.productId.toString() === productId && item.size === size
        );

        if (existingProductIndex >= 0) {
            cart.items[existingProductIndex].quantity += quantity;

            if (cart.items[existingProductIndex].quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} items are available in stock`
                });
            }
        } else {
            cart.items.push({ productId, quantity, size });
        }

        await cart.save();

        res.status(200).json({ success: true, message: 'Item added to cart successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

const loadCheckout=async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }
        const user=await userSchema.findOne({email:req.session.userData.email})
        const userId=user._id
        
        const cart = await cartSchema.findOne({ userId }).populate('items.productId')
        const quantity=cart.items.reduce((acc, item) =>{
            return acc+item.quantity
        },0)
        const address = await addressSchema.find({ userId: new mongoose.Types.ObjectId(userId) });

        const total = cart.items.reduce((acc, item) => {
            return acc + item.productId.offerPrice * item.quantity;
        }, 0);

        
        res.render("checkout",{address:address,items:cart.items,total,user:user,quantity:quantity})
}catch(error){
    console.log(error)
}}


const placeOrder = async (req, res) => {
    try {
       let { paymentMethod, userId, addressId, items,totalAmount,couponCode } = req.body;
        totalAmount = parseFloat(totalAmount)
        const user = await userSchema.findById(userId);
        if (!user) {
            return res.status(401).json({success:false, message: 'User not logged in' });
        }

        const address = await addressSchema.findById(addressId);
        if (!address) {
            return res.status(404).json({success:false, message: 'Address not found' });
        }

        if (paymentMethod !== 'COD') {
            return res.status(400).json({success:false, message: 'Only COD payment method is allowed' });
        }

        let finalAmount = totalAmount;

        if (couponCode) {
            const coupon = await couponSchema.findOne({ code: couponCode, isActive: true });
            if (!coupon) {
                return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
            }

            if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }

            if (totalAmount < coupon.minPurchase) {
                return res.status(400).json({ success: false, message: `Minimum purchase of ${coupon.minPurchase} required for this coupon` });
            }

            if (coupon.usedCount >= coupon.maxCount) {
                return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
            }

            let discountAmount = (totalAmount * coupon.discount) / 100;

            if (discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }

            finalAmount -= discountAmount;

            if (finalAmount < 0) finalAmount = 0;

            coupon.usedCount += 1;
            await coupon.save();
        }


        for(let i=0;i<items.length;i++){
            const product = await productSchema.findById(items[i].productId);
            if(!product){
                return res.status(404).json({success:false, message: 'Product not found'})
            }
            if(product.stock<items[i].quantity){
                return res.status(400).json({success:false, message: 'Not enough stock for this product'})
            }
            product.stock-=items[i].quantity
            await product.save()
        }
        
        const newOrder = new orderSchema({
            userId,
            addressId,
            totalAmount,
            orderItems: items,
            paymentMethod: paymentMethod,
            paymentStatus:"Pending",
            status:"Pending"
        });

        await newOrder.save()
        
        await cartSchema.deleteOne({userId:userId})
        res.status(200).json({success:true, message: 'Order placed successfully', order: newOrder });
        } catch (error) {
        console.log(error);
        res.status(500).json({success:false, message: 'Something went wrong, please try again later.' });
    }
}

const razorPayOrder=async(req,res) => {
    try {
        const { addressId, userId, items, totalAmount, quantity, paymentMethod,couponCode } = req.body;

        const user = await userSchema.findById(userId);
        if (!user) {
            return res.status(401).json({success:false, message: 'User not logged in' });
        }

        const address = await addressSchema.findById(addressId);
        if (!address) {
            return res.status(404).json({success:false, message: 'Address not found' });
        }

        let finalAmount = totalAmount; 

        
        if (couponCode) {
            
            const coupon = await couponSchema.findOne({ code: couponCode, isActive: true });

            if (!coupon) {
                return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
            }

            if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }

            if (totalAmount < coupon.minPurchase) {
                return res.status(400).json({ success: false, message: `Minimum purchase of ${coupon.minPurchase} required for this coupon` });
            }

            if (coupon.usedCount >= coupon.maxCount) {
                return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
            }

            let discountAmount = (totalAmount * coupon.discount) / 100;

            if (discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }

            finalAmount -= discountAmount;

            if (finalAmount < 0) finalAmount = 0;

            coupon.usedCount += 1;
            await coupon.save();
        }

        for(let i=0;i<items.length;i++){
            const product = await productSchema.findById(items[i].productId);
            if(!product){
                return res.status(404).json({success:false, message: 'Product not found'})
            }
            if(product.stock<items[i].quantity){
                return res.status(400).json({success:false, message: 'Not enough stock for this product'})
            }
            product.stock-=items[i].quantity
            await product.save()
        }


        const amountInPaise = totalAmount * 100;

        const orderOptions = {
            amount: amountInPaise,
            currency: "INR", 
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(orderOptions);

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            razorpayKey: process.env.RAZORPAY_ID,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to create Razorpay order."
        });
    }
}

const verifyPayment=async(req,res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, addressId, userId, items, totalAmount, paymentMethod } = req.body;

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed.",
            });
        }

        const newOrder = new orderSchema({
            userId,
            addressId,
            totalAmount,
            orderItems: items,
            paymentMethod,
            paymentStatus: "Completed",
            status: "Pending",
        });

        await newOrder.save();
        await cartSchema.deleteOne({ userId });

        res.status(200).json({
            success: true,
            message: "Order placed successfully",
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to verify Razorpay payment.",
        });
    }
}

const loadOrderComplete = async (req,res)=>{
    res.render("order-complete")
}

const loadOrder = async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }
        const user=await userSchema.findOne({email:req.session.userData.email});
        const userId=user._id
        if(!user) {
            return res.redirect("/login")
        }
        const orders = await orderSchema.find({ userId }).populate('orderItems.productId')
        res.render('myaccountorders', { orders:orders });
    } catch (error) {
        console.log(error);
    }
};


const loadOrderView = async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }
        const orderId = req.params.id;
        const order = await orderSchema.findById(orderId).populate('orderItems.productId').populate("addressId")
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.render('userorderview', { order: order })   
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error retrieving order' });
    }
}


const cancelOrder = async (req, res) => {
    try {
        const orderId  = req.params.id;
        const order = await orderSchema.findById(orderId);

        if (!order) {
            return res.status(404).json({ success:false,message: "Order not found" });
        }

        if (order.status === "Delivered") {
            return res.status(400).json({ 
                success: false, 
                message: "Order cannot be canceled as it is already completed" 
            });
        }

        order.status = "Cancelled";

        if (order.paymentMethod === "Razorpay" && order.paymentStatus === "Completed") {
            const wallet = await walletSchema.findOne({ userId: order.userId });

            if (wallet) {
                wallet.balance += order.totalAmount;
                await wallet.save();
            } else {
                const newWallet = new walletSchema({
                    userId: order.userId,
                    balance: order.totalAmount,
                });
                await newWallet.save();
            }
        }

        await order.save();

        return res.status(200).json({success:true, message: "Order cancelled successfully", order });
    } catch (error) {
        console.error("Error cancelling order:", error);
        return res.status(500).json({success:false, message: "An error occurred" });
    }
};

const returnOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await orderSchema.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status !== "Delivered") {
            return res.status(400).json({
                success: false,
                message: "Only delivered orders can be returned"
            });
        }

        order.status = "Returned";

        if (order.paymentMethod === "Razorpay" && order.paymentStatus === "Completed") {
            let wallet = await walletSchema.findOne({ userId: order.userId });
            if (wallet) {
                wallet.balance += order.totalAmount;
                await wallet.save();
            } else {
                wallet = new walletSchema({
                    userId: order.userId,
                    balance: order.totalAmount,
                });
                await wallet.save();
            }
        } else if (order.paymentMethod === "COD" && order.paymentStatus === "Completed") {
            let wallet = await walletSchema.findOne({ userId: order.userId });
            if (wallet) {
                wallet.balance += order.totalAmount;
                await wallet.save();
            } else {
                wallet = new walletSchema({
                    userId: order.userId,
                    balance: order.totalAmount,
                });
                await wallet.save();
            }
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Return request submitted successfully",
            order
        });
    } catch (error) {
        console.error("Error requesting return:", error);
        return res.status(500).json({ success: false, message: "An error occurred" });
    }
};

const applyCoupon = async (req, res) => {
    try {
      const { couponCode, totalAmount } = req.body;
      const total = parseFloat(totalAmount);

      const coupon = await couponSchema.findOne({ code: couponCode });

      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
      }
  
      const currentDate = new Date();
      if (!coupon.isActive || currentDate > coupon.expirationDate) {
        return res.status(400).json({ success: false, message: 'Coupon is expired or inactive' });
      }

      if (coupon.usedCount >= coupon.maxCount) {
        return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
      }
  
      let discountAmount = (total * coupon.discount) / 100; 

      if (discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
    }
      let finalAmount = totalAmount - discountAmount;

      finalAmount = parseFloat(finalAmount)
  
      return res.status(200).json({
        success: true,
        discount: discountAmount,
        finalAmount:finalAmount,
        message: 'Coupon applied successfully',
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  


const removeFromCart= async (req, res) => {
    try{
    const {itemId}=req.body
    const user=await userSchema.findOne({email:req.session.userData.email})
    const userId=user._id
    

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Please log in to remove items from your cart.' });
    }

    let cart = await cartSchema.findOne({ userId });

    if (!cart) {
        return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const productIndex = cart.items.findIndex(item => item.productId.toString() === itemId);

    if (productIndex !== -1) {
        cart.items.splice(productIndex, 1);
            await cart.save();

            return res.json({ success: true, message: 'Product removed successfully', cart });
        } else {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error('Error removing product from cart:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while removing the product' });
    }
};

const loadWishlist=async(req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login'); 
        }
        const user=await userSchema.findOne({email:req.session.userData.email})
        const userId=user._id
        
        const wishlist = await wishlistSchema.findOne({ userId }).populate('products.productId');
        
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        res.render('wishlist', { wishlistItems: wishlist.products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

const addToWishlist= async (req, res) => {
    try{
const { productId } = req.body;
const user=await userSchema.findOne({email:req.session.userData.email});
const userId=user.id;

let wishlist = await wishlistSchema.findOne({ userId });

if (!wishlist) {

    wishlist = new wishlistSchema({ userId, products: [{ productId }] });
} else {
    const productExists = wishlist.products.some((item) => item.productId.toString() === productId.toString());

    if (productExists) {
        return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    wishlist.products.push({ productId });
}

await wishlist.save();

res.json({ success: true, message: 'Product added to wishlist' });
} catch (error) {
console.error(error);
res.status(500).json({ success: false, message: 'Server error' });
}
}


const removeFromWishlist= async (req, res) => {
    try{
    const {itemId}=req.body
    const user=await userSchema.findOne({email:req.session.userData.email})
    const userId=user._id
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Please log in to remove items from your Wishlist.' });
    }

    let wishlist = await wishlistSchema.findOne({ userId });

    if (!wishlist) {
        return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    const productIndex = wishlist.products.findIndex(item => item.productId.toString() === itemId);
    console.log(itemId)

    if (productIndex !== -1) {
        wishlist.products.splice(productIndex, 1);
            await wishlist.save();

            return res.json({ success: true, message: 'Product removed successfully', wishlist });
        } else {
            return res.status(404).json({ success: false, message: 'Product not found in Wishlist' });
        }
    } catch (error) {
        console.error('Error removing product from Wishlist:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while removing the product' });
    }
};

const loadWallet=async(req,res) => {
    try{
        if (!req.session.userData || !req.session.userData.email) {
            return res.redirect('/login');
        }
    const user=await userSchema.findOne({email:req.session.userData.email})
    const userId=user._id
    
    let wallet = await walletSchema.findOne({ userId });
    
    if (!wallet) {
        wallet=new walletSchema({
            userId,
            balance: 0
        })
        await wallet.save();
    }
    
    res.render('wallet',{wallet})
}catch(error)
{
    console.error(error);
}
}


const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
}


module.exports = {
    registerUser,
    loadRegister,
    loadForgotPassword,
    requestOtp,
    loadVerify,
    loadHome,
    loadLogin,
    resendOtp,
    loginUser,
    loadProductDetail,
    loadShop,
    loaduserBan,
    loadMyAccount,
    loadEditProfile,
    editProfile,
    loadAddress,
    loadAddAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    loadCart,
    addToCart,
    loadCheckout,
    placeOrder,
    loadOrderComplete,
    loadOrder,
    loadOrderView,
    cancelOrder,
    loadCheckoutEditAddress,
    checkouteditAddress,
    loadCheckoutAddAddress,
    checkoutaddAddress,
    removeFromCart,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    razorPayOrder,
    verifyPayment,
    returnOrder,
    loadWallet,
    applyCoupon,
    logout
}