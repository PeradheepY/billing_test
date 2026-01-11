import dbconnect from '@/db/dbconnect';
import CompanyCreditBilling from '@/models/CompanyCreditBill';
import { NextResponse } from 'next/server';

// GET - Fetch all items or filtered by date
/* export async function GET(req) {
  try {
    // Connect to the database
    await dbconnect();
    
    // Extract date filter parameters from the URL
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Build the query based on date filters
    let query = {};
    
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        // Set the start of the day for the start date
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        query.date.$gte = startDateObj;
      }
      
      if (endDate) {
        // Set the end of the day for the end date
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.date.$lte = endDateObj;
      }
    }
    
    // Fetch filtered company credit bills
    const bills = await CompanyCreditBilling.find(query);
    
    if (!bills.length) {
      return NextResponse.json({ message: 'No records found' }, { status: 404 });
    }
    
    // Transform the data structure (flattened structure for frontend use)
    const items = bills.flatMap((bill) =>
      bill.items.map((item) => ({
        id: item._id, // Include item ID for update/delete operations
        supplierName: bill.supplierName,
        invoiceNumber: bill.invoiceNumber,
        date: bill.date,
        productName: item.productName,
        purchaseprice: item.purchaseprice,
        purchaseDiscount: item.purchaseDiscount,
        quantity: item.quantity,
        unit: item.unit,
        gstPercentage: item.gstPercentage,
        hsnCode: item.hsnCode,
        amount: item.purchaseprice * item.quantity,
      }))
    );
    
    // Respond with the item data
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('Error fetching company credit records:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
} */

// POST - Add a new item
/* export async function POST(req) {
  try {
    await dbconnect();
    
    const itemData = await req.json();
    const { supplierName, invoiceNumber, productName, purchaseprice, purchaseDiscount, quantity, unit, gstPercentage, hsnCode } = itemData;
    
    // Check if a bill with the same supplier and invoice already exists
    let bill = await CompanyCreditBilling.findOne({
      supplierName,
      invoiceNumber
    });
    
    // If bill exists, add the new item to it
    if (bill) {
      bill.items.push({
        productName,
        purchaseprice,
        purchaseDiscount,
        quantity,
        unit,
        gstPercentage,
        hsnCode
      });
      
      await bill.save();
      
      // Find the newly added item for the response
      const addedItem = bill.items[bill.items.length - 1];
      
      return NextResponse.json({
        id: addedItem._id,
        supplierName,
        invoiceNumber,
        date: bill.date,
        productName,
        purchaseprice,
        purchaseDiscount,
        quantity,
        unit,
        gstPercentage,
        hsnCode
      }, { status: 201 });
    }
    
    // If bill doesn't exist, create a new one with the item
    const newBill = new CompanyCreditBilling({
      supplierName,
      invoiceNumber,
      date: new Date(), // Set current date for new bills
      items: [{
        productName,
        purchaseprice,
        purchaseDiscount,
        quantity,
        unit,
        gstPercentage,
        hsnCode
      }]
    });
    
    await newBill.save();
    
    // Get the newly created item
    const newItem = newBill.items[0];
    
    return NextResponse.json({
      id: newItem._id,
      supplierName,
      invoiceNumber,
      date: newBill.date,
      productName,
      purchaseprice,
      purchaseDiscount,
      quantity,
      unit,
      gstPercentage,
      hsnCode
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json(
      { message: 'Error adding item', error: error.message },
      { status: 500 }
    );
  }
} */

 
  
  // 🔧 Helper function to calculate totals
  function calculateGSTDetails(item) {
    const quantity = Number(item.quantity) || 0;
    const purchasePrice = Number(item.purchaseprice) || 0;
    const purchaseDiscount = Number(item.purchaseDiscount) || 0;
    const gstPercentage = Number(item.gstPercentage) || 0;
  
    const subtotal = purchasePrice * quantity;
    const discount = subtotal * (purchaseDiscount / 100);
    const netAmount = subtotal - discount;
  
    const gstRate = gstPercentage / 100;
    const gstAmount = netAmount * gstRate;
    const sgst = gstAmount / 2;
    const cgst = gstAmount / 2;
  
    const totalAmount = netAmount + sgst + cgst;
  
    return {
      netAmount,
      sgst,
      cgst,
      totalAmount,
    };
  }
  
  // ✅ GET - Fetch all items or filtered by date
  export async function GET(req) {
    try {
      await dbconnect();
  
      const url = new URL(req.url);
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
  
      let query = {};
  
      if (startDate || endDate) {
        query.date = {};
  
        if (startDate) {
          const startDateObj = new Date(startDate);
          startDateObj.setHours(0, 0, 0, 0);
          query.date.$gte = startDateObj;
        }
  
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          query.date.$lte = endDateObj;
        }
      }
  
      const bills = await CompanyCreditBilling.find(query);
  
      if (!bills.length) {
        return NextResponse.json({ message: 'No records found' }, { status: 404 });
      }
  
      const items = bills.flatMap((bill) =>
        bill.items.map((item) => {
          const { netAmount, sgst, cgst, totalAmount } = calculateGSTDetails(item);
  
          return {
            id: item._id,
            supplierName: bill.supplierName,
            invoiceNumber: bill.invoiceNumber,
            date: bill.date,
            productName: item.productName,
            purchaseprice: item.purchaseprice,
            purchaseDiscount: item.purchaseDiscount,
            quantity: item.quantity,
            unit: item.unit,
            gstPercentage: item.gstPercentage,
            hsnCode: item.hsnCode,
            netAmount,
            sgst,
            cgst,
            totalAmount,
          };
        })
      );
  
      return NextResponse.json(items, { status: 200 });
    } catch (error) {
      console.error('Error fetching company credit records:', error);
      return NextResponse.json(
        { message: 'Internal server error', error: error.message },
        { status: 500 }
      );
    }
  }
  
  // ✅ POST - Add a new item
  /* export async function POST(req) {
    try {
      await dbconnect();
  
      const itemData = await req.json();
      const {
        supplierName,
        invoiceNumber,
        productName,
        purchaseprice,
        purchaseDiscount,
        quantity,
        unit,
        gstPercentage,
        hsnCode
      } = itemData;
  
      let bill = await CompanyCreditBilling.findOne({
        supplierName,
        invoiceNumber
      });
  
      if (bill) {
        bill.items.push({
          productName,
          purchaseprice,
          purchaseDiscount,
          quantity,
          unit,
          gstPercentage,
          hsnCode
        });
  
        await bill.save();
  
        const addedItem = bill.items[bill.items.length - 1];
        const { netAmount, sgst, cgst, totalAmount } = calculateGSTDetails(addedItem);
  
        return NextResponse.json({
          id: addedItem._id,
          supplierName,
          invoiceNumber,
          date: bill.date,
          productName,
          purchaseprice,
          purchaseDiscount,
          quantity,
          unit,
          gstPercentage,
          hsnCode,
          netAmount,
          sgst,
          cgst,
          totalAmount,
        }, { status: 201 });
      }
  
      const newBill = new CompanyCreditBilling({
        supplierName,
        invoiceNumber,
        date: new Date(),
        items: [{
          productName,
          purchaseprice,
          purchaseDiscount,
          quantity,
          unit,
          gstPercentage,
          hsnCode
        }]
      });
  
      await newBill.save();
  
      const newItem = newBill.items[0];
      const { netAmount, sgst, cgst, totalAmount } = calculateGSTDetails(newItem);
  
      return NextResponse.json({
        id: newItem._id,
        supplierName,
        invoiceNumber,
        date: newBill.date,
        productName,
        purchaseprice,
        purchaseDiscount,
        quantity,
        unit,
        gstPercentage,
        hsnCode,
        netAmount,
        sgst,
        cgst,
        totalAmount,
      }, { status: 201 });
  
    } catch (error) {
      console.error('Error adding item:', error);
      return NextResponse.json(
        { message: 'Error adding item', error: error.message },
        { status: 500 }
      );
    }
  } */
    
    
    export async function POST(req) {
      try {
        await dbconnect();
        
        const itemData = await req.json();
        const {
          supplierName,
          invoiceNumber,
          productName,
          purchaseprice,
          purchaseDiscount,
          quantity,
          unit,
          gstPercentage,
          hsnCode
        } = itemData;
        
        // Create the item with calculated GST values
        const itemWithGST = {
          productName,
          purchaseprice,
          purchaseDiscount,
          quantity,
          unit,
          gstPercentage,
          hsnCode
        };
        
        const gstDetails = calculateGSTDetails(itemWithGST);
        itemWithGST.netAmount = gstDetails.netAmount;
        itemWithGST.sgst = gstDetails.sgst;
        itemWithGST.cgst = gstDetails.cgst;
        itemWithGST.amount = gstDetails.netAmount; // Store the net amount (before GST)
        
        let bill = await CompanyCreditBilling.findOne({
          supplierName,
          invoiceNumber
        });
        
        if (bill) {
          // Add the new item with GST details to the existing bill
          bill.items.push(itemWithGST);
          
          // Recalculate the bill subtotal
          bill.subtotal = bill.items.reduce((sum, item) => sum + parseFloat(item.netAmount || 0), 0);
          
          // Recalculate total GST and totalAmount
          if (bill.showGst) {
            const totalGst = bill.items.reduce((sum, item) => {
              return sum + parseFloat(item.sgst || 0) + parseFloat(item.cgst || 0);
            }, 0);
            bill.totalAmount = bill.subtotal + totalGst;
          } else {
            bill.totalAmount = bill.subtotal;
          }
          
          // If it's a credit bill, update the totalDue as well
          if (bill.isCreditBill) {
            bill.totalDue = bill.totalAmount;
          }
          
          await bill.save();
          
          const addedItem = bill.items[bill.items.length - 1];
          
          return NextResponse.json({
            id: addedItem._id,
            supplierName,
            invoiceNumber,
            date: bill.date,
            productName,
            purchaseprice,
            purchaseDiscount,
            quantity,
            unit,
            gstPercentage,
            hsnCode,
            netAmount: gstDetails.netAmount,
            sgst: gstDetails.sgst,
            cgst: gstDetails.cgst,
            totalAmount: gstDetails.totalAmount,
            billSubtotal: parseFloat(bill.subtotal.toString()),
            billTotalAmount: parseFloat(bill.totalAmount.toString()),
            billTotalDue: bill.isCreditBill ? parseFloat(bill.totalDue.toString()) : 0
          }, { status: 201 });
        }
        
        // Create a new bill with the item
        const newBill = new CompanyCreditBilling({
          supplierName,
          invoiceNumber,
          date: new Date(),
          items: [itemWithGST],
          subtotal: gstDetails.netAmount,
          totalAmount: bill?.showGst === false ? gstDetails.netAmount : gstDetails.totalAmount
        });
        
        if (newBill.isCreditBill) {
          newBill.totalDue = newBill.totalAmount;
        }
        
        await newBill.save();
        
        const newItem = newBill.items[0];
        
        return NextResponse.json({
          id: newItem._id,
          supplierName,
          invoiceNumber,
          date: newBill.date,
          productName,
          purchaseprice,
          purchaseDiscount,
          quantity,
          unit,
          gstPercentage,
          hsnCode,
          netAmount: gstDetails.netAmount,
          sgst: gstDetails.sgst,
          cgst: gstDetails.cgst,
          totalAmount: gstDetails.totalAmount,
          billSubtotal: parseFloat(newBill.subtotal.toString()),
          billTotalAmount: parseFloat(newBill.totalAmount.toString()),
          billTotalDue: newBill.isCreditBill ? parseFloat(newBill.totalDue.toString()) : 0
        }, { status: 201 });
        
      } catch (error) {
        console.error('Error adding item:', error);
        return NextResponse.json(
          { message: 'Error adding item', error: error.message },
          { status: 500 }
        );
      }
    }