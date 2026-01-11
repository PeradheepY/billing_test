import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import Settlement from "@/models/SettlementModel";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await dbconnect();
    const { customerPhone } = params;
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    // Get customer credit billings
    const creditBillings = await CreditBilling.find({
      customerPhone,
      ...dateFilter,
    }).sort({ date: 1 });
    
    // Get settlements
    const settlements = await Settlement.find({
      customerPhone,
      ...dateFilter,
    }).sort({ settlementDate: 1 });
    
    // Combine and process transactions
    let transactions = [];
    let runningBalance = 0;
    
    // Process credit billings
    for (const billing of creditBillings) {
      // Consider partial payment when calculating running balance
      const effectiveAmount = billing.totalAmount - (billing.partialPayment || 0);
      runningBalance += effectiveAmount;
      
      transactions.push({
        date: billing.date,
        billNumber: billing.billNumber,
        items: billing.items,
        creditAmount: billing.totalAmount,
        paidAmount: billing.partialPayment || 0,
        remainingCredit: billing.remainingCredit || effectiveAmount,
        balance: runningBalance,
        type: 'credit',
        isCreditBill: billing.isCreditBill,
        dueDate: billing.dueDate
      });
    }
    
    // Process settlements
    for (const settlement of settlements) {
      runningBalance -= settlement.settledAmount;
      transactions.push({
        date: settlement.settlementDate,
        settlementId: settlement._id,
        items: [],
        creditAmount: 0,
        paidAmount: settlement.settledAmount,
        balance: runningBalance,
        type: 'settlement'
      });
    }
    
    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return NextResponse.json({
      success: true,
      transactions,
      summary: {
        totalCredit: creditBillings.reduce((sum, bill) => sum + bill.totalAmount, 0),
        totalPaid: creditBillings.reduce((sum, bill) => sum + (bill.partialPayment || 0), 0) + 
                  settlements.reduce((sum, settlement) => sum + settlement.settledAmount, 0),
        currentBalance: runningBalance
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Credit history details error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch credit history details" },
      { status: 500 }
    );
  }
}