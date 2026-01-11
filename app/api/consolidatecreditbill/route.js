// Credit Billing API (api/creditbill/route.js)
import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbconnect();
    
    const bills = await CreditBilling.find({}).sort({ date: -1 });
    
    // Calculate totals for credit bills
    const totalAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalPendingAmount = bills.reduce((sum, bill) => sum + bill.totalDue, 0);
    
    return NextResponse.json({
      bills,
      summary: {
        totalAmount,
        totalPendingAmount,
        totalOrders: bills.length,
        uniqueCustomers: new Set(bills.map(bill => bill.customerEmail)).size,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, items, isCreditBill, dueDate } = body;

    await dbconnect();
    
    const itemsWithAmounts = items.map((item) => ({
      ...item,
      amount: item.quantity * item.price,
    }));
    
    const subtotal = itemsWithAmounts.reduce((sum, item) => sum + item.amount, 0);
    const totalDue = isCreditBill ? subtotal : 0;

    const bill = await CreditBilling.create({
      customerName,
      customerEmail,
      items: itemsWithAmounts,
      subtotal,
      totalAmount: subtotal,
      isCreditBill,
      dueDate: isCreditBill ? new Date(dueDate) : null,
      totalDue,
    });

    return NextResponse.json({ success: true, bill }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}