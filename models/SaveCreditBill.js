import mongoose from 'mongoose';

const CreditBillSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    default: "Virutcham Agro Traders - Poonachi(S.C)"
  },
  customerName: String,
  customerPhone: String,
  date: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  items: [{
    productName: String,
    hsnCode: String,
    unit: String,
    price: Number,
    quantity: Number,
    gstPercentage: Number
  }],
  previousDue: {
    type: Number,
    default: 0
  },
  partialPayment: {
    type: Number,
    default: 0
  },
  remainingCredit: {
    type: Number,
    default: 0
  },
  showGst: {
    type: Boolean,
    default: true
  },
  subTotal: Number,
  roundingDiff: Number,
  finalAmount: Number
}, { timestamps: true });

const SaveCreditBill = mongoose.models.SaveCreditBilljo|| mongoose.model('SaveCreditBilljo', CreditBillSchema);

export default SaveCreditBill;