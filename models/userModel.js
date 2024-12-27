const mongoose=require("mongoose")

const userSchema=new mongoose.Schema({

    username:{
        type:String,
        required:false
    },

    email:{
        type:String,
        required:true
    },

    Phone:{
        type:String,
        sparse:true,
    },

    googleId:{
        type:String,
        sparse:true
    },

    password:{
        type:String,
    },

    createdAt:{
        type:Date,
        required:false,
        default:Date.now
    },

    role: { 
        type: String, default: "user"     
    },

    isDeleted: {
        type: Boolean, default: false
     },

     updatedAt: { 
        type: Date, default: Date.now 
    },

     isValid: {
        type: Boolean, default: false
     },

     isGoogleLogin: { 
        type: Boolean, default: false 
    }
})

module.exports=mongoose.model("users",userSchema)