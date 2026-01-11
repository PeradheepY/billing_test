import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
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
  items: [{
    productName: String,
    hsnCode: String,
    unit: String,
    price: Number,
    quantity: Number,
    gstPercentage: Number
  }],
  subTotal: Number,
  roundingDiff: Number,
  finalAmount: Number
}, { timestamps: true });



const CashBill = mongoose.models.cashBilljo || mongoose.model('cashBilljo', BillSchema);

export default CashBill;