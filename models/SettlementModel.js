import mongoose from 'mongoose';

const { Schema } = mongoose;

const settlementSchema = new Schema({
  customerPhone: { type: String, required: false },
  settledAmount: { type: Number, required: true },
  settlementDate: { type: Date, required: true },
  fullySettledBills: [{ type: Schema.Types.ObjectId, ref: 'CreditBilling' }], // Fully settled bills
  partiallySettledBills: [
    {
      billId: { type: Schema.Types.ObjectId, ref: 'CreditBilling' }, // Reference to CreditBilling
      originalAmount: Number, // Original bill amount
      paidAmount: Number, // Amount paid for this bill
      remainingDue: Number, // Remaining due amount
      partialPayment: Number, // Partial payment amount
      remainingCredit: Number, // Remaining credit amount
    },
  ],
  isPartialSettlement: { type: Boolean, default: false }, // Whether this settlement is partial
});

const Settlement = mongoose.models.Settlementcustomer || mongoose.model('Settlementcustomer', settlementSchema);

export default Settlement;
