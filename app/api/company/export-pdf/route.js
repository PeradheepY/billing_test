import dbconnect from '@/db/dbconnect';
import CompanyCreditBilling from '@/models/CompanyCreditBill';
import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export async function POST(req) {
  try {
    // Extract filter parameters from request body
    const { startDate, endDate, showGst, searchTerm } = await req.json();
    
    // Connect to the database
    await dbconnect();
    
    // Fetch credit bills
    let query = {};
    
    // Add date range to query if provided
    if (startDate && endDate) {
      query.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate).setHours(23, 59, 59, 999) // End of day
      };
    }
    
    // Fetch the bills
    const bills = await CompanyCreditBilling.find(query);
    
    if (!bills.length) {
      return NextResponse.json({ message: 'No records found' }, { status: 404 });
    }
    
    // Filter by search term if provided
    let filteredBills = bills;
    if (searchTerm) {
      filteredBills = bills.filter(bill => 
        bill.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.invoiceNumber.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    // Add content to PDF
    doc.fontSize(20).text('Company Credit Records Report', { align: 'center' });
    doc.moveDown();
    
    // Add date range if provided
    if (startDate && endDate) {
      doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();
    }
    
    // Add report generation date
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);
    
    // Company information
    doc.fontSize(14).text('Invoice Summary', { underline: true });
    doc.moveDown();
    
    // Table headers
    const tableTop = doc.y;
    let tableHeaders = [
      'S.No', 
      'Invoice No.', 
      'Supplier', 
      'Items'
    ];
    
    // Add GST headers if showGst is true
    if (showGst) {
      tableHeaders.splice(3, 0, 'GST%', 'SGST', 'CGST');
    }
    
    tableHeaders.push('Net Amount');
    
    // Set column widths
    const columnWidth = 500 / tableHeaders.length;
    
    // Draw headers
    tableHeaders.forEach((header, i) => {
      doc.fontSize(10).text(
        header,
        50 + (i * columnWidth),
        tableTop,
        { width: columnWidth, align: 'left' }
      );
    });
    
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    // Draw rows for each invoice
    let totalAmount = 0;
    
    filteredBills.forEach((bill, index) => {
      // Calculate totals for the bill
      let billNetAmount = 0;
      let billSGST = 0;
      let billCGST = 0;
      
      bill.items.forEach(item => {
        const subtotal = item.purchaseprice * item.quantity;
        const discount = subtotal * (item.purchaseDiscount / 100);
        const netAmount = subtotal - discount;
        
        billNetAmount += netAmount;
        
        if (showGst) {
          const gstRate = item.gstPercentage / 100;
          const gstAmount = netAmount * gstRate;
          billSGST += gstAmount / 2;
          billCGST += gstAmount / 2;
        }
      });
      
      totalAmount += billNetAmount;
      
      // Draw row
      let rowData = [
        (index + 1).toString(),
        bill.invoiceNumber.toString(),
        bill.supplierName,
        bill.items.length.toString()
      ];
      
      // Add GST data if showGst is true
      if (showGst) {
        const firstItem = bill.items[0] || {};
        rowData.splice(3, 0, 
          `${firstItem.gstPercentage || 0}%`,
          `₹${billSGST.toFixed(2)}`,
          `₹${billCGST.toFixed(2)}`
        );
      }
      
      rowData.push(`₹${billNetAmount.toFixed(2)}`);
      
      // Write row data
      rowData.forEach((text, i) => {
        doc.fontSize(9).text(
          text,
          50 + (i * columnWidth),
          doc.y,
          { width: columnWidth, align: i >= (showGst ? 5 : 3) ? 'right' : 'left' }
        );
      });
      
      doc.moveDown();
      
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        
        // Redraw headers on new page
        const newTableTop = 50;
        tableHeaders.forEach((header, i) => {
          doc.fontSize(10).text(
            header,
            50 + (i * columnWidth),
            newTableTop,
            { width: columnWidth, align: 'left' }
          );
        });
        
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      }
    });
    
    // Add total
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(10).text(
      `Total Invoices: ${filteredBills.length}`,
      400,
      doc.y,
      { align: 'right' }
    );
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `Total Amount: ₹${totalAmount.toFixed(2)}`,
      400,
      doc.y,
      { align: 'right' }
    );
    
    // Finalize the PDF
    doc.end();
    
    // Collect the PDF chunks and return
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="company_credit_records.pdf"`,
            },
          })
        );
      });
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { message: 'Error generating PDF', error: error.message },
      { status: 500 }
    );
  }
}