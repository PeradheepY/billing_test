import { NextResponse } from 'next/server';
import Billing from '@/models/BillingModel';
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
    
    // Fetch the billing data
    const billingData = await Billing.find(dateFilter)
      .sort({ purchaseDate: -1 })
      .lean();
    
    // Process the data to ensure GST fields are properly formatted
    const processedData = billingData.map(bill => {
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
          
          // Fixed tax amount logic - check for various possible tax field names
          processedItem.tax = processedBill.showGst && (
            item.tax !== undefined && item.tax !== null && item.tax !== ''
          ) ? item.tax : (
            processedBill.showGst && (
              item.taxAmount !== undefined && item.taxAmount !== null && item.taxAmount !== ''
            ) ? item.taxAmount : 0
          );
          
          // Alternative approach - check for multiple possible tax field names
          // processedItem.tax = processedBill.showGst ? (
          //   item.tax ?? item.taxAmount ?? item.gstAmount ?? 0
          // ) : 0;
          
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
    console.error('Error in billing API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}