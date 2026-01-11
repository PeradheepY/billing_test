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
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileDown, History, Search, Calendar, Loader2, Users, IndianRupee, Package } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
const CustomerCreditHistory = () => {
  const [creditHistory, setCreditHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [customerDetails, setCustomerDetails] = useState({});

  useEffect(() => {
    fetchCreditHistory();
  }, [startDate, endDate]);

  const fetchCreditHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateQuery = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : "";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/company/credithistory${dateQuery}`
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

  const fetchCustomerDetails = async (invoiceNumber) => {
    if (customerDetails[invoiceNumber]) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/company/credithistory/details/${invoiceNumber}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch customer details');
      }

      const result = await response.json();
      setCustomerDetails(prev => ({
        ...prev,
        [invoiceNumber]: result
      }));
    } catch (err) {
      setError('Failed to load customer details');
    }
  };

  const toggleRow = async (invoiceNumber) => {
    setExpandedRows(prev => ({
      ...prev,
      [invoiceNumber]: !prev[invoiceNumber]
    }));

    if (!customerDetails[invoiceNumber]) {
      await fetchCustomerDetails(invoiceNumber);
    }
  };

  const downloadCustomerReport = async (invoiceNumber) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/company/credithistory/export/${invoiceNumber}`
      );
      
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credit_history_${invoiceNumber}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download report');
    }
  };

  const filteredHistory = creditHistory.filter(
    (record) =>
      record.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoiceNumber?.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive" className="glass border-[#EE8C7F]/20">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Supplier Credit History</h1>
              <p className="text-sm text-gray-500">View detailed transaction history for suppliers</p>
            </div>
          </div>
        </Card>

        {/* Filters Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[#EE8C7F]" />
            <h3 className="text-lg font-semibold text-[#1E1E1E]">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
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
            <div className="flex items-end">
              <Button className="w-full bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md">
                <Link href="/company/invoicebill" className="flex items-center">
                  Search Bill
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Table */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FDF5F4]">
                <TableHead className="text-[#1E1E1E] font-semibold"></TableHead>
                <TableHead className="text-[#1E1E1E] font-semibold">Supplier Name</TableHead>
                <TableHead className="text-[#1E1E1E] font-semibold">Invoice Number</TableHead>
                <TableHead className="text-[#1E1E1E] font-semibold">Total Paid</TableHead>
                <TableHead className="text-[#1E1E1E] font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {filteredHistory.map((record) => (
                <React.Fragment key={record.invoiceNumber}>
                  <TableRow className="hover:bg-[#FDF5F4]/50 transition-colors">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(record.invoiceNumber)}
                        className="hover:bg-[#FDF5F4] text-[#EE8C7F]"
                      >
                        {expandedRows[record.invoiceNumber] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-[#1E1E1E]">{record.supplierName}</TableCell>
                    <TableCell className="text-gray-600">{record.invoiceNumber}</TableCell>
                    <TableCell className="font-semibold text-[#EE8C7F]">₹{record.totalPaid.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => downloadCustomerReport(record.invoiceNumber)}
                        className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRows[record.invoiceNumber] && customerDetails[record.invoiceNumber] && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-[#FDF5F4]/30">
                        <Card className="mt-2 border border-[#EE8C7F]/20 glass">
                          <CardHeader className="bg-[#FDF5F4]">
                            <CardTitle className="text-[#1E1E1E] flex items-center gap-2">
                              <Package className="h-5 w-5 text-[#EE8C7F]" />
                              Transaction Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="rounded-lg border border-[#EE8C7F]/20 overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-[#FAE5E2]">
                                    <TableHead className="text-[#1E1E1E] font-semibold">Date</TableHead>
                                    <TableHead className="text-[#1E1E1E] font-semibold">Items</TableHead>
                                    <TableHead className="text-[#1E1E1E] font-semibold">Credit Amount</TableHead>
                                    <TableHead className="text-[#1E1E1E] font-semibold">Paid Amount</TableHead>
                                    <TableHead className="text-[#1E1E1E] font-semibold">Balance</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody className="bg-white">
                                  {customerDetails[record.invoiceNumber].transactions.map((transaction, index) => (
                                    <React.Fragment key={index}>
                                      <TableRow className="hover:bg-[#FDF5F4]/50 transition-colors">
                                        <TableCell className="text-gray-600">{format(new Date(transaction.date), "yyyy-MM-dd")}</TableCell>
                                        <TableCell>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRow(`${record.invoiceNumber}-${index}`)}
                                            className="hover:bg-[#FDF5F4] text-[#EE8C7F]"
                                          >
                                            {transaction.items.length} items
                                          </Button>
                                        </TableCell>
                                        <TableCell className="text-[#1E1E1E]">₹{transaction.creditAmount.toFixed(2)}</TableCell>
                                        <TableCell className="font-semibold text-[#EE8C7F]">₹{transaction.paidAmount.toFixed(2)}</TableCell>
                                        <TableCell className="font-semibold text-amber-600">₹{transaction.balance.toFixed(2)}</TableCell>
                                      </TableRow>
                                      {expandedRows[`${record.invoiceNumber}-${index}`] && (
                                        <TableRow>
                                          <TableCell colSpan={5} className="bg-amber-50/30">
                                            <div className="rounded-lg border border-amber-200 overflow-hidden mt-2">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow className="bg-amber-50">
                                                    <TableHead className="text-[#1E1E1E] font-semibold">Product</TableHead>
                                                    <TableHead className="text-[#1E1E1E] font-semibold">Quantity</TableHead>
                                                    <TableHead className="text-[#1E1E1E] font-semibold">Unit</TableHead>
                                                    <TableHead className="text-[#1E1E1E] font-semibold">Purchase Price</TableHead>
                                                    <TableHead className="text-[#1E1E1E] font-semibold">GST%</TableHead>
                                                    <TableHead className="text-[#1E1E1E] font-semibold">Discount</TableHead>
                                                    <TableHead className="text-[#1E1E1E] font-semibold">HSN Code</TableHead>
                                                    <TableHead className="text-[#1E1E1E] font-semibold">Amount</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody className="bg-white">
                                                  {transaction.items.map((item, itemIndex) => (
                                                    <TableRow key={itemIndex} className="hover:bg-amber-50/50 transition-colors">
                                                      <TableCell className="font-medium text-[#1E1E1E]">{item.productName}</TableCell>
                                                      <TableCell className="text-gray-600">{item.quantity}</TableCell>
                                                      <TableCell className="text-gray-600">{item.unit}</TableCell>
                                                      <TableCell className="text-[#1E1E1E]">₹{item.purchaseprice.toFixed(2)}</TableCell>
                                                      <TableCell className="text-gray-600">{item.gstPercentage || 0}%</TableCell>
                                                      <TableCell className="text-gray-600">{item.purchaseDiscount}%</TableCell>
                                                      <TableCell className="text-gray-600">{item.hsnCode || 'N/A'}</TableCell>
                                                      <TableCell className="font-semibold text-[#EE8C7F]">
                                                        ₹{(item.purchaseprice * (1 - item.purchaseDiscount/100) * (1 + item.gstPercentage/100)).toFixed(2)}
                                                      </TableCell>
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
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default CustomerCreditHistory;