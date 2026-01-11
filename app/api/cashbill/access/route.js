import { NextResponse } from 'next/server';
import dbconnect from '@/db/dbconnect';
import CashBill from '@/models/CashBillModel';
import SaveCreditBill from '@/models/SaveCreditBill';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const billNumber = searchParams.get('billNumber');

  console.log('Searching for Bill Number:', billNumber);

  if (!billNumber) {
    return NextResponse.json({ message: 'Bill number is required' }, { status: 400 });
  }

  try {
    await dbconnect();

    // Search in Cash Bills
    const cashBill = await CashBill.findOne({ billNumber });
    console.log('Cash Bill Search Result:', cashBill);

    if (cashBill) {
      return NextResponse.json(cashBill, { status: 200 });
    }

    // Search in Credit Bills
    const creditBill = await SaveCreditBill.findOne({ billNumber });
    console.log('Credit Bill Search Result:', creditBill);

    if (creditBill) {
      return NextResponse.json(creditBill, { status: 200 });
    }

    // Additional logging for troubleshooting
    const cashBillCount = await CashBill.countDocuments();
    const creditBillCount = await SaveCreditBill.countDocuments();

    console.log('Total Cash Bills:', cashBillCount);
    console.log('Total Credit Bills:', creditBillCount);

    // If no bill found
    return NextResponse.json({ 
      message: 'Bill not found', 
      details: {
        billNumber,
        cashBillCount,
        creditBillCount
      }
    }, { status: 404 });

  } catch (error) {
    console.error('Bill search error:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      errorDetails: error.message 
    }, { status: 500 });
  }
}