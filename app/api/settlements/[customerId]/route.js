import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import Settlement from "@/models/SettlementModel";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { customerId } = await params;
    const { partialAmount } = await request.json(); // Get partial payment amount from request body

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!partialAmount || partialAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    await dbconnect();

    // Get all unpaid credit bills for the customer
    const creditBills = await CreditBilling.find({
      customerPhone: customerId,
      isCreditBill: true,
      totalDue: { $gt: 0 }
    }).sort({ billDate: 1 }); // Sort by date to settle oldest bills first

    if (creditBills.length === 0) {
      return NextResponse.json(
        { success: false, message: "No pending bills found" },
        { status: 404 }
      );
    }

    let remainingPayment = partialAmount;
    const settledBills = [];
    const partiallySettledBills = [];

    // Process bills one by one until the partial payment is exhausted
    for (const bill of creditBills) {
      if (remainingPayment <= 0) break;

      if (remainingPayment >= bill.totalDue) {
        // Full settlement for this bill
        settledBills.push(bill._id);
        remainingPayment -= bill.totalDue;
        await CreditBilling.findByIdAndUpdate(bill._id, {
          totalDue: 0,
          settledAt: new Date(),
          isFullySettled: true
        });
      } else {
        // Partial settlement for this bill
        const newDue = bill.totalDue - remainingPayment;
        partiallySettledBills.push({
          billId: bill._id,
          originalAmount: bill.totalDue,
          paidAmount: remainingPayment,
          remainingDue: newDue
        });
        await CreditBilling.findByIdAndUpdate(bill._id, {
          totalDue: newDue,
          lastPartialPayment: {
            amount: remainingPayment,
            date: new Date()
          },
          isFullySettled: false
        });
        remainingPayment = 0;
      }
    }

    // Create settlement record
    const settlement = await Settlement.create({
      customerPhone: customerId,
      settledAmount: partialAmount,
      settlementDate: new Date(),
      fullySettledBills: settledBills,
      partiallySettledBills: partiallySettledBills,
      isPartialSettlement: true
    });

    // Calculate remaining total due
    const remainingTotalDue = await CreditBilling.aggregate([
      {
        $match: {
          customerPhone: customerId,
          totalDue: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalRemaining: { $sum: "$totalDue" },
        },
      },
      {
        $project: { totalRemaining: 1, _id: 0 },
      },
    ]);
    

    return NextResponse.json({
      success: true,
      settlement,
      remainingBalance: remainingTotalDue[0]?.totalRemaining || 0,
      fullySettledBills: settledBills,
      partiallySettledBills
    });

  } catch (error) {
    console.error("Error processing partial settlement:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}