// app/api/settlement/summary/route.js
import dbconnect from "@/db/dbconnect";
import Settlement from "@/models/SettlementModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbconnect();

    const summary = await Settlement.aggregate([
      {
        $group: {
          _id: null,
          totalSettled: { $sum: "$settledAmount" },
          totalCount: { $sum: 1 },
          partialSettlements: {
            $sum: { $cond: [{ $eq: ["$isPartialSettlement", true] }, "$settledAmount", 0] }
          },
          fullSettlements: {
            $sum: { $cond: [{ $eq: ["$isPartialSettlement", false] }, "$settledAmount", 0] }
          },
          partialCount: {
            $sum: { $cond: [{ $eq: ["$isPartialSettlement", true] }, 1, 0] }
          },
          fullCount: {
            $sum: { $cond: [{ $eq: ["$isPartialSettlement", false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalSettled: 1,
          totalCount: 1,
          partialSettlements: 1,
          fullSettlements: 1,
          partialCount: 1,
          fullCount: 1
        }
      }
    ]);

    // Get recent settlements
    const recentSettlements = await Settlement.find({})
      .sort({ settlementDate: -1 })
      .limit(5)
      .select('customerPhone settledAmount settlementDate isPartialSettlement');

    const formattedResponse = {
      success: true,
      summary: summary[0] || {
        totalSettled: 0,
        totalCount: 0,
        partialSettlements: 0,
        fullSettlements: 0,
        partialCount: 0,
        fullCount: 0
      },
      recentSettlements
    };

    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error("Error fetching settlement summary:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}