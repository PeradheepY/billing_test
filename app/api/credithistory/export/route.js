import dbconnect from "@/db/dbconnect";

export async function GET(request) {
    try {
      await dbconnect();
      const { searchParams } = new URL(request.url);
      const customerPhone = searchParams.get('customerPhone');
  
      if (!customerPhone) {
        return NextResponse.json(
          { error: 'Customer phone is required' },
          { status: 400 }
        );
      }
  
      // Get transaction history
      const history = await getCustomerTransactions(customerPhone, {});
      const { transactions } = history.data;
  
      // Convert to CSV
      const csvHeader = 'Date,Description,Credit Amount,Paid Amount,Balance\n';
      const csvRows = transactions.map(t => 
        `${format(new Date(t.date), 'yyyy-MM-dd')},${t.description},${t.credit},${t.paid},${t.balance}`
      ).join('\n');
      const csv = csvHeader + csvRows;
  
      // Return as downloadable file
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="credit_history_${customerPhone}_${format(new Date(), 'yyyy-MM-dd')}.csv"`
        }
      });
    } catch (error) {
      console.error('Export Error:', error);
      return NextResponse.json(
        { error: 'Failed to export credit history' },
        { status: 500 }
      );
    }
  }