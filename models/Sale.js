// models/Sale.js
import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'pcs'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Adding fields to link with bills
  billNumber: {
    type: String
  },
  billType: {
    type: String,
    enum: ['cash', 'credit'],
    default: 'cash'
  },
  customerName: {
    type: String
  },
  customerPhone: {
    type: String
  }
});

// Create and export the model
const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
export default Sale;