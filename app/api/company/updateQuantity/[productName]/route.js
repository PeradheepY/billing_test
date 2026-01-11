import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";


  export async function PATCH(request, { params }) {
  try {
    await dbconnect();
    
    const productName = decodeURIComponent(params.productName);
    const { quantity, purchaseprice, price, hsnCode, gstPercentage, expireDate, Batch, unit, tax, category, productId } = await request.json();
    
    // Find the item by productName
    let item = await Item.findOne({ productName });
    
    if (!item) {
      // If product doesn't exist, create a new one
      item = new Item({
        productId,
        productName,
        purchaseprice,
        price,
        quantity: Number(quantity),
        unit: unit || 'pcs',
        hsnCode,
        gstPercentage,
        expireDate,
        // Convert Batch to number if possible, or use string if it's meant to be a string
        Batch: !isNaN(Number(Batch)) ? Number(Batch) : Batch,
        tax: tax || 0,
        category: category || 'Uncategorized'
      });
      
      await item.save();
      
      return new NextResponse(
        JSON.stringify({
          success: true,
          message: "New product added successfully",
          newQuantity: item.quantity,
          productId: item.productId
        }),
        { status: 201 }
      );
    } else {
      // For existing items, INCREASE the quantity
      item.quantity = Number(item.quantity) + Number(quantity);
      
      // Update other fields if provided
      if (purchaseprice) item.purchaseprice = purchaseprice;
      if (price) item.price = price;
      if (hsnCode) item.hsnCode = hsnCode;
      if (gstPercentage) item.gstPercentage = gstPercentage;
      if (expireDate) item.expireDate = expireDate;
      if (Batch) {
        // Try to convert Batch to number if possible
        item.Batch = !isNaN(Number(Batch)) ? Number(Batch) : Batch;
      }
      if (unit) item.unit = unit;
      if (tax) item.tax = tax;
      if (category) item.category = category;
      
      await item.save();
      
      return new NextResponse(
        JSON.stringify({
          success: true,
          message: "Quantity increased successfully",
          newQuantity: item.quantity,
          productId: item.productId
        }),
        { status: 200 }
      );
    }
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