import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { start, end } = await req.json();

  dbconnect();
  const monthly = await CreditBilling.aggregate([
    {
      $match: {
        isCreditBill: true,
        date: { $gte: new Date(start), $lte: new Date(end) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        totalAmount: { $sum: "$totalAmount" }
      }
    },
    {
      $project: {
        month: "$_id",
        totalAmount: 1
      }
    },
    { $sort: { month: 1 } }
  ]);

  return NextResponse.json({ success: true, data: monthly });
}
