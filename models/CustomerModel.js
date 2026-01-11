import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true
});

const Customer = mongoose.models.Customers || mongoose.model("Customers", CustomerSchema);

export default Customer;
