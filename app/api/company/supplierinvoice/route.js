import dbconnect from "@/db/dbconnect";
import CompanyCreditBilling from "@/models/CompanyCreditBill";
import { NextResponse } from "next/server";

// GST calculation helper
function calculateTotalFromItems(items) {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const purchasePrice = Number(item.purchaseprice) || 0;
    const purchaseDiscount = Number(item.purchaseDiscount) || 0;
    const gstPercentage = Number(item.gstPercentage) || 0;

    const subtotal = purchasePrice * quantity;
    const discount = subtotal * (purchaseDiscount / 100);
    const netAmount = subtotal - discount;
    const gstAmount = netAmount * (gstPercentage / 100);

    const totalAmount = netAmount + gstAmount;
    return sum + totalAmount;
  }, 0);
}

export async function GET(request) {
  try {
    await dbconnect();

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const supplierName = searchParams.get("supplierName");
    const supplierAddress = searchParams.get("supplierAddress");

    const query = {};
    if (supplierName) query.supplierName = supplierName;
    if (supplierAddress) query.supplierAddress = supplierAddress;

    // ✅ Fetch and return individual supplier bills with recalculated totals
    if (supplierName || supplierAddress) {
      const bills = await CompanyCreditBilling.find(query)
        .sort({ purchaseDate: -1 })
        .lean();

      const formattedBills = bills.map((bill) => {
        const calculatedTotal = calculateTotalFromItems(bill.items || []);

        return {
          _id: bill._id,
          billNumber: bill.billNumber,
          supplierName: bill.supplierName,
          supplierAddress: bill.supplierAddress,
          invoiceNumber: bill.invoiceNumber,
          purchaseDate: bill.purchaseDate,
          discount: parseFloat(bill.discount?.toString() || "0"),
          subtotal: parseFloat(bill.subtotal?.toString() || "0"),
          totalAmount: parseFloat(calculatedTotal.toFixed(2)),
          previousDue: parseFloat(bill.previousDue?.toString() || "0"),
          totalDue: parseFloat(bill.totalDue?.toString() || "0"),
          isCreditBill: bill.isCreditBill,
          itemCount: bill.items?.length || 0,
        };
      });

      return NextResponse.json({ success: true, bills: formattedBills }, { status: 200 });
    }

    // ✅ Aggregate supplier summary with total invoice values
    const suppliers = await CompanyCreditBilling.aggregate([
      {
        $addFields: {
          calculatedTotalAmount: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: {
                  $add: [
                    {
                      $multiply: [
                        {
                          $subtract: [
                            { $multiply: ["$$item.purchaseprice", "$$item.quantity"] },
                            {
                              $multiply: [
                                { $multiply: ["$$item.purchaseprice", "$$item.quantity"] },
                                { $divide: ["$$item.purchaseDiscount", 100] }
                              ]
                            }
                          ]
                        },
                        { $add: [1, { $divide: ["$$item.gstPercentage", 100] }] }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: {
            supplierName: "$supplierName",
            supplierAddress: "$supplierAddress",
          },
          invoices: {
            $push: {
              id: "$_id",
              invoiceNumber: "$invoiceNumber",
              purchaseDate: "$purchaseDate",
              totalAmount: "$calculatedTotalAmount",
              previousDue: "$previousDue",
              totalDue: "$totalDue",
              itemCount: { $size: "$items" },
            },
          },
          totalAmount: { $sum: "$calculatedTotalAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id.supplierName",
          address: "$_id.supplierAddress",
          invoiceCount: "$count",
          totalAmount: { $round: ["$totalAmount", 2] },
          invoices: "$invoices",
        },
      },
      { $sort: { name: 1 } },
    ]);

    // ✅ Customer view for backward compatibility
    const customers = await CompanyCreditBilling.aggregate([
      {
        $group: {
          _id: "$invoiceNumber",
          supplierName: { $last: "$supplierName" },
          supplierAddress: { $last: "$supplierAddress" },
          invoiceNumber: { $last: "$invoiceNumber" },
          latestBill: { $last: "$$ROOT" },
        },
      },
      {
        $project: {
          id: "$_id",
          name: "$supplierName",
          phone: "$invoiceNumber",
          address: "$supplierAddress",
          previousDue: "$latestBill.totalDue",
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        suppliers,
        customers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching suppliers",
        error: error.message,
      },
      { status: 500 }
    );
  }
}



/* export async function GET(request) {
  try {
    await dbconnect();

    // Get query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const supplierName = searchParams.get('supplierName');
    const supplierAddress = searchParams.get('supplierAddress');
    
    // Build query based on parameters
    const query = {};
    if (supplierName) query.supplierName = supplierName;
    if (supplierAddress) query.supplierAddress = supplierAddress;

    // If searching for a specific supplier, get all their invoices
    if (supplierName || supplierAddress) {
      const bills = await CompanyCreditBilling.find(query)
        .sort({ purchaseDate: -1 })
        .lean();
      
      // Format the bills for response
      const formattedBills = bills.map(bill => ({
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
        isCreditBill: bill.isCreditBill,
        itemCount: bill.items?.length || 0
      }));
      
      return NextResponse.json(
        { success: true, bills: formattedBills },
        { status: 200 }
      );
    }

    // Fetch grouped suppliers with summary information
    const suppliers = await CompanyCreditBilling.aggregate([
      {
        $group: {
          _id: {
            supplierName: "$supplierName",
            supplierAddress: "$supplierAddress"
          },
          invoices: {
            $push: {
              id: "$_id",
              invoiceNumber: "$invoiceNumber",
              purchaseDate: "$purchaseDate",
              totalAmount: "$totalAmount",
              previousDue: "$previousDue",
              totalDue: "$totalDue",
              itemCount: { $size: "$items" }
            }
          },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id.supplierName",
          address: "$_id.supplierAddress",
          invoiceCount: "$count",
          totalAmount: "$totalAmount",
          invoices: "$invoices"
        }
      },
      { $sort: { name: 1 } }
    ]);

    // For backward compatibility, also return the customers format
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
      { 
        success: true, 
        suppliers,
        customers // Include for backward compatibility
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching suppliers", error: error.message },
      { status: 500 }
    );
  }
} */