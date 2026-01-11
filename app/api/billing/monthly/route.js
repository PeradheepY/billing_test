
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Billing from "@/models/BillingModel";
import CreditBilling from "@/models/CreditBillingModel";
import dbconnect from "@/db/dbconnect";

export async function GET() {
  try {
    await dbconnect();

    // Get the last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Regular Bills
    const regularBills = await Billing.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          regularBills: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Credit Bills
    const creditBills = await CreditBilling.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          creditBills: { $sum: 1 },
          totalCreditAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Combine the data
    const monthlyStats = [];
    const monthMap = new Map();

    regularBills.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      monthMap.set(key, {
        year: item._id.year,
        month: item._id.month,
        regularBills: item.regularBills,
        totalRegularAmount: item.totalAmount,
        creditBills: 0,
        totalCreditAmount: 0
      });
    });

    creditBills.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthMap.has(key)) {
        const existing = monthMap.get(key);
        existing.creditBills = item.creditBills;
        existing.totalCreditAmount = item.totalCreditAmount;
      } else {
        monthMap.set(key, {
          year: item._id.year,
          month: item._id.month,
          regularBills: 0,
          totalRegularAmount: 0,
          creditBills: item.creditBills,
          totalCreditAmount: item.totalCreditAmount
        });
      }
    });

    monthMap.forEach(value => monthlyStats.push(value));
    
    return NextResponse.json(monthlyStats.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    }));
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}