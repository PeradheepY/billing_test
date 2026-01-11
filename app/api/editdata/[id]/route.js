import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } =await params; // No need for 'await' here
  const data = await request.json();
  console.log("Received data:", data); // Log received data for debugging

  // Connect to the database
  await dbconnect();

  // Calculate the total amount
  const total = data.quantity * data.price;

  // Assign the total to the 'amount' field in the data object
  data.amount = total;

  try {
    // Find and update the item by ID
    const updatedItem = await Item.findByIdAndUpdate(id, data, {
      new: true, // Return updated item
      runValidators: true, // Ensure validation is applied
    });

    if (updatedItem) {
      console.log("Item updated:", updatedItem); // Log the updated item
      return NextResponse.json(
        { message: "Item updated successfully", item: updatedItem },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Item not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error updating item:", error); // Log error
    return NextResponse.json(
      { message: "Failed to update item", error: error.message },
      { status: 500 }
    );
  }
}
