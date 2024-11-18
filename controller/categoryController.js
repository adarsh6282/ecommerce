const mongoose = require('mongoose')
const categorySchema= require('../models/categoryModel');
const productSchema = require('../models/productModel');
const path= require('path');


const loadAddCategory=(req,res)=>{
    res.render('addCategory')
}



const loadCategoryManagement = async (req, res) => {
    
    try {
        // Fetch all categories that are not deleted
        const categories = await categorySchema.find({ isDeleted: false });
        // Check if categories are found
        if (!categories || categories.length === 0) {
            return res.render('admin-categorymanagement', {categories, message: 'No categories found' });   
        }

        // For each category, fetch the count of products
        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                // Get product count for each category
                const productCount = await productSchema.countDocuments({ categories: category._id });
                return {
                    ...category.toObject(),
                    productCount: productCount
                };
            })
        );

        res.render('admin-categorymanagement', { categories:categoriesWithCounts});
    } catch (error) {
        console.error(error);
        res.render('admin-categorymanagement', { message: 'Error fetching categories' });
    }
};



const addCategory=async(req, res)=>{
    
    try {
        const {name,description,image}=req.body

      if (!req.file || req.file.length === 0) {
        return res.status(400).json({ val: false, msg: "No files were uploaded" });
      }

      const imagePaths=path.relative(path.join(__dirname,"..","public"),req.file.path)
        
        const category=new categorySchema({
            name,
            description,
            image:imagePaths,
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



const loadUpdateCategory=async(req,res)=>{
    const categoryid=req.params.id
    const category=await categorySchema.findById(categoryid)
    if(!category){
        return res.redirect("/admin/categorymanagement")
    }
    res.render('updateCategory',{category:category})
}



const updateCategory=async(req,res)=>{
    const {categoryname,categorydescription,categoryimage}=req.body
    const categoryid=req.params.id
    
    try {
        const category=await categorySchema.findById(categoryid)
        if(!category){
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        category.name=categoryname
        category.description=categorydescription
        category.image=categoryimage
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
    loadAddCategory,
    loadUpdateCategory,
    updateCategory,
    loadDeleteCategory,
    deleteCategory,
    recoverCategory
}