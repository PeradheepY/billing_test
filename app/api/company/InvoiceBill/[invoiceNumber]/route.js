import dbconnect from "@/db/dbconnect";
import InvoiceBilling from "@/models/InvoicecreditbillModel";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await dbconnect();

    const { invoiceNumber } =await  params;

    const bill = await InvoiceBilling.findOne({ invoiceNumber });
    if (!bill) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(bill, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching invoice", error: error.message }, { status: 500 });
  }
}
