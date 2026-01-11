// api/creditbill.js
import { NextResponse } from 'next/server';
import CreditBilling from '@/models/CreditBillingModel';
import dbconnect from '@/db/dbconnect';

export async function POST(request) {
  try {
    await dbconnect();
    
    // Get query parameters from the URL
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Build date filter if dates are provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        purchaseDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    // Add credit bill filter
    dateFilter.isCreditBill = true;
    
    // Fetch the credit billing data
    const creditBillingData = await CreditBilling.find(dateFilter)
      .sort({ purchaseDate: -1 })
      .lean();
    
    // Process the data to ensure GST fields are properly formatted
    const processedData = creditBillingData.map(bill => {
      // Make a shallow copy of the bill object
      const processedBill = { ...bill };
      
      // Process each item to ensure consistent property names
      if (processedBill.items && Array.isArray(processedBill.items)) {
        processedBill.items = processedBill.items.map(item => {
          const processedItem = { ...item };
          
          // Always add gstPercentage and hsnCode fields for consistent structure
          // If showGst is true, use the actual values; otherwise, set defaults
          processedItem.gstPercentage = processedBill.showGst && item.gstPercentage !== undefined
            ? item.gstPercentage
            : 0;
            
          processedItem.hsnCode = processedBill.showGst && (item.hsnCode || item.hsn)
            ? (item.hsnCode || item.hsn)
            : '';
          
          return processedItem;
        });
      }
      
      return processedBill;
    });
    
    return NextResponse.json({
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('Error in credit billing API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit billing data' },
      { status: 500 }
    );
  }
}