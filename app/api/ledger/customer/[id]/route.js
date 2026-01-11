// File: app/api/customers/route.js
import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const customerId = params.id;
    const { customerName, customerPhone, totalDue, date } = await request.json();

    // Connect to the database
    await dbconnect();

    // Find the customer record
  // Instead of using findById
const customer = await CreditBilling.findOne({ customerPhone: customerId });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    // Update customer details
    customer.customerName = customerName;
    customer.customerPhone = customerPhone;
    
    // Calculate the difference in totalDue to update
    const dueDifference = totalDue - customer.totalDue;
    customer.totalDue = totalDue;
    
    // Update date if provided
    if (date) {
      customer.date = new Date(date);
    }

    await customer.save();

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      data: customer
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}