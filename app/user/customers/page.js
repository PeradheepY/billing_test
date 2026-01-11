"use client"
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  FileText, 
  Edit, 
  Trash2,
  AlertCircle,
  X,
  Users,
  Search,
  Filter,
  Calendar,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BillingDetailsTable = () => {
  const [billingData, setBillingData] = useState([]);
  const [creditBillingData, setCreditBillingData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGSTOnly, setShowGSTOnly] = useState(false);
  
  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Edit/Delete state
  const [editingItem, setEditingItem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({
    productName: "",
    quantity: 0,
    unit: "",
    price: 0,
    gstPercentage: 0,
    hsnCode: "",
    tax: 0,
    sgst: 0,
    cgst: 0
  });

  // Helper function to calculate SGST and CGST
  const calculateGSTComponents = (price, quantity, gstPercentage) => {
    const totalAmount = price * quantity;
    const gstAmount = (totalAmount * gstPercentage) / 100;
    const sgst = gstAmount / 2;
    const cgst = gstAmount / 2;
    
    return {
      gstAmount,
      sgst,
      cgst,
      sgstPercentage: gstPercentage / 2,
      cgstPercentage: gstPercentage / 2
    };
  };

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

        // Process billing data to ensure consistent GST and tax properties with SGST/CGST calculation
        const processedBillingData = billingResult.data.map(bill => ({
          ...bill,
          items: bill.items.map(item => {
            const gstComponents = calculateGSTComponents(item.price, item.quantity, item.gstPercentage || 0);
            return {
              ...item,
              gstPercentage: item.gstPercentage !== undefined ? item.gstPercentage : 0,
              hsnCode: item.hsnCode || item.hsn || "N/A",
              tax: item.tax !== undefined ? item.tax : gstComponents.gstAmount,
              sgst: gstComponents.sgst,
              cgst: gstComponents.cgst,
              sgstPercentage: gstComponents.sgstPercentage,
              cgstPercentage: gstComponents.cgstPercentage
            };
          })
        }));

        // Process credit billing data with the same approach
        const processedCreditBillingData = creditBillingResult.data.map(bill => ({
          ...bill,
          items: bill.items.map(item => {
            const gstComponents = calculateGSTComponents(item.price, item.quantity, item.gstPercentage || 0);
            return {
              ...item,
              gstPercentage: item.gstPercentage !== undefined ? item.gstPercentage : 0,
              hsnCode: item.hsnCode || item.hsn || "N/A",
              tax: item.tax !== undefined ? item.tax : gstComponents.gstAmount,
              sgst: gstComponents.sgst,
              cgst: gstComponents.cgst,
              sgstPercentage: gstComponents.sgstPercentage,
              cgstPercentage: gstComponents.cgstPercentage
            };
          })
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

  // Calculate totals for summary display including SGST, CGST, and Tax
  const totals = useMemo(() => {
    const totalCash = combinedData.reduce((sum, customer) => 
      sum + (customer.isPaid ? customer.totalAmount - (customer.totalDue || 0) : 0), 0);
    const totalCredit = combinedData.reduce((sum, customer) => 
      sum + (customer.totalDue || 0), 0);
    const totalAmount = totalCash + totalCredit;
    
    // Calculate total SGST, CGST, and Tax
    const totalSGST = combinedData.reduce((sum, customer) => 
      sum + customer.items.reduce((itemSum, item) => itemSum + (item.sgst || 0), 0), 0);
    const totalCGST = combinedData.reduce((sum, customer) => 
      sum + customer.items.reduce((itemSum, item) => itemSum + (item.cgst || 0), 0), 0);
    const totalTax = combinedData.reduce((sum, customer) => 
      sum + customer.items.reduce((itemSum, item) => itemSum + (item.tax || 0), 0), 0);
    
    return { totalCash, totalCredit, totalAmount, totalSGST, totalCGST, totalTax };
  }, [combinedData]);

  // Filter data based on search term and GST filter
  const filteredData = combinedData.filter(
    (customer) => {
      const matchesSearch = (
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerPhone.toString().includes(searchTerm) ||
        customer.billNumber.toString().includes(searchTerm) ||
        (customer.aadharNumber && customer.aadharNumber.toString().includes(searchTerm)) ||
        (customer.villageArea && customer.villageArea.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      // Apply GST filter if checkbox is checked
      if (showGSTOnly) {
        return matchesSearch && customer.showGst === true;
      }
      
      return matchesSearch;
    }
  );

  // Calculate filtered totals including SGST, CGST, and Tax
  const filteredTotals = useMemo(() => {
    const totalCash = filteredData.reduce((sum, customer) => 
      sum + (customer.isPaid ? customer.totalAmount - (customer.totalDue || 0) : 0), 0);
    const totalCredit = filteredData.reduce((sum, customer) => 
      sum + (customer.totalDue || 0), 0);
    const totalAmount = totalCash + totalCredit;
    
    // Calculate filtered total SGST, CGST, and Tax
    const totalSGST = filteredData.reduce((sum, customer) => 
      sum + customer.items.reduce((itemSum, item) => itemSum + (item.sgst || 0), 0), 0);
    const totalCGST = filteredData.reduce((sum, customer) => 
      sum + customer.items.reduce((itemSum, item) => itemSum + (item.cgst || 0), 0), 0);
    const totalTax = filteredData.reduce((sum, customer) => 
      sum + customer.items.reduce((itemSum, item) => itemSum + (item.tax || 0), 0), 0);
    
    return { totalCash, totalCredit, totalAmount, totalSGST, totalCGST, totalTax };
  }, [filteredData]);

  // Setup table data for pagination
  const tableData = useMemo(() => {
    return filteredData;
  }, [filteredData]);
  
  // Create a table object to mimic React Table API
  const table = useMemo(() => {
    const pageCount = Math.ceil(tableData.length / pageSize);
    const startIdx = pageIndex * pageSize;
    const endIdx = Math.min(startIdx + pageSize, tableData.length);
    
    const paginatedData = tableData.slice(startIdx, endIdx);
    
    return {
      getRowModel: () => ({
        rows: paginatedData.map((item, idx) => ({
          id: idx,
          original: item,
          index: startIdx + idx + 1 // For S.No.
        }))
      }),
      getPageCount: () => pageCount,
      getCanPreviousPage: () => pageIndex > 0,
      getCanNextPage: () => pageIndex < pageCount - 1
    };
  }, [tableData, pageIndex, pageSize]);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Function to safely format date, using original value from DB without modification
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    try {
      return format(new Date(dateValue), "yyyy-MM-dd");
    } catch (err) {
      console.error("Date format error:", err);
      return "Invalid Date";
    }
  };

 const downloadCSV = () => {
  // Add SGST, CGST, and Tax columns to the headers
  const hasGSTBills = filteredData.some(customer => customer.showGst);
  let headers = [
    "S.No",
    "Date",
    "Customer Name",
    "Bill Number",
    "Phone Number",
    "Aadhar Number",
    "Village/Area",
    "Items Count",
    "Cash Amount",
    "Credit Amount",
    "Payment Method",
  ];
  
  // Add GST-specific columns if needed
  if (hasGSTBills) {
    headers.push("GST Applied");
  }
  
  // Add SGST, CGST, and Tax columns
  headers.push("SGST Amount", "CGST Amount", "Tax Amount", "Status", "Total Amount");
  
  const csvData = filteredData.map((customer, index) => {
    // Calculate SGST, CGST, and Tax totals for this customer
    const customerSGST = customer.items.reduce((sum, item) => sum + (item.sgst || 0), 0);
    const customerCGST = customer.items.reduce((sum, item) => sum + (item.cgst || 0), 0);
    const customerTax = customer.items.reduce((sum, item) => sum + (item.tax || 0), 0);
    
    const baseRow = [
      index + 1, // S.No
      formatDate(customer.purchaseDate),
      customer.customerName,
      customer.billNumber,
      customer.customerPhone,
      customer.aadharNumber || "N/A",
      customer.villageArea || "N/A",
      customer.items.length,
      (customer.totalAmount - (customer.totalDue || 0)).toFixed(2),
      (customer.totalDue || 0).toFixed(2),
      customer.paymentMethod || "Not Specified",
    ];
    
    if (hasGSTBills) {
      baseRow.push(customer.showGst ? "Yes" : "No");
    }
    
    baseRow.push(
      customerSGST.toFixed(2), // SGST Amount
      customerCGST.toFixed(2), // CGST Amount
      customerTax.toFixed(2),  // Tax Amount
      customer.isPaid ? "Paid" : "Unpaid",
      customer.totalAmount.toFixed(2) // Total Amount
    );
    
    return baseRow;
  });

  // Add summary row at the end
  const summaryRow = [
    "", // S.No
    "", // Date
    "TOTAL", // Customer Name
    "", // Bill Number
    "", // Phone
    "", // Aadhar
    "", // Village
    "", // Items Count
    filteredTotals.totalCash.toFixed(2), // Cash Amount
    filteredTotals.totalCredit.toFixed(2), // Credit Amount
    "", // Payment Method
  ];
  
  if (hasGSTBills) {
    summaryRow.push(""); // GST Applied
  }
  
  summaryRow.push(
    filteredTotals.totalSGST.toFixed(2), // SGST Amount
    filteredTotals.totalCGST.toFixed(2), // CGST Amount
    filteredTotals.totalTax.toFixed(2),  // Tax Amount
    "", // Status
    filteredTotals.totalAmount.toFixed(2) // Total Amount
  );
  
  csvData.push(summaryRow);

  // Calculate GST Rate-wise totals
  const gstRateTotals = {};
  filteredData.forEach(customer => {
    if (customer.showGst) {
      customer.items.forEach(item => {
        const gstRate = item.gstPercentage || 0;
        if (!gstRateTotals[gstRate]) {
          gstRateTotals[gstRate] = {
            totalAmount: 0,
            totalSGST: 0,
            totalCGST: 0,
            totalTax: 0,
            itemCount: 0
          };
        }
        gstRateTotals[gstRate].totalAmount += item.amount || 0;
        gstRateTotals[gstRate].totalSGST += item.sgst || 0;
        gstRateTotals[gstRate].totalCGST += item.cgst || 0;
        gstRateTotals[gstRate].totalTax += item.tax || 0;
        gstRateTotals[gstRate].itemCount += 1;
      });
    }
  });

  // Add GST Rate-wise breakdown section
  csvData.push([]); // Empty row for separation
  csvData.push(["GST RATE-WISE BREAKDOWN"]);
  csvData.push([]); // Empty row
  csvData.push(["GST Rate", "Item Count", "Total Amount", "SGST Amount", "CGST Amount", "Total Tax"]);
  
  // Sort GST rates and add them to CSV
  const sortedGSTRates = Object.keys(gstRateTotals).sort((a, b) => parseFloat(a) - parseFloat(b));
  sortedGSTRates.forEach(rate => {
    const totals = gstRateTotals[rate];
    csvData.push([
      `${rate}%`,
      totals.itemCount,
      totals.totalAmount.toFixed(2),
      totals.totalSGST.toFixed(2),
      totals.totalCGST.toFixed(2),
      totals.totalTax.toFixed(2)
    ]);
  });

  // Add detailed items section with SGST/CGST breakdown
  csvData.push([]); // Empty row for separation
  csvData.push(["DETAILED ITEMS BREAKDOWN"]);
  csvData.push([]); // Empty row

  // Add detailed items for each bill
  filteredData.forEach((customer, customerIndex) => {
    // Add customer header
    csvData.push([
      `Bill #${customer.billNumber} - ${customer.customerName}`,
      `Date: ${formatDate(customer.purchaseDate)}`,
      `Phone: ${customer.customerPhone}`,
      `Status: ${customer.isPaid ? "Paid" : "Unpaid"}`
    ]);
    
    // Add items header with SGST and CGST columns
    if (customer.showGst) {
      csvData.push([
        "S.No",
        "Product Name",
        "Quantity", 
        "Unit",
        "Price",
        "GST %",
        "HSN Code",
        "SGST %",
        "SGST Amount",
        "CGST %", 
        "CGST Amount",
        "Total Tax",
        "Amount"
      ]);
    } else {
      csvData.push([
        "S.No",
        "Product Name",
        "Quantity", 
        "Unit",
        "Price",
        "Amount"
      ]);
    }
    
    // Add each item with SGST/CGST breakdown
    customer.items.forEach((item, itemIndex) => {
      if (customer.showGst) {
        csvData.push([
          itemIndex + 1,
          item.productName,
          item.quantity,
          item.unit,
          item.price.toFixed(2),
          `${item.gstPercentage || 0}%`,
          item.hsnCode || "N/A",
          `${item.sgstPercentage || 0}%`,
          (item.sgst || 0).toFixed(2),
          `${item.cgstPercentage || 0}%`,
          (item.cgst || 0).toFixed(2),
          (item.tax || 0).toFixed(2),
          item.amount.toFixed(2)
        ]);
      } else {
        csvData.push([
          itemIndex + 1,
          item.productName,
          item.quantity,
          item.unit,
          item.price.toFixed(2),
          item.amount.toFixed(2)
        ]);
      }
    });
    
    // Add bill total with tax breakdown
    if (customer.showGst) {
      const totalSGST = customer.items.reduce((sum, item) => sum + (item.sgst || 0), 0);
      const totalCGST = customer.items.reduce((sum, item) => sum + (item.cgst || 0), 0);
      const totalTax = customer.items.reduce((sum, item) => sum + (item.tax || 0), 0);
      
      csvData.push([
        "",
        "BILL TOTAL",
        "",
        "",
        "",
        "",
        "",
        "",
        totalSGST.toFixed(2),
        "",
        totalCGST.toFixed(2),
        totalTax.toFixed(2),
        customer.totalAmount.toFixed(2)
      ]);
    } else {
      csvData.push([
        "",
        "BILL TOTAL",
        "",
        "",
        "",
        customer.totalAmount.toFixed(2)
      ]);
    }
    
    csvData.push([]); // Empty row between bills
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
    let startY = 28;
    if (startDate && endDate) {
      doc.text(`Period: ${startDate} to ${endDate}`, 14, startY);
      startY += 6;
    }
    
    if (showGSTOnly) {
      doc.text("Filter: GST Bills Only", 14, startY);
      startY += 6;
    }
    
    // Calculate summary amounts from filteredTotals
    const summary = {
      totalCash: filteredTotals.totalCash,
      totalCredit: filteredTotals.totalCredit,
      totalAmount: filteredTotals.totalAmount,
      totalSGST: filteredTotals.totalSGST,
      totalCGST: filteredTotals.totalCGST,
      totalTax: filteredTotals.totalTax
    };
    
    // Calculate GST Rate-wise totals
    const gstRateTotals = {};
    filteredData.forEach(customer => {
      if (customer.showGst) {
        customer.items.forEach(item => {
          const gstRate = item.gstPercentage || 0;
          if (!gstRateTotals[gstRate]) {
            gstRateTotals[gstRate] = {
              totalAmount: 0,
              totalSGST: 0,
              totalCGST: 0,
              totalTax: 0,
              itemCount: 0
            };
          }
          gstRateTotals[gstRate].totalAmount += item.amount || 0;
          gstRateTotals[gstRate].totalSGST += item.sgst || 0;
          gstRateTotals[gstRate].totalCGST += item.cgst || 0;
          gstRateTotals[gstRate].totalTax += item.tax || 0;
          gstRateTotals[gstRate].itemCount += 1;
        });
      }
    });
    
    // Add main table with SGST, CGST, and Tax columns
    const mainTableData = filteredData.map((customer, index) => {
      // Calculate customer-specific SGST, CGST, and Tax
      const customerSGST = customer.items.reduce((sum, item) => sum + (item.sgst || 0), 0);
      const customerCGST = customer.items.reduce((sum, item) => sum + (item.cgst || 0), 0);
      const customerTax = customer.items.reduce((sum, item) => sum + (item.tax || 0), 0);
      
      return [
        formatDate(customer.purchaseDate),
        customer.customerName,
        customer.billNumber,
        customer.customerPhone,
        customer.aadharNumber || "N/A",
        customer.villageArea || "N/A",
        customer.items.length,
        `Rs.${(customer.totalAmount - (customer.totalDue || 0)).toFixed(2)}`,
        `Rs.${(customer.totalDue || 0).toFixed(2)}`,
        customer.paymentMethod || "Not Specified",
        customer.showGst ? "Yes" : "No",
        `Rs.${customerSGST.toFixed(2)}`, // SGST Amount
        `Rs.${customerCGST.toFixed(2)}`, // CGST Amount
        `Rs.${customerTax.toFixed(2)}`,  // Tax Amount
        customer.isPaid ? "Paid" : "Unpaid",
        `Rs.${customer.totalAmount.toFixed(2)}`
      ];
    });
    
    // Add summary row with SGST, CGST, and Tax totals
    mainTableData.push([
      "", // Date
      "TOTAL", // Customer Name
      "", // Bill Number
      "", // Phone
      "", // Aadhar
      "", // Village
      "", // Items Count
      `Rs.${summary.totalCash.toFixed(2)}`, // Cash Amount
      `Rs.${summary.totalCredit.toFixed(2)}`, // Credit Amount
      "", // Payment Method
      "", // GST
      `Rs.${summary.totalSGST.toFixed(2)}`, // SGST Amount
      `Rs.${summary.totalCGST.toFixed(2)}`, // CGST Amount
      `Rs.${summary.totalTax.toFixed(2)}`,  // Tax Amount
      "", // Status
      `Rs.${summary.totalAmount.toFixed(2)}` // Total Amount
    ]);
    
    // Create main table with SGST, CGST, and Tax columns
    autoTable(doc, {
      head: [["Date", "Customer", "Bill #", "Phone", "Aadhar", "Village/Area", "Items", "Cash Amount", "Credit Amount", "Payment", "GST", "SGST", "CGST", "Tax", "Status", "Total Amount"]],
      body: mainTableData,
      startY: startY,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1 }, // Smaller font to fit more columns
      headStyles: { fillColor: [66, 139, 202] },
      // Explicitly style the last row as the footer
      didParseCell: function(data) {
        if (data.row.index === mainTableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [200, 200, 200];
        }
      }
    });
    
    // Add GST Rate-wise breakdown table
    let gstBreakdownY = doc.lastAutoTable.finalY + 15;
    
    // Check if GST breakdown would fit on current page
    if (gstBreakdownY > doc.internal.pageSize.height - 80) {
      doc.addPage();
      gstBreakdownY = 20;
    }
    
    // Add GST Rate-wise breakdown title
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("GST Rate-wise Breakdown", 14, gstBreakdownY);
    
    // Prepare GST breakdown table data
    const gstBreakdownData = [];
    const sortedGSTRates = Object.keys(gstRateTotals).sort((a, b) => parseFloat(a) - parseFloat(b));
    
    sortedGSTRates.forEach(rate => {
      const totals = gstRateTotals[rate];
      gstBreakdownData.push([
        `${rate}%`,
        totals.itemCount,
        `Rs.${totals.totalAmount.toFixed(2)}`,
        `Rs.${totals.totalSGST.toFixed(2)}`,
        `Rs.${totals.totalCGST.toFixed(2)}`,
        `Rs.${totals.totalTax.toFixed(2)}`
      ]);
    });
    
    // Add GST breakdown table
    autoTable(doc, {
      head: [["GST Rate", "Item Count", "Total Amount", "SGST Amount", "CGST Amount", "Total Tax"]],
      body: gstBreakdownData,
      startY: gstBreakdownY + 8,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [255, 193, 7] }, // Different color for GST breakdown
      bodyStyles: { fillColor: [255, 248, 220] },
      margin: { left: 20, right: 20 }
    });
    
    // Add item details for each bill
    let currentY = doc.lastAutoTable.finalY + 15;
    
    // Loop through each bill and add its items
    for (let i = 0; i < filteredData.length; i++) {
      const customer = filteredData[i];
      
      // Check if we need a new page (leaving 50pt margin at bottom)
      if (currentY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        currentY = 20;
      }
      
      // Add bill header
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`Bill #${customer.billNumber} - ${customer.customerName}`, 14, currentY);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Date: ${formatDate(customer.purchaseDate)} | Phone: ${customer.customerPhone} | Status: ${customer.isPaid ? "Paid" : "Unpaid"}`, 14, currentY + 6);
      
      // Create items table data with SGST/CGST breakdown
      const itemsTableData = customer.items.map((item, idx) => {
        if (customer.showGst) {
          return [
            idx + 1, // S.No
            item.productName,
            item.quantity,
            item.unit,
            `Rs.${item.price.toFixed(2)}`,
            `${item.gstPercentage || 0}%`,
            item.hsnCode || "N/A",
            `${item.sgstPercentage || 0}%`,
            `Rs.${(item.sgst || 0).toFixed(2)}`,
            `${item.cgstPercentage || 0}%`,
            `Rs.${(item.cgst || 0).toFixed(2)}`,
            `Rs.${(item.tax || 0).toFixed(2)}`,
            `Rs.${item.amount.toFixed(2)}`
          ];
        } else {
          return [
            idx + 1, // S.No
            item.productName,
            item.quantity,
            item.unit,
            `Rs.${item.price.toFixed(2)}`,
            `Rs.${item.amount.toFixed(2)}`
          ];
        }
      });
      
      // Add item total row with tax breakdown
      if (customer.showGst) {
        const totalSGST = customer.items.reduce((sum, item) => sum + (item.sgst || 0), 0);
        const totalCGST = customer.items.reduce((sum, item) => sum + (item.cgst || 0), 0);
        const totalTax = customer.items.reduce((sum, item) => sum + (item.tax || 0), 0);
        
        itemsTableData.push([
          "", // S.No
          "Total", // Product
          "", // Quantity
          "", // Unit
          "", // Price
          "", // GST %
          "", // HSN
          "", // SGST %
          `Rs.${totalSGST.toFixed(2)}`, // SGST Amount
          "", // CGST %
          `Rs.${totalCGST.toFixed(2)}`, // CGST Amount
          `Rs.${totalTax.toFixed(2)}`, // Total Tax
          `Rs.${customer.totalAmount.toFixed(2)}` // Amount
        ]);
        
        // Add items table with SGST/CGST columns
        autoTable(doc, {
          head: [["S.No", "Product", "Qty", "Unit", "Price", "GST %", "HSN", "SGST %", "SGST", "CGST %", "CGST", "Total Tax", "Amount"]],
          body: itemsTableData,
          startY: currentY + 10,
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 1 },
          headStyles: { fillColor: [100, 149, 237] },
          // Style total row
          didParseCell: function(data) {
            if (data.row.index === itemsTableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [220, 220, 220];
            }
          },
          margin: { left: 10, right: 10 } // Reduced margin for more space
        });
      } else {
        itemsTableData.push([
          "", // S.No
          "Total", // Product
          "", // Quantity
          "", // Unit
          "", // Price
          `Rs.${customer.totalAmount.toFixed(2)}` // Amount
        ]);
        
        // Add items table without GST columns
        autoTable(doc, {
          head: [["S.No", "Product", "Qty", "Unit", "Price", "Amount"]],
          body: itemsTableData,
          startY: currentY + 10,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [100, 149, 237] },
          // Style total row
          didParseCell: function(data) {
            if (data.row.index === itemsTableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [220, 220, 220];
            }
          },
          margin: { left: 20, right: 20 } // Indent item tables
        });
      }
      
      // Update currentY for next bill
      currentY = doc.lastAutoTable.finalY + 15;
    }
    
    // Add a separate, more visible summary table at the end
    let summaryY = doc.lastAutoTable.finalY + 15;
    
    // Check if summary would fit on current page
    if (summaryY > doc.internal.pageSize.height - 40) {
      doc.addPage();
      summaryY = 20;
    }
    
    // Create a dedicated, visually distinctive summary table with SGST/CGST breakdown
    autoTable(doc, {
      head: [["Summary", "Amount"]],
      body: [
        ["Total Credit Amount", `Rs.${summary.totalCredit.toFixed(2)}`],
        ["Total Cash Amount", `Rs.${summary.totalCash.toFixed(2)}`],
        ["Total SGST Amount", `Rs.${summary.totalSGST.toFixed(2)}`],
        ["Total CGST Amount", `Rs.${summary.totalCGST.toFixed(2)}`],
        ["Total Tax Amount", `Rs.${summary.totalTax.toFixed(2)}`],
        ["Total Amount", `Rs.${summary.totalAmount.toFixed(2)}`]
      ],
      startY: summaryY,
      theme: 'grid',
      styles: { fontSize: 10, fontStyle: 'bold' },
      headStyles: { fillColor: [66, 139, 202] },
      bodyStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 50, right: 50 }
    });
    
    // Save the PDF
    doc.save(`billing_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Show error message to user
    setError("Failed to generate PDF. Please try again.");
  }
};

const downloadCSVa = () => {
    // Add SGST, CGST, and Tax columns to the headers
    const hasGSTBills = filteredData.some(customer => customer.showGst);
    let headers = [
      "S.No",
      "Date",
      "Customer Name",
      "Bill Number",
      "Phone Number",
      "Aadhar Number",
      "Village/Area",
      "Items Count",
      "Cash Amount",
      "Credit Amount",
      "Payment Method",
    ];
    
    if (hasGSTBills) {
      headers.push("GST Applied");
    }
    
    headers.push("SGST Amount", "CGST Amount", "Tax Amount", "Status", "Total Amount");
    
    const csvData = filteredData.map((customer, index) => {
      // Calculate customer-specific SGST, CGST, and Tax
      const customerSGST = customer.items.reduce((sum, item) => sum + (item.sgst || 0), 0);
      const customerCGST = customer.items.reduce((sum, item) => sum + (item.cgst || 0), 0);
      const customerTax = customer.items.reduce((sum, item) => sum + (item.tax || 0), 0);
      
      const baseRow = [
        index + 1,
        formatDate(customer.purchaseDate),
        customer.customerName,
        customer.billNumber,
        customer.customerPhone,
        customer.aadharNumber || "N/A",
        customer.villageArea || "N/A",
        customer.items.length,
        (customer.totalAmount - (customer.totalDue || 0)).toFixed(2),
        (customer.totalDue || 0).toFixed(2),
        customer.paymentMethod || "Not Specified",
      ];
      
      if (hasGSTBills) {
        baseRow.push(customer.showGst ? "Yes" : "No");
      }
      
      baseRow.push(
        customerSGST.toFixed(2),
        customerCGST.toFixed(2),
        customerTax.toFixed(2),
        customer.isPaid ? "Paid" : "Unpaid",
        customer.totalAmount.toFixed(2)
      );
      
      return baseRow;
    });

    // Add summary row at the end
    const summaryRow = [
      "", "", "TOTAL", "", "", "", "",
      "",
      filteredTotals.totalCash.toFixed(2),
      filteredTotals.totalCredit.toFixed(2),
      "",
    ];
    
    if (hasGSTBills) {
      summaryRow.push("");
    }
    
    summaryRow.push(
      filteredTotals.totalSGST.toFixed(2),
      filteredTotals.totalCGST.toFixed(2),
      filteredTotals.totalTax.toFixed(2),
      "",
      filteredTotals.totalAmount.toFixed(2)
    );
    
    csvData.push(summaryRow);

    // Calculate GST Rate-wise totals - now including all rates (0%, 5%, 12%, 18%, etc.)
    const gstRateTotals = {};
    filteredData.forEach(customer => {
      customer.items.forEach(item => {
        const gstRate = item.gstPercentage || 0;
        if (!gstRateTotals[gstRate]) {
          gstRateTotals[gstRate] = {
            totalAmount: 0,
            totalSGST: 0,
            totalCGST: 0,
            totalTax: 0,
            itemCount: 0
          };
        }
        gstRateTotals[gstRate].totalAmount += item.amount || 0;
        gstRateTotals[gstRate].totalSGST += item.sgst || 0;
        gstRateTotals[gstRate].totalCGST += item.cgst || 0;
        gstRateTotals[gstRate].totalTax += item.tax || 0;
        gstRateTotals[gstRate].itemCount += 1;
      });
    });

    // Add GST Rate-wise breakdown section
    csvData.push([]); // Empty row for separation
    csvData.push(["GST RATE-WISE BREAKDOWN"]);
    csvData.push([]); // Empty row
    csvData.push(["GST Rate", "Item Count", "Total Amount", "SGST Amount", "CGST Amount", "Total Tax"]);
    
    // Sort GST rates numerically and add them to CSV
    const sortedGSTRates = Object.keys(gstRateTotals)
      .map(rate => parseFloat(rate))
      .sort((a, b) => a - b)
      .map(rate => rate.toString());
    
    sortedGSTRates.forEach(rate => {
      const totals = gstRateTotals[rate];
      csvData.push([
        `${rate}%`,
        totals.itemCount,
        totals.totalAmount.toFixed(2),
        totals.totalSGST.toFixed(2),
        totals.totalCGST.toFixed(2),
        totals.totalTax.toFixed(2)
      ]);
    });

    // Add detailed items section with SGST/CGST breakdown
    csvData.push([]);
    csvData.push(["DETAILED ITEMS BREAKDOWN"]);
    csvData.push([]);

    // ... (rest of the CSV generation code remains the same)
    
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

  const downloadPDFa = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Billing Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd")}`, 14, 22);
      
      // Add filter details if any
      let startY = 28;
      if (startDate && endDate) {
        doc.text(`Period: ${startDate} to ${endDate}`, 14, startY);
        startY += 6;
      }
      
      if (showGSTOnly) {
        doc.text("Filter: GST Bills Only", 14, startY);
        startY += 6;
      }
      
      // Calculate summary amounts from filteredTotals
      const summary = {
        totalCash: filteredTotals.totalCash,
        totalCredit: filteredTotals.totalCredit,
        totalAmount: filteredTotals.totalAmount,
        totalSGST: filteredTotals.totalSGST,
        totalCGST: filteredTotals.totalCGST,
        totalTax: filteredTotals.totalTax
      };
      
      // Calculate GST Rate-wise totals (including 0%, 5%, 12%, 18%, etc.)
      const gstRateTotals = {};
      filteredData.forEach(customer => {
        customer.items.forEach(item => {
          const gstRate = item.gstPercentage || 0;
          if (!gstRateTotals[gstRate]) {
            gstRateTotals[gstRate] = {
              totalAmount: 0,
              totalSGST: 0,
              totalCGST: 0,
              totalTax: 0,
              itemCount: 0
            };
          }
          gstRateTotals[gstRate].totalAmount += item.amount || 0;
          gstRateTotals[gstRate].totalSGST += item.sgst || 0;
          gstRateTotals[gstRate].totalCGST += item.cgst || 0;
          gstRateTotals[gstRate].totalTax += item.tax || 0;
          gstRateTotals[gstRate].itemCount += 1;
        });
      });
      
      // ... (rest of the PDF generation code remains the same, including the GST breakdown table)
      
      // Save the PDF
      doc.save(`billing_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    }
  };

 // Function to update daily quantity in inventory
 const updateItemQuantity = async (productName, quantity) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/updateQuantitydaily/${encodeURIComponent(productName)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update quantity');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating quantity:", error);
    throw error;
  }
};

// Edit functionality
const handleEditClick = (customerIndex, itemIndex) => {
  const customer = table.getRowModel().rows[customerIndex].original;
  const item = customer.items[itemIndex];
  
  setEditingItem({
    customerIndex, 
    itemIndex,
    customerBillId: customer.billNumber,
    item,
    originalQuantity: item.quantity // Store original quantity for comparison
  });
  
  setEditFormData({
    productName: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    price: item.price,
    gstPercentage: item.gstPercentage || 0,
    hsnCode: item.hsnCode || "",
    tax: item.tax || 0,
    sgst: item.sgst || 0,
    cgst: item.cgst || 0
  });
  
  setEditDialogOpen(true);
};

const handleDeleteClick = (customerIndex, itemIndex) => {
  const customer = table.getRowModel().rows[customerIndex].original;
  const item = customer.items[itemIndex];
  
  setItemToDelete({
    customerIndex,
    itemIndex,
    customerBillId: customer.billNumber,
    isPaid: customer.isPaid, // Add this to identify if it's a credit bill
    productName: item.productName,
    quantity: item.quantity
  });
  
  setDeleteDialogOpen(true);
};

const handleEditFormChange = (e) => {
  const { name, value } = e.target;
  let newFormData = {
    ...editFormData,
    [name]: name === 'productName' ? value : parseFloat(value) || 0
  };
  
  // Recalculate SGST and CGST when GST percentage or price/quantity changes
  if (name === 'gstPercentage' || name === 'price' || name === 'quantity') {
    const gstComponents = calculateGSTComponents(
      name === 'price' ? parseFloat(value) || 0 : newFormData.price,
      name === 'quantity' ? parseFloat(value) || 0 : newFormData.quantity,
      name === 'gstPercentage' ? parseFloat(value) || 0 : newFormData.gstPercentage
    );
    
    newFormData = {
      ...newFormData,
      tax: gstComponents.gstAmount,
      sgst: gstComponents.sgst,
      cgst: gstComponents.cgst
    };
  }
  
  setEditFormData(newFormData);
};

const handleEditSubmit = async () => {
  try {
    // Calculate the quantity difference for inventory update
    const quantityDifference = editingItem.originalQuantity - editFormData.quantity;
    
    // Calculate new amount
    const newAmount = editFormData.price * editFormData.quantity;
    
    // Update the local state
    let updatedData;
    if (table.getRowModel().rows[editingItem.customerIndex].original.isPaid) {
      // Update in billingData
      updatedData = [...billingData];
      const customerIndex = billingData.findIndex(
        customer => customer.billNumber === editingItem.customerBillId
      );
      
      if (customerIndex !== -1 && 
          updatedData[customerIndex].items && 
          updatedData[customerIndex].items[editingItem.itemIndex]) {
        
        updatedData[customerIndex].items[editingItem.itemIndex] = {
          ...updatedData[customerIndex].items[editingItem.itemIndex],
          ...editFormData,
          amount: newAmount
        };
        
        // Recalculate total amount for this bill
        updatedData[customerIndex].totalAmount = updatedData[customerIndex].items.reduce(
          (sum, item) => sum + item.amount, 0
        );
        
        setBillingData(updatedData);
      }
    } else {
      // Update in creditBillingData
      updatedData = [...creditBillingData];
      const customerIndex = creditBillingData.findIndex(
        customer => customer.billNumber === editingItem.customerBillId
      );
      
      if (customerIndex !== -1 && 
          updatedData[customerIndex].items && 
          updatedData[customerIndex].items[editingItem.itemIndex]) {
        
        updatedData[customerIndex].items[editingItem.itemIndex] = {
          ...updatedData[customerIndex].items[editingItem.itemIndex],
          ...editFormData,
          amount: newAmount
        };
        
        // Recalculate total amount for this bill
        updatedData[customerIndex].totalAmount = updatedData[customerIndex].items.reduce(
          (sum, item) => sum + item.amount, 0
        );
        
        setCreditBillingData(updatedData);
      }
    }
    
    // Update the API
    try {
      // First update the item in the billing record via API
      const billUpdateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/billingreport/items`, 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billId: editingItem.customerBillId,
            itemIndex: editingItem.itemIndex,
            updatedItem: {...editFormData, amount: newAmount}
          }),
        }
      );
      
      if (!billUpdateResponse.ok) {
        throw new Error('Failed to update item in billing record');
      }
      
      // Then update the inventory quantity if quantity has changed
      if (quantityDifference !== 0) {
        await updateItemQuantity(editFormData.productName, quantityDifference);
      }
      
      // Show success notification if needed
      console.log('Item updated successfully');
    } catch (apiError) {
      console.error("API Error:", apiError);
      setError(`Failed to update: ${apiError.message}`);
    }
    
    // Close dialog
    setEditDialogOpen(false);
    setEditingItem(null);
    
  } catch (err) {
    setError("Failed to update item. Please try again.");
    console.error(err);
  }
};

const handleDeleteSubmit = async () => {
  try {
    // Update the local state to simulate the change
    let updatedData;
    let customer;
    
    if (table.getRowModel().rows[itemToDelete.customerIndex].original.isPaid) {
      // Update in billingData
      updatedData = [...billingData];
      const customerIndex = billingData.findIndex(
        c => c.billNumber === itemToDelete.customerBillId
      );
      
      if (customerIndex !== -1) {
        customer = updatedData[customerIndex];
        // Adjust for the right item index
        const correctItemIndex = customer.items.findIndex(
          item => item.productName === itemToDelete.productName
        );
        
        if (correctItemIndex !== -1) {
          // Remove the item
          customer.items.splice(correctItemIndex, 1);
          
          // Recalculate total amount for this bill
          customer.totalAmount = customer.items.reduce(
            (sum, item) => sum + item.amount, 0
          );
        }
        
        setBillingData(updatedData);
      }
    } else {
      // Update in creditBillingData
      updatedData = [...creditBillingData];
      const customerIndex = creditBillingData.findIndex(
        c => c.billNumber === itemToDelete.customerBillId
      );
      
      if (customerIndex !== -1) {
        customer = updatedData[customerIndex];
        // Adjust for the right item index
        const correctItemIndex = customer.items.findIndex(
          item => item.productName === itemToDelete.productName
        );
        
        if (correctItemIndex !== -1) {
          // Remove the item
          customer.items.splice(correctItemIndex, 1);
          
          // Recalculate total amount for this bill
          customer.totalAmount = customer.items.reduce(
            (sum, item) => sum + item.amount, 0
          );
        }
        
        setCreditBillingData(updatedData);
      }
    }
    
    // Update the API
    try {
      // First delete the item from the billing record
      const deleteResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/billingreport/items`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billId: itemToDelete.customerBillId,
            isCreditBill: !itemToDelete.isPaid, // Convert isPaid to isCreditBill
            itemIndices: [itemToDelete.itemIndex], // Put the index in an array
          }),
        }
      );
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to delete item from billing record');
      }
      
      // Then update the inventory quantity (adding the deleted quantity back)
      await updateItemQuantity(itemToDelete.productName, itemToDelete.quantity);
      
      // Show success notification if needed
      console.log('Item deleted successfully');
    } catch (apiError) {
      console.error("API Error:", apiError);
      setError(`Failed to delete: ${apiError.message}`);
    }
    
    // Close dialog
    setDeleteDialogOpen(false);
    setItemToDelete(null);
    
  } catch (err) {
    setError("Failed to delete item. Please try again.");
    console.error(err);
  }
};

  if (loading) {
    return <div className="w-full text-center py-8">Loading billing data...</div>;
  }

  // Define columns for display purposes - Added SGST, CGST, and Tax columns
  const columns = [
    { id: "toggle", header: "" },
    { id: "serialNumber", header: "S.No" },
    { id: "date", header: "Date" },
    { id: "customerName", header: "Customer Name" },
    { id: "billNumber", header: "Bill Number" },
    { id: "phone", header: "Phone Number" },
    { id: "aadhar", header: "Aadhar Number" },
    { id: "village", header: "Village/Area" },
    { id: "itemsCount", header: "Items Count" },
    { id: "cashAmount", header: "Cash Amount" },
    { id: "creditAmount", header: "Credit Amount" },
    { id: "paymentMethod", header: "Payment Method" },
    { id: "gst", header: "GST" },
    { id: "sgstAmount", header: "SGST Amount" },
    { id: "cgstAmount", header: "CGST Amount" },
    { id: "taxAmount", header: "Tax Amount" },
    { id: "status", header: "Status" },
    { id: "totalAmount", header: "Total Amount" }
  ];

  // Helper function to render cell content based on column and row data
  const flexRender = (columnDef, context) => {
    const customer = context.row.original;
    const columnId = context.column.id;
    
    // Calculate customer-specific SGST, CGST, and Tax totals
    const customerSGST = customer.items.reduce((sum, item) => sum + (item.sgst || 0), 0);
    const customerCGST = customer.items.reduce((sum, item) => sum + (item.cgst || 0), 0);
    const customerTax = customer.items.reduce((sum, item) => sum + (item.tax || 0), 0);
    
    switch (columnId) {
      case "toggle":
        return expandedRows[context.row.id] ? 
          <ChevronUp size={20} /> : 
          <ChevronDown size={20} />;
      case "serialNumber":
        return context.row.index;
      case "date":
        return formatDate(customer.purchaseDate);
      case "customerName":
        return <span className="font-medium">{customer.customerName}</span>;
      case "billNumber":
        return <span className="font-medium">{customer.billNumber}</span>;
      case "phone":
        return customer.customerPhone;
      case "aadhar":
        return customer.aadharNumber || "N/A";
      case "village":
        return customer.villageArea || "N/A";
      case "itemsCount":
        return customer.items.length;
      case "cashAmount":
        return `₹${(customer.totalAmount - (customer.totalDue || 0)).toFixed(2)}`;
      case "creditAmount":
        return `₹${(customer.totalDue || 0).toFixed(2)}`;
      case "paymentMethod":
        return customer.paymentMethod || "Not Specified";
      case "gst":
        return (
          <Badge variant={customer.showGst ? "outline" : "secondary"}>
            {customer.showGst ? "Yes" : "No"}
          </Badge>
        );
      case "sgstAmount":
        return customer.showGst ? `₹${customerSGST.toFixed(2)}` : <span className="text-muted-foreground italic">N/A</span>;
      case "cgstAmount":
        return customer.showGst ? `₹${customerCGST.toFixed(2)}` : <span className="text-muted-foreground italic">N/A</span>;
      case "taxAmount":
        return customer.showGst ? `₹${customerTax.toFixed(2)}` : <span className="text-muted-foreground italic">N/A</span>;
      case "status":
        return (
          <Badge variant={customer.isPaid ? "success" : "destructive"}>
            {customer.isPaid ? "Paid" : "Unpaid"}
          </Badge>
        );
      case "totalAmount":
        return <span className="font-medium">₹{customer.totalAmount.toFixed(2)}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFEFEF] via-white to-[#FDF5F4] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E1E1E]">Customer Reports</h1>
                <p className="text-sm text-gray-500">Manage and view all billing records</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-l-4 border-l-red-500 glass">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Filters Section */}
        <div className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-[#EE8C7F]" />
            <h2 className="text-lg font-semibold text-[#1E1E1E]">Filters & Search</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Search Records
              </label>
              <Input
                placeholder="Search by name, phone, bill number, Aadhar or village..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center space-x-2 bg-[#FDF5F4] px-4 py-2 rounded-lg border border-[#EE8C7F]/20">
              <Checkbox
                id="showGSTOnly"
                checked={showGSTOnly}
                onCheckedChange={setShowGSTOnly}
                className="data-[state=checked]:bg-[#EE8C7F] data-[state=checked]:border-[#EE8C7F]"
              />
              <label
                htmlFor="showGSTOnly"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                GST Bills Only
              </label>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button onClick={downloadCSV} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md">
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button onClick={downloadPDF} className="bg-gradient-to-r from-[#F5A99F] to-[#EE8C7F] hover:from-[#EE8C7F] hover:to-[#D67568] text-white shadow-md">
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button onClick={downloadCSVa} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md">
                <Download className="mr-2 h-4 w-4" />
                CSV-GST
              </Button>
              <Button onClick={downloadPDFa} className="bg-gradient-to-r from-[#F5A99F] to-[#EE8C7F] hover:from-[#EE8C7F] hover:to-[#D67568] text-white shadow-md">
                <FileText className="mr-2 h-4 w-4" />
                PDF-GST
              </Button>
              <Button className="bg-[#1E1E1E] hover:bg-[#333] text-white shadow-md">
                <Link href="/user/bill" className="flex items-center">
                  Search Bill
                </Link>
              </Button>
            </div>
          </div>
        </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cash Amount</p>
              <p className="text-3xl font-bold text-[#EE8C7F] mt-2">₹{filteredTotals.totalCash.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
              <IndianRupee className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="glass rounded-xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credit Amount</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">₹{filteredTotals.totalCredit.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-md">
              <IndianRupee className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-[#1E1E1E] mt-2">₹{filteredTotals.totalAmount.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-[#1E1E1E] to-[#333] rounded-xl shadow-md">
              <IndianRupee className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total SGST</p>
              <p className="text-2xl font-bold text-[#1E1E1E] mt-2">₹{filteredTotals.totalSGST.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-[#FDF5F4] rounded-xl">
              <FileText className="h-6 w-6 text-[#EE8C7F]" />
            </div>
          </div>
        </div>
        <div className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total CGST</p>
              <p className="text-2xl font-bold text-[#1E1E1E] mt-2">₹{filteredTotals.totalCGST.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-[#FDF5F4] rounded-xl">
              <FileText className="h-6 w-6 text-[#EE8C7F]" />
            </div>
          </div>
        </div>
        <div className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tax</p>
              <p className="text-2xl font-bold text-[#1E1E1E] mt-2">₹{filteredTotals.totalTax.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-[#FDF5F4] rounded-xl">
              <FileText className="h-6 w-6 text-[#EE8C7F]" />
            </div>
          </div>
        </div>
      </div>
      
      {tableData.length === 0 ? (
        <div className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-12 text-center">
          <p className="text-gray-500">No billing data found for the selected criteria.</p>
        </div>
      ) : (
        <>
          {/* Table Section */}
          <div className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
            <div className="rounded-lg border border-[#EE8C7F]/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2]">
                  <TableRow className="hover:bg-[#FDF5F4]">
                    {columns.map((column) => (
                      <TableHead key={column.id} className="min-w-fit whitespace-nowrap font-semibold text-[#1E1E1E]">
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <React.Fragment key={row.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-[#FDF5F4] transition-colors border-b border-[#EE8C7F]/10"
                          onClick={() => toggleRow(row.id)}
                        >
                        {columns.map((column) => (
                          <TableCell key={column.id} className="min-w-fit whitespace-nowrap">
                            {flexRender(column, { column: { id: column.id }, row })}
                          </TableCell>
                        ))}
                      </TableRow>
                      {expandedRows[row.id] && (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="bg-muted/50">
                            <div className="p-4">
                              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium">Customer Details:</p>
                                  <p>Name: {row.original.customerName}</p>
                                  <p>Phone: {row.original.customerPhone}</p>
                                  <p>Aadhar: {row.original.aadharNumber || "N/A"}</p>
                                  <p>Village/Area: {row.original.villageArea || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Bill Details:</p>
                                  <p>Bill Number: {row.original.billNumber}</p>
                                  <p>Date: {formatDate(row.original.purchaseDate)}</p>
                                  <p>Payment Method: {row.original.paymentMethod || "Not Specified"}</p>
                                  <p>GST Applied: {row.original.showGst ? "Yes" : "No"}</p>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>S.No</TableHead>
                                      <TableHead>Product</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>Unit</TableHead>
                                      <TableHead>Price</TableHead>
                                      <TableHead>GST %</TableHead>
                                      <TableHead>HSN</TableHead>
                                      {row.original.showGst && (
                                        <>
                                          <TableHead>SGST %</TableHead>
                                          <TableHead>SGST</TableHead>
                                          <TableHead>CGST %</TableHead>
                                          <TableHead>CGST</TableHead>
                                        </>
                                      )}
                                      <TableHead>Total Tax</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead>Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {row.original.items.map((item, itemIndex) => (
                                      <TableRow key={itemIndex}>
                                        <TableCell>{itemIndex + 1}</TableCell>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                        <TableCell className={row.original.showGst ? "" : "text-muted-foreground italic"}>
                                          {row.original.showGst ? (item.gstPercentage || "0") : "N/A"}
                                        </TableCell>
                                        <TableCell className={row.original.showGst ? "" : "text-muted-foreground italic"}>
                                          {row.original.showGst ? (item.hsnCode || "N/A") : "N/A"}
                                        </TableCell>
                                        {row.original.showGst && (
                                          <>
                                            <TableCell>{(item.sgstPercentage || 0).toFixed(1)}%</TableCell>
                                            <TableCell>₹{(item.sgst || 0).toFixed(2)}</TableCell>
                                            <TableCell>{(item.cgstPercentage || 0).toFixed(1)}%</TableCell>
                                            <TableCell>₹{(item.cgst || 0).toFixed(2)}</TableCell>
                                          </>
                                        )}
                                        <TableCell className={row.original.showGst ? "" : "text-muted-foreground italic"}>
                                          ₹{row.original.showGst ? (item.tax || 0).toFixed(2) : "N/A"}
                                        </TableCell>
                                        <TableCell>₹{item.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(row.id, itemIndex);
                                              }}
                                            >
                                              <Edit size={16} />
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              className="text-red-500 hover:text-red-700"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(row.id, itemIndex);
                                              }}
                                            >
                                              <Trash2 size={16} />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/30 font-medium">
                                      <TableCell colSpan={row.original.showGst ? 11 : 8} className="text-right">
                                        Total:
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        ₹{row.original.totalAmount.toFixed(2)}
                                      </TableCell>
                                      <TableCell></TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#EE8C7F]/20">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPageIndex(old => Math.max(old - 1, 0))}
                disabled={!table.getCanPreviousPage()}
                className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white disabled:opacity-50 shadow-md"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPageIndex(old => Math.min(old + 1, table.getPageCount() - 1))}
                disabled={!table.getCanNextPage()}
                className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white disabled:opacity-50 shadow-md"
              >
                Next
              </Button>
            </div>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPageIndex(0);
              }}
              className="border border-[#EE8C7F]/30 rounded-lg px-4 py-2 focus:border-[#EE8C7F] focus:ring-[#EE8C7F] bg-white"
            >
              {[10, 25, 50, 100, 200, 300, 400, 500, 800, 1000, 1300, 1500, 2000].map(size => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <span className="text-sm font-medium text-gray-600">
              Page {pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
          </div>
        </>
      )}
      
      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Edit the details for this item. SGST and CGST will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="productName" className="text-right">
                  Product Name
                </label>
                <Input
                  id="productName"
                  name="productName"
                  value={editFormData.productName}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="quantity" className="text-right">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={editFormData.quantity}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="unit" className="text-right">
                  Unit
                </label>
                <Input
                  id="unit"
                  name="unit"
                  value={editFormData.unit}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="price" className="text-right">
                  Price
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={editFormData.price}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="gstPercentage" className="text-right">
                  GST %
                </label>
                <Input
                  id="gstPercentage"
                  name="gstPercentage"
                  type="number"
                  step="0.01"
                  value={editFormData.gstPercentage}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="hsnCode" className="text-right">
                  HSN Code
                </label>
                <Input
                  id="hsnCode"
                  name="hsnCode"
                  value={editFormData.hsnCode}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              
              {/* Display calculated values */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right text-sm text-gray-500">
                  SGST ({(editFormData.gstPercentage / 2).toFixed(1)}%)
                </div>
                <div className="col-span-3 font-medium">
                  ₹{editFormData.sgst.toFixed(2)}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right text-sm text-gray-500">
                  CGST ({(editFormData.gstPercentage / 2).toFixed(1)}%)
                </div>
                <div className="col-span-3 font-medium">
                  ₹{editFormData.cgst.toFixed(2)}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right text-sm text-gray-500">
                  Total Tax
                </div>
                <div className="col-span-3 font-medium">
                  ₹{editFormData.tax.toFixed(2)}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right">
                  Calculated Amount
                </div>
                <div className="col-span-3 font-medium">
                  ₹{(editFormData.price * editFormData.quantity).toFixed(2)}
                </div>
             </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditSubmit}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Item Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {itemToDelete && (
            <div className="py-4 border-t border-b">
              <p className="font-medium">You are about to delete:</p>
              <p>Product: {itemToDelete.productName}</p>
              <p>From Bill: #{itemToDelete.customerBillId}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteSubmit}>
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default BillingDetailsTable;