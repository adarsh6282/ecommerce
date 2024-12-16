const mongoose = require('mongoose')
const productSchema = require('../models/productModel')
const categorySchema = require('../models/categoryModel')
const { response } = require('express')
const path = require('path')


const loadProductmanage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 4; 
        const skip = (page - 1) * limit;

        const products = await productSchema.find({ isDeleted: false })
            .skip(skip)
            .limit(limit)
            .populate({ path: 'category', select: 'name' });

        const totalProducts = await productSchema.countDocuments({ isDeleted: false });
        const totalPages = Math.ceil(totalProducts / limit);

        if (!products || products.length === 0) {
            return res.render('productManagement', { message: "No products found", products, currentPage: page, totalPages });
        }

        res.render('productManagement', {
            products,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).send("Internal Server Error");
    }
};

const loadAddProduct=async(req,res)=>{
    try {
        const category=await categorySchema.find({isDeleted: false})
       return res.render('addProduct',{categories:category,message:null})
        } catch (error) {
        console.error(error)
    }
}

const addProduct=async(req,res)=>{
    try {
        let {name,description,price,category,returnpolicy,stockQuantities,offerprice,warranty,cashOnDelivery,tags,sizes}=req.body
        if(Array.isArray(sizes)){
            console.log('ITS ARRAY')
        }else{
            sizes = [...sizes]
        }
        const existingProduct=await  productSchema.findOne({name:name.trim(),isDeleted:false})

        if(existingProduct){
            res.render("updateProduct",{message:"Product with same name already exist"})
        }
        const imagePaths = [];
        for (const key in req.files) {
            req.files[key].forEach((file) => {
                imagePaths.push(path.relative(path.join(__dirname, "..", "public"), file.path))
            });
        }

        const variants = sizes.map((size, index) => ({
            size: size,
            stock: parseInt(stockQuantities[index] || 0, 10)
        }));

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ val: false, msg: "No files were uploaded" });
        }
      
      const totalStock = stockQuantities.reduce((total, stock) => total + parseInt(stock || 0, 10), 0);

        const product=new productSchema({
           name: name,
           description: description,
           price: price,
           category: category,
           images: imagePaths,
           offerPrice: offerprice,
           variants: variants,
           tags: tags.split(","),
           totalStock: totalStock,
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

const updateProduct = async (req, res) => {
    const { name, description, price, category, returnpolicy, stock, offerprice, warranty} = req.body;
    const productId = req.params.id;

    try {
        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const imagePaths = [];
        if (req.files) {
            for (const key in req.files) {
                req.files[key].forEach((file) => {
                    imagePaths.push(path.relative(path.join(__dirname, "..", "public"), file.path));
                });
            }
        }

        if (imagePaths.length > 0) {
            product.images = imagePaths;
        }

        const categoryObj = await categorySchema.findOne({ name: category });
        if (!categoryObj) {
            return res.status(400).json({ success: false, message: 'Invalid category name' });
        }

        product.name = name;
        product.description = description;
        product.price = price;
        product.category = categoryObj._id;
        product.offerPrice = offerprice;
        product.stock = stock;
        product.warranty = warranty;
        product.returnPolicy = returnpolicy;
        product.updatedAt = Date.now();

        await product.save();

        res.status(200).json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
};

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