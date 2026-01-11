import dbconnect from "@/db/dbconnect";
import CreditBilling from "@/models/CreditBillingModel";
import { NextResponse } from "next/server";
import Settlement from "@/models/SettlementModel";
/* export async function GET() {
  try {
    await dbconnect();
    
    // Fetch distinct customers with their latest bills
    const customers = await CreditBilling.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $last: "$customerName" },
          customerPhone: { $last: "$customerPhone" },
          aadharNumber: { $last: "$aadharNumber" },
          villageArea: { $last: "$villageArea" },
          latestBill: { $last: "$$ROOT" }
        }
      },
      {
        $project: {
          id: "$_id",
          name: "$customerName",
          phone: "$customerPhone",
          aadharNumber: "$aadharNumber",
          villageArea: "$villageArea",
           previousDue: "$latestBill.totalDue"
        }
      }
    ]);

    return NextResponse.json(
      { 
        success: true, 
        data: customers  // Changed 'customers' to 'data' for consistency with the Billing API
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error fetching customers",
        data: []  // Added empty data array for consistency
      },
      { status: 500 }
    );
  }
} */
  export async function GET() {
    try {
      await dbconnect();
      
      // Get all customers with their phone numbers
      const customers = await CreditBilling.aggregate([
        {
          $group: {
            _id: "$customerPhone",
            customerName: { $last: "$customerName" },
            customerPhone: { $last: "$customerPhone" },
            aadharNumber: { $last: "$aadharNumber" },
            villageArea: { $last: "$villageArea" }
          }
        }
      ]);
      
      // Extract all customer phone numbers
      const customerPhones = customers.map(customer => customer.customerPhone);
      
      // Get all credit billings and settlements for these customers in just two queries
      const [allCreditBillings, allSettlements] = await Promise.all([
        CreditBilling.find({ customerPhone: { $in: customerPhones } }).lean(),
        Settlement.find({ customerPhone: { $in: customerPhones } }).lean()
      ]);
      
      // Group credit billings and settlements by customer phone
      const creditBillingsByCustomer = {};
      const settlementsByCustomer = {};
      
      allCreditBillings.forEach(billing => {
        if (!creditBillingsByCustomer[billing.customerPhone]) {
          creditBillingsByCustomer[billing.customerPhone] = [];
        }
        creditBillingsByCustomer[billing.customerPhone].push(billing);
      });
      
      allSettlements.forEach(settlement => {
        if (!settlementsByCustomer[settlement.customerPhone]) {
          settlementsByCustomer[settlement.customerPhone] = [];
        }
        settlementsByCustomer[settlement.customerPhone].push(settlement);
      });
      
      // Calculate balances for each customer
      const customersWithBalance = customers.map(customer => {
        const customerPhone = customer.customerPhone;
        const creditBillings = creditBillingsByCustomer[customerPhone] || [];
        const settlements = settlementsByCustomer[customerPhone] || [];
        
        // Calculate current balance
        let currentBalance = 0;
        
        // Process credit billings
        for (const billing of creditBillings) {
          const effectiveAmount = billing.totalAmount - (billing.partialPayment || 0);
          currentBalance += effectiveAmount;
        }
        
        // Process settlements
        for (const settlement of settlements) {
          currentBalance -= settlement.settledAmount;
        }
        
        return {
          id: customer._id,
          name: customer.customerName,
          phone: customerPhone,
          aadharNumber: customer.aadharNumber,
          villageArea: customer.villageArea,
          previousDue: currentBalance
        };
      });
      
      return NextResponse.json(
        { 
          success: true, 
          data: customersWithBalance
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
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      aadharNumber,
      villageArea,
      items,
      isCreditBill,
      dueDate,
      showGst,
      billNumber,
      partialPayment,
      remainingCredit,
      paymentMethod,
      purchaseDate,
    } = body;
    
    // Properly convert showGst to boolean regardless of how it's sent
    const showGstBoolean = showGst === true || showGst === "true";
    console.log("Converted showGst value:", showGstBoolean);
    
    if (!customerName || !customerPhone || !items || items.length === 0 || !billNumber) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }
    
    // Map items and handle GST information explicitly
    const itemsWithAmounts = items.map((item) => {
      const amount = item.quantity * item.price;
      
      // Create base item object
      const itemObject = {
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        amount: amount,
        unit: item.unit,
      };
      
      // Add GST information when showGst is true
      if (showGstBoolean) {
        itemObject.gstPercentage = item.gstPercentage;
        itemObject.hsnCode = item.hsnCode;
      }
      
      return itemObject;
    });
    
    const subtotal = itemsWithAmounts.reduce((sum, item) => sum + item.amount, 0);
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
    
    // Calculate total due based on remaining credit instead of subtotal
    const amountPaid = partialPayment || 0;
    const creditRemaining = remainingCredit || (subtotal - amountPaid);
    const totalDue = isCreditBill ? creditRemaining : 0;
    
    const bill = await CreditBilling.create({
      billNumber,
      customerName,
      customerPhone,
      aadharNumber,
      villageArea,
      paymentMethod,
      items: itemsWithAmounts,
      subtotal,
      totalAmount: subtotal,
      isCreditBill,
      dueDate: isCreditBill ? new Date(dueDate) : null,
      totalDue,
      previousDue: 0,
      showGst: showGstBoolean,
      partialPayment: amountPaid,
      purchaseDate: parsedPurchaseDate,
      remainingCredit: creditRemaining
    });
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
    // Create parsed response with properly formatted values
    const parsedBill = {
      _id: bill._id,
      billNumber: bill.billNumber,
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      aadharNumber: bill.aadharNumber,
      villageArea: bill.villageArea,
      paymentMethod: bill.paymentMethod,
      purchaseDate: formatDateToIST(bill.purchaseDate),
      date: formatDateToIST(bill.date),
      subtotal: parseFloat(bill.subtotal.toString()),
      totalAmount: parseFloat(bill.totalAmount.toString()),
      previousDue: parseFloat(bill.previousDue ? bill.previousDue.toString() : '0'),
      totalDue: parseFloat(bill.totalDue.toString()),
      showGst: bill.showGst,
      partialPayment: parseFloat(amountPaid.toString()),
      remainingCredit: parseFloat(creditRemaining.toString()),
      items: bill.items.map(item => {
        const parsedItem = {
          productName: item.productName,
          quantity: parseFloat(item.quantity.toString()),
          price: parseFloat(item.price.toString()),
          amount: parseFloat(item.amount.toString()),
          unit: item.unit,
        };
        
        // Include GST information in response when showGst is true
        if (bill.showGst) {
          parsedItem.gstPercentage = item.gstPercentage;
          parsedItem.hsnCode = item.hsnCode;
        }
        
        return parsedItem;
      }),
    };
    
    return NextResponse.json(
      { message: "Bill generated successfully", bill: parsedBill },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating bill:", error.message || error);
    return NextResponse.json(
      { message: "Error generating bill", error: error.message || error },
      { status: 500 }
    );
  }
}