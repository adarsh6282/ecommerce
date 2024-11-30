const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    expirationDate: { type: Date, required: true },
    minPurchase: { type: Number, required: true },
    maxDiscount: { type: Number, required: true },
    isActive: { type: Boolean, required: true},
    maxCount:{type: Number, required: true},
    usedCount:{type: Number,default:0, required: true},
    createdAt:{type: Date, required: true}
})

module.exports = mongoose.model('Coupons', couponSchema);
