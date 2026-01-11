import dbconnect from "@/db/dbconnect"; 
import Billing from "@/models/BillingModel"; 
import { NextResponse } from "next/server";   

export async function GET() {   
  try {     
    await dbconnect();          
    // Fetch distinct customers with their latest information     
    const customers = await Billing.aggregate([       
      {         
        $group: {           
          _id: "$customerPhone",           
          customerName: { $last: "$customerName" },           
          customerPhone: { $last: "$customerPhone" },
          aadharNumber: { $last: "$aadharNumber" },
          villageArea: { $last: "$villageArea" }
        }       
      },       
      {         
        $project: {           
          id: "$_id",           
          name: "$customerName",           
          phone: "$customerPhone" ,
          aadharNumber: "$aadharNumber",
          villageArea: "$villageArea"
        }       
      }     
    ]);      
    
    return NextResponse.json(       
      {          
        success: true,          
        data: customers       
      },       
      { status: 200 }     
    );   
  } catch (error) {     
    console.error("Error fetching customers:", error);     
    return NextResponse.json(       
      {          
        success: false,          
        message: "Error fetching customers",         
        data: []       
      },       
      { status: 500 }     
    );   
  } 
}   

export async function POST(request) {
  try {
    // Parse the request JSON and log it for debugging
    const reqData = await request.json();
    console.log("Request data received:", {
      showGst: reqData.showGst,
      type: typeof reqData.showGst
    });
    
    const { customerName, customerPhone, aadharNumber, villageArea,billNumber, items, showGst, paymentMethod, purchaseDate } = reqData;
    
    // Properly convert showGst to boolean regardless of how it's sent
    const showGstBoolean = showGst === true || showGst === "true";
    console.log("Converted showGst value:", showGstBoolean);
    
    // Generate unique bill number with IST timestamp  
       /*  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');   
        const randomNum = Math.floor(1000 + Math.random() * 9000);   
        const billNumber = `BILLCA-${dateStr}-${randomNum}`;  */
    
    if (!customerName || !customerPhone || !items || items.length === 0) {     
      return NextResponse.json(       
        { message: "All fields are required" },       
        { status: 400 }     
      );   
    }    
    
    await dbconnect();    

    // Properly parse the purchase date
    let parsedPurchaseDate;
    if (purchaseDate) {
      // Handle different date formats
      parsedPurchaseDate = new Date(purchaseDate);
      
      // Check if date is valid
      if (isNaN(parsedPurchaseDate.getTime())) {
        console.log("Invalid date format received:", purchaseDate);
        parsedPurchaseDate = new Date(); // Fallback to current date
      } else {
        console.log("Parsed purchase date:", parsedPurchaseDate);
      }
    } else {
      parsedPurchaseDate = new Date();
    }
    
    let totalAmount = 0; // Using a normal number for totalAmount     
    const itemDetails = items.map((item) => {       
      const quantity = item.quantity;       
      const price = item.price;       
      const amount = quantity * price; // Regular multiplication    
      const tax=item.tax;    
      totalAmount += amount; // Adding to totalAmount        
      
      // Base item object
      const itemObject = {         
        productName: item.productName,         
        quantity,         
        price,         
        amount,    
        tax,     
        unit: item.unit,    
      };
      
      // Explicitly check with the boolean variable we created
      if (showGstBoolean) {
        itemObject.gstPercentage = item.gstPercentage;
        itemObject.hsnCode = item.hsnCode;
        itemObject.tax=item.tax;
        console.log("Added GST info to item:", item.productName);
      }
      
      return itemObject;
    });      
    
    const newBill = new Billing({       
      billNumber,       
      customerName,       
      customerPhone,  
      aadharNumber,
      villageArea,
      paymentMethod, 
      purchaseDate: parsedPurchaseDate, // Use the properly parsed date
      items: itemDetails,       
      totalAmount,       
      showGst: showGstBoolean, // Store the boolean version      
      date: new Date(),     
    });      
    
    await newBill.save();

    // Convert dates to IST format for response
    const formatDateToIST = (date) => {
      // Create a new date object and add 5 hours and 30 minutes for IST
      const istDate = new Date(date.getTime() + (5*60 + 30) * 60000);
      return {
        formatted: istDate.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
        timestamp: istDate.getTime(),
        iso: istDate.toISOString()
      };
    };
      
    const parsedBill = {       
      _id: newBill._id,       
      billNumber:newBill.billNumber,
      customerName: newBill.customerName,       
      customerPhone: newBill.customerPhone,  
      aadharNumber: newBill.aadharNumber,
      villageArea: newBill.villageArea,
      paymentMethod: newBill.paymentMethod,
      // Add IST formatted dates
      //purchaseDate: newBill.purchaseDate,
      purchaseDate: formatDateToIST(newBill.purchaseDate),
     // date: newBill.date,
     date: formatDateToIST(newBill.date),
      totalAmount: parseFloat(newBill.totalAmount.toString()), // Convert number to float for response
      showGst: newBill.showGst, // Include showGst in response
      items: newBill.items.map(item => {
        const parsedItem = {
          productName: item.productName,         
          quantity: parseFloat(item.quantity.toString()), // Convert number to float for response         
          price: parseFloat(item.price.toString()), // Convert number to float for response         
          amount: parseFloat(item.amount.toString()), // Convert number to float for response 
          tax:parseFloat(item.amount.toString()),        
          unit: item.unit,
        };
        
        // Use the stored boolean value for consistency
        if (newBill.showGst) {
          parsedItem.gstPercentage = item.gstPercentage;
          parsedItem.hsnCode = item.hsnCode;
          parsedItem.tax= item.tax;
        }
        
        return parsedItem;
      }),     
    };      
    
    return NextResponse.json(       
      { message: "Bill generated successfully", bill: parsedBill },       
      { status: 201 }     
    );   
  } catch (err) {     
    console.error("Error generating bill:", err.message || err);     
    return NextResponse.json(       
      { message: "Error generating bill", error: err.message || err },       
      { status: 500 }     
    );   
  } 
}