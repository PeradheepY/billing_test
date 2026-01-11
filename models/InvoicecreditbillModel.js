// models/Bill.js
import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  supplierName: { type: String, required: true },
  supplierAddress: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  invoiceNumber: { type: String, required: true },
  items: [{
    productName: { type: String, required: true },
     gstPercentage: { type: Number},
     hsnCode: {type: String},
     purchaseDiscount: { type: Number, default: 0, min: 0, max: 100,},
     quantity: { type: Number, required: true }, 
     purchaseprice: { type: Number, required: true }, 
     expireDate: {type: Date,required: false }
  }],
  previousDue: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  totalSgst: { type: Number, required: true },
  totalCgst: { type: Number, required: true },
  totalGst: { type: Number, required: true },
  finalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});


const InvoiceBilling = mongoose.models.BillInvoicejotech || mongoose.model('BillInvoicejotech', BillSchema);

export default InvoiceBilling;