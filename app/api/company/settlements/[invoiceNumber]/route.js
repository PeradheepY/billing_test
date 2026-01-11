import dbconnect from "@/db/dbconnect"; 
import CompanyCreditBilling from "@/models/CompanyCreditBill"; 
import CompanySettlement from "@/models/CompanySettlementbill"; 
import { NextResponse } from "next/server";  
 

export async function POST(request, { params }) {   
  try {     
    const { invoiceNumber } = params;
    const { partialAmount } = await request.json(); 
    
    if (!invoiceNumber) {       
      return NextResponse.json(         
        { success: false, message: "Invoice number is required" },         
        { status: 400 }       
      );     
    }
    
    if (!partialAmount || partialAmount <= 0) {       
      return NextResponse.json(         
        { success: false, message: "Valid payment amount is required" },         
        { status: 400 }       
      );     
    }
    
    await dbconnect();
    
    // First, get the bills and log what's actually in the database
    const creditBills = await CompanyCreditBilling.find({       
      invoiceNumber: invoiceNumber,       
      isCreditBill: true,       
      totalDue: { $gt: 0 }     
    }).sort({ purchaseDate: 1 });
    
    console.log("Database bill values:", creditBills.map(bill => ({
      id: bill._id,
      totalDue: bill.totalDue,
      // Log other relevant fields
      items: bill.items ? bill.items.length : 0
    })));
    
    if (creditBills.length === 0) {       
      return NextResponse.json(         
        { success: false, message: "No pending bills found" },         
        { status: 404 }       
      );     
    }
    
    let remainingPayment = parseFloat(partialAmount);     
    const settledBills = [];     
    const partiallySettledBills = [];
    
    // Process bills one by one until the partial payment is exhausted     
    for (const bill of creditBills) {       
      if (remainingPayment <= 0) break;
      
      // Calculate correct total based on items if available
      let correctTotalDue = bill.totalDue; // Default to stored totalDue
      
      // Check if items exist and have GST/discount information
      if (bill.items && bill.items.length > 0) {
        correctTotalDue = 0;
        for (const item of bill.items) {
          const gstRate = parseFloat(item.gstPercentage || 0) / 100; // Convert percentage to decimal
          const discountRate = parseFloat(item.purchaseDiscount || 0) / 100; // Convert percentage to decimal
          
          const basePrice = Number(item.purchaseprice) * Number(item.quantity);
          const discountAmount = basePrice * discountRate;
          const priceAfterDiscount = basePrice - discountAmount;
          const gstAmount = priceAfterDiscount * gstRate;
          const itemTotal = priceAfterDiscount + gstAmount;
          
          correctTotalDue += itemTotal;
        }
        // Round to 2 decimal places for currency
        correctTotalDue = Number(correctTotalDue.toFixed(2));
      }
      
      // For logging/debugging
      console.log("Bill calculation:", {
        billId: bill._id,
        storedTotalDue: bill.totalDue,
        calculatedTotalDue: correctTotalDue,
        itemCount: bill.items ? bill.items.length : 0
      });
      
      if (remainingPayment >= correctTotalDue) {         
        // Full settlement for this bill         
        settledBills.push(bill._id);         
        remainingPayment -= correctTotalDue;         
        await CompanyCreditBilling.findByIdAndUpdate(bill._id, {           
          totalDue: 0,           
          settledAt: new Date(),           
          isFullySettled: true         
        });       
      } else {         
        // Partial settlement for this bill         
        const newDue = Number((correctTotalDue - remainingPayment).toFixed(2));
        
        partiallySettledBills.push({           
          billId: bill._id,           
          originalAmount: correctTotalDue,
          paidAmount: remainingPayment,  
          remainingDue: newDue
        });         
        
        await CompanyCreditBilling.findByIdAndUpdate(bill._id, {           
          totalDue: newDue,           
          lastPartialPayment: {             
            amount: remainingPayment,             
            date: new Date()           
          },           
          isFullySettled: false         
        });         
        
        remainingPayment = 0;       
      }     
    }
    
    // Create settlement record     
    const settlement = await CompanySettlement.create({       
      invoiceNumber: invoiceNumber,       
      settledAmount: partialAmount,       
      settlementDate: new Date(),       
      fullySettledBills: settledBills,       
      partiallySettledBills: partiallySettledBills,       
      isPartialSettlement: true     
    });
    
    // Calculate remaining total due     
    const remainingTotalDue = await CompanyCreditBilling.aggregate([       
      {         
        $match: {           
          invoiceNumber: invoiceNumber,           
          totalDue: { $gt: 0 },         
        },       
      },       
      {         
        $group: {           
          _id: null,           
          totalRemaining: { $sum: "$totalDue" },         
        },       
      },       
      {         
        $project: { totalRemaining: 1, _id: 0 },       
      },     
    ]);
    
    return NextResponse.json({       
      success: true,       
      settlement,       
      remainingBalance: remainingTotalDue[0]?.totalRemaining || 0,       
      fullySettledBills: settledBills,       
      partiallySettledBills     
    });    
  } catch (error) {     
    console.error("Error processing partial settlement:", error);     
    return NextResponse.json(       
      { success: false, message: "Server error", error: error.message },       
      { status: 500 }     
    );   
  } 
}

/* export async function POST(request, { params }) {   
  try {     
    const { invoiceNumber } =  params;  // Change customerId to invoiceNumber to match what's being passed
    const { partialAmount } = await request.json(); 
    
    if (!invoiceNumber) {       
      return NextResponse.json(         
        { success: false, message: "Invoice number is required" },         
        { status: 400 }       
      );     
    }
    
    if (!partialAmount || partialAmount <= 0) {       
      return NextResponse.json(         
        { success: false, message: "Valid payment amount is required" },         
        { status: 400 }       
      );     
    }
    
    await dbconnect();
    
    // Get all unpaid credit bills for the customer with this invoice number    
    const creditBills = await CompanyCreditBilling.find({       
      invoiceNumber: invoiceNumber,       
      isCreditBill: true,       
      totalDue: { $gt: 0 }     
    }).sort({ purchaseDate: 1 }); // Changed billDate to purchaseDate to match your schema
    
    if (creditBills.length === 0) {       
      return NextResponse.json(         
        { success: false, message: "No pending bills found" },         
        { status: 404 }       
      );     
    }
    
    let remainingPayment = partialAmount;     
    const settledBills = [];     
    const partiallySettledBills = [];
    
    // Process bills one by one until the partial payment is exhausted     
    for (const bill of creditBills) {       
      if (remainingPayment <= 0) break;
      
      if (remainingPayment >= bill.totalDue) {         
        // Full settlement for this bill         
        settledBills.push(bill._id);         
        remainingPayment -= bill.totalDue;         
        await CompanyCreditBilling.findByIdAndUpdate(bill._id, {           
          totalDue: 0,           
          settledAt: new Date(),           
          isFullySettled: true         
        });       
      } else {         
        // Partial settlement for this bill         
        const newDue = bill.totalDue - remainingPayment;         
        partiallySettledBills.push({           
          billId: bill._id,           
          originalAmount: bill.totalDue,           
          paidAmount: remainingPayment,  
          remainingDue: newDue,
      
        });         
        await CompanyCreditBilling.findByIdAndUpdate(bill._id, {           
          totalDue: newDue,           
          lastPartialPayment: {             
            amount: remainingPayment,             
            date: new Date()           
          },           
          isFullySettled: false         
        });         
        remainingPayment = 0;       
      }     
    }
    
    // Create settlement record     
    const settlement = await CompanySettlement.create({       
      invoiceNumber: invoiceNumber,       
      settledAmount: partialAmount,       
      settlementDate: new Date(),       
      fullySettledBills: settledBills,       
      partiallySettledBills: partiallySettledBills,       
      isPartialSettlement: true     
    });
    
    // Calculate remaining total due     
    const remainingTotalDue = await CompanyCreditBilling.aggregate([       
      {         
        $match: {           
          invoiceNumber: invoiceNumber,           
          totalDue: { $gt: 0 },         
        },       
      },       
      {         
        $group: {           
          _id: null,           
          totalRemaining: { $sum: "$totalDue" },         
        },       
      },       
      {         
        $project: { totalRemaining: 1, _id: 0 },       
      },     
    ]);
    
    return NextResponse.json({       
      success: true,       
      settlement,       
      remainingBalance: remainingTotalDue[0]?.totalRemaining || 0,       
      fullySettledBills: settledBills,       
      partiallySettledBills     
    });    
  } catch (error) {     
    console.error("Error processing partial settlement:", error);     
    return NextResponse.json(       
      { success: false, message: "Server error", error: error.message },       
      { status: 500 }     
    );   
  } 
} */