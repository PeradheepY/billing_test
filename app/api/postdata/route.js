import dbconnect from '@/db/dbconnect';
import Item from '@/models/Itemmodel';

export async function POST(req) {
  try {
    // Parse request body
    const body = await req.json();
    console.log(body);

    // Ensure that numeric fields are handled as regular numbers
    const quantity = Number(body.quantity);
    const purchaseprice = Number(body.purchaseprice);
    const price = Number(body.price);
    const MRP = Number(body.MRP);
    const gstPercentage = Number(body.gstPercentage);
    const tax=Number(body.tax);
    // Calculate total amount (use regular number calculation)
    const total = quantity * price;

    // Assign the total to the 'amount' field
    body.amount = total;

    // Connect to the database
    await dbconnect();

    // Create a new item in the database
    const newItem = await Item.create({
      ...body,
      quantity,
      purchaseprice,
      price,
      MRP,
      gstPercentage,
      hsnCode: body.hsnCode,
      tax
    });

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