import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Billing from "@/models/BillingModel";
import CreditBilling from "@/models/CreditBillingModel";
import dbconnect from "@/db/dbconnect";

export async function GET() {
  try {
    await dbconnect();

    // Get the last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Regular Bills
    const regularBills = await Billing.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          regularBills: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Credit Bills
    const creditBills = await CreditBilling.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          creditBills: { $sum: 1 },
          totalCreditAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Combine the data
    const dailyStats = [];
    const dateMap = new Map();

    regularBills.forEach(item => {
      dateMap.set(item._id, {
        date: item._id,
        regularBills: item.regularBills,
        totalRegularAmount: item.totalAmount,
        creditBills: 0,
        totalCreditAmount: 0
      });
    });

    creditBills.forEach(item => {
      if (dateMap.has(item._id)) {
        const existing = dateMap.get(item._id);
        existing.creditBills = item.creditBills;
        existing.totalCreditAmount = item.totalCreditAmount;
      } else {
        dateMap.set(item._id, {
          date: item._id,
          regularBills: 0,
          totalRegularAmount: 0,
          creditBills: item.creditBills,
          totalCreditAmount: item.totalCreditAmount
        });
      }
    });

    dateMap.forEach(value => dailyStats.push(value));
    
    return NextResponse.json(dailyStats.sort((a, b) => a.date.localeCompare(b.date)));
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}