
import mongoose from 'mongoose';

// Define Purchase Item Schema
const PurchaseItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  hsnCode: { type: String },
  Batch: { type: String },
  purchaseprice: { type: Number, required: true },
  price: { type: Number },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'pcs' },
  gstPercentage: { type: String },
  expireDate: { type: Date },
  purchaseDiscount: { type: String },
  amount: { type: Number, required: true }
});

// Define Purchase Bill Schema
const PurchaseBillSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true, unique: true },
  purchaseDate: { type: Date, required: true },
  supplierName: { type: String, required: true },
  supplierAddress: { type: String },
  items: [PurchaseItemSchema],
  subtotal: { type: Number, required: true },
  gstSummary: {
    zeroPercent: { type: Number, default: 0 },
    fivePercent: { type: Number, default: 0 },
    twelvePercent: { type: Number, default: 0 },
    eighteenPercent: { type: Number, default: 0 },
    twentyEightPercent: { type: Number, default: 0 }
  },
  totalTax: {
    sgst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 }
  },
  totalAmount: { type: Number, required: true },
  isCreditBill: { type: Boolean, default: false },
  dueDate: { type: Date },
  totalDue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Initialize model
const PurchaseBill = mongoose.models.PurchaseBill || mongoose.model('PurchaseBill', PurchaseBillSchema);
