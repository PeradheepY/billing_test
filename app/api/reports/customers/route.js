import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import { NextResponse } from "next/server";

/* export async function POST(request) {
  try {
    const { start, end } = await request.json();

    if (!start || !end) {
      return NextResponse.json(
        { success: false, message: "Start and end dates are required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbconnect();

    // Query the database
    const customers = await CreditBilling.aggregate([
      {
        $match: {
          isCreditBill: true,
          date: { $gte: new Date(start), $lte: new Date(end) },
        },
      },
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $first: "$customerName" },
          customerPhone: { $first: "$customerPhone" },
          totalDue: { $sum: "$totalDue" },
          lastBillDate: { $max: "$date" },
        },
      },
    ]);

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error("Error fetching billing data:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
} */
export async function POST(request) {
    try {
      const body = await request.json();
      const { start, end, getAllCustomers } = body;
      
      // Connect to the database
      await dbconnect();
      
      // Query parameters
      let matchCondition = {
        isCreditBill: true,
      };
      
      // Only add date filters if not fetching all customers
      if (!getAllCustomers && start && end) {
        matchCondition.date = { $gte: new Date(start), $lte: new Date(end) };
      }
      
      // Query the database
      const customers = await CreditBilling.aggregate([
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: "$customerPhone",
            customerName: { $first: "$customerName" },
            customerPhone: { $first: "$customerPhone" },
            totalDue: { $sum: "$totalDue" },
            lastBillDate: { $max: "$date" },
          },
        },
        {
          $sort: { customerName: 1 } // Default sort by name
        }
      ]);
      
      return NextResponse.json({ success: true, data: customers });
    } catch (error) {
      console.error("Error fetching billing data:", error);
      return NextResponse.json(
        { success: false, message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }