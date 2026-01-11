"use client";
import React, { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Download, Search, UserPlus, Upload, FileUp, FileText, Users, TrendingUp, Calendar, IndianRupee, DollarSign, Loader2 } from "lucide-react";

const CreditBillReport = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [customerReports, setCustomerReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [importSupplierOpen, setImportSupplierOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplierName: "",
    invoiceNumber: "",
    totalDue: 0,
    discount: 0,
    gst: 0, // Default GST to 0%
    lastBillDate: new Date().toISOString().split("T")[0],
  });
  const [importedSuppliers, setImportedSuppliers] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReports();
  }, [selectedDateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const customerData = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/company/reports/customers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedDateRange),
        }
      ).then((res) => res.json());
  
      if (customerData.success) {
        // Make sure we're completely replacing the state with fresh data
        setCustomerReports(customerData.data);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Error fetching reports: " + (error.message || "Unknown error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    // Validate inputs
    if (!newSupplier.supplierName || !newSupplier.invoiceNumber) {
      setNotification({
        type: "error",
        message: "Supplier name and invoice number are required",
      });
      return;
    }

    // Ensure totalDue is a number
    const totalDue = parseFloat(newSupplier.totalDue);
    if (isNaN(totalDue) || totalDue <= 0) {
      setNotification({
        type: "error",
        message: "Please enter a valid amount for total due",
      });
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ledger/supplier`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newSupplier,
            totalDue: totalDue,
            discount: parseFloat(newSupplier.discount) || 0,
            gst: parseFloat(newSupplier.gst) || 0,
            date: newSupplier.lastBillDate,
            isCreditBill: true,
          }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setNotification({
          type: "success",
          message: "Supplier added successfully",
        });
        setAddSupplierOpen(false);
        setNewSupplier({
          supplierName: "",
          invoiceNumber: "",
          totalDue: 0,
          discount: 0,
          gst: 0,
          lastBillDate: new Date().toISOString().split("T")[0],
        });
        fetchReports(); // Refresh the data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error adding supplier",
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'csv' && fileType !== 'xlsx' && fileType !== 'xls') {
      setNotification({
        type: "error",
        message: "Please upload a CSV or Excel file"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        // Simple CSV parsing - can be enhanced with a proper library
        const rows = csvData.split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        // Map headers to expected fields
        const nameIndex = headers.findIndex(h => 
          h.toLowerCase().includes('name') || h.toLowerCase().includes('supplier'));
        const invoiceIndex = headers.findIndex(h => 
          h.toLowerCase().includes('invoice') || h.toLowerCase().includes('bill'));
        const amountIndex = headers.findIndex(h => 
          h.toLowerCase().includes('amount') || h.toLowerCase().includes('due') || 
          h.toLowerCase().includes('total'));
        const dateIndex = headers.findIndex(h => 
          h.toLowerCase().includes('date'));
        const discountIndex = headers.findIndex(h => 
          h.toLowerCase().includes('discount'));
        const gstIndex = headers.findIndex(h => 
          h.toLowerCase().includes('gst') || h.toLowerCase().includes('tax'));
        
        if (nameIndex === -1 || invoiceIndex === -1 || amountIndex === -1) {
          throw new Error("Required columns not found in the file. Need columns for supplier name, invoice number, and amount");
        }

        const parsedData = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const columns = rows[i].split(',').map(c => c.trim());
          if (columns.length < Math.max(nameIndex, invoiceIndex, amountIndex) + 1) {
            continue; // Skip malformed rows
          }
          
          const supplier = {
            supplierName: columns[nameIndex],
            invoiceNumber: columns[invoiceIndex],
            totalDue: parseFloat(columns[amountIndex].replace(/[^\d.-]/g, '')) || 0, // Remove currency symbols
            discount: discountIndex !== -1 ? parseFloat(columns[discountIndex]) || 0 : 0,
            gst: gstIndex !== -1 ? parseFloat(columns[gstIndex]) || 0 : 0, // Default GST to 0% if not provided
            lastBillDate: dateIndex !== -1 && columns[dateIndex] 
              ? new Date(columns[dateIndex]).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]
          };
          
          if (supplier.supplierName && supplier.invoiceNumber) {
            parsedData.push(supplier);
          }
        }
        
        if (parsedData.length === 0) {
          throw new Error("No valid supplier data found in the file");
        }
        
        setImportedSuppliers(parsedData);
      } catch (error) {
        setNotification({
          type: "error",
          message: error.message || "Error parsing file"
        });
      }
    };
    
    reader.readAsText(file);
  };

  const handleImportSuppliers = async () => {
    if (importedSuppliers.length === 0) {
      setNotification({
        type: "error",
        message: "No suppliers to import"
      });
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < importedSuppliers.length; i++) {
      try {
        const supplier = importedSuppliers[i];
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ledger/supplier`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...supplier,
              date: supplier.lastBillDate,
              isCreditBill: true,
            }),
          }
        );
        const data = await res.json();

        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Update progress
        setImportProgress(Math.round(((i + 1) / importedSuppliers.length) * 100));
      } catch (error) {
        errorCount++;
      }
    }

    setNotification({
      type: "success",
      message: `Import complete: ${successCount} suppliers added successfully, ${errorCount} errors`
    });
    
    setIsImporting(false);
    setImportSupplierOpen(false);
    setImportedSuppliers([]);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    fetchReports(); // Refresh the reports
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier((prev) => ({
      ...prev,
      [name]: name === "totalDue" || name === "discount" || name === "gst" 
        ? parseFloat(value) || 0 
        : value,
    }));
  };

  const handlePaymentSettlement = async (customerId, invoiceNumber) => {
    try {
      // Replace basic prompt with a more robust solution in a production app
      const partialAmount = parseFloat(prompt("Enter payment amount:"));
      
      if (!partialAmount || isNaN(partialAmount) || partialAmount <= 0) {
        setNotification({
          type: "error",
          message: "Please enter a valid payment amount greater than zero"
        });
        return;
      }
      
      // Add confirmation step
      if (!confirm(`Confirm settlement of ₹${partialAmount.toFixed(2)} for invoice ${invoiceNumber}?`)) {
        return;
      }
    
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/company/settlements/${invoiceNumber}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            partialAmount,
            customerId, // Include the ID for reference
            isCreditBill: true // Add flag to identify this as a credit bill settlement
          })
        }
      );
      
      const data = await res.json();
    
      if (data.success) {
        // Parse the remaining balance as a number
        const newRemainingBalance = parseFloat(data.remainingBalance);
        
        setNotification({
          type: "success",
          message: `Payment of ₹${partialAmount.toFixed(2)} settled successfully. Remaining balance: ₹${newRemainingBalance.toFixed(2)}`
        });
        
        // Update the customer reports directly with the new balance
        setCustomerReports(prevReports => 
          prevReports.map(customer => 
            customer.invoiceNumber === invoiceNumber
              ? {...customer, totalDue: newRemainingBalance}
              : customer
          )
        );
      } else {
        throw new Error(data.message || "Settlement failed");
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error settling payment"
      });
    }
  };

  const handleDeleteRecord = async (customerId, invoiceNumber) => {
    try {
      const identifier = customerId || invoiceNumber;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/company/customers/${identifier}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();

      if (data.success) {
        setNotification({
          type: "success",
          message: "Record deleted successfully",
        });
        // Remove the deleted record from the state instead of fetching again
        setCustomerReports(prevReports => 
          prevReports.filter(customer => 
            customer._id !== customerId && customer.invoiceNumber !== invoiceNumber
          )
        );
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error deleting record",
      });
    }
  };

  const downloadCSV = (data, filename) => {
    const headers = Object.keys(data[0]).join(",");
    const csvData = data
      .map((row) => Object.values(row).join(","))
      .join("\n");
    const blob = new Blob([`${headers}\n${csvData}`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplateCSV = () => {
    const headers = "supplierName,invoiceNumber,totalDue,discount,gst,lastBillDate";
    const exampleData = "Sample Supplier,INV001,1000.00,5,0,2025-03-07\nAnother Supplier,INV002,2500.50,10,12,2025-03-07";
    const blob = new Blob([`${headers}\n${exampleData}`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supplier-import-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculateTotalStats = () => {
    const totalDue = customerReports.reduce(
      (sum, customer) => sum + customer.totalDue,
      0
    );
    const totalCustomers = customerReports.length;
    const averageDue = totalCustomers > 0 ? totalDue / totalCustomers : 0;

    return { totalDue, totalCustomers, averageDue };
  };

  const filteredCustomers = customerReports.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.supplierName.toLowerCase().includes(searchLower) ||
      String(customer.invoiceNumber).toLowerCase().includes(searchLower)
    );
  });

  // Calculate preview of total with discount and GST for the add supplier form
  const previewTotal = () => {
    const subtotal = parseFloat(newSupplier.totalDue) || 0;
    const discount = parseFloat(newSupplier.discount) || 0;
    const gst = parseFloat(newSupplier.gst) || 0;
    
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = afterDiscount * (gst / 100);
    const finalTotal = afterDiscount + gstAmount;
    
    return isNaN(finalTotal) ? 0 : finalTotal.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {notification && (
          <Alert
            variant={notification.type === "success" ? "default" : "destructive"}
            className="mb-4 glass border-[#EE8C7F]/20"
            onMouseEnter={() => setTimeout(() => setNotification(null), 3000)}
          >
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E1E1E]">Supplier Credit Reports</h1>
                <p className="text-sm text-gray-500">Track supplier credit bills and payments</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Date Range Filter */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[#EE8C7F]" />
            <h3 className="text-lg font-semibold text-[#1E1E1E]">Date Range</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={selectedDateRange.start}
                onChange={(e) =>
                  setSelectedDateRange((prev) => ({
                    ...prev,
                    start: e.target.value,
                  }))
                }
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Input
                type="date"
                value={selectedDateRange.end}
                onChange={(e) =>
                  setSelectedDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => fetchReports()} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md">
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-[#EE8C7F]" />
              <p className="text-gray-600">Loading reports...</p>
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="customers" className="w-full">
            <TabsList className="bg-[#FDF5F4]">
              <TabsTrigger value="customers" className="data-[state=active]:bg-white data-[state=active]:text-[#EE8C7F]">Supplier-wise</TabsTrigger>
            </TabsList>

            <TabsContent value="customers">
              <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-[#1E1E1E]">Supplier-wise Credit Report</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddSupplierOpen(true)}
                      className="border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FDF5F4]"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Supplier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImportSupplierOpen(true)}
                      className="border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FDF5F4]"
                    >
                      <FileUp className="w-4 h-4 mr-2" />
                      Import Suppliers
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCSV(customerReports, "supplier-report")}
                      className="border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FDF5F4]"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {(() => {
                      const stats = calculateTotalStats();
                      return (
                        <>
                          <Card className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 hover:shadow-xl transition-shadow">
                            <div className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Total Due</p>
                                  <p className="text-3xl font-bold text-[#EE8C7F] mt-2">
                                    ₹{stats.totalDue.toFixed(2)}
                                  </p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
                                  <IndianRupee className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            </div>
                          </Card>
                          <Card className="glass rounded-xl shadow-lg border border-[#1E1E1E]/10 hover:shadow-xl transition-shadow">
                            <div className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                                  <p className="text-3xl font-bold text-[#1E1E1E] mt-2">{stats.totalCustomers}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-[#1E1E1E] to-[#333] rounded-xl shadow-md">
                                  <Users className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            </div>
                          </Card>
                          <Card className="glass rounded-xl shadow-lg border border-amber-200 hover:shadow-xl transition-shadow">
                            <div className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Average Due</p>
                                  <p className="text-3xl font-bold text-amber-600 mt-2">
                                    ₹{stats.averageDue.toFixed(2)}
                                  </p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-md">
                                  <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            </div>
                          </Card>
                        </>
                      );
                    })()}
                  </div>

                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search supplier or invoice..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#EE8C7F]/20 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#FDF5F4]">
                          <TableHead className="text-[#1E1E1E] font-semibold">Supplier Name</TableHead>
                          <TableHead className="text-[#1E1E1E] font-semibold">Invoice Number</TableHead>
                          <TableHead className="text-[#1E1E1E] font-semibold">Bill Date</TableHead>
                          <TableHead className="text-right text-[#1E1E1E] font-semibold">Amount Due</TableHead>
                          <TableHead className="text-[#1E1E1E] font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        {filteredCustomers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              No records found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <TableRow key={customer.invoiceNumber} className="hover:bg-[#FDF5F4]/50 transition-colors">
                              <TableCell className="font-medium text-[#1E1E1E]">
                                {customer.supplierName}
                              </TableCell>
                              <TableCell className="text-gray-600">{customer.invoiceNumber}</TableCell>
                              <TableCell className="text-gray-600">
                                {new Date(customer.lastBillDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-[#EE8C7F]">
                                ₹{customer.totalDue.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePaymentSettlement(customer._id, customer.invoiceNumber)}
                                    className="border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FDF5F4]"
                                  >
                                    Pay
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteRecord(customer._id, customer.invoiceNumber)}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Add Supplier Dialog */}
        <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
          <DialogContent className="glass border border-[#EE8C7F]/20">
            <DialogHeader>
              <DialogTitle className="text-[#1E1E1E]">Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-700 font-medium">Supplier Name</label>
                <Input
                  name="supplierName"
                  value={newSupplier.supplierName}
                  onChange={handleInputChange}
                  className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-700 font-medium">Invoice Number</label>
                <Input
                  name="invoiceNumber"
                  value={newSupplier.invoiceNumber}
                  onChange={handleInputChange}
                  className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-700 font-medium">Total Amount</label>
                <Input
                  name="totalDue"
                  type="number"
                  value={newSupplier.totalDue}
                  onChange={handleInputChange}
                  className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-700 font-medium">Discount (%)</label>
                <Input
                  name="discount"
                  type="number"
                  value={newSupplier.discount}
                  onChange={handleInputChange}
                  className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-700 font-medium">GST (%)</label>
                <Input
                  name="gst"
                  type="number"
                  value={newSupplier.gst}
                  onChange={handleInputChange}
                  className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-700 font-medium">Bill Date</label>
                <Input
                  name="lastBillDate"
                  type="date"
                  value={newSupplier.lastBillDate}
                  onChange={handleInputChange}
                  className="col-span-3 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-700 font-medium">Final Amount</label>
                <div className="col-span-3 font-semibold text-[#EE8C7F] text-lg">₹{previewTotal()}</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddSupplierOpen(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button onClick={handleAddSupplier} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Suppliers Dialog */}
        <Dialog open={importSupplierOpen} onOpenChange={setImportSupplierOpen}>
          <DialogContent className="glass border border-[#EE8C7F]/20">
            <DialogHeader>
              <DialogTitle className="text-[#1E1E1E]">Import Suppliers</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 font-medium">Upload CSV or Excel file</label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
                <Button variant="outline" size="sm" onClick={downloadTemplateCSV} className="border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FDF5F4]">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
              
              {importedSuppliers.length > 0 && (
                <div>
                  <p className="mb-2 text-gray-700 font-medium">Preview: {importedSuppliers.length} suppliers</p>
                  <div className="max-h-48 overflow-y-auto border border-[#EE8C7F]/20 rounded-lg p-2">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#FDF5F4]">
                          <TableHead className="text-[#1E1E1E]">Supplier</TableHead>
                          <TableHead className="text-[#1E1E1E]">Invoice</TableHead>
                          <TableHead className="text-right text-[#1E1E1E]">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importedSuppliers.slice(0, 5).map((supplier, index) => (
                          <TableRow key={index} className="hover:bg-[#FDF5F4]/50">
                            <TableCell>{supplier.supplierName}</TableCell>
                            <TableCell>{supplier.invoiceNumber}</TableCell>
                            <TableCell className="text-right text-[#EE8C7F] font-semibold">₹{supplier.totalDue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        {importedSuppliers.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-gray-500">
                              ... and {importedSuppliers.length - 5} more
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {isImporting && (
                <div>
                  <p className="text-gray-700 font-medium mb-2">Importing suppliers: {importProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] h-3 rounded-full transition-all" style={{ width: `${importProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setImportSupplierOpen(false);
                setImportedSuppliers([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }} className="border-gray-300">
                Cancel
              </Button>
              <Button onClick={handleImportSuppliers} disabled={importedSuppliers.length === 0 || isImporting} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white">
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CreditBillReport;