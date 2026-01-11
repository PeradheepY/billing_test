import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel"; // Assuming you have an Item model
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  // Extract id from URL parameters
  const { id } =await params;  // params should give us the URL parameters (e.g., { id: '12345' })

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  await dbconnect();

  try {
    // Delete the item by its ObjectId (make sure it's an ObjectId)
    const result = await Item.deleteOne({ _id: id });  // Use _id for MongoDB's object id

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("Error deleting item:", err);
    return NextResponse.json({ message: "Error deleting item" }, { status: 500 });
  }
}
