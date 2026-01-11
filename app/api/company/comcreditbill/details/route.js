// API Route (pages/api/companycredit/details/[panNumber].js)
import dbconnect from "@/db/dbconnect";
import CompanyCreditBill from "@/models/CompanyCreditBill";
import CompanySettlement from "@/models/CompanySettlementbill";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await dbconnect();
    const { panNumber } = await params;
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.$or = [
        { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { settlementDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
      ];
    }

    // Get credit bills
    const creditBills = await CompanyCreditBill.find({
      panNumber,
      ...dateFilter
    }).sort({ createdAt: -1 });

    // Get settlements
    const settlements = await CompanySettlement.find({
      panNumber,
      ...dateFilter
    }).sort({ settlementDate: -1 });

    // Calculate totals
    const totalCredit = creditBills.reduce((sum, bill) => 
      sum + bill.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0);
    
    const totalPaid = settlements.reduce((sum, settlement) => 
      sum + settlement.settledAmount, 0);

    return NextResponse.json({
      creditBills,
      settlements,
      summary: {
        totalCredit,
        totalPaid,
        balance: totalCredit - totalPaid
      }
    });
  } catch (error) {
    console.error("Company credit details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company credit details" },
      { status: 500 }
    );
  }
}