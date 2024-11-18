const mongoose = require("mongoose")
const userSchema = require("../models/userModel")
const { sentOtpEmail } = require("../utils/otpservice")
const { generateOtp, otpExpiry } = require("../utils/otpGenerator")
const otpSchema=require("../models/otpModel")
const productSchema = require("../models/productModel")
const { name } = require("ejs")
const addressSchema=require("../models/addressModel")
const bcrypt=require("bcrypt")

const loadRegister = (req, res) => {
    res.render("register",{message:null})
}

const loadVerify=(req,res)=>{
    res.render("verify",{email:req.session.email})
}

const loadHome=async(req,res)=>{
    const product=await productSchema.find({isDeleted:false}).sort({createdAt: -1})
    res.render("home",{product})
}

const loadLogin=(req,res)=>{
    res.render("login")
}

const loaduserBan=async(req,res)=>{
    res.render("userban")
}

const loadEditProfile=async(req,res)=>{
    const profileId=req.params.id
    const user=await userSchema.findById(profileId)
    res.render("updateprofile",{user:user})
}

const editProfile=async(req,res)=>{
    try {
        
        const { username,Phone,password} = req.body
        
        const userId = req.params.id
        const user=await userSchema.findById(userId)
        if(!user)
        {
           return res.status(404).json({success:false,message:"User not found"})
        }
        user.username=username
        user.Phone=Phone
 
        const hashedPassword = await bcrypt.hash(password, 10)
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
    const id=req.params.id
    const product=await productSchema.findById(id)
    
    const relatedProducts = await productSchema.find({ category: product.category,_id: { $ne: id }}).limit(4)
    res.render("product-detail",{product,relatedProducts})
}

const loadShop=async(req,res)=>{
    const products=await productSchema.find({isDeleted:false})
    res.render("shop",{products})
}

const loadAddress=async(req,res)=>{
    const {email}=req.session.userData
    
    try{
        const user=await userSchema.findOne({email:email});
        const address=await addressSchema.find({userId:user._id})

    res.render("address",{user:user,address:address})
    }catch(error){
        console.log(error)
    }
}

const loadAddAddress=async(req,res)=>{
    try {
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
    res.redirect("/address")

}catch(error){
    console.log(error)
}}


const loadEditAddress = async(req,res)=>{
    const id=req.params.id
    const address=await addressSchema.findById(id)
    if(!address){
        return res.redirect("/address")
    }
    res.render("editAddress",{address:address})
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

const deleteAddress=async (req, res) => {
    try {
        const addressId=req.params.id
        const address=await addressSchema.findById(addressId)
        if(!address){
            return res.status(404).json({success:false,message:"Address not found"})
        }
        await address.remove()
    }catch(error)
    {
        console.log(error)
        res.status(500).json({success:false,message:"Error deleting address"})
    }
}

const loadCart=async (req, res) => {
    res.render("cart")
}

module.exports = {
    registerUser,
    loadRegister,
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
}