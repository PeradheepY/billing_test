import { NextResponse } from 'next/server';
import dbconnect from '@/db/dbconnect';
import CreditBilling from '@/models/CreditBillingModel';
import Settlement from '@/models/SettlementModel';

export async function GET(request) {
  try {
    await dbconnect();
    
    const { searchParams } = new URL(request.url);
    const customerPhone = searchParams.get('customerPhone');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build date filter if dates are provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $or: [
          {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          },
          {
            settlementDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        ]
      };
    }

    // Fetch credit bills
    const creditBillsQuery = { isCreditBill: true };
    if (customerPhone) creditBillsQuery.customerPhone = customerPhone;
    
    const [creditBills, settlements] = await Promise.all([
      CreditBilling.find({ ...creditBillsQuery, ...dateFilter })
        .sort({ date: -1 })
        .lean(),
      Settlement.find(customerPhone ? { customerPhone, ...dateFilter } : dateFilter)
        .sort({ settlementDate: -1 })
        .lean()
    ]);

    // Group customers and calculate totals
    const customerSummary = creditBills.reduce((acc, bill) => {
      if (!acc[bill.customerPhone]) {
        acc[bill.customerPhone] = {
          customerName: bill.customerName,
          customerPhone: bill.customerPhone,
          totalCredit: 0,
          totalPaid: 0,
          transactions: [],
          bills: []
        };
      }
      
      acc[bill.customerPhone].totalCredit += bill.totalDue;
      acc[bill.customerPhone].bills.push(bill);
      acc[bill.customerPhone].transactions.push({
        date: bill.date,
        type: 'CREDIT',
        amount: bill.totalDue,
        items: bill.items,
        id: bill._id
      });
      
      return acc;
    }, {});

    // Add settlement information
    settlements.forEach(settlement => {
      const customer = customerSummary[settlement.customerPhone];
      if (customer) {
        customer.totalPaid += settlement.settledAmount;
        customer.transactions.push({
          date: settlement.settlementDate,
          type: 'SETTLEMENT',
          amount: settlement.settledAmount,
          isPartial: settlement.isPartialSettlement,
          id: settlement._id
        });
      }
    });

    // Convert to array and sort transactions
    const customersData = Object.values(customerSummary).map(customer => ({
      ...customer,
      remainingDue: customer.totalCredit - customer.totalPaid,
      transactions: customer.transactions.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )
    }));

    return NextResponse.json({
      success: true,
      data: customerPhone ? customersData[0] : customersData
    });

  } catch (error) {
    console.error('Error in credit history API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit history' },
      { status: 500 }
    );
  }
}