import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  productName: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
  },
  hsnCode: {
    type: String,
    required: true,
  },
  gstPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  purchaseprice: {
    type: Number,
    required: true,
  },
  purchaseDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  price: {
    type: Number,
    required: true,
  },
  Batch: {
    type: String,
  },
  MRP: {
    type: Number,
  },
  quantity: {
    type: Number,
    required: true,
  },
  tax:{
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['pcs', 'kg', 'litre', 'gms', 'Nos', "ml", "bags"],
  },
  amount: {
    type: Number,
  },
  expireDate: {
    type: Date,
    required: false, // Optional field
  }
}, {
  timestamps: true,
});

const Product = mongoose.models.ProductItemJohson || mongoose.model("ProductItemJohson", ProductSchema);

export default Product;