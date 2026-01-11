


// PUT - Update an existing item
/* export async function PUT(req, { params }) {
  try {
    await dbconnect();
    
    const { id } = params;
    const updateData = await req.json();
    
    // Find the bill containing the item to update
    const bill = await CompanyCreditBilling.findOne({
      'items._id': id
    });
    
    if (!bill) {
      return NextResponse.json(
        { message: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Find the specific item in the items array
    const itemIndex = bill.items.findIndex(item => item._id.toString() === id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { message: 'Item not found in bill' },
        { status: 404 }
      );
    }
    
    // Update the item properties
    if (updateData.productName) bill.items[itemIndex].productName = updateData.productName;
    if (updateData.purchaseprice !== undefined) bill.items[itemIndex].purchaseprice = updateData.purchaseprice;
    if (updateData.purchaseDiscount !== undefined) bill.items[itemIndex].purchaseDiscount = updateData.purchaseDiscount;
    if (updateData.quantity !== undefined) bill.items[itemIndex].quantity = updateData.quantity;
    if (updateData.unit) bill.items[itemIndex].unit = updateData.unit;
    if (updateData.gstPercentage !== undefined) bill.items[itemIndex].gstPercentage = updateData.gstPercentage;
    if (updateData.hsnCode) bill.items[itemIndex].hsnCode = updateData.hsnCode;
    
    await bill.save();
    
    // Return the updated item
    return NextResponse.json({
      id: bill.items[itemIndex]._id,
      supplierName: bill.supplierName,
      invoiceNumber: bill.invoiceNumber,
      date: bill.date,
      productName: bill.items[itemIndex].productName,
      purchaseprice: bill.items[itemIndex].purchaseprice,
      purchaseDiscount: bill.items[itemIndex].purchaseDiscount,
      quantity: bill.items[itemIndex].quantity,
      unit: bill.items[itemIndex].unit,
      gstPercentage: bill.items[itemIndex].gstPercentage,
      hsnCode: bill.items[itemIndex].hsnCode
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { message: 'Error updating item', error: error.message },
      { status: 500 }
    );
  }
} */

// DELETE - Delete an item
/* export async function DELETE(req, { params }) {
  try {
    await dbconnect();
    
    const { id } = params;
    
    // Find the bill containing the item to delete
    const bill = await CompanyCreditBilling.findOne({
      'items._id': id
    });
    
    if (!bill) {
      return NextResponse.json(
        { message: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Find the specific item in the items array
    const itemIndex = bill.items.findIndex(item => item._id.toString() === id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { message: 'Item not found in bill' },
        { status: 404 }
      );
    }
    
    // Store item details for response before removing
    const deletedItem = {
      id: bill.items[itemIndex]._id,
      supplierName: bill.supplierName,
      invoiceNumber: bill.invoiceNumber,
      productName: bill.items[itemIndex].productName
    };
    
    // Remove the item from the items array
    bill.items.splice(itemIndex, 1);
    
    // If there are no more items in the bill, delete the entire bill
    if (bill.items.length === 0) {
      await CompanyCreditBilling.deleteOne({ _id: bill._id });
    } else {
      // Otherwise just save the updated bill
      await bill.save();
    }
    
    return NextResponse.json(
      {
        message: 'Item deleted successfully',
        deletedItem
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { message: 'Error deleting item', error: error.message },
      { status: 500 }
    );
  }
} */

 
  import dbconnect from '@/db/dbconnect';
  import CompanyCreditBilling from '@/models/CompanyCreditBill';
  import { NextResponse } from 'next/server';


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

// ✅ PUT - Update an existing item
export async function PUT(req, { params }) {
  try {
    await dbconnect();
    
    const { id } = params;
    const updateData = await req.json();
    
    const bill = await CompanyCreditBilling.findOne({
      'items._id': id
    });
    
    if (!bill) {
      return NextResponse.json(
        { message: 'Item not found' },
        { status: 404 }
      );
    }
    
    const itemIndex = bill.items.findIndex(item => item._id.toString() === id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { message: 'Item not found in bill' },
        { status: 404 }
      );
    }
    
    // Update the item fields
    const item = bill.items[itemIndex];
    if (updateData.productName !== undefined) item.productName = updateData.productName;
    if (updateData.purchaseprice !== undefined) item.purchaseprice = updateData.purchaseprice;
    if (updateData.purchaseDiscount !== undefined) item.purchaseDiscount = updateData.purchaseDiscount;
    if (updateData.quantity !== undefined) item.quantity = updateData.quantity;
    if (updateData.unit !== undefined) item.unit = updateData.unit;
    if (updateData.gstPercentage !== undefined) item.gstPercentage = updateData.gstPercentage;
    if (updateData.hsnCode !== undefined) item.hsnCode = updateData.hsnCode;
    
    // Calculate updated GST values for the item
    const gstDetails = calculateGSTDetails(item);
    item.netAmount = gstDetails.netAmount;
    item.sgst = gstDetails.sgst;
    item.cgst = gstDetails.cgst;
    
    // Update the amount field to reflect the net amount (before GST)
    item.amount = gstDetails.netAmount;
    
    // Recalculate the bill subtotal (sum of all item net amounts)
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
    
    // Save the updated bill
    await bill.save();
    
    // Use the already calculated GST details for the response
    return NextResponse.json({
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
      netAmount: gstDetails.netAmount,
      sgst: gstDetails.sgst,
      cgst: gstDetails.cgst,
      totalAmount: gstDetails.totalAmount,
      // Include updated bill totals
      billSubtotal: parseFloat(bill.subtotal.toString()),
      billTotalAmount: parseFloat(bill.totalAmount.toString()),
      billTotalDue: bill.isCreditBill ? parseFloat(bill.totalDue.toString()) : 0
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { message: 'Error updating item', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Delete an item
export async function DELETE(req, { params }) {
  try {
    await dbconnect();

    const { id } = params;

    const bill = await CompanyCreditBilling.findOne({
      'items._id': id
    });

    if (!bill) {
      return NextResponse.json(
        { message: 'Item not found' },
        { status: 404 }
      );
    }

    const itemIndex = bill.items.findIndex(item => item._id.toString() === id);

    if (itemIndex === -1) {
      return NextResponse.json(
        { message: 'Item not found in bill' },
        { status: 404 }
      );
    }

    const deletedItem = {
      id: bill.items[itemIndex]._id,
      supplierName: bill.supplierName,
      invoiceNumber: bill.invoiceNumber,
      productName: bill.items[itemIndex].productName
    };

    bill.items.splice(itemIndex, 1);

    if (bill.items.length === 0) {
      await CompanyCreditBilling.deleteOne({ _id: bill._id });
    } else {
      await bill.save();
    }

    return NextResponse.json(
      {
        message: 'Item deleted successfully',
        deletedItem
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { message: 'Error deleting item', error: error.message },
      { status: 500 }
    );
  }
}
