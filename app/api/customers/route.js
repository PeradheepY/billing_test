// app/api/customers/route.js
import { NextResponse } from 'next/server';
import dbconnect from '@/db/dbconnect';
import Customer from '@/models/CustomerModel';

export async function GET() {
  try {
    await dbconnect();
    
    const customers = await Customer.find({})
      .sort({ customerName: 1 })
      .select('customerName customerPhone');

    return NextResponse.json({
      success: true,
      customers: customers.map(customer => ({
        id: customer._id.toString(),
        name: customer.customerName,
        phone: customer.customerPhone
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}