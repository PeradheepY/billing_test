// Regular Billing API (api/regularbillingreport/route.js)
import dbconnect from '@/db/dbconnect';
import Billing from '@/models/BillingModel';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbconnect();
    
    const billings = await Billing.find({}).sort({ date: -1 });
    
    // Calculate totals for regular bills
    const totalRevenue = billings.reduce((sum, bill) => sum + bill.totalAmount, 0);
    
    const processedData = {
      bills: billings,
      summary: {
        totalRevenue,
        totalOrders: billings.length,
        uniqueCustomers: new Set(billings.map(bill => bill.customerEmail)).size,
      }
    };
    
    return NextResponse.json(processedData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

