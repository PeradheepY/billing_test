import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  const { customerid } = params;  // Destructure customerid from params
  const { start, end } = await req.json();

  try {
    // Step 1: Connect to the database
    await dbconnect();

    // Step 2: Mark the payment as settled for the given customer
    const updatedPayment = await CreditBilling.findOneAndUpdate(
      { _id: customerid }, // Using customerid from params to find the payment
      { isSettled: true },
      { new: true }
    );

    if (!updatedPayment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    // Step 3: Recalculate the daily aggregation
    const daily = await CreditBilling.aggregate([
      {
        $match: {
          isCreditBill: true,
          isSettled: true,
          date: { $gte: new Date(start), $lte: new Date(end) },
          customerId: customerid,  // Ensure it only recalculates for the given customer
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

    // Step 4: Recalculate the monthly aggregation
    const monthly = await CreditBilling.aggregate([
      {
        $match: {
          isCreditBill: true,
          isSettled: true,
          date: { $gte: new Date(start), $lte: new Date(end) },
          customerId: customerid,  // Ensure it only recalculates for the given customer
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

    // Step 5: Return the updated daily and monthly data
    return NextResponse.json({
      success: true,
      message: 'Payment updated and recalculated successfully',
      data: { daily, monthly }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
