const mongoose= require('mongoose')

const walletSchema=new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required:true
    },
    balance:{
        type: Number,
        required:true
    },
    createdAt:{type: Date,default:Date.now()},
    updatedAt:{type: Date,default:Date.now()},
})

module.exports=mongoose.model("wallet",walletSchema)