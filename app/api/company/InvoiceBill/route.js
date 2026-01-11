import dbconnect from "@/db/dbconnect";
import InvoiceBilling from "@/models/InvoicecreditbillModel";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbconnect();

    const body = await req.json(); // Parse the request body
    const { 
      shopName, 
      supplierName, 
      supplierAddress, 
      purchaseDate,
      purchaseDiscount, 
      dueDate, 
      invoiceNumber, 
      items, 
      previousDue,
      subtotal,
      totalSgst,
      totalCgst,
      totalGst,
      finalAmount 
    } = body;

    // Create a new invoice
    const newBill = new InvoiceBilling({
      shopName,
      supplierName,
      supplierAddress,
      purchaseDate: new Date(purchaseDate),
      purchaseDiscount,
      dueDate: new Date(dueDate),
      invoiceNumber,
      items,
      previousDue,
      subtotal,
      totalSgst,
      totalCgst,
      totalGst,
      finalAmount
    });

    // Save the new invoice
    const savedBill = await newBill.save();

    return NextResponse.json(savedBill, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating bill", error: error.message }, { status: 400 });
  }
}
