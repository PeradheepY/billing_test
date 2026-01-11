// app/api/companies/[companyId]/route.js
import dbconnect from "@/db/dbconnect";
import CompanyCreditBill from "@/models/CompanyCreditBill";
import Settlement from "@/models/SettlementModel";
import { NextResponse } from "next/server";

// DELETE endpoint for removing company records
export async function DELETE(request, { params }) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID is required" },
        { status: 400 }
      );
    }

    await dbconnect();

    // Check if company has any unsettled bills
    const unsettledBills = await CompanyCreditBill.find({
      companyName: companyId,
      isFullySettled: { $ne: true }
    });

    if (unsettledBills.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Cannot delete company with unsettled bills. Please settle all outstanding bills first." 
        },
        { status: 400 }
      );
    }

    // Find all bills for the company
    const bills = await CompanyCreditBill.find({ companyName: companyId });
    const billIds = bills.map(bill => bill._id);

    // Delete all settlements related to this company
    await Settlement.deleteMany({
      $or: [
        { companyName: companyId },
        { fullySettledBills: { $in: billIds } },
        { 'partiallySettledBills.billId': { $in: billIds } }
      ]
    });

    // Delete all bills for the company
    await CompanyCreditBill.deleteMany({ companyName: companyId });

    return NextResponse.json({
      success: true,
      message: "Company and all related records deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving company details
export async function GET(request, { params }) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID is required" },
        { status: 400 }
      );
    }

    await dbconnect();

    // Get company details and aggregate total dues
    const companyDetails = await CompanyCreditBill.aggregate([
      {
        $match: { companyName: companyId }
      },
      {
        $group: {
          _id: "$companyName",
          companyName: { $first: "$companyName" },
          companyAddress: { $first: "$companyAddress" },
          panNumber: { $first: "$panNumber" },
          totalDue: {
            $sum: {
              $cond: [
                { $eq: ["$isFullySettled", false] },
                {
                  $add: [
                    "$previousDue",
                    {
                      $reduce: {
                        input: "$items",
                        initialValue: 0,
                        in: { 
                          $add: ["$$value", { $multiply: ["$$this.price", "$$this.quantity"] }] 
                        }
                      }
                    }
                  ]
                },
                0
              ]
            }
          },
          billCount: { $sum: 1 },
          settledBillCount: {
            $sum: { $cond: [{ $eq: ["$isFullySettled", true] }, 1, 0] }
          },
          lastBillDate: { $max: "$createdAt" },
          firstBillDate: { $min: "$createdAt" }
        }
      }
    ]);

    if (!companyDetails.length) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    // Get recent settlements
    const recentSettlements = await Settlement.find({
      companyName: companyId
    })
    .sort({ settlementDate: -1 })
    .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        ...companyDetails[0],
        recentSettlements
      }
    });
  } catch (error) {
    console.error("Error fetching company details:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating company information
export async function PATCH(request, { params }) {
  try {
    const { companyId } =await params;
    const updates = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID is required" },
        { status: 400 }
      );
    }

    await dbconnect();

    // Update company information across all bills
    const result = await CompanyCreditBill.updateMany(
      { companyName: companyId },
      {
        $set: {
          companyAddress: updates.companyAddress,
          panNumber: updates.panNumber,
          // Add other fields that should be updated
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Company information updated successfully",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}