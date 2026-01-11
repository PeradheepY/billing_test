import dbconnect from "@/db/dbconnect";
import CompanyCreditBill from "@/models/CompanyCreditBill";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supplier = await request.json();
    
    // Validate required fields
    if (!supplier.supplierName || !supplier.invoiceNumber) {
      return NextResponse.json(
        { success: false, message: "Supplier name and invoice number are required" },
        { status: 400 }
      );
    }
    
    // Parse numeric values
    const subtotal = parseFloat(supplier.totalDue) || 0;
    const discountPercent = parseFloat(supplier.discount) || 0;
    const gstPercent = parseFloat(supplier.gst) || 0; 
    
    // Calculate with discount
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    
    // Calculate with GST
    const gstAmount = afterDiscount * (gstPercent / 100);
    const totalDue = afterDiscount + gstAmount;
    
    // Connect to the database
    await dbconnect();
    
    // Check if invoice number already exists
    const existingSupplier = await CompanyCreditBill.findOne({ 
      invoiceNumber: supplier.invoiceNumber 
    });
    
    if (existingSupplier) {
      return NextResponse.json(
        { success: false, message: "Invoice number already exists" },
        { status: 400 }
      );
    }
    
    // Create new credit billing entry
    const newSupplier = new CompanyCreditBill({
      supplierName: supplier.supplierName,
      invoiceNumber: supplier.invoiceNumber,
      supplierAddress: supplier.supplierAddress || "Old Supplier",
      subtotal: subtotal,
      discount: discountPercent,
      gstPercentage: gstPercent,
      totalDue: totalDue,
      totalAmount: totalDue,
      billNumber: supplier.invoiceNumber,
      purchaseDate: supplier.lastBillDate || new Date(),
      isCreditBill: true,
      
      // Include calculated fields for reference
      calculatedDiscount: discountAmount,
      calculatedGst: gstAmount,
      afterDiscount: afterDiscount
    });
    
    await newSupplier.save();
    
    return NextResponse.json({
      success: true,
      message: "Supplier added successfully",
      supplier: newSupplier
    });
  } catch (error) {
    console.error("Error adding supplier:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbconnect();
    
    const suppliers = await CompanyCreditBill.find({ isCreditBill: true })
      .sort({ purchaseDate: -1 });
      
    return NextResponse.json({
      success: true,
      suppliers
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}