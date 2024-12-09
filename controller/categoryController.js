const mongoose = require('mongoose')
const categorySchema= require('../models/categoryModel');
const productSchema = require('../models/productModel');
const path= require('path');


const loadAddCategory=(req,res)=>{
    res.render('addCategory')
}



const loadCategoryManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categories = await categorySchema.find({ isDeleted: false })
            .skip(skip)
            .limit(limit);

        if (!categories || categories.length === 0) {
            return res.render('admin-categorymanagement', { categories, message: 'No categories found' });
        }

        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const productCount = await productSchema.countDocuments({ categories: category._id });
                return {
                    ...category.toObject(),
                    productCount: productCount
                };
            })
        );

        const totalCategories = await categorySchema.countDocuments({ isDeleted: false });
        const totalPages = Math.ceil(totalCategories / limit);

        res.render('admin-categorymanagement', {
            categories: categoriesWithCounts,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error("Error loading categories:", error);
        res.render('admin-categorymanagement', { message: 'Error fetching categories' });
    }
};




const addCategory=async(req, res)=>{
    
    try {
        const {name,description}=req.body
        
        const category=new categorySchema({
            name,
            description,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false
        });
    await category.save()
    res.redirect('/admin/categorymanagement')
    } catch (error) {
        console.error(error);
    res.status(500).send("Error adding category");
    }
}


const applyOffer = async (req, res) => {
    const { currentCategoryId } = req.params;
    const { offerPercentage } = req.body;
  
    if (!offerPercentage || isNaN(offerPercentage)) {
      return res.status(400).json({ success: false, message: 'Invalid offer percentage.' });
    }
  
    try {
      const products = await productSchema.find({ category: currentCategoryId });
  
      if (products.length === 0) {
        return res.status(404).json({ success: false, message: 'No products found in this category.' });
      }

      for (const product of products) {
        const originalPrice = product.offerPrice;
        const discount = (originalPrice * offerPercentage) / 100;
        const newPrice = originalPrice - discount;

        product.offerPrice = newPrice.toFixed(2);
        product.offerPercentage = offerPercentage;
        await product.save();
      }
  
      res.json({ success: true, message: 'Offer applied successfully!' });
    } catch (error) {
      console.error("Error applying offer:", error);
      res.status(500).json({ success: false, message: 'An error occurred while applying the offer.' });
    }
  };



const loadUpdateCategory=async(req,res)=>{
    const categoryid=req.params.id
    const category=await categorySchema.findById(categoryid)
    if(!category){
        return res.redirect("/admin/categorymanagement")
    }
    res.render('updateCategory',{category:category})
}



const updateCategory=async(req,res)=>{
    const {categoryname,categorydescription}=req.body
    const categoryid=req.params.id
    
    try {
        const category=await categorySchema.findById(categoryid)
        if(!category){
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        category.name=categoryname
        category.description=categorydescription
        category.updatedAt=Date.now()

        await category.save()
        res.status(200).json({ success: true, message: 'Successfully updated category' });

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, message: 'Error updating category'});
    }
}



const loadDeleteCategory=async(req, res) =>{
    try {
    const category=await categorySchema.find({isDeleted: true})
    if(!category){
        return res.redirect("/admin/categorymanagement")
    }
    res.render('deleteCategory',{deletedCategories:category})
}catch{
    console.error(error)
    res.redirect('/admin/categorymanagement')
}}



const deleteCategory=async(req,res)=>{
    const {categoryId}=req.body
    console.log(categoryId);
    
    try {
        const category=await categorySchema.findByIdAndUpdate(categoryId, {isDeleted: true}, {new: true})
        if(!category){
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        return res.status(200).json({ success: true, message: 'Successfully deleted category' });
}
catch{
    console.error('Error deleting category:', error);
     return res.status(500).json({ success: false, message: 'Error deleting category'});
}}



const recoverCategory=async(req,res)=>{
    const {categoryId}=req.body    
    try {
        const category=await categorySchema.findByIdAndUpdate(categoryId, {isDeleted: false}, {new: true})
        if(!category){
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        return res.status(200).json({ success: true, message: 'Successfully recovered category' });
}catch(error){
    console.error('Error recovering category:', error);
    return res.status(500).json({ success: false, message: 'Error recovering category'});
}}

   
module.exports = {
    loadCategoryManagement,
    addCategory,
    applyOffer,
    loadAddCategory,
    loadUpdateCategory,
    updateCategory,
    loadDeleteCategory,
    deleteCategory,
    recoverCategory
}