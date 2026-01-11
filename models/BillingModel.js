import mongoose from "mongoose";

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
  },
  aadharNumber: {  // New field for Aadhar number
    type: String,
  },
  villageArea: {   // New field for Village Area
    type: String,
  },
  paymentMethod: {
    type: String,
    required: false,
    enum: ['cash', 'card', 'upi', 'credit'],
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
      quantity: { type: Number, required: true }, // Using Number type for quantity
      purchaseprice: {  type: Number}, // Using Number type for purchaseprice
      tax: { type: Number }, // Using Number type for CostAmt
      price: { type: Number, required: true }, // Using Number type for price
      amount: { type: Number, required: true }, // Using Number type for amount
      unit: { type: String, enum: ['kg', 'litre', 'ml', 'pcs', 'bags', 'gms', 'Nos'], required: true },
    },
  ],
  totalAmount: {
    type: Number, // Using Number type for totalAmount
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Billing = mongoose.models.Billingmodeljobjord || mongoose.model("Billingmodeljobjord", BillingSchema);

export default Billing;
