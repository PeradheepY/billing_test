import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = await params;
  await dbconnect(); // Ensure DB connection is established

  try {
    // Find the item by ID
    const item = await Item.findById(id);

    if (item) {
      return NextResponse.json(item);
    } else {
      return NextResponse.error({ status: 404, message: "Item not found" });
    }
  } catch (error) {
    return NextResponse.error({ status: 500, message: "Database error" });
  }
}

