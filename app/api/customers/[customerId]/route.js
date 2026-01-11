import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbconnect from '@/db/dbconnect';
import CreditBilling from '@/models/CreditBillingModel';

export async function DELETE(request, { params }) {
  try {
    await dbconnect();
    const { customerId } = params;

    let deletedCustomer;
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      deletedCustomer = await CreditBilling.findByIdAndDelete(customerId);
    }

    if (!deletedCustomer) {
      deletedCustomer = await CreditBilling.findOneAndDelete({ customerPhone: customerId });
    }

    if (!deletedCustomer) {
      return NextResponse.json({ 
        success: false, 
        message: 'Customer not found' 
      }, { status: 404 });
    }

    const startDate = deletedCustomer.lastBillDate;
    const endDate = new Date();

    await CreditBilling.updateMany(
      {
        billDate: { $gte: startDate, $lte: endDate }
      },
      {
        $inc: { 
          totalAmount: -deletedCustomer.totalDue,
          billCount: -1
        }
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Customer record deleted successfully',
      deletedCustomer 
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error deleting customer record' 
    }, { status: 500 });
  }
}
