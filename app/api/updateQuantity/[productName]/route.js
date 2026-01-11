import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";

import Sale from "@/models/Sale";

export async function PATCH(request, { params }) {
  try {
    await dbconnect();
    
    // Await params before accessing its properties (Next.js 15 requirement)
    const { productName: rawProductName } = await params;
    const productName = decodeURIComponent(rawProductName);
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
    item.quantity -= Number(quantity);
    await item.save();
    
    // Create new sale record
    const newSale = new Sale({
      productId: item._id,
      productName: item.productName,
      quantity: Number(quantity),
      price: item.price,
      unit: item.unit || 'pcs',
      totalPrice: item.price * Number(quantity),
      date: new Date()
    });
    
    // Save the sale record
    await newSale.save();
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Quantity updated and sale recorded successfully",
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