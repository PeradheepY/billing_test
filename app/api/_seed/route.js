import dbconnect from '@/db/dbconnect';
import ProductData from '@/db/db.json';
import Item from '@/models/Itemmodel';

export async function GET(req) {
  try {
    // Connect to the database
    await dbconnect();

    // Delete existing data
    await Item.deleteMany();
    console.log('Products deleted!');

    // Insert new data
    await Item.insertMany(ProductData);
    console.log('All products added!');

    // Send success response
    return new Response(JSON.stringify({ message: 'Database seeded successfully!' }), { status: 200 });
  } catch (error) {
    console.error('Error seeding database:', error);

    // Send error response
    return new Response(JSON.stringify({ message: 'Failed to seed database', error: error.message }), { status: 500 });
  }
}
