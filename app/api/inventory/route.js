import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";

// Get all products
export async function GET() {
  try {
    await dbconnect();
    
    const items = await Item.find({}).sort({ productName: 1 });
    
    return new NextResponse(
      JSON.stringify({ success: true, data: items }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Error fetching products", 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}

// Add a new product
export async function POST(request) {
  try {
    await dbconnect();
    
    const data = await request.json();
    
    // Check if product with same name already exists
    const existingItem = await Item.findOne({ 
      productName: data.productName 
    });
    
    if (existingItem) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: "A product with this name already exists" 
        }),
        { status: 400 }
      );
    }
    
    // Create new product
    const newItem = new Item(data);
    await newItem.save();
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Product added successfully",
        data: newItem
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding product:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Error adding product",
        error: error.message
      }),
      { status: 500 }
    );
  }
}
