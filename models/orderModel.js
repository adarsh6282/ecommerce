const mongoose = require('mongoose')

const orderSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    addressId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "address"
    },
    totalAmount:{
        type: Number,  
        required:true
    },
    orderItems:[
        {
            productId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Products"
            },
            quantity:{
                type: Number,
                required: true
            },
            price:{
                type: Number,
            }
        }
    ],
    status:{
        type: String,
        enum: ['Pending', 'Cancelled', 'Delivered','Returned'],
        default: 'Pending'
    },
    paymentMethod:{
        type: String,
        enum: ['COD', 'Razorpay'],
        default: 'COD'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})

module.exports=mongoose.model("Orders",orderSchema)