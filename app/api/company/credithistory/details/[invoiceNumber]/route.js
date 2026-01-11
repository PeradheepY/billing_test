// API Route (pages/api/credithistory/details/[invoiceNumber].js)
import dbconnect from "@/db/dbconnect";
import CompanyCreditBilling from "@/models/CompanyCreditBill";
import CompanySettlement from "@/models/CompanySettlementbill";
import Customer from "@/models/CustomerModel";

import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await dbconnect();
    const { invoiceNumber } =await params;
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
    const creditBillings = await CompanyCreditBilling.find({
      invoiceNumber,
      ...dateFilter,
    }).sort({ date: 1 });

    // Get settlements
    const settlements = await CompanySettlement.find({
      invoiceNumber,
      ...dateFilter,
    }).sort({ settlementDate: 1 });

    // Combine and process transactions
    let transactions = [];
    let runningBalance = 0;

    // Process credit billings
    // Process credit billings
for (const billing of creditBillings) {
  // Calculate total credit amount considering purchase price, GST, and discount
  let creditAmount = 0;
  
  // Process each item in the billing
  if (billing.items && billing.items.length > 0) {
    creditAmount = billing.items.reduce((sum, item) => {
      // Apply discount and GST to each item
      const itemAmount = item.purchaseprice * 
        (1 - (item.purchaseDiscount || 0)/100) * 
        (1 + (item.gstPercentage || 0)/100);
      return sum + itemAmount;
    }, 0);
  } else {
    // Fallback to totalAmount if items are not available
    creditAmount = billing.totalAmount;
  }
  
  runningBalance += creditAmount;
  transactions.push({
    date: billing.date,
    items: billing.items,
    creditAmount: Number(creditAmount.toFixed(2)),
    paidAmount: 0,
    balance: Number(runningBalance.toFixed(2)),
    type: 'credit'
  });
}

    // Process settlements
    for (const settlement of settlements) {
      runningBalance -= settlement.settledAmount;
      transactions.push({
        date: settlement.settlementDate,
        items: [],
        creditAmount: 0,
        paidAmount: settlement.settledAmount,
        balance: runningBalance,
        type: 'settlement'
      });
    }

    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Modify the summary calculation
return NextResponse.json({
  transactions,
  summary: {
    totalCredit: creditBillings.reduce((sum, bill) => {
      // Calculate total credit considering items' purchase price, GST, and discount
      if (bill.items && bill.items.length > 0) {
        return sum + bill.items.reduce((itemSum, item) => {
          const itemAmount = item.purchaseprice * 
            (1 - (item.purchaseDiscount || 0)/100) * 
            (1 + (item.gstPercentage || 0)/100);
          return itemSum + itemAmount;
        }, 0);
      }
      return sum + bill.totalAmount;
    }, 0).toFixed(2),
    totalPaid: settlements.reduce((sum, settlement) => sum + settlement.settledAmount, 0).toFixed(2),
    currentBalance: runningBalance.toFixed(2)
  }
});
  } catch (error) {
    console.error("Credit history details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit history details" },
      { status: 500 }
    );
  }
}