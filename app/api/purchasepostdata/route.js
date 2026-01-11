import dbconnect from '@/db/dbconnect';
import Product from '@/models/Itemmodel';


export async function POST(req) {
  try {
    const body = await req.json();
    console.log('Received credit bill data:', body);

    // Connect to database
    await dbconnect();

    // Process items array to ensure numeric values
    const processedItems = body.items.map(item => ({
      ...item,
      purchaseprice: Number(item.purchaseprice),
      quantity: Number(item.quantity),
      gstPercentage: Number(item.gstPercentage || 0),
      purchaseDiscount: Number(item.purchaseDiscount || 0)
    }));

    // Calculate total amount including all items
    const totalAmount = processedItems.reduce((sum, item) => {
      const subtotal = item.purchaseprice * item.quantity;
      const discountAmount = subtotal * (item.purchaseDiscount / 100);
      return sum + (subtotal - discountAmount);
    }, 0);

    // Create the credit bill document
    const newCreditBill = await Product.create({
      shopName: body.shopName,
      supplierName: body.supplierName,
      supplierAddress: body.supplierAddress,
      invoiceNumber: body.invoiceNumber,
      billNumber: body.billNumber,
      purchaseDate: new Date(body.purchaseDate),
      dueDate: new Date(body.dueDate),
      previousDue: Number(body.previousDue || 0),
      items: processedItems,
      totalAmount,
      isCreditBill: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credit bill created successfully',
        data: newCreditBill
      }), 
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating credit bill:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error creating credit bill',
        error: error.message
      }), 
      { status: 500 }
    );  22
  }
}

// GET endpoint to fetch suppliers
export async function GET() {
  try {
    await dbconnect();
    
    // Fetch all unique suppliers from credit bills
    const suppliers = await CreditBill.find().distinct('supplierName');
    
    // Get detailed info for each supplier
    const supplierDetails = await Promise.all(
      suppliers.map(async (name) => {
        const latestBill = await CreditBill.findOne({ supplierName: name })
          .sort({ purchaseDate: -1 });
        
        return {
          id: latestBill._id,
          name: name,
          address: latestBill.supplierAddress,
          previousDue: latestBill.previousDue || 0
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        customers: supplierDetails
      }), 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching suppliers:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error fetching suppliers',
        error: error.message
      }), 
      { status: 500 }
    );
  }
}