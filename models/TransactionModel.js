import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['payIn', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  date: {
    type: Date,
    default: Date.now
  }
});


const TransactionModel = mongoose.models.TransactionP || mongoose.model('TransactionP', transactionSchema);
export default TransactionModel;