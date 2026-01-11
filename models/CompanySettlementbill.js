import mongoose from 'mongoose';

const { Schema } = mongoose;

const settlementSchema = new Schema({
  invoiceNumber: { type: String, required: false },
  settledAmount: { type: Number, required: true },
  settlementDate: { type: Date, required: true },
  fullySettledBills: [{ type: Schema.Types.ObjectId, ref: 'CompanyCreditBilling' }], // Fully settled bills
  partiallySettledBills: [
    {
      billId: { type: Schema.Types.ObjectId, ref: 'CompanyCreditBilling' }, // Reference to CreditBilling
      originalAmount: Number, // Original bill amount
      paidAmount: Number, // Amount paid for this bill
      remainingDue: Number, // Remaining due amount
    },
  ],
  isPartialSettlement: { type: Boolean, default: false }, // Whether this settlement is partial
});

const CompanySettlement = mongoose.models.companySettlementg || mongoose.model('companySettlementg', settlementSchema);

export default CompanySettlement;
