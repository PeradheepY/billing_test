import { NextResponse } from 'next/server';
import dbconnect from '@/db/dbconnect';
import CompanyCreditBilling from '@/models/CompanyCreditBill';
import CompanySettlement from '@/models/CompanySettlementbill';


export async function GET(request) {
  try {
    await dbconnect();
    
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get('invoiceNumber');
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
    if (invoiceNumber) creditBillsQuery.invoiceNumber = invoiceNumber;
    
    const [creditBills, settlements] = await Promise.all([
      CompanyCreditBilling.find({ ...creditBillsQuery, ...dateFilter })
        .sort({ date: -1 })
        .lean(),
      CompanySettlement.find(invoiceNumber ? { invoiceNumber, ...dateFilter } : dateFilter)
        .sort({ settlementDate: -1 })
        .lean()
    ]);

    // Group customers and calculate totals
    const customerSummary = creditBills.reduce((acc, bill) => {
      if (!acc[bill.invoiceNumber]) {
        acc[bill.invoiceNumber] = {
          supplierName: bill.supplierName,
          invoiceNumber: bill.invoiceNumber,
          totalCredit: 0,
          totalPaid: 0,
          transactions: [],
          bills: []
        };
      }
      
      acc[bill.invoiceNumber].totalCredit += bill.totalDue;
      acc[bill.invoiceNumber].bills.push(bill);
      acc[bill.invoiceNumber].transactions.push({
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
      const customer = customerSummary[settlement.invoiceNumber];
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
      totalCredit: customer.totalCredit,
      totalPaid: customer.totalPaid,
      balance: customer.totalCredit - customer.totalPaid, // Add this line
      transactions: customer.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    }));

    return NextResponse.json({
      success: true,
      data: invoiceNumber ? customersData[0] : customersData
    });

  } catch (error) {
    console.error('Error in credit history API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit history' },
      { status: 500 }
    );
  }
}