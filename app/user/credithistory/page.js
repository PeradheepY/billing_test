"use client"
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileDown, ArrowUpDown, FileText, Loader2, History, Calendar, Search, User, Phone, IndianRupee, Package, TrendingUp } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CustomerCreditHistory = () => {
  const [creditHistory, setCreditHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [customerDetails, setCustomerDetails] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  useEffect(() => {
    fetchCreditHistory();
  }, [startDate, endDate]);

  const fetchCreditHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateQuery = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : "";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credithistory${dateQuery}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch credit history');
      }
      const result = await response.json();
      setCreditHistory(result.data);
    } catch (err) {
      setError(err.message || "Failed to load credit history");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerPhone) => {
    if (customerDetails[customerPhone]) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credithistory/details/${customerPhone}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch customer details');
      }
      const result = await response.json();
      setCustomerDetails(prev => ({
        ...prev,
        [customerPhone]: result
      }));
    } catch (err) {
      setError('Failed to load customer details');
    }
  };

  const toggleRow = async (customerPhone) => {
    setExpandedRows(prev => ({
      ...prev,
      [customerPhone]: !prev[customerPhone]
    }));
    if (!customerDetails[customerPhone]) {
      await fetchCustomerDetails(customerPhone);
    }
  };

  const downloadCustomerReport = async (customerPhone) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credithistory/export/${customerPhone}`
      );
      
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credit_history_${customerPhone}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download report');
    }
  };

  // New PDF generation function
  const generateDetailedPDF = async (customerPhone) => {
    try {
      // First make sure we have the customer details
      if (!customerDetails[customerPhone]) {
        await fetchCustomerDetails(customerPhone);
      }
      
      const customer = customerDetails[customerPhone];
      const customerInfo = creditHistory.find(c => c.customerPhone === customerPhone);
      
      if (!customer || !customerInfo) {
        throw new Error('Customer details not found');
      }

      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title and header
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 128);
      doc.text("Transaction History Report", 105, 15, { align: "center" });
      
      // Add customer details
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Customer: ${customerInfo.customerName}`, 14, 30);
      doc.text(`Phone: ${customerPhone}`, 14, 37);
      doc.text(`Report Date: ${format(new Date(), "yyyy-MM-dd")}`, 14, 44);
      
      // Add summary section
      doc.setFillColor(240, 240, 240);
      doc.rect(14, 50, 182, 20, "F");
      doc.setFont(undefined, "bold");
      doc.text("Account Summary", 105, 58, { align: "center" });
      doc.setFont(undefined, "normal");
      
      // Use 'Rs.' instead of the Rupee symbol
      doc.text(`Total Credit: Rs.${customerInfo.totalCredit}`, 20, 65);
      doc.text(`Total Paid: Rs.${customerInfo.totalPaid}`, 80, 65);
     
      // Add transaction history table
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Transaction History", 105, 85, { align: "center" });
      
      // Define transaction table data
      const transactionHead = [['Date', 'Days', 'Credit Amount', 'Paid Amount', 'Balance']];
      
      const transactionBody = customer.transactions.map(transaction => [
        format(new Date(transaction.date), "yyyy-MM-dd"),
        differenceInDays(new Date(), new Date(transaction.date)) + ' days',
        'Rs.' + transaction.creditAmount.toFixed(2),
        'Rs.' + transaction.paidAmount.toFixed(2),
        'Rs.' + ((transaction.creditAmount - transaction.paidAmount).toFixed(2))  // Calculate balance
      ]);
      
      // Add transaction table
      autoTable(doc, {
        head: transactionHead,
        body: transactionBody,
        startY: 90,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202] },
      });
      
      // For each transaction, add the item details
      let currentY = doc.lastAutoTable.finalY + 10;
      
      for (let i = 0; i < customer.transactions.length; i++) {
        const transaction = customer.transactions[i];
        
        // Add page if there's not enough space
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }
        
        // Transaction title
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text(`Transaction: ${format(new Date(transaction.date), "yyyy-MM-dd")}`, 14, currentY);
        currentY += 7;
        
        const itemHead = [['Product', 'Quantity', 'Unit', 'Price', 'Amount']];
        
        const itemBody = transaction.items.map(item => [
          item.productName,
          item.quantity,
          item.unit,
          'Rs.' + item.price.toFixed(2),
          'Rs.' + item.amount.toFixed(2),
        ]);
        
        // Add items table
        autoTable(doc, {
          head: itemHead,
          body: itemBody,
          startY: currentY,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [100, 100, 100] },
        });
        
        currentY = doc.lastAutoTable.finalY + 10;
      }
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
        doc.text(`Generated on ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 105, 295, { align: "center" });
      }
      
      // Save the PDF
      doc.save(`Transaction_History_${customerInfo.customerName}_${customerPhone}.pdf`);
      
    } catch (err) {
      console.error(err);
      setError('Failed to generate PDF report');
    }
};

  const calculateDaysSinceTransaction = (transactionDate) => {
    const days = differenceInDays(new Date(), new Date(transactionDate));
    return days;
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredHistory = creditHistory.filter(
    (record) =>
      record.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerPhone?.toString().includes(searchTerm)
  );

  const sortedData = getSortedData(filteredHistory);
  
  // Calculate totals
  const totalCredit = sortedData.reduce((sum, record) => sum + record.totalCredit, 0);
  const totalPaid = sortedData.reduce((sum, record) => sum + record.totalPaid, 0);
  const totalBalance = sortedData.reduce((sum, record) => sum + record.balance, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EFEFEF] via-white to-[#FDF5F4] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-[#EE8C7F]" />
              <p className="text-gray-600">Loading credit history...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFEFEF] via-white to-[#FDF5F4] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Customer Credit History</h1>
              <p className="text-sm text-gray-500">Track customer transactions and outstanding balances</p>
            </div>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive" className="border-red-200 glass">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Filters Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#EE8C7F]" />
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
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#EE8C7F]" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Search className="h-4 w-4 text-[#EE8C7F]" />
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Main Table Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] border-b border-[#EE8C7F]/20">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => requestSort('customerName')}
                      className="flex items-center hover:bg-[#FDF5F4] font-semibold text-[#1E1E1E]"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Customer Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => requestSort('customerPhone')}
                      className="flex items-center hover:bg-[#FDF5F4] font-semibold text-[#1E1E1E]"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Phone Number
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => requestSort('totalCredit')}
                      className="flex items-center hover:bg-[#FDF5F4] font-semibold text-[#1E1E1E]"
                    >
                      <IndianRupee className="mr-2 h-4 w-4" />
                      Total Credit
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => requestSort('totalPaid')}
                      className="flex items-center hover:bg-[#FDF5F4] font-semibold text-[#1E1E1E]"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Total Paid
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => requestSort('balance')}
                      className="flex items-center hover:bg-[#FDF5F4] font-semibold text-[#1E1E1E]"
                    >
                      Balance
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#1E1E1E]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((record) => (
                  <React.Fragment key={record.customerPhone}>
                    <TableRow className="hover:bg-[#FDF5F4] transition-colors border-b border-[#EE8C7F]/10">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(record.customerPhone)}
                          className="hover:bg-[#FDF5F4]"
                        >
                          {expandedRows[record.customerPhone] ? (
                            <ChevronUp className="h-4 w-4 text-[#EE8C7F]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#EE8C7F]" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-[#1E1E1E]">{record.customerName}</TableCell>
                      <TableCell className="text-gray-600">{record.customerPhone}</TableCell>
                      <TableCell className="text-[#1E1E1E]">₹{record.totalCredit}</TableCell>
                      <TableCell className="text-[#1E1E1E]">₹{record.totalPaid}</TableCell>
                      <TableCell>
                        <Badge variant={record.balance > 0 ? "destructive" : "success"} className="font-semibold">
                          ₹{record.balance}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => downloadCustomerReport(record.customerPhone)}
                          title="Download CSV"
                          className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateDetailedPDF(record.customerPhone)}
                          title="Download Detailed PDF"
                          className="border-[#EE8C7F] text-[#EE8C7F] hover:bg-[#FDF5F4]"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRows[record.customerPhone] && customerDetails[record.customerPhone] && (
                      <TableRow className="bg-[#FDF5F4]/30">
                        <TableCell colSpan={7}>
                          <Card className="mt-2 border-[#EE8C7F]/20 bg-white rounded-xl shadow-md">
                            <CardHeader className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2]">
                              <CardTitle className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Package className="h-5 w-5 text-[#EE8C7F]" />
                                  <span className="text-[#1E1E1E]">Transaction Details</span>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => generateDetailedPDF(record.customerPhone)}
                                  className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download PDF Report
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="rounded-lg border border-[#EE8C7F]/20 overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-[#F5A99F]/20 to-[#EE8C7F]/20 border-b border-[#EE8C7F]/20">
                                      <TableHead className="font-semibold text-[#1E1E1E]">Date</TableHead>
                                      <TableHead className="font-semibold text-[#1E1E1E]">No. of Days</TableHead>
                                      <TableHead className="font-semibold text-[#1E1E1E]">Items</TableHead>
                                      <TableHead className="font-semibold text-[#1E1E1E]">Credit Amount</TableHead>
                                      <TableHead className="font-semibold text-[#1E1E1E]">Paid Amount</TableHead>
                                      <TableHead className="font-semibold text-[#1E1E1E]">Balance</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {customerDetails[record.customerPhone].transactions.map((transaction, index) => (
                                      <React.Fragment key={index}>
                                        <TableRow className="hover:bg-[#FDF5F4] transition-colors border-b border-[#EE8C7F]/10">
                                          <TableCell className="text-[#1E1E1E]">
                                            <div className="flex items-center gap-2">
                                              <Calendar className="h-4 w-4 text-gray-400" />
                                              {format(new Date(transaction.date), "yyyy-MM-dd")}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-gray-600">{calculateDaysSinceTransaction(transaction.date)} days</TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleRow(`${record.customerPhone}-${index}`)}
                                              className="text-[#EE8C7F] hover:bg-[#FDF5F4]"
                                            >
                                              <Package className="h-4 w-4 mr-1" />
                                              {transaction.items.length} items
                                            </Button>
                                          </TableCell>
                                          <TableCell className="text-[#1E1E1E]">₹{transaction.creditAmount.toFixed(2)}</TableCell>
                                          <TableCell className="text-[#EE8C7F] font-medium">₹{transaction.paidAmount.toFixed(2)}</TableCell>
                                          <TableCell className="text-amber-600 font-medium">₹{transaction.balance.toFixed(2)}</TableCell>
                                        </TableRow>
                                        {expandedRows[`${record.customerPhone}-${index}`] && (
                                          <TableRow className="bg-amber-50/30">
                                            <TableCell colSpan={6}>
                                              <div className="p-3 rounded-lg border border-amber-200/50 bg-white m-2 shadow-sm">
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/50">
                                                      <TableHead className="font-semibold text-[#1E1E1E]">Product</TableHead>
                                                      <TableHead className="font-semibold text-[#1E1E1E]">Quantity</TableHead>
                                                      <TableHead className="font-semibold text-[#1E1E1E]">Unit</TableHead>
                                                      <TableHead className="font-semibold text-[#1E1E1E]">Price</TableHead>
                                                      <TableHead className="font-semibold text-[#1E1E1E]">Amount</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {transaction.items.map((item, itemIndex) => (
                                                      <TableRow key={itemIndex} className="hover:bg-amber-50 transition-colors border-b border-amber-100/50">
                                                        <TableCell className="font-medium text-[#1E1E1E]">{item.productName}</TableCell>
                                                        <TableCell className="text-gray-700">{item.quantity}</TableCell>
                                                        <TableCell className="text-gray-600">{item.unit}</TableCell>
                                                        <TableCell className="text-[#1E1E1E]">₹{item.price.toFixed(2)}</TableCell>
                                                        <TableCell className="font-medium text-amber-600">₹{item.amount.toFixed(2)}</TableCell>
                                                      </TableRow>
                                                    ))}
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
                              </div>
                            </CardContent>
                          </Card>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] border-t-2 border-[#EE8C7F]/30">
                  <TableCell colSpan={3} className="font-bold text-[#1E1E1E]">Total</TableCell>
                  <TableCell className="font-bold text-[#1E1E1E]">₹{totalCredit.toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-[#EE8C7F]">₹{totalPaid.toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-amber-700">₹{totalBalance.toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CustomerCreditHistory;