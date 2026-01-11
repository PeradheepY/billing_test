import dbconnect from "@/db/dbconnect";
import Item from "@/models/Itemmodel";
import { NextResponse } from "next/server";

export async function GET() {
  await dbconnect();
  const data = await Item.find();

  // Create a response with CORS headers
  const response = new NextResponse(JSON.stringify({ success: true, data }));

  return response;
}
