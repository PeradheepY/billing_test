// API Route (pages/api/credithistory/transaction/[customerPhone].js)
import dbconnect from "@/db/dbconnect";
import Customer from "@/models/CustomerModel";
import Settlement from "@/models/SettlementModel";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await dbconnect();
    const { customerPhone } = await params;
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Find customer by phone number
    const customer = await Customer.findOne({ customerPhone: customerPhone });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.settlementDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch settlements for the customer
    const settlements = await Settlement.find({
      customerPhone: customerPhone,  // Match by customerPhone instead of customerId
      ...dateFilter,
    })
      .sort({ settlementDate: -1 })
      .lean();

    if (!settlements.length) {
      return NextResponse.json({ transactions: [] });
    }

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = settlements.reverse().map((settlement) => {
      // Calculate credit amount from fully and partially settled bills
      const creditAmount = (settlement.fullySettledBills || []).length * settlement.settledAmount +
        (settlement.partiallySettledBills || []).reduce((sum, bill) => sum + bill.originalAmount, 0);

      // Use settled amount as settlement amount
      const settlementAmount = settlement.settledAmount || 0;

      runningBalance = runningBalance + creditAmount - settlementAmount;

      return {
        id: settlement._id.toString(),
        date: settlement.settlementDate,
        creditAmount: Number(creditAmount.toFixed(2)),
        settlementAmount: Number(settlementAmount.toFixed(2)),
        runningBalance: Number(runningBalance.toFixed(2)),
      };
    });

    // Calculate summary
    const summary = settlements.reduce(
      (acc, settlement) => {
        const creditAmount = (settlement.fullySettledBills || []).length * settlement.settledAmount +
          (settlement.partiallySettledBills || []).reduce((sum, bill) => sum + bill.originalAmount, 0);
        
        acc.totalCredit += creditAmount;
        acc.totalSettlement += settlement.settledAmount || 0;
        return acc;
      },
      { totalCredit: 0, totalSettlement: 0 }
    );

    return NextResponse.json({
      transactions: transactionsWithBalance.reverse(),
      summary: {
        totalCredit: Number(summary.totalCredit.toFixed(2)),
        totalSettlement: Number(summary.totalSettlement.toFixed(2)),
        currentBalance: Number(runningBalance.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Transaction history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 }
    );
  }
}