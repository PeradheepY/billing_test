import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { start, end } = await req.json();
  
  dbconnect();
  const daily = await CreditBilling.aggregate([
    {
      $match: {
        isCreditBill: true,
        date: { $gte: new Date(start), $lte: new Date(end) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        totalAmount: { $sum: "$totalAmount" },
        billCount: { $sum: 1 }
      }
    },
    {
      $project: {
        date: "$_id",
        totalAmount: 1,
        billCount: 1
      }
    },
    { $sort: { date: -1 } }
  ]);

  return NextResponse.json({ success: true, data: daily });
}
