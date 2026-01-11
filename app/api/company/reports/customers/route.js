import dbconnect from "@/db/dbconnect";
import CompanyCreditBilling from "@/models/CompanyCreditBill";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { start, end } = await request.json();
    
    if (!start || !end) {
      return NextResponse.json(
        { success: false, message: "Start and end dates are required" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await dbconnect();
    
    // Query the database with proper totalDue calculation
    const customers = await CompanyCreditBilling.aggregate([
      {
        $match: {
          isCreditBill: true,
          purchaseDate: {
            $gte: new Date(start),
            $lte: new Date(end)
          },
        },
      },
      {
        $addFields: {
          // Check if items array exists and has elements
          hasItems: { $gt: [{ $size: { $ifNull: ["$items", []] } }, 0] },
          calculatedItems: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$items", []] } }, 0] },
              // If items exist, calculate from items
              {
                $map: {
                  input: "$items",
                  as: "item",
                  in: {
                    $let: {
                      vars: {
                        purchasePrice: { $toDouble: { $ifNull: ["$$item.purchaseprice", 0] } },
                        quantity: { $toDouble: { $ifNull: ["$$item.quantity", 0] } },
                        discount: { $toDouble: { $ifNull: ["$$item.purchaseDiscount", 0] } },
                        gst: { $toDouble: { $ifNull: ["$$item.gstPercentage", 0] } }
                      },
                      in: {
                        productName: "$$item.productName",
                        subtotal: { $multiply: ["$$purchasePrice", "$$quantity"] },
                        discountAmount: { 
                          $multiply: [
                            { $multiply: ["$$purchasePrice", "$$quantity"] }, 
                            { $divide: ["$$discount", 100] }
                          ] 
                        },
                        afterDiscount: {
                          $subtract: [
                            { $multiply: ["$$purchasePrice", "$$quantity"] },
                            { $multiply: [
                              { $multiply: ["$$purchasePrice", "$$quantity"] }, 
                              { $divide: ["$$discount", 100] }
                            ]}
                          ]
                        },
                        gstPercentage: "$$gst",
                        gstAmount: {
                          $multiply: [
                            { $subtract: [
                              { $multiply: ["$$purchasePrice", "$$quantity"] },
                              { $multiply: [
                                { $multiply: ["$$purchasePrice", "$$quantity"] }, 
                                { $divide: ["$$discount", 100] }
                              ]}
                            ]},
                            { $divide: ["$$gst", 100] }
                          ]
                        },
                        finalAmount: {
                          $add: [
                            { $subtract: [
                              { $multiply: ["$$purchasePrice", "$$quantity"] },
                              { $multiply: [
                                { $multiply: ["$$purchasePrice", "$$quantity"] }, 
                                { $divide: ["$$discount", 100] }
                              ]}
                            ]},
                            { $multiply: [
                              { $subtract: [
                                { $multiply: ["$$purchasePrice", "$$quantity"] },
                                { $multiply: [
                                  { $multiply: ["$$purchasePrice", "$$quantity"] }, 
                                  { $divide: ["$$discount", 100] }
                                ]}
                              ]},
                              { $divide: ["$$gst", 100] }
                            ]}
                          ]
                        }
                      }
                    }
                  }
                }
              },
              // If no items, use an empty array
              []
            ]
          }
        }
      },
      {
        $addFields: {
          // Calculate subtotal before GST
          subtotalBeforeGst: {
            $cond: [
              "$hasItems",
              // If has items, calculate from items
              {
                $reduce: {
                  input: "$calculatedItems",
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.afterDiscount"] }
                }
              },
              // If no items, use stored values for calculation
              {
                $cond: [
                  { $and: [
                    { $ne: ["$subtotal", null] },
                    { $ne: ["$subtotal", 0] }
                  ]},
                  // If subtotal exists, use it
                  "$subtotal",
                  // Otherwise, use totalDue as base for working backwards
                  {
                    $divide: [
                      "$totalDue",
                      { $add: [1, { $divide: [{ $ifNull: ["$gstPercentage", 0] }, 100] }] }
                    ]
                  }
                ]
              }
            ]
          },
          // Calculate total GST amount
          totalGstAmount: {
            $cond: [
              "$hasItems",
              // If has items, calculate from items
              {
                $reduce: {
                  input: "$calculatedItems",
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.gstAmount"] }
                }
              },
              // If no items, calculate from stored values
              {
                $multiply: [
                  // Get the subtotal after discount
                  {
                    $cond: [
                      { $and: [
                        { $ne: ["$subtotal", null] },
                        { $ne: ["$subtotal", 0] }
                      ]},
                      // If subtotal exists, calculate with discount
                      {
                        $subtract: [
                          "$subtotal",
                          { $multiply: ["$subtotal", { $divide: [{ $ifNull: ["$discount", 0] }, 100] }] }
                        ]
                      },
                      // Otherwise, use totalDue basis
                      {
                        $divide: [
                          "$totalDue",
                          { $add: [1, { $divide: [{ $ifNull: ["$gstPercentage", 0] }, 100] }] }
                        ]
                      }
                    ]
                  },
                  // Multiply by GST percentage
                  { $divide: [{ $ifNull: ["$gstPercentage", 0] }, 100] }
                ]
              }
            ]
          },
          // Calculate total with GST (final totalDue)
          calculatedTotalDue: {
            $cond: [
              "$hasItems",
              // If has items, sum up the final amounts
              {
                $reduce: {
                  input: "$calculatedItems",
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.finalAmount"] }
                }
              },
              // If no items, use the stored totalDue
              "$totalDue"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$invoiceNumber",
          supplierName: { $first: "$supplierName" },
          invoiceNumber: { $first: "$invoiceNumber" },
          subtotalBeforeGst: { $first: "$subtotalBeforeGst" },
          totalGstAmount: { $first: "$totalGstAmount" },
          // Use calculated totalDue which includes discounts and GST
          totalDue: { $sum: "$calculatedTotalDue" },
          lastBillDate: { $max: "$purchaseDate" },
        },
      },
      {
        $project: {
          _id: 0,
          supplierName: 1,
          invoiceNumber: 1,
          subtotalBeforeGst: { $round: ["$subtotalBeforeGst", 2] },
          totalGstAmount: { $round: ["$totalGstAmount", 2] },
          totalDue: { $round: ["$totalDue", 2] },
          lastBillDate: 1,
        }
      }
    ]);
    
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error("Error fetching billing data:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}