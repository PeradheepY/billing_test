// api/sales/route.js
import { NextResponse } from "next/server";
import dbconnect from "@/db/dbconnect";
import Sale from "@/models/Sale";

export async function GET(request) {
  try {
    await dbconnect();
    
    // Get date parameters from query
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = {};
    
    // Apply date filter if both dates are provided
    if (startDate && endDate) {
      // Create date range from start of startDate to end of endDate
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
    } 
    // For backward compatibility - support single date parameter
    else if (searchParams.get('date')) {
      const date = searchParams.get('date');
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const sales = await Sale.find(query).sort({ date: -1 });
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        data: sales
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sales:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Error fetching sales",
        error: error.message
      }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbconnect();
    const body = await request.json();
    
    // Basic validation
    if (!body.productId || !body.productName || !body.quantity || !body.price) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Missing required fields"
        }),
        { status: 400 }
      );
    }
    
    // Create new sale
    const newSale = new Sale({
      productId: body.productId,
      productName: body.productName,
      quantity: Number(body.quantity),
      price: Number(body.price),
      unit: body.unit || 'pcs',
      totalPrice: body.totalPrice || (Number(body.price) * Number(body.quantity)),
      date: body.date || new Date(),
      billNumber: body.billNumber,
      billType: body.billType,
      customerName: body.customerName,
      customerPhone: body.customerPhone
    });
    
    // Save the sale
    await newSale.save();
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Sale recorded successfully",
        data: newSale
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sale:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Error creating sale",
        error: error.message
      }),
      { status: 500 }
    );
  }
}