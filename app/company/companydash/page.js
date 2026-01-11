"use client"
import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, Download, FileText, FileSpreadsheet, Trash2, Edit, Plus, Loader2, LayoutDashboard, Search, Filter, IndianRupee, Package } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedInvoices, setExpandedInvoices] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showGST, setShowGST] = useState(true);
  const tableRef = useRef(null);
  
  // Edit/Add/Delete related state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentInvoiceRef, setCurrentInvoiceRef] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      
      // Build the query string with date filters if they exist
      let queryParams = new URLSearchParams();
      if (startDate) {
        queryParams.append('startDate', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        queryParams.append('endDate', endDate.toISOString().split('T')[0]);
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/companydash${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Apply date filters
  const applyDateFilters = () => {
    fetchItems();
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    // Fetch all items without date filters
    setTimeout(() => {
      fetchItems();
    }, 0);
  };

  // Calculate item total with discount
  const calculateItemTotal = (item) => {
    const subtotal = item.purchaseprice * item.quantity;
    const discount = subtotal * (item.purchaseDiscount / 100);
    return subtotal - discount;
  };

  const calculateGSTDetails = (item) => {
    // Add checks for missing or invalid values
    const quantity = Number(item.quantity) || 0;
    const purchasePrice = Number(item.purchaseprice) || 0;
    const purchaseDiscount = Number(item.purchaseDiscount) || 0;
    const gstPercentage = Number(item.gstPercentage) || 0;
    
    const subtotal = purchasePrice * quantity;
    const discount = subtotal * (purchaseDiscount / 100);
    const netAmount = subtotal - discount;
    
    const gstRate = gstPercentage / 100;
    const gstAmount = netAmount * gstRate;
    const sgst = gstAmount / 2;
    const cgst = gstAmount / 2;
    const totalAmount = netAmount + sgst + cgst;
  
    return {
      netAmount,
      gstAmount,
      sgst,
      cgst,
      totalAmount
    };
  };

  // Group and filter items
  const groupedItems = Object.values(
    items
      .filter(item => 
        (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.invoiceNumber && item.invoiceNumber.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .reduce((acc, item) => {
        const invoiceKey = `${item.supplierName}-${item.invoiceNumber}`;
        if (!acc[invoiceKey]) {
          acc[invoiceKey] = {
            supplierName: item.supplierName,
            invoiceNumber: item.invoiceNumber,
            items: []
          };
        }
        acc[invoiceKey].items.push(item);
        return acc;
      }, {})
  );

  const toggleInvoiceExpansion = (invoiceKey) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [invoiceKey]: !prev[invoiceKey]
    }));
  };

 // Replace the existing downloadPDF and downloadCSV functions in your component with these enhanced versions

// Helper function to segregate items by GST percentage
const segregateItemsByGST = (groupedItems) => {
  const gstCategories = {
    0: { items: [], totalNetAmount: 0, totalSGST: 0, totalCGST: 0, totalAmount: 0 },
    5: { items: [], totalNetAmount: 0, totalSGST: 0, totalCGST: 0, totalAmount: 0 },
    12: { items: [], totalNetAmount: 0, totalSGST: 0, totalCGST: 0, totalAmount: 0 },
    18: { items: [], totalNetAmount: 0, totalSGST: 0, totalCGST: 0, totalAmount: 0 },
    other: { items: [], totalNetAmount: 0, totalSGST: 0, totalCGST: 0, totalAmount: 0 }
  };

  groupedItems.forEach((invoice, index) => {
    // Group items within each invoice by GST percentage
    const invoiceGSTGroups = {};
    
    invoice.items.forEach(item => {
      const gstRate = Number(item.gstPercentage) || 0;
      if (!invoiceGSTGroups[gstRate]) {
        invoiceGSTGroups[gstRate] = [];
      }
      invoiceGSTGroups[gstRate].push(item);
    });

    // Process each GST group within the invoice
    Object.keys(invoiceGSTGroups).forEach(gstRate => {
      const gstRateNum = Number(gstRate);
      const items = invoiceGSTGroups[gstRate];
      
      // Calculate totals for this GST group
      let groupNetAmount = 0;
      let groupSGST = 0;
      let groupCGST = 0;
      let groupTotalAmount = 0;
      
      items.forEach(item => {
        const { netAmount, sgst, cgst, totalAmount } = calculateGSTDetails(item);
        groupNetAmount += netAmount;
        groupSGST += sgst;
        groupCGST += cgst;
        groupTotalAmount += totalAmount;
      });

      // Get unique HSN codes for this GST group
      const uniqueHsnCodes = [...new Set(items.map(item => item.hsnCode).filter(Boolean))];
      const hsnDisplay = uniqueHsnCodes.length > 0 ? uniqueHsnCodes.join(', ') : 'N/A';

      const invoiceData = {
        serialNo: index + 1,
        invoiceNumber: invoice.invoiceNumber,
        supplierName: invoice.supplierName,
        hsnCode: hsnDisplay,
        gstPercentage: `${gstRateNum}%`,
        netAmount: groupNetAmount,
        sgst: groupSGST,
        cgst: groupCGST,
        totalAmount: groupTotalAmount,
        itemCount: items.length
      };

      // Categorize by GST rate
      const category = [0, 5, 12, 18].includes(gstRateNum) ? gstRateNum : 'other';
      gstCategories[category].items.push(invoiceData);
      gstCategories[category].totalNetAmount += groupNetAmount;
      gstCategories[category].totalSGST += groupSGST;
      gstCategories[category].totalCGST += groupCGST;
      gstCategories[category].totalAmount += groupTotalAmount;
    });
  });

  return gstCategories;
};

// Enhanced PDF Download Function
const downloadPDF = () => {
  const doc = new jsPDF();
  let currentY = 22;
  
  // Add title
  doc.setFontSize(18);
  doc.text("Company Credit Records - GST Segregated Report", 14, currentY);
  currentY += 10;
  
  // Add date range if applicable
  if (startDate || endDate) {
    doc.setFontSize(12);
    let dateText = "Date Range: ";
    if (startDate) dateText += format(startDate, "PPP");
    if (startDate && endDate) dateText += " to ";
    if (endDate) dateText += format(endDate, "PPP");
    doc.text(dateText, 14, currentY);
    currentY += 10;
  }

  const gstCategories = segregateItemsByGST(groupedItems);
  
  // Process each GST category
  [0, 5, 12, 18, 'other'].forEach(gstRate => {
    const category = gstCategories[gstRate];
    if (category.items.length === 0) return;

    // Add category header
    currentY += 5;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    const categoryTitle = gstRate === 'other' ? 'Other GST Rates' : `${gstRate}% GST Items`;
    doc.text(categoryTitle, 14, currentY);
    currentY += 5;

    // Prepare table data for this category
    const tableData = category.items.map((item, index) => [
      index + 1,
      item.invoiceNumber,
      item.supplierName,
      item.hsnCode,
      item.gstPercentage,
      `Rs. ${item.sgst.toFixed(2)}`,
      `Rs. ${item.cgst.toFixed(2)}`,
      `Rs. ${item.netAmount.toFixed(2)}`,
      `Rs. ${item.totalAmount.toFixed(2)}`,
      item.itemCount
    ]);

    // Add table for this category
    autoTable(doc, {
      head: [['S.No', 'Invoice No.', 'Supplier Name', 'HSN Code', 'GST%', 'SGST', 'CGST', 'Net Amount', 'Total Amount', 'Items']],
      body: tableData,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 5;

    // Add category totals
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`${categoryTitle} Summary:`, 14, currentY);
    currentY += 5;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Total Invoices: ${category.items.length}`, 14, currentY);
    doc.text(`Net Amount: Rs. ${category.totalNetAmount.toFixed(2)}`, 90, currentY);
    currentY += 5;
    
    if (gstRate !== 0) {
      doc.text(`SGST: Rs. ${category.totalSGST.toFixed(2)}`, 14, currentY);
      doc.text(`CGST: Rs. ${category.totalCGST.toFixed(2)}`, 90, currentY);
      currentY += 5;
    }
    
    doc.setFont(undefined, 'bold');
    doc.text(`Category Total: Rs. ${category.totalAmount.toFixed(2)}`, 14, currentY);
    currentY += 10;

    // Add new page if needed
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
  });

  // Add grand totals
  const grandTotal = Object.values(gstCategories).reduce((sum, category) => sum + category.totalAmount, 0);
  const totalInvoices = Object.values(gstCategories).reduce((sum, category) => sum + category.items.length, 0);

  currentY += 5;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text("GRAND TOTAL SUMMARY", 14, currentY);
  currentY += 8;
  
  doc.setFontSize(10);
  doc.text(`Total Invoices: ${totalInvoices}`, 14, currentY);
  currentY += 5;
  doc.text(`Grand Total Amount: Rs. ${grandTotal.toFixed(2)}`, 14, currentY);
  
  // Save the PDF
  doc.save("company-credit-records-gst-segregated.pdf");
};

// Enhanced CSV Download Function
const downloadCSV = () => {
  let csvContent = "";
  
  // Add header
  csvContent += "Company Credit Records - GST Segregated Report\n";
  if (startDate || endDate) {
    let dateText = "Date Range: ";
    if (startDate) dateText += format(startDate, "PPP");
    if (startDate && endDate) dateText += " to ";
    if (endDate) dateText += format(endDate, "PPP");
    csvContent += dateText + "\n";
  }
  csvContent += "\n";

  const gstCategories = segregateItemsByGST(groupedItems);
  
  // Process each GST category
  [0, 5, 12, 18, 'other'].forEach(gstRate => {
    const category = gstCategories[gstRate];
    if (category.items.length === 0) return;

    // Add category header
    const categoryTitle = gstRate === 'other' ? 'Other GST Rates' : `${gstRate}% GST Items`;
    csvContent += `${categoryTitle}\n`;
    csvContent += "S.No,Invoice No.,Supplier Name,HSN Code,GST%,SGST,CGST,Net Amount,Total Amount,Items\n";
    
    // Add category data
    category.items.forEach((item, index) => {
      csvContent += `${index + 1},${item.invoiceNumber},"${item.supplierName}","${item.hsnCode}",${item.gstPercentage},Rs. ${item.sgst.toFixed(2)},Rs. ${item.cgst.toFixed(2)},Rs. ${item.netAmount.toFixed(2)},Rs. ${item.totalAmount.toFixed(2)},${item.itemCount}\n`;
    });
    
    // Add category summary
    csvContent += `\n${categoryTitle} Summary:\n`;
    csvContent += `Total Invoices,${category.items.length}\n`;
    csvContent += `Net Amount,Rs. ${category.totalNetAmount.toFixed(2)}\n`;
    if (gstRate !== 0) {
      csvContent += `SGST,Rs. ${category.totalSGST.toFixed(2)}\n`;
      csvContent += `CGST,Rs. ${category.totalCGST.toFixed(2)}\n`;
    }
    csvContent += `Category Total,Rs. ${category.totalAmount.toFixed(2)}\n`;
    csvContent += "\n";
  });

  // Add grand totals
  const grandTotal = Object.values(gstCategories).reduce((sum, category) => sum + category.totalAmount, 0);
  const totalInvoices = Object.values(gstCategories).reduce((sum, category) => sum + category.items.length, 0);
  
  csvContent += "GRAND TOTAL SUMMARY\n";
  csvContent += `Total Invoices,${totalInvoices}\n`;
  csvContent += `Grand Total Amount,Rs. ${grandTotal.toFixed(2)}\n`;
  
  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'company-credit-records-gst-segregated.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // Edit item handler
  const handleEditItem = (item, invoiceKey) => {
    setCurrentItem({...item});
    setCurrentInvoiceRef(invoiceKey);
    setIsEditDialogOpen(true);
  };

  // Delete item handler
  const handleDeleteItem = (item, invoiceKey) => {
    setCurrentItem(item);
    setCurrentInvoiceRef(invoiceKey);
    setIsDeleteDialogOpen(true);
  };

  // Add item handler
  const handleAddItem = (invoiceKey, supplierName, invoiceNumber) => {
    // Create empty item template with required fields
    setCurrentItem({
      productName: "",
      hsnCode: "",
      quantity: 1,
      unit: "pcs",
      purchaseprice: 0,
      price: 0, // Added required field for MongoDB
      amount: 0, // Added required field for MongoDB
      purchaseDiscount: 0,
      gstPercentage: 18,
      supplierName: supplierName,
      invoiceNumber: invoiceNumber
    });
    setCurrentInvoiceRef(invoiceKey);
    setIsAddDialogOpen(true);
  };

  // Save edited item
  const saveEditedItem = async () => {
    try {
      // Validate required fields
      if (!currentItem.productName) {
        toast.error("Product name is required");
        return;
      }
      
      // Ensure numeric values are valid
      const quantity = parseFloat(currentItem.quantity) || 0;
      const purchasePrice = parseFloat(currentItem.purchaseprice) || 0;
      const purchaseDiscount = parseFloat(currentItem.purchaseDiscount) || 0;
      
      const subtotal = purchasePrice * quantity;
      const discount = subtotal * (purchaseDiscount / 100);
      const netAmount = subtotal - discount;
      
      // Prepare the item with all required fields
      const itemToSave = {
        ...currentItem,
        quantity: quantity,
        purchaseprice: purchasePrice,
        purchaseDiscount: purchaseDiscount,
        price: purchasePrice, // Required field
        amount: netAmount     // Required field
      };
      
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/companydash/${currentItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemToSave),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
  
      // Update local state
      const updatedItems = items.map(item => 
        item.id === currentItem.id ? itemToSave : item
      );
      
      setItems(updatedItems);
      setIsEditDialogOpen(false);
      toast.success("Item has been successfully updated.");
    } catch (error) {
      toast.error(error.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  };
  // Save new item
  const saveNewItem = async () => {
    try {
      // Validation and calculations remain the same
      if (!currentItem.productName) {
        toast.error("Product name is required");
        return;
      }
      
      const quantity = parseFloat(currentItem.quantity) || 0;
      const purchasePrice = parseFloat(currentItem.purchaseprice) || 0;
      const purchaseDiscount = parseFloat(currentItem.purchaseDiscount) || 0;
      
      const subtotal = purchasePrice * quantity;
      const discount = subtotal * (purchaseDiscount / 100);
      const netAmount = subtotal - discount;
      
      const itemToSave = {
        ...currentItem,
        quantity: quantity,
        purchaseprice: purchasePrice,
        purchaseDiscount: purchaseDiscount,
        price: purchasePrice, // Required field
        amount: netAmount     // Required field
      };
      
      setLoading(true);
      
      // Structure the data as an array in the items property
      const requestData = {
        items: [itemToSave]  // Wrap in 'items' array
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/companydash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),  // Send the properly structured data
      });
      
      // Rest of the function remains the same
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item');
      }
      
      const newItem = await response.json();
      
      setItems([...items, newItem]);
      setIsAddDialogOpen(false);
      toast.success("New item has been successfully added.");
    } catch (error) {
      toast.error(error.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const deleteItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/companydash/${currentItem.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Update local state
      const updatedItems = items.filter(item => item.id !== currentItem.id);
      setItems(updatedItems);
      setIsDeleteDialogOpen(false);
      toast.success("Item has been successfully deleted.");
    } catch (error) {
      toast.error(error.message || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for edit/add dialogs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => {
      let parsedValue = value;
      
      // Only try to parse as float for numeric fields
      if (['quantity', 'purchaseprice', 'gstPercentage', 'purchaseDiscount'].includes(name)) {
        parsedValue = value === '' ? 0 : parseFloat(value);
        // Check for NaN and replace with 0 if needed
        if (isNaN(parsedValue)) parsedValue = 0;
      }
      
      const newItem = {
        ...prev,
        [name]: parsedValue
      };
      
      // Update price when purchaseprice changes
      if (name === 'purchaseprice') {
        newItem.price = parsedValue;
      }
      
      return newItem;
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-[#EE8C7F]" />
            <p className="text-gray-600">Loading company records...</p>
          </div>
        </Card>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="glass rounded-2xl shadow-lg border border-red-200 p-12">
          <div className="flex flex-col items-center justify-center gap-3 text-red-500">
            <p className="text-lg font-semibold">Error: {error}</p>
          </div>
        </Card>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Company Credit Records</h1>
              <p className="text-sm text-gray-500">View and manage supplier credit transactions</p>
            </div>
          </div>
        </Card>
        
        {/* Date Filters Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-[#EE8C7F]" />
            <h3 className="text-lg font-semibold text-[#1E1E1E]">Date Range Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-200 hover:border-[#EE8C7F] hover:bg-[#FDF5F4]"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#EE8C7F]" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-200 hover:border-[#EE8C7F] hover:bg-[#FDF5F4]"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#EE8C7F]" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => startDate && date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex items-end">
              <Button onClick={applyDateFilters} className="w-full bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md">Apply Filters</Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearDateFilters} className="w-full border-gray-300 hover:bg-gray-50">Clear</Button>
            </div>
          </div>
        </Card>
        
        {/* Search and Actions Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Search by Supplier Name or Invoice Number" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-gst"
                checked={showGST}
                onCheckedChange={setShowGST}
                className="border-[#EE8C7F] text-[#EE8C7F] data-[state=checked]:bg-[#EE8C7F]"
              />
              <label 
                htmlFor="show-gst" 
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Show GST Details
              </label>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={downloadPDF}
                className="bg-red-500 hover:bg-red-600 text-white shadow-md"
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button 
                onClick={downloadCSV}
                className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Table Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 overflow-hidden">
          <div className="p-6">
            <div className="h-[500px] rounded-lg border border-[#EE8C7F]/20 overflow-auto">
              <table className="w-full" ref={tableRef}>
                <thead className="bg-[#FDF5F4] sticky top-0">
                  <tr>
                    <th className="text-left p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">S.No</th>
                    <th className="text-left p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Invoice No.</th>
                    <th className="text-left p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Supplier Name</th>
                    <th className="text-left p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">HSN Code</th>
                    {showGST && <th className="text-right p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">GST%</th>}
                    {showGST && <th className="text-right p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">SGST</th>}
                    {showGST && <th className="text-right p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">CGST</th>}
                    <th className="text-right p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Net Amount</th>
                    <th className="text-right p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Total Amount</th>
                    <th className="text-left p-3 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Items</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {groupedItems.map((invoice, index) => {
                  const invoiceKey = `${invoice.supplierName}-${invoice.invoiceNumber}`;
                  
                  // Calculate totals for the invoice
                  let totalNetAmount = 0;
                  let totalSGST = 0;
                  let totalCGST = 0;
                  let invoiceTotalAmount = 0;
                  
                  invoice.items.forEach(item => {
                    const { netAmount, sgst, cgst, totalAmount } = calculateGSTDetails(item);
                    totalNetAmount += netAmount;
                    totalSGST += sgst;
                    totalCGST += cgst;
                    invoiceTotalAmount += totalAmount;
                  });
                  
                  // Get all unique HSN codes and GST percentages
                  const uniqueHsnCodes = [...new Set(invoice.items.map(item => item.hsnCode).filter(Boolean))];
                  const uniqueGstPercentages = [...new Set(invoice.items.map(item => item.gstPercentage).filter(Boolean))];
                  
                  const hsnDisplay = uniqueHsnCodes.length > 0 
                    ? uniqueHsnCodes.join(', ')
                    : 'N/A';
                    
                  const gstDisplay = uniqueGstPercentages.length > 0
                    ? uniqueGstPercentages.map(gst => `${gst}%`).join(', ')
                    : '0%';
                  
                    return (
                      <React.Fragment key={index}>
                        <tr className="cursor-pointer hover:bg-[#FDF5F4]/50 transition-colors">
                          <td className="p-3 border-b border-[#EE8C7F]/10 text-gray-600">{index + 1}</td>
                          <td className="p-3 border-b border-[#EE8C7F]/10 text-[#1E1E1E]">{invoice.invoiceNumber}</td>
                          <td className="p-3 border-b border-[#EE8C7F]/10 font-medium text-[#1E1E1E]">{invoice.supplierName}</td>
                          <td className="p-3 border-b border-[#EE8C7F]/10 text-gray-600">{hsnDisplay}</td>
                          {showGST && <td className="p-3 border-b border-[#EE8C7F]/10 text-right text-gray-600">{gstDisplay}</td>}
                          {showGST && <td className="p-3 border-b border-[#EE8C7F]/10 text-right text-[#1E1E1E]">₹{totalSGST.toFixed(2)}</td>}
                          {showGST && <td className="p-3 border-b border-[#EE8C7F]/10 text-right text-[#1E1E1E]">₹{totalCGST.toFixed(2)}</td>}
                          <td className="p-3 border-b border-[#EE8C7F]/10 text-right text-[#1E1E1E]">₹{totalNetAmount.toFixed(2)}</td>
                          <td className="p-3 border-b border-[#EE8C7F]/10 text-right font-semibold text-[#EE8C7F]">₹{invoiceTotalAmount.toFixed(2)}</td>
                          <td className="p-3 border-b border-[#EE8C7F]/10">
                            <div 
                              className="flex items-center cursor-pointer text-[#EE8C7F] hover:text-[#D67568]"
                              onClick={() => toggleInvoiceExpansion(invoiceKey)}
                            >
                              <span className="mr-1 font-medium">{invoice.items.length}</span>
                              {expandedInvoices[invoiceKey] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expandable details for the invoice */}
                        {expandedInvoices[invoiceKey] && (
                          <tr>
                            <td colSpan={10} className="p-0 border-t-0">
                              <div className="bg-[#FDF5F4]/30 p-4 rounded-md m-2">
                                <div className="flex justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-[#EE8C7F]" />
                                    <h4 className="font-semibold text-[#1E1E1E]">Invoice Items</h4>
                                  </div>
                                {/* <Button
                                  variant="outline" 
                                  size="sm"
                                  className="flex items-center text-[#EE8C7F] border-[#EE8C7F] hover:bg-[#FDF5F4]"
                                  onClick={() => handleAddItem(invoiceKey, invoice.supplierName, invoice.invoiceNumber)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Item
                                </Button> */}
                                </div>
                                <div className="rounded-lg border border-[#EE8C7F]/20 overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-[#FAE5E2]">
                                      <tr>
                                        <th className="text-left p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Product Name</th>
                                        <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">HSN Code</th>
                                        <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Qty</th>
                                        <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Unit</th>
                                        <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Price</th>
                                        <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Discount</th>
                                        {showGST && <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">GST%</th>}
                                        {showGST && <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">SGST</th>}
                                        {showGST && <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">CGST</th>}
                                        <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Net Amount</th>
                                        <th className="text-right p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Total Amount</th>
                                        <th className="text-center p-2 border-b border-[#EE8C7F]/20 font-semibold text-[#1E1E1E]">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                      {invoice.items.map((item, itemIndex) => {
                                        const { netAmount, sgst, cgst, totalAmount } = calculateGSTDetails(item);
                                        return (
                                          <tr key={itemIndex} className="hover:bg-[#FDF5F4]/50 transition-colors">
                                            <td className="p-2 border-b border-[#EE8C7F]/10 font-medium text-[#1E1E1E]">{item.productName}</td>
                                            <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-gray-600">{item.hsnCode || 'N/A'}</td>
                                            <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-[#1E1E1E]">{item.quantity}</td>
                                            <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-gray-600">{item.unit}</td>
                                            <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-[#1E1E1E]">₹{item.purchaseprice.toFixed(2)}</td>
                                            <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-gray-600">{item.purchaseDiscount}%</td>
                                            {showGST && <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-gray-600">{item.gstPercentage}%</td>}
                                            {showGST && <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-[#1E1E1E]">₹{sgst.toFixed(2)}</td>}
                                            {showGST && <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-[#1E1E1E]">₹{cgst.toFixed(2)}</td>}
                                            <td className="p-2 border-b border-[#EE8C7F]/10 text-right text-[#1E1E1E]">₹{netAmount.toFixed(2)}</td>
                                            <td className="p-2 border-b border-[#EE8C7F]/10 text-right font-semibold text-[#EE8C7F]">₹{totalAmount.toFixed(2)}</td>
                                            <td className="p-2 border-b border-[#EE8C7F]/10 text-center">
                                              <div className="flex justify-center space-x-2">
                                                <button 
                                                  className="text-[#EE8C7F] hover:text-[#D67568] p-1 rounded hover:bg-[#FDF5F4] transition-colors"
                                                  onClick={() => handleEditItem(item, invoiceKey)}
                                                >
                                                  <Edit size={16} />
                                                </button>
                                                <button 
                                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                                                  onClick={() => handleDeleteItem(item, invoiceKey)}
                                                >
                                                  <Trash2 size={16} />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] rounded-xl border border-[#EE8C7F]/20">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-lg shadow-md">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Invoices: {groupedItems.length}</p>
                    <p className="text-2xl font-bold text-[#EE8C7F]">
                      ₹{
                        groupedItems.reduce((sum, invoice) => {
                          if (!invoice || !invoice.items || !Array.isArray(invoice.items)) {
                            return sum;
                          }
                          return sum + invoice.items.reduce((itemSum, item) => {
                            if (!item) return itemSum;
                            try {
                              const { totalAmount } = calculateGSTDetails(item);
                              return itemSum + (isNaN(totalAmount) ? 0 : totalAmount);
                            } catch (e) {
                              console.error("Error calculating item total:", e);
                              return itemSum;
                            }
                          }, 0);
                        }, 0).toFixed(2)
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Item Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] glass border border-[#EE8C7F]/20">
            <DialogHeader>
              <DialogTitle className="text-[#1E1E1E]">Edit Item</DialogTitle>
              <DialogDescription>
                Make changes to the item details below.
              </DialogDescription>
            </DialogHeader>
            {currentItem && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="productName" className="text-right font-medium text-gray-700">Product Name</label>
                  <Input
                    id="productName"
                    name="productName"
                    value={currentItem.productName}
                    onChange={handleInputChange}
                    className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="hsnCode" className="text-right font-medium text-gray-700">HSN Code</label>
                  <Input
                    id="hsnCode"
                    name="hsnCode"
                    value={currentItem.hsnCode || ''}
                    onChange={handleInputChange}
                    className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="quantity" className="text-right font-medium text-gray-700">Quantity</label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={currentItem.quantity}
                    onChange={handleInputChange}
                    className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    min={1}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="unit" className="text-right font-medium text-gray-700">Unit</label>
                  <Input
                    id="unit"
                    name="unit"
                    value={currentItem.unit}
                    onChange={handleInputChange}
                    className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="purchaseprice" className="text-right font-medium text-gray-700">Price</label>
                  <Input
                    id="purchaseprice"
                    name="purchaseprice"
                    type="number"
                    step="0.01"
                    value={currentItem.purchaseprice}
                    onChange={handleInputChange}
                    className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    min={0}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="purchaseDiscount" className="text-right font-medium text-gray-700">Discount (%)</label>
                  <Input
                    id="purchaseDiscount"
                    name="purchaseDiscount"
                    type="number"
                    step="0.01"
                    value={currentItem.purchaseDiscount}
                    onChange={handleInputChange}
                    className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    min={0}
                    max={100}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="gstPercentage" className="text-right font-medium text-gray-700">GST (%)</label>
                  <Input
                    id="gstPercentage"
                    name="gstPercentage"
                    type="number"
                    step="0.01"
                    value={currentItem.gstPercentage}
                    onChange={handleInputChange}
                    className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-300">Cancel</Button>
              <Button onClick={saveEditedItem} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Add Item Dialog */}
      {/* <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Enter the details for the new item.
            </DialogDescription>
          </DialogHeader>
          {currentItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="productName" className="text-right font-medium">Product Name</label>
                <Input
                  id="productName"
                  name="productName"
                  value={currentItem.productName}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="hsnCode" className="text-right font-medium">HSN Code</label>
                <Input
                  id="hsnCode"
                  name="hsnCode"
                  value={currentItem.hsnCode || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Enter HSN code"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="quantity" className="text-right font-medium">Quantity</label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={currentItem.quantity}
                  onChange={handleInputChange}
                  className="col-span-3"
                  min={1}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="unit" className="text-right font-medium">Unit</label>
                <Input
                  id="unit"
                  name="unit"
                  value={currentItem.unit}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="e.g., pcs, kg, etc."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="purchaseprice" className="text-right font-medium">Price</label>
                <Input
                  id="purchaseprice"
                  name="purchaseprice"
                  type="number"
                  step="0.01"
                  value={currentItem.purchaseprice}
                  onChange={handleInputChange}
                  className="col-span-3"
                  min={0}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="purchaseDiscount" className="text-right font-medium">Discount (%)</label>
                <Input
                  id="purchaseDiscount"
                  name="purchaseDiscount"
                  type="number"
                  step="0.01"
                  value={currentItem.purchaseDiscount}
                  onChange={handleInputChange}
                  className="col-span-3"
                  min={0}
                  max={100}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="gstPercentage" className="text-right font-medium">GST (%)</label>
                <Input
                  id="gstPercentage"
                  name="gstPercentage"
                  type="number"
                  step="0.01"
                  value={currentItem.gstPercentage}
                  onChange={handleInputChange}
                  className="col-span-3"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveNewItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

        {/* Delete Item Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] glass border border-[#EE8C7F]/20">
            <DialogHeader>
              <DialogTitle className="text-[#1E1E1E]">Delete Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {currentItem && (
              <div className="py-4">
                <p className="mb-2 text-gray-700"><span className="font-semibold">Product:</span> {currentItem.productName}</p>
                <p className="mb-4 text-gray-700"><span className="font-semibold">Price:</span> ₹{currentItem.purchaseprice?.toFixed(2)}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-gray-300">Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={deleteItem}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}