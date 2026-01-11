import dbconnect from '@/db/dbconnect';
import Billing from '@/models/BillingModel';
import CreditBilling from '@/models/CreditBillingModel';
import { NextResponse } from 'next/server';

// GET handler for fetching bills within a date range
export async function GET(request) {
    try {
        await dbconnect();

        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        // Create start and end dates
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        // Fetch both cash and credit bills within the date range
        const [cashBills, creditBills] = await Promise.all([
            Billing.find({
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ date: -1 }),
            CreditBilling.find({
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ date: -1 })
        ]);

        // Combine and format the bills
        const allBills = [
            ...cashBills.map(bill => ({
                ...bill.toObject(),
                isCreditBill: false
            })),
            ...creditBills.map(bill => ({
                ...bill.toObject(),
                isCreditBill: true
            }))
        ];

        // Sort combined bills by date (most recent first)
        allBills.sort((a, b) => new Date(b.date) - new Date(a.date));

        return NextResponse.json(allBills);
    } catch (error) {
        console.error('Sales report error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sales report' },
            { status: 500 }
        );
    }
}

// PUT handler for updating bill items
export async function PUT(request) {
    try {
        await dbconnect();

        const { billId, isCreditBill, items, action = 'update' } = await request.json();

        // Select the appropriate model based on bill type
        const BillModel = isCreditBill ? CreditBilling : Billing;

        // Find the bill
        const bill = await BillModel.findById(billId);

        if (!bill) {
            return NextResponse.json(
                { error: 'Bill not found' },
                { status: 404 }
            );
        }

        if (action === 'delete_item') {
            // Filter out the deleted item and recalculate total
            const updatedItems = bill.items.filter((_, index) => !items.includes(index));
            const totalAmount = updatedItems.reduce((sum, item) => sum + (item.amount || item.quantity * item.price), 0);

            const updatedBill = await BillModel.findByIdAndUpdate(
                billId,
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
        } else {
            // Regular update
            const totalAmount = items.reduce((sum, item) => sum + (item.amount || item.quantity * item.price), 0);

            const updatedBill = await BillModel.findByIdAndUpdate(
                billId,
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
        }
    } catch (error) {
        console.error('Bill update error:', error);
        return NextResponse.json(
            { error: 'Failed to update bill' },
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

        // Find the bill
        const bill = await BillModel.findById(billId);

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
            billId,
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
        console.error('Error in DELETE /api/pdfdaily/items:', error);
        return NextResponse.json(
            { error: 'Failed to delete items' },
            { status: 500 }
        );
    }
}
  