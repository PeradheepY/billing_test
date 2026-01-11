// app/api/customers/route.js
import dbconnect from "@/db/dbconnect";
import Billing from "@/models/BillingModel";
import CreditBilling from "@/models/CreditBillingModel";
import Settlement from "@/models/SettlementModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbconnect();

    // Fetch all bills from both models
    const [regularBills, creditBills] = await Promise.all([
      Billing.find({}),
      CreditBilling.find({})
    ]);

    // Fetch all settlements
    const settlements = await Settlement.find({});

    // Create a map of customer settlements
    const settlementMap = settlements.reduce((acc, settlement) => {
      if (!acc[settlement.customerEmail]) {
        acc[settlement.customerEmail] = 0;
      }
      acc[settlement.customerEmail] += settlement.settledAmount;
      return acc;
    }, {});

    // Combine and process the data
    const customers = new Map();

    // Process regular bills
    regularBills.forEach(bill => {
      const key = `${bill.customerEmail}`;
      if (!customers.has(key)) {
        customers.set(key, {
          customerName: bill.customerName,
          customerEmail: bill.customerEmail,
          customerPhone: bill.customerPhone || 'N/A',
          totalAmount: 0,
          totalDue: 0,
        });
      }
      const customer = customers.get(key);
      customer.totalAmount += bill.totalAmount;
      customer.totalDue += bill.totalAmount;
    });

    // Process credit bills
    creditBills.forEach(bill => {
      const key = `${bill.customerEmail}`;
      if (!customers.has(key)) {
        customers.set(key, {
          customerName: bill.customerName,
          customerEmail: bill.customerEmail,
          customerPhone: bill.customerPhone || 'N/A',
          totalAmount: 0,
          totalDue: 0,
        });
      }
      const customer = customers.get(key);
      customer.totalAmount += bill.totalAmount;
      customer.totalDue += bill.totalDue;
    });

    // Apply settlements
    for (let [key, customer] of customers) {
      const settledAmount = settlementMap[customer.customerEmail] || 0;
      customer.totalDue = Math.max(0, customer.totalDue - settledAmount);
    }

    return NextResponse.json({
      success: true,
      customers: Array.from(customers.values())
    });

  } catch (error) {
    console.error("Error fetching customer data:", error);
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