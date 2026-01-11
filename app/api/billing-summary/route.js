import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Billing from "@/models/BillingModel";
import CreditBilling from "@/models/CreditBillingModel";
import Settlement from "@/models/SettlementModel";
import dbconnect from "@/db/dbconnect";

export async function GET() {
  try {
    await dbconnect();

    // Regular Bills Summary
    const regularBills = await Billing.aggregate([
      {
        $group: {
          _id: null,
          totalRegularAmount: { $sum: "$totalAmount" },
          totalRegularBills: { $sum: 1 },
          averageRegularAmount: { $avg: "$totalAmount" },
        },
      },
    ]);

    const regularData = regularBills[0] || {
      totalRegularAmount: 0,
      totalRegularBills: 0,
      averageRegularAmount: 0,
    };

    // Credit Bills Summary with Detailed Settlement Status
    const creditBills = await CreditBilling.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalCreditAmount: { $sum: "$totalAmount" },
                totalCreditBills: { $sum: 1 },
                totalDueAmount: { $sum: "$totalDue" },
                averageCreditAmount: { $avg: "$totalAmount" },
              },
            },
          ],
          settlementStatus: [
            {
              $group: {
                _id: "$isFullySettled",
                count: { $sum: 1 },
                amount: { $sum: "$totalAmount" },
              },
            },
          ],
        },
      },
    ]);

    const creditTotals = creditBills[0].totals[0] || {
      totalCreditAmount: 0,
      totalCreditBills: 0,
      totalDueAmount: 0,
      averageCreditAmount: 0,
    };

    // Settlement Summary with Partial Payments
    const settlementSummary = await Settlement.aggregate([
      {
        $facet: {
          totalSettled: [
            {
              $group: {
                _id: null,
                totalSettledAmount: { $sum: "$settledAmount" },
                totalSettlements: { $sum: 1 },
                averageSettlement: { $avg: "$settledAmount" },
              },
            },
          ],
          partialSettlements: [
            {
              $match: { isPartialSettlement: true },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalPartialAmount: { $sum: "$settledAmount" },
              },
            },
          ],
          monthlySettlements: [
            {
              $group: {
                _id: {
                  year: { $year: "$settlementDate" },
                  month: { $month: "$settlementDate" },
                },
                amount: { $sum: "$settledAmount" },
                count: { $sum: 1 },
              },
            },
            {
              $sort: {
                "_id.year": -1,
                "_id.month": -1,
              },
            },
            {
              $limit: 12,
            },
          ],
        },
      },
    ]);

    const settlementData = settlementSummary[0];
    const totalSettled = settlementData.totalSettled[0] || {
      totalSettledAmount: 0,
      totalSettlements: 0,
      averageSettlement: 0,
    };
    const partialSettlements = settlementData.partialSettlements[0] || {
      count: 0,
      totalPartialAmount: 0,
    };

    // Calculate remaining balance and other metrics
    const remainingBalance = creditTotals.totalCreditAmount - totalSettled.totalSettledAmount;
    const settlementRate = creditTotals.totalCreditBills > 0
      ? (totalSettled.totalSettlements / creditTotals.totalCreditBills) * 100
      : 0;

    // Compile comprehensive response
    const response = {
      regular: {
        totalAmount: regularData.totalRegularAmount,
        totalBills: regularData.totalRegularBills,
        averageAmount: regularData.averageRegularAmount,
      },
      credit: {
        totalAmount: creditTotals.totalCreditAmount,
        totalBills: creditTotals.totalCreditBills,
        totalDue: creditTotals.totalDueAmount,
        averageAmount: creditTotals.averageCreditAmount,
      },
      settlements: {
        totalSettled: totalSettled.totalSettledAmount,
        totalCount: totalSettled.totalSettlements,
        averageSettlement: totalSettled.averageSettlement,
        partialSettlements: {
          count: partialSettlements.count,
          amount: partialSettlements.totalPartialAmount,
        },
        remainingBalance: remainingBalance,
        settlementRate: settlementRate,
        monthlyTrend: settlementData.monthlySettlements,
      },
      summary: {
        totalTransactions: regularData.totalRegularBills + creditTotals.totalCreditBills,
        totalBusinessValue: regularData.totalRegularAmount + creditTotals.totalCreditAmount,
        outstandingAmount: remainingBalance,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching billing summary:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal Server Error",
        message: error.message 
      },
      { status: 500 }
    );
  }
}