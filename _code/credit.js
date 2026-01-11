"use client"
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from 'next/link';

const BillingDetailsTable = () => {
  const [billingData, setBillingData] = useState([]);
  const [creditBillingData, setCreditBillingData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGSTOnly, setShowGSTOnly] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchBillingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const dateQuery = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : "";
        const billingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/billingreport/cashreport${dateQuery}`,
          { method: 'POST' }
        );
        const creditBillingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/billingreport/creditreport${dateQuery}`,
          { method: 'POST' }
        );

        if (!billingResponse.ok || !creditBillingResponse.ok) {
          throw new Error('Failed to fetch billing data');
        }

        const billingResult = await billingResponse.json();
        const creditBillingResult = await creditBillingResponse.json();

        if (!billingResult.data || !creditBillingResult.data) {
          throw new Error('Invalid data format received from the server');
        }

        // Process billing data to ensure consistent GST properties
        const processedBillingData = billingResult.data.map(bill => ({
          ...bill,
          items: bill.items.map(item => ({
            ...item,
            // Ensure GST properties always exist with consistent naming
            gstPercentage: item.gstPercentage !== undefined ? item.gstPercentage : 0,
            hsnCode: item.hsnCode || item.hsn || "N/A"
          }))
        }));

        // Process credit billing data with the same approach
        const processedCreditBillingData = creditBillingResult.data.map(bill => ({
          ...bill,
          items: bill.items.map(item => ({
            ...item,
            // Ensure GST properties always exist with consistent naming
            gstPercentage: item.gstPercentage !== undefined ? item.gstPercentage : 0,
            hsnCode: item.hsnCode || item.hsn || "N/A"
          }))
        }));

        setBillingData(processedBillingData);
        setCreditBillingData(processedCreditBillingData);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message || "Failed to load billing data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [startDate, endDate]);

  const combinedData = [
    ...billingData.map((bill) => ({ ...bill, isPaid: true })),
    ...creditBillingData.map((bill) => ({ ...bill, isPaid: false })),
  ];

  // Filter data based on search term and GST filter
  const filteredData = combinedData.filter(
    (customer) => {
      const matchesSearch = (
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerPhone.toString().includes(searchTerm)
      );
      
      // Apply GST filter if checkbox is checked
      if (showGSTOnly) {
        return matchesSearch && customer.showGst === true;
      }
      
      return matchesSearch;
    }
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const downloadCSV = () => {
    // Add GST% and HSN to the headers if there are GST bills
    const hasGSTBills = filteredData.some(customer => customer.showGst);
    let headers = [
      "Date",
      "Customer Name",
      "Bill Number",
      "Phone Number",
      "Items Count",
      "Cash Amount",
      "Credit Amount",
      "Payment Method",
    ];
    
    // Add GST-specific columns if needed
    if (hasGSTBills) {
      headers.push("GST Applied");
    }
    
    headers.push("Status");
    
    const csvData = filteredData.map((customer) => {
      const baseRow = [
        format(new Date(customer.date), "yyyy-MM-dd"),
        customer.customerName,
        customer.billNumber,
        customer.customerPhone,
        customer.items.length,
        (customer.totalAmount - (customer.totalDue || 0)).toFixed(2),
        (customer.totalDue || 0).toFixed(2),
        customer.paymentMethod || "Not Specified",
      ];
      
      if (hasGSTBills) {
        baseRow.push(customer.showGst ? "Yes" : "No");
      }
      
      baseRow.push(customer.isPaid ? "Paid" : "Unpaid");
      
      return baseRow;
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `billing_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async () => {
    try {
      // Import jsPDF and autoTable dynamically to prevent loading issues
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Billing Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd")}`, 14, 22);
      
      // Add filter details if any
      if (startDate && endDate) {
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);
      }
      
      if (showGSTOnly) {
        doc.text("Filter: GST Bills Only", 14, showGSTOnly ? 34 : 28);
      }
      
      // Add main table
      const mainTableData = filteredData.map((customer) => [
        format(new Date(customer.date), "yyyy-MM-dd"),
        customer.customerName,
        customer.billNumber,
        customer.customerPhone,
        customer.items.length,
        `₹${(customer.totalAmount - (customer.totalDue || 0)).toFixed(2)}`,
        `₹${(customer.totalDue || 0).toFixed(2)}`,
        customer.paymentMethod || "Not Specified",
        customer.showGst ? "Yes" : "No",
        customer.isPaid ? "Paid" : "Unpaid",
      ]);
      
      autoTable(doc, {
        head: [["Date", "Customer", "Bill #", "Phone", "Items", "Cash Amount", "Credit Amount", "Payment Method", "GST", "Status"]],
        body: mainTableData,
        startY: showGSTOnly ? 40 : 35,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // For each expanded item, add a detailed table
      let currentY = doc.lastAutoTable.finalY + 10;
      
      for (let i = 0; i < filteredData.length; i++) {
        const customer = filteredData[i];
        
        // Check if we need to add a new page
        if (currentY > doc.internal.pageSize.height - 40) {
          doc.addPage();
          currentY = 20;
        }
        
        // Add customer name as header for items section
        doc.setFontSize(10);
        doc.text(`Items for ${customer.customerName} (Bill #${customer.billNumber})`, 14, currentY);
        
        // Always include GST and HSN columns for all bills
        const tableHeaders = ["Product", "Quantity", "Unit", "Price", "GST %", "HSN", "Amount"];
        
        // Create items data for table
        const itemsData = customer.items.map(item => {
          return [
            item.productName,
            item.quantity,
            item.unit,
            `₹${item.price.toFixed(2)}`,
            customer.showGst ? (item.gstPercentage || "N/A") : "N/A",
            customer.showGst ? (item.hsnCode || "N/A") : "N/A",
            `₹${item.amount.toFixed(2)}`
          ];
        });
        
        autoTable(doc, {
          head: [tableHeaders],
          body: itemsData,
          startY: currentY + 5,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [120, 120, 120] }
        });
        
        currentY = doc.lastAutoTable.finalY + 15;
      }
      
      // Add summary at the end
      const totalCash = filteredData.reduce((sum, customer) => 
        sum + (customer.totalAmount - (customer.totalDue || 0)), 0);
      const totalCredit = filteredData.reduce((sum, customer) => 
        sum + (customer.totalDue || 0), 0);
      
      autoTable(doc, {
        head: [["Summary"]],
        body: [
          ["Total Cash Amount:", `₹${totalCash.toFixed(2)}`],
          ["Total Credit Amount:", `₹${totalCredit.toFixed(2)}`],
          ["Total Amount:", `₹${(totalCash + totalCredit).toFixed(2)}`]
        ],
        startY: currentY,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Save the PDF
      doc.save(`billing_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Show error message to user
      setError("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return <div className="w-full text-center py-8">Loading billing data...</div>;
  }

  return (
    <div className="space-y-4 w-full max-w-4xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:w-auto"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full sm:w-auto"
        />
        <Input
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-auto"
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showGSTOnly"
            checked={showGSTOnly}
            onCheckedChange={setShowGSTOnly}
          />
          <label
            htmlFor="showGSTOnly"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            GST Bills Only
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={downloadCSV} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button onClick={downloadPDF} className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white">
            <Link href="/user/bill" className="w-full h-full flex items-center justify-center">
              Search Bill
            </Link>
          </Button>
        </div>
      </div>

      {currentData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No billing data found for the selected criteria.
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Bill Number</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Cash Amount</TableHead>
                <TableHead>Credit Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((customer, index) => (
                <React.Fragment key={index}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRow(index)}
                  >
                    <TableCell>
                      {expandedRows[index] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </TableCell>
                    <TableCell>{format(new Date(customer.date), "yyyy-MM-dd")}</TableCell>
                    <TableCell className="font-medium">{customer.customerName}</TableCell>
                    <TableCell className="font-medium">{customer.billNumber}</TableCell>
                    <TableCell>{customer.customerPhone}</TableCell>
                    <TableCell>{customer.items.length}</TableCell>
                    <TableCell>₹{(customer.totalAmount - (customer.totalDue || 0)).toFixed(2)}</TableCell>
                    <TableCell>₹{(customer.totalDue || 0).toFixed(2)}</TableCell>
                    <TableCell>{customer.paymentMethod || "Not Specified"}</TableCell>
                    <TableCell>
                      <Badge variant={customer.showGst ? "outline" : "secondary"}>
                        {customer.showGst ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isPaid ? "success" : "destructive"}>
                        {customer.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {expandedRows[index] && (
                    <TableRow>
                      <TableCell colSpan={11} className="bg-muted/50">
                        <div className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Price</TableHead>
                                {/* Always show GST% and HSN columns */}
                                <TableHead>GST %</TableHead>
                                <TableHead>HSN</TableHead>
                                <TableHead>Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customer.items.map((item, itemIndex) => (
                                <TableRow key={itemIndex}>
                                  <TableCell>{item.productName}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.unit}</TableCell>
                                  <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                  {/* Always display GST fields but style differently if GST not applied */}
                                  <TableCell className={customer.showGst ? "" : "text-muted-foreground italic"}>
                                    {customer.showGst ? (item.gstPercentage || "0") : "N/A"}
                                  </TableCell>
                                  <TableCell className={customer.showGst ? "" : "text-muted-foreground italic"}>
                                    {customer.showGst ? (item.hsnCode || "N/A") : "N/A"}
                                  </TableCell>
                                  <TableCell>₹{item.amount.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                              {/* Fix colspan to account for always showing GST columns */}
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={6} className="text-right font-medium">
                                  Total:
                                </TableCell>
                                <TableCell className="font-medium">
                                  ₹{customer.totalAmount.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={
                    currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}
    </div>
  );
};

export default BillingDetailsTable;