// File: app/api/customers/route.js
import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const customer = await request.json();
    
    // Validate required fields
    if (!customer.customerName || !customer.customerPhone) {
      return NextResponse.json(
        { success: false, message: "Customer name and phone are required" },
        { status: 400 }
      );
    }
    
    // Ensure totalDue is a number
    const totalDue = parseFloat(customer.totalDue) || 0;
    
    // Connect to the database
    await dbconnect();
    
    // Create new credit billing entry with all required fields
    const newCustomer = new CreditBilling({
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      totalDue: totalDue,
      subtotal: totalDue, // Using totalDue as subtotal
      totalAmount: totalDue, // Using totalDue as totalAmount
      billNumber: `CR-${Date.now()}`, // Generating a unique bill number
      date: customer.lastBillDate || new Date(),
      isCreditBill: true,
    });
    
    await newCustomer.save();
    
    return NextResponse.json({ 
      success: true, 
      message: "Customer added successfully",
      customer: newCustomer 
    });
  } catch (error) {
    console.error("Error adding customer:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}