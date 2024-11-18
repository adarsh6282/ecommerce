const mongoose=require("mongoose")
const connectDB=async()=>{
    try {
        const connection=await mongoose.connect("mongodb://localhost:27017/ecommerce")
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

module.exports=connectDB