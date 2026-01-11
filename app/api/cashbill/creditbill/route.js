import { NextResponse } from "next/server";
import dbconnect from "@/db/dbconnect";
import SaveCreditBill from "@/models/SaveCreditBill";

export async function POST(req) {
  try {
    await dbconnect();
    
    const billData = await req.json(); // Parse the JSON body from the request
    
    // Validate bill number uniqueness
    const existingBill = await SaveCreditBill.findOne({ billNumber: billData.billNumber });
    if (existingBill) {
      return NextResponse.json(
        {
          success: false,
          message: "Bill number must be unique"
        },
        { status: 400 }
      );
    }
    
    const newCreditBill = await SaveCreditBill.create(billData);
    
    return NextResponse.json(
      {
        success: true,
        bill: newCreditBill,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Credit Bill saving error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }
}

// Add a GET endpoint to retrieve a bill by number
export async function GET(req) {
  try {
    await dbconnect();
    
    const url = new URL(req.url);
    const billNumber = url.searchParams.get('billNumber');
    
    if (!billNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Bill number is required"
        },
        { status: 400 }
      );
    }
    
    const bill = await SaveCreditBill.findOne({ billNumber });
    
    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          message: "Bill not found"
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        bill
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving credit bill:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}