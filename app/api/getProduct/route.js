import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";

export async function GET(request) {
  // Connect to the database
  await dbconnect();

  const url = new URL(request.url);
  const productName = url.searchParams.get("productName"); // Get productName from query params
    
  if (productName) {
    try {
      // Search for products with a name that matches the query (case-insensitive)
      const products = await Item.find({
        productName: { $regex: productName, $options: "i" }, // Partial match (case-insensitive)
      }).limit(10); // Limit results to 10 products

      return new NextResponse(JSON.stringify({ success: true, data: products }), {
        status: 200,
      });
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Error fetching products", error }),
        { status: 500 }
      );
    }
  } else {
    return new NextResponse(
      JSON.stringify({ success: false, message: "No product name provided" }),
      { status: 400 }
    );
  }
}
