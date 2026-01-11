// src/pages/api/billing/supplier-sales.ts
import dbconnect from '@/db/dbconnect';
import CompanyCreditBilling from '@/models/CompanyCreditBill';
import { NextResponse } from 'next/server';


export async function GET() {
  await dbconnect();

  try {
    const supplierSales = await CompanyCreditBilling.aggregate([
      {
        $group: {
          _id: '$supplierName',
          totalSales: { $sum: '$totalAmount' },
          billCount: { $sum: 1 },
        },
      },
      {
        $project: {
          supplierName: '$_id',
          totalSales: 1,
          billCount: 1,
          _id: 0,
        },
      },
    ]);

    return NextResponse.json({ success: true, data: supplierSales }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
