import dbconnect from "@/db/dbconnect";
import CompanyCreditBilling from "@/models/CompanyCreditBill";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbconnect();

    // Fetch distinct customers with their latest bills
    const customers = await CompanyCreditBilling.aggregate([
      {
        $group: {
          _id: "$invoiceNumber",
          supplierName: { $last: "$supplierName" },
          supplierAddress: { $last: "$supplierAddress" },
          invoiceNumber: { $last: "$invoiceNumber" },
          latestBill: { $last: "$$ROOT" }
        }
      },
      {
        $project: {
          id: "$_id",
          name: "$supplierName",
          phone: "$invoiceNumber",
          address: "$supplierAddress",
          previousDue: "$latestBill.totalDue"
        }
      }
    ]);

    return NextResponse.json(
      { success: true, customers },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching customers" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
   
    const { 
      supplierName, 
      supplierAddress, 
      invoiceNumber, 
      items, 
      isCreditBill, 
      dueDate, 
      showGst, 
      billNumber,
      purchaseDate
    } = body;

    if (!supplierName || !supplierAddress || !invoiceNumber || !items || items.length === 0 ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }
    
    // Process items based on showGst flag
    const itemsWithDetails = items.map((item) => {
      // Explicitly calculate the amount based on purchaseprice and quantity
      const calculatedAmount = parseFloat(item.purchaseprice) * parseFloat(item.quantity);
      
      const processedItem = {
        productName: item.productName,
        Batch: item.Batch || "",
        purchaseprice: parseFloat(item.purchaseprice),
        price: parseFloat(item.price),
        quantity: parseFloat(item.quantity),
        amount: calculatedAmount,
        unit: item.unit,
        purchaseDiscount: parseFloat(item.purchaseDiscount || 0),
        expireDate: item.expireDate ? new Date(item.expireDate) : undefined
      };
      
      // Only include GST fields if showGst is true
      if (showGst === true) {
        processedItem.gstPercentage = parseFloat(item.gstPercentage || 0);
        processedItem.hsnCode = item.hsnCode || "";
      }
      
      return processedItem;
    });

    // Recalculate the subtotal based on the correctly calculated amounts
    const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate GST if showGst is true
    let totalAmount = subtotal;
    if (showGst === true) {
      const totalGst = itemsWithDetails.reduce((sum, item) => {
        const itemGst = (item.amount * (item.gstPercentage || 0)) / 100;
        return sum + itemGst;
      }, 0);
      totalAmount = subtotal + totalGst;
    }
    
    await dbconnect();

    // Find if the invoice number already exists
    const existingBill = await CompanyCreditBilling.findOne({ invoiceNumber });
    if (existingBill) {
      return NextResponse.json(
        { message: "Invoice number already exists" },
        { status: 400 }
      );
    }

    // Create the bill with invoice number as string (not parsed as number)
    const bill = await CompanyCreditBilling.create({
      billNumber,
      supplierName,
      supplierAddress,
      invoiceNumber,
      items: itemsWithDetails,
      subtotal,
      totalAmount, // Now properly calculated based on GST if applicable
      isCreditBill,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      dueDate: isCreditBill ? new Date(dueDate) : null,
      totalDue: isCreditBill ? totalAmount : 0, // Use totalAmount here
      previousDue: 0,
      showGst,
    });

    const parsedBill = {
      _id: bill._id,
      billNumber: bill.billNumber,
      supplierName: bill.supplierName,
      supplierAddress: bill.supplierAddress,
      invoiceNumber: bill.invoiceNumber,
      purchaseDate: bill.purchaseDate,
      subtotal: parseFloat(bill.subtotal.toString()),
      totalAmount: parseFloat(bill.totalAmount.toString()),
      previousDue: parseFloat(bill.previousDue ? bill.previousDue.toString() : '0'),
      totalDue: parseFloat(bill.totalDue.toString()),
      showGst: bill.showGst,
      items: bill.items.map(item => {
        const mappedItem = {
          productName: item.productName,
          Batch: item.Batch,
          quantity: parseFloat(item.quantity.toString()),
          purchaseprice: parseFloat(item.purchaseprice.toString()),
          amount: parseFloat(item.amount.toString()),
          unit: item.unit,
          purchaseDiscount: item.purchaseDiscount,
          expireDate: item.expireDate,
        };
        
        if (item.gstPercentage !== undefined) {
          mappedItem.gstPercentage = item.gstPercentage;
        }
        
        if (item.hsnCode !== undefined) {
          mappedItem.hsnCode = item.hsnCode;
        }
        
        return mappedItem;
      }),
    };

    return NextResponse.json(
      { message: "Bill generated successfully", bill: parsedBill },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating bill:", error.message || error);
    return NextResponse.json(
      { message: "Error generating bill", error: error.message || error },
      { status: 500 }
    );
  }
}