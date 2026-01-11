

import dbconnect from '@/db/dbconnect';
import Billing from '@/models/BillingModel';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbconnect();
    
    const billings = await Billing.find({}).sort({ date: -1 });
    
    // Process data for dashboard
    const processedData = {
      raw: billings,
      summary: {
        totalRevenue: billings.reduce((sum, bill) => sum + bill.totalAmount, 0),
        totalOrders: billings.length,
        uniqueCustomers: new Set(billings.map(bill => bill.customerPhone)).size,
      },
      // Add more processed data as needed
    };
    
    return NextResponse.json(processedData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add billing record
export async function POST(request) {
  try {
    await dbconnect();
    const data = await request.json();
    
    // Calculate amount for each item
    data.items = data.items.map(item => ({
      ...item,
      amount: item.quantity * item.price
    }));
    
    // Calculate total amount
    data.totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
    
    const billing = await Billing.create(data);
    return NextResponse.json(billing);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}