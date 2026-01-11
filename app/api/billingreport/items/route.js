import { NextResponse } from 'next/server';
import dbconnect from '@/db/dbconnect';
import Billing from '@/models/BillingModel';
import CreditBilling from '@/models/CreditBillingModel';

export async function PUT(request) {
  try {
    await dbconnect();
    
    const { billId, itemIndex, updatedItem } = await request.json();
    
    if (!billId) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      );
    }
    
    // Try to find the bill in both collections
    let bill = await Billing.findOne({ billNumber: billId });
    let isCreditBill = false;
    
    if (!bill) {
      bill = await CreditBilling.findOne({ billNumber: billId });
      isCreditBill = true;
      
      if (!bill) {
        return NextResponse.json(
          { error: 'Bill not found' },
          { status: 404 }
        );
      }
    }
    
    // Update the specific item in the items array
    const items = [...bill.items];
    
    if (itemIndex >= 0 && itemIndex < items.length) {
      items[itemIndex] = updatedItem;
    } else {
      return NextResponse.json(
        { error: 'Item index out of range' },
        { status: 400 }
      );
    }
    
    // Recalculate total amount
    const totalAmount = items.reduce((sum, item) => 
      sum + (item.amount || item.quantity * item.price), 0
    );
    
    // Select the appropriate model
    const BillModel = isCreditBill ? CreditBilling : Billing;
    
    // Update the bill
    const updatedBill = await BillModel.findByIdAndUpdate(
      bill._id,
      {
        $set: {
          items: items,
          totalAmount: totalAmount,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Bill update error:', error);
    return NextResponse.json(
      { error: `Failed to update bill: ${error.message}` },
      { status: 500 }
    );
  }
}
export async function DELETE(request) {
    try {
        await dbconnect();
        const { billId, isCreditBill, itemIndices } = await request.json();

        // Validate required fields
        if (!billId || typeof isCreditBill !== 'boolean' || !Array.isArray(itemIndices)) {
            return NextResponse.json(
                { error: 'Missing or invalid required fields' },
                { status: 400 }
            );
        }

        // Select the appropriate model based on bill type
        const BillModel = isCreditBill ? CreditBilling : Billing;

        // Find the bill by billNumber instead of _id
        const bill = await BillModel.findOne({ billNumber: billId });

        if (!bill) {
            return NextResponse.json(
                { error: 'Bill not found' },
                { status: 404 }
            );
        }

        // Create new items array excluding the deleted indices
        const updatedItems = bill.items.filter((_, index) => !itemIndices.includes(index));

        // Recalculate total amount
        const totalAmount = updatedItems.reduce((sum, item) => 
            sum + (item.amount || item.quantity * item.price), 0
        );

        // Update the bill with new items and total
        const updatedBill = await BillModel.findByIdAndUpdate(
            bill._id, // Use the actual ObjectId from the found document
            {
                $set: {
                    items: updatedItems,
                    totalAmount: totalAmount,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        return NextResponse.json(updatedBill);

    } catch (error) {
        console.error('Error in DELETE /api/billingreport/items:', error);
        return NextResponse.json(
            { error: 'Failed to delete items', details: error.message },
            { status: 500 }
        );
    }
}