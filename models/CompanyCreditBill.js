import mongoose from 'mongoose';

const BillingSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  supplierName: {
    type: String,
    required: true,
  },
  supplierAddress: {
    type: String,
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [
    {
     productName: { type: String, required: true },
     Batch: { type: String},
     gstPercentage: { type: Number},
     hsnCode: {type: String},
     purchaseDiscount: { type: Number, default: 0, min: 0, max: 100,},
     quantity: { type: Number, required: true }, 
     purchaseprice: { type: Number, required: true }, 
     price: { type: Number, required: true },
     amount: { type: Number, required: true }, 
     unit: { type: String, enum: ['kg', 'litre', 'ml', 'pcs'], required: true },
     expireDate: {type: Date,required: false }
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
});

const CompanyCreditBilling = mongoose.models.companycreditBillingsdjo || mongoose.model('companycreditBillingsdjo', BillingSchema);

export default CompanyCreditBilling;
