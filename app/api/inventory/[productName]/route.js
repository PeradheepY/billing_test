import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";

// Get a specific product
export async function GET(request, { params }) {
  try {
    await dbconnect();
    
    const productName = decodeURIComponent(params.productName);
    
    const item = await Item.findOne({ productName });
    
    if (!item) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Product not found" }),
        { status: 404 }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ success: true, data: item }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Error fetching product", 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}

// Update a product
export async function PATCH(request, { params }) {
  try {
    await dbconnect();
    
    const productName = decodeURIComponent(params.productName);
    const updateData = await request.json();
    
    // Find the item by productName
    const item = await Item.findOne({ productName });
    
    if (!item) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Product not found" }),
        { status: 404 }
      );
    }
    
    // If product name is being changed, check for duplicates
    if (updateData.productName && updateData.productName !== productName) {
      const existingItem = await Item.findOne({ 
        productName: updateData.productName 
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
    }
    
    // Update the item
    Object.keys(updateData).forEach(key => {
      item[key] = updateData[key];
    });
    
    await item.save();
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Product updated successfully",
        data: item
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Error updating product",
        error: error.message
      }),
      { status: 500 }
    );
  }
}

// Delete a product
export async function DELETE(request, { params }) {
  try {
    await dbconnect();
    
    const productName = decodeURIComponent(params.productName);
    
    const result = await Item.deleteOne({ productName });
    
    if (result.deletedCount === 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Product not found" }),
        { status: 404 }
      );
    }
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Product deleted successfully"
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Error deleting product",
        error: error.message
      }),
      { status: 500 }
    );
  }
}