const mongoose=require("mongoose")
require("dotenv").config()
const connectDB=async( )=>{
    try {
        const connection=await mongoose.connect(process.env.MONGO_CREDS)
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

module.exports=connectDB