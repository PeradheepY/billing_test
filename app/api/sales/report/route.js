// api/sales/report/route.js
import { NextResponse } from "next/server";
import dbconnect from "@/db/dbconnect";
import Sale from "@/models/Sale";

export async function GET(request) {
  try {
    await dbconnect();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "product"; // default group by product
    
    let query = {};
    
    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: start,
        $lte: end
      };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      query.date = {
        $gte: start
      };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $lte: end
      };
    }
    
    // For simple reports, just get the sales and calculate the totals in js
    const sales = await Sale.find(query).sort({ date: -1 });
    
    // Calculate total revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    
    // Calculate total items sold
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // Group sales by product
    const salesByProduct = {};
    sales.forEach(sale => {
      if (!salesByProduct[sale.productName]) {
        salesByProduct[sale.productName] = {
          productId: sale.productId,
          productName: sale.productName,
          totalQuantity: 0,
          totalRevenue: 0,
          unit: sale.unit
        };
      }
      
      salesByProduct[sale.productName].totalQuantity += sale.quantity;
      salesByProduct[sale.productName].totalRevenue += sale.totalPrice;
    });
    
    // Convert to array
    const productSalesArray = Object.values(salesByProduct);
    
    // For daily breakdown using MongoDB aggregation
    let dailySales = [];
    
    if (groupBy === "date") {
      const aggregateResult = await Sale.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" }
            },
            totalRevenue: { $sum: "$totalPrice" },
            totalQuantity: { $sum: "$quantity" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      dailySales = aggregateResult.map(day => {
        const date = new Date(day._id.year, day._id.month - 1, day._id.day);
        return {
          date: date.toISOString().split('T')[0],
          totalRevenue: day.totalRevenue,
          totalQuantity: day.totalQuantity,
          transactionCount: day.count
        };
      });
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalItemsSold,
        transactionCount: sales.length
      },
      productSales: productSalesArray,
      dailySales: groupBy === "date" ? dailySales : [],
      data: sales
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to generate sales report"
    }, { status: 500 });
  }
}