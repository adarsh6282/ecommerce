const mongoose = require('mongoose')
const productSchema = require('../models/productModel')
const categorySchema = require('../models/categoryModel')
const { response } = require('express')
const path = require('path')


const loadProductmanage=async(req,res)=>{
    try{
    const product=await productSchema.find({isDeleted: false}).populate({ path: 'category', select: 'name' })

      return res.render('productManagement',{products:product})
    } catch (error) {
        console.error(error)
    }
}



const loadAddProduct=async(req,res)=>{
    try {
        const category=await categorySchema.find({isDeleted: false})
       return res.render('addProduct',{categories:category})
        } catch (error) {
        console.error(error)
    }
}



const addProduct=async(req,res)=>{
    try {
        const {name,description,price,category,returnpolicy,stock,offerprice,warranty,cashOnDelivery,tags,sizes}=req.body
        const imagePaths = [];
        for (const key in req.files) {
            req.files[key].forEach((file) => {
                imagePaths.push(path.relative(path.join(__dirname, "..", "public"), file.path))
            });
        }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ val: false, msg: "No files were uploaded" });
      }
      

        const product=new productSchema({
           name: name,
           description: description,
           price: price,
           category: category,
           images: imagePaths,
           offerPrice: offerprice,
           sizes: sizes.split(","),
           tags: tags.split(","),
           stock: stock,
           warranty: warranty,
           returnpolicy: returnpolicy,
           cashOnDelivery: cashOnDelivery,
           isDeleted:false
        })
        await product.save()
        
        return res.redirect("/admin/productmanagement")
        
    } catch (error) {
        console.error(error)
        res.status(500).send("Error adding product")
    }
}



const loadProductDelete=async(req, res) =>{
    try {
    const product=await productSchema.find({isDeleted: true})
    if(!product){
        return res.redirect("/admin/productmanagement")
    }
    res.render('deleteProduct',{deletedProducts:product})
}catch{
    console.error(error)
    res.redirect('/admin/productmanagement')
}}



const deleteProduct=async(req,res)=>{
    const {productId}=req.body
    
    try {
        const product=await productSchema.findByIdAndUpdate(productId, {isDeleted: true}, {new: true})
        if(!product){
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        return res.status(200).json({ success: true, message: 'Successfully deleted product' });
}
catch{
    console.error('Error deleting prodcut:', error);
     return res.status(500).json({ success: false, message: 'Error deleting porduct'});
}}



const recoverProduct=async(req,res)=>{
    const {productId}=req.body
    
    try {
        const product=await productSchema.findByIdAndUpdate(productId, {isDeleted: false}, {new: true})
        if(!product){
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        return res.status(200).json({ success: true, message: 'Successfully recovered product' });
}catch(error){
    console.error('Error recovering product:', error);
    return res.status(500).json({ success: false, message: 'Error recovering product'});
}}




const loadUpdateProduct=async(req,res)=>{
    const productId=req.params.id
    try {
        const category=await categorySchema.find()
        const product=await productSchema.findByIdAndUpdate(productId)
        if(!product){
            return res.redirect("/admin/productmanagement")
        }
        return res.render("updateProduct",{product:product,categories:category})
    } catch (error) {
        console.error(error)
        res.status(500).send("Error loading product")
    }
}



const updateProduct=async(req,res)=>{
    const {name,description,price,category,image,returnpolicy,stock,offerprice,warranty,cashOnDelivery}=req.body
    const productId=req.params.id
    const imagePaths = [];
        for (const key in req.files) {
            req.files[key].forEach((file) => {
                imagePaths.push(path.relative(path.join(__dirname, "..", "public"), file.path))
            });
        }
        console.log(imagePaths)
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ val: false, msg: "No files were uploaded" });
      }
    
        try {
            const categoryObj = await categorySchema.findOne({ name: category });
            if (!categoryObj) {
                return res.status(400).json({ success: false, message: 'Invalid category name' });
            }

            const isCashOnDelivery = cashOnDelivery ? cashOnDelivery === "true" : false;

            const product=await productSchema.findById(productId)
            console.log(product);
            
            if(!product){
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            product.name=name
            product.description=description
            product.images= imagePaths
            product.price=price
            product.category=categoryObj._id
            product.offerPrice=offerprice
            product.stock=stock
            product.warranty=warranty
            product.returnPolicy=returnpolicy
            product.cashOnDelivery=isCashOnDelivery
            product.updatedAt=Date.now()
    
            await product.save()
            res.status(200).json({ success: true, message: 'Successfully updated product' });
    
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ success: false, message: 'Error updating product'});
        } 
}




module.exports={
    loadProductmanage,
    loadAddProduct,
    addProduct,
    deleteProduct,
    loadProductDelete,
    recoverProduct,
    loadUpdateProduct,
    updateProduct,
}