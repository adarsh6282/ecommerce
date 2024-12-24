const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number },
  withoutOfferApplied:{type:Number,default:0},
  images: [{ type: String }],
  tags: [{ type: String }],
  variants:[{
    size:{type:Number},
    stock:{type:Number}
  }],
  totalStock:{type:Number},
  category:{type:mongoose.Schema.ObjectId, ref:"Category"},
  warranty: { type:String },
  returnPolicy: { type:String },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Products',productSchema);
