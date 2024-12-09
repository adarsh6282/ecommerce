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
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupons"
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
            },
            itemStatus:{
                type: String,
                enum: ['Pending', 'Delivered', 'Cancelled', 'Returned','Requested',"Rejected"],
                default: 'Pending'
            },
            isRefund: {
                type: Boolean,
                default: false
            },
            refundStatus: {
                type: String,
                enum: ['Requested', 'Approved', 'Rejected'],
            },
            refundReason: {
                type: String
            }
        }
    ],
    status:{
        type: String,
        enum: ['Pending', 'Cancelled', 'Delivered','Returned','Requested'],
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
    isRefund: {
        type: Boolean,
        default: false
    },
    refundStatus: {
        type: String,
        enum: ['Requested', 'Approved', 'Rejected'],
    },
    refundReason: {
        type: String,
    },
    razorpayOrderId:{
        type: String,
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})

module.exports=mongoose.model("Orders",orderSchema)