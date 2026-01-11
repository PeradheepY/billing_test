import dbconnect from "@/db/dbconnect";
import CompanyCreditBill from "@/models/CompanyCreditBill";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { start, end } = await request.json();

    if (!start || !end) {
      return NextResponse.json(
        { success: false, message: "Start and end dates are required" },
        { status: 400 }
      );
    }

    await dbconnect();

    const companies = await CompanyCreditBill.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(start), $lte: new Date(end) },
        },
      },
      {
        $group: {
          _id: "$companyName",
          companyName: { $first: "$companyName" },
          panNumber: { $first: "$panNumber" },
          companyAddress: { $first: "$companyAddress" },
          previousDue: { $first: "$previousDue" },
          totalDue: { 
            $sum: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: { 
                  $add: ["$$value", { $multiply: ["$$this.price", "$$this.quantity"] }] 
                }
              }
            }
          },
          dueDate: { $first: "$dueDate" },
          lastBillDate: { $max: "$createdAt" },
        },
      },
    ]);

    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    console.error("Error fetching company billing data:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
