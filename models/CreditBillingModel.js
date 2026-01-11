import mongoose from 'mongoose';

const BillingSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  purchaseDate: {
    type: Date,
    required: false,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: Number,
    required: true,
  },
  aadharNumber: {  // New field for Aadhar number
    type: String,
  },
  villageArea: {   // New field for Village Area
    type: String,
  },
  showGst: {
    type: Boolean,
    default: false,
  },
  items: [
    {
     productName: { type: String, required: true },
     gstPercentage: { type: Number},
     hsnCode: {type: String},
     quantity: { type: Number, required: true }, 
     purchaseprice: { type: Number },
     tax: { type: Number },
     price: { type: Number, required: true }, 
     amount: { type: Number, required: true }, 
     unit: { type: String, enum: ['kg', 'litre', 'ml', 'pcs', 'bags', 'gms', 'Nos'], required: true },
    },
  ],
  totalAmount: {
     type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  subtotal: { type: Number, required: true },
  isCreditBill: { type: Boolean, default: false },
  dueDate: { type: Date },
  totalDue: { type: Number, default: 0 },
  partialPayment: {
    type: Number,
    default: 0
  },
  remainingCredit: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: false,
    enum: ['cash', 'card', 'upi', 'credit'],
  },
});

const CreditBilling = mongoose.models.Billingcustomercrrs || mongoose.model('Billingcustomercrrs', BillingSchema);

export default CreditBilling;
