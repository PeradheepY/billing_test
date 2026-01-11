import dbconnect from '@/db/dbconnect';
import Item from '@/models/Itemmodel';

export async function POST(req) {
  try {
    // Parse request body
    const body = await req.json();
    console.log('Received data:', body); // Debug: log incoming data
    
    // Ensure that numeric fields are handled as numbers
    const quantity = parseFloat(body.quantity) || 0;
    const purchaseprice = parseFloat(body.purchaseprice) || 0;
    const purchaseDiscount = parseFloat(body.purchaseDiscount) || 0;
    const price = parseFloat(body.price) || 0;
    const gstPercentage = parseFloat(body.gstPercentage) || 0;
    const tax = parseFloat(body.tax) || 0;
    const MRP = parseFloat(body.MRP) || 0;
    
    // Calculate total amount
    const total = quantity * price;
    
    // Format expireDate properly
    let formattedExpireDate = '';
    if (body.expireDate) {
      // Check if date is in DD/MM/YYYY format
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = body.expireDate.match(dateRegex);
      
      if (match) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD format which MongoDB can handle
        const [_, day, month, year] = match;
        formattedExpireDate = new Date(`${year}-${month}-${day}`);
      } else {
        // If it's already in a valid format, use it directly
        formattedExpireDate = new Date(body.expireDate);
      }
      
      // Validate that the result is a valid date
      if (isNaN(formattedExpireDate.getTime())) {
        throw new Error('Invalid date format. Please use DD/MM/YYYY or YYYY-MM-DD format.');
      }
    }
    
    // Connect to the database
    await dbconnect();
    
    // Create a new item in the database with explicit fields
    const newItem = await Item.create({
      productId: body.productId,
      productName: body.productName,
      category: body.category,
      quantity,
      purchaseprice,
      purchaseDiscount,
      price,
      unit: body.unit || 'pcs',
      hsnCode: body.hsnCode || '',
      gstPercentage,
      tax,
      MRP,
      expireDate: formattedExpireDate || null,
      amount: total
    });
    
    console.log('Item created:', newItem); // Debug: log created item
    
    // Return success response with a message
    return new Response(JSON.stringify({
      success: true,
      message: 'Item created successfully',
      data: newItem
    }), { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    
    // Return error response with a message
    return new Response(JSON.stringify({
      success: false,
      message: 'Error creating item',
      error: error.message
    }), { status: 500 });
  }
}