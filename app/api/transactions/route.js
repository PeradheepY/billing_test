import dbconnect from '@/db/dbconnect';
import TransactionModel from '@/models/TransactionModel';
import { NextResponse } from 'next/server';




export async function GET(request) {
  try {
    await dbconnect();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = {  };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await TransactionModel.find(query)
      .sort({ date: -1 });
    
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbconnect();
    const body = await request.json();
    
    const transaction = await TransactionModel.create(body);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
