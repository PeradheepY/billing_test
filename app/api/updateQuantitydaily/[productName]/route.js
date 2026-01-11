import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    await dbconnect();
    
    const productName =decodeURIComponent(await params.productName);
    const { quantity } = await request.json();

    // Find the item by productName
    const item = await Item.findOne({ productName });
    
    if (!item) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Product not found" }),
        { status: 404 }
      );
    }

    // Check if there's enough quantity available
    if (item.quantity < quantity) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: "Not enough quantity available" 
        }),
        { status: 400 }
      );
    }

    // Update the quantity by subtracting the sold amount
    item.quantity += quantity;
    await item.save();

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: "Quantity updated successfully",
        newQuantity: item.quantity 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating quantity:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Error updating quantity",
        error: error.message 
      }),
      { status: 500 }
    );
  }
}