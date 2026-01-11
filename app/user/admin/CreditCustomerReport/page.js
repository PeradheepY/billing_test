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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Trash2, Download, Search, UserPlus, Upload, FileUp, Edit } from "lucide-react";

const CreditBillReport = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [customerReports, setCustomerReports] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [importCustomersOpen, setImportCustomersOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerName: "",
    customerPhone: "",
    totalDue: 0,
    lastBillDate: new Date().toISOString().split("T")[0],
  });
  const [editingCustomer, setEditingCustomer] = useState({
    _id: "",
    customerName: "",
    customerPhone: "",
    totalDue: 0,
    lastBillDate: new Date().toISOString().split("T")[0],
  });
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'customerName', direction: 'asc' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReports();
  }, [selectedDateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [customerData, monthlyData, dailyData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ getAllCustomers: true }), // Modified to get all customers
        }).then((res) => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/monthly`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedDateRange),
        }).then((res) => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/daily`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedDateRange),
        }).then((res) => res.json()),
      ]);

      if (customerData.success) {
        setCustomerReports(customerData.data);
      }
      if (monthlyData.success) setMonthlyReports(monthlyData.data);
      if (dailyData.success) setDailyReports(dailyData.data);
    } catch (error) {
      setNotification({
        type: "error",
        message: "Error fetching reports",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    // Validate inputs
    if (!newCustomer.customerName || !newCustomer.customerPhone) {
      setNotification({
        type: "error",
        message: "Customer name and phone are required",
      });
      return;
    }
  
    // Ensure totalDue is a number
    const totalDue = parseFloat(newCustomer.totalDue);
    if (isNaN(totalDue)) {
      setNotification({
        type: "error",
        message: "Please enter a valid amount for total due",
      });
      return;
    }
  
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ledger/customer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newCustomer,
            totalDue: totalDue,
            isCreditBill: true,
            date: newCustomer.lastBillDate,
          }),
        }
      );
      const data = await res.json();
  
      if (data.success) {
        setNotification({
          type: "success",
          message: "Customer added successfully",
        });
        setAddCustomerOpen(false);
        setNewCustomer({
          customerName: "",
          customerPhone: "",
          totalDue: 0,
          lastBillDate: new Date().toISOString().split("T")[0],
        });
        fetchReports(); // Refresh the data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error adding customer",
      });
    }
  };

  const handleEditCustomer = async () => {
    // Validate inputs
    if (!editingCustomer.customerName || !editingCustomer.customerPhone) {
      setNotification({
        type: "error",
        message: "Customer name and phone are required",
      });
      return;
    }
  
    // Ensure totalDue is a number
    const totalDue = parseFloat(editingCustomer.totalDue);
    if (isNaN(totalDue)) {
      setNotification({
        type: "error",
        message: "Please enter a valid amount for total due",
      });
      return;
    }
  
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ledger/customer/${editingCustomer._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: editingCustomer.customerName,
            customerPhone: editingCustomer.customerPhone,
            totalDue: totalDue,
            date: editingCustomer.lastBillDate,
          }),
        }
      );
      const data = await res.json();
  
      if (data.success) {
        setNotification({
          type: "success",
          message: "Customer updated successfully",
        });
        setEditCustomerOpen(false);
        fetchReports(); // Refresh the data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error updating customer",
      });
    }
  };

  const openEditCustomerDialog = (customer) => {
    setEditingCustomer({
      _id: customer._id,
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      totalDue: customer.totalDue,
      lastBillDate: new Date(customer.lastBillDate).toISOString().split("T")[0],
    });
    setEditCustomerOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        
        // Get headers from the first line
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Check if the CSV has required columns
        const requiredColumns = ['customerName', 'customerPhone', 'totalDue'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          setNotification({
            type: "error",
            message: `CSV missing required columns: ${missingColumns.join(', ')}`
          });
          setImportFile(null);
          return;
        }
        
        // Parse the data
        const parsedData = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines
          
          const values = lines[i].split(',');
          const entry = {};
          
          headers.forEach((header, index) => {
            entry[header] = values[index] ? values[index].trim() : '';
            
            // Convert totalDue to number
            if (header === 'totalDue') {
              entry[header] = parseFloat(entry[header]) || 0;
            }
          });
          
          // Add default lastBillDate if not provided
          if (!entry.lastBillDate) {
            entry.lastBillDate = new Date().toISOString().split('T')[0];
          }
          
          parsedData.push(entry);
        }
        
        setImportPreview(parsedData);
      } catch (error) {
        setNotification({
          type: "error",
          message: "Error parsing CSV file"
        });
        setImportFile(null);
      }
    };
    
    reader.readAsText(file);
  };

  const handleImportCustomers = async () => {
    if (!importPreview.length) {
      setNotification({
        type: "error",
        message: "No valid data to import"
      });
      return;
    }
    
    setLoading(true);
    try {
      const importPromises = importPreview.map(customer => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ledger/customer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...customer,
            isCreditBill: true,
            date: customer.lastBillDate || new Date().toISOString().split('T')[0],
          }),
        }).then(res => res.json())
      );
      
      const results = await Promise.all(importPromises);
      const successCount = results.filter(result => result.success).length;
      
      setNotification({
        type: "success",
        message: `Successfully imported ${successCount} of ${importPreview.length} customers`
      });
      
      setImportCustomersOpen(false);
      setImportFile(null);
      setImportPreview([]);
      fetchReports();
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error importing customers"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSettlement = async (customerId) => {
    try {
      const partialAmount = parseFloat(prompt("Enter payment amount:"));
      if (!partialAmount || isNaN(partialAmount)) {
        setNotification({
          type: "error",
          message: "Please enter a valid payment amount"
        });
        return;
      }
  
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settlements/${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ partialAmount })
        }
      );
      const data = await res.json();
  
      if (data.success) {
        setNotification({
          type: "success",
          message: `Payment of ₹${partialAmount} settled successfully. Remaining balance: ₹${data.remainingBalance}`
        });
        setTimeout(() => {
          fetchReports();
        }, 500);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error settling payment"
      });
    }
  };

  const handleDeleteRecord = async (customerId, customerPhone) => {
    try {
      const identifier = customerId || customerPhone;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${identifier}`,
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
        setTimeout(() => {
          fetchReports();
        }, 500);
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
    const headers = "customerName,customerPhone,totalDue,lastBillDate";
    const sampleData = "John Doe,9876543210,1000," + new Date().toISOString().split("T")[0];
    const blob = new Blob([`${headers}\n${sampleData}`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-import-template.csv`;
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

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const filteredCustomers = customerReports.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.customerName.toLowerCase().includes(searchLower) ||
      String(customer.customerPhone).toLowerCase().includes(searchLower)
    );
  });

  const sortedCustomers = React.useMemo(() => {
    let sortableCustomers = [...filteredCustomers];
    if (sortConfig.key) {
      sortableCustomers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCustomers;
  }, [filteredCustomers, sortConfig]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({
      ...prev,
      [name]: name === "totalDue" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCustomer((prev) => ({
      ...prev,
      [name]: name === "totalDue" ? parseFloat(value) || 0 : value,
    }));
  };

  const getSortIcon = (column) => {
    if (sortConfig.key === column) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '⇅';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-7xl mx-auto">
      {notification && (
        <Alert
          variant={notification.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-xl"
          onMouseEnter={() => setTimeout(() => setNotification(null), 3000)}
        >
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4 text-[#1E1E1E]">Credit Bill Reports</h1>
        <div className="flex gap-4 mb-4">
          <Input
            type="date"
            value={selectedDateRange.start}
            onChange={(e) =>
              setSelectedDateRange((prev) => ({
                ...prev,
                start: e.target.value,
              }))
            }
            className="border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
          />
          <Input
            type="date"
            value={selectedDateRange.end}
            onChange={(e) =>
              setSelectedDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
          />
          <Button onClick={() => fetchReports()} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C45D50] text-white">Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#EE8C7F]"></div>
        </div>
      ) : (
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="bg-[#FDF5F4] rounded-xl">
            <TabsTrigger value="customers" className="data-[state=active]:bg-white data-[state=active]:text-[#EE8C7F] rounded-lg">Customer-wise</TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-[#EE8C7F] rounded-lg">Monthly</TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-white data-[state=active]:text-[#EE8C7F] rounded-lg">Daily</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#1E1E1E]">Customer-wise Credit Report</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddCustomerOpen(true)}
                    className="border-[#EE8C7F]/30 hover:bg-[#FDF5F4] hover:text-[#EE8C7F]"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportCustomersOpen(true)}
                    className="border-[#EE8C7F]/30 hover:bg-[#FDF5F4] hover:text-[#EE8C7F]"
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    Import Customers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCSV(customerReports, "customer-report")}
                    className="border-[#EE8C7F]/30 hover:bg-[#FDF5F4] hover:text-[#EE8C7F]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {(() => {
                    const stats = calculateTotalStats();
                    return (
                      <>
                        <Card className="p-4 glass border border-[#EE8C7F]/20 rounded-xl">
                          <p className="text-sm text-gray-500">Total Due</p>
                          <p className="text-2xl font-bold text-[#EE8C7F]">
                          ₹{stats.totalDue.toFixed(2)}
                          </p>
                        </Card>
                        <Card className="p-4 glass border border-[#EE8C7F]/20 rounded-xl">
                          <p className="text-sm text-gray-500">Total Customers</p>
                          <p className="text-2xl font-bold text-[#1E1E1E]">{stats.totalCustomers}</p>
                        </Card>
                        <Card className="p-4 glass border border-[#EE8C7F]/20 rounded-xl">
                          <p className="text-sm text-gray-500">Average Due</p>
                          <p className="text-2xl font-bold text-[#EE8C7F]">
                          ₹{stats.averageDue.toFixed(2)}
                          </p>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by customer name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                  />
                </div>

                <div className="rounded-xl border border-[#EE8C7F]/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FDF5F4] hover:bg-[#FDF5F4]">
                      <TableHead onClick={() => requestSort('customerName')} className="cursor-pointer font-semibold text-[#1E1E1E]">
                        Customer {getSortIcon('customerName')}
                      </TableHead>
                      <TableHead onClick={() => requestSort('customerPhone')} className="cursor-pointer font-semibold text-[#1E1E1E]">
                        Phone.No {getSortIcon('customerPhone')}
                      </TableHead>
                      <TableHead className="text-right cursor-pointer font-semibold text-[#1E1E1E]" onClick={() => requestSort('totalDue')}>
                        Total Due {getSortIcon('totalDue')}
                      </TableHead>
                      <TableHead className="text-right cursor-pointer font-semibold text-[#1E1E1E]" onClick={() => requestSort('lastBillDate')}>
                        Last Bill Date {getSortIcon('lastBillDate')}
                      </TableHead>
                      <TableHead className="text-right cursor-pointer font-semibold text-[#1E1E1E]" onClick={() => requestSort('daysSinceLastBill')}>
                         Days Since Bill {getSortIcon('daysSinceLastBill')}
                       </TableHead>
                      <TableHead className="font-semibold text-[#1E1E1E]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCustomers.map((customer) => {
                      // Calculate days since last bill
                      const lastBillDate = new Date(customer.lastBillDate);
                      const currentDate = new Date();
                      const diffTime = Math.abs(currentDate - lastBillDate);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      // Add this calculated property to the customer object for sorting
                      customer.daysSinceLastBill = diffDays;
                      
                      return (
                        <TableRow key={customer._id} className="hover:bg-[#FDF5F4]/50 border-b border-[#EE8C7F]/10">
                          <TableCell className="font-medium text-[#1E1E1E]">{customer.customerName}</TableCell>
                          <TableCell>{customer.customerPhone}</TableCell>
                          <TableCell className="text-right font-semibold text-[#EE8C7F]">
                            ₹{customer.totalDue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {new Date(customer.lastBillDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffDays} {diffDays === 1 ? 'day' : 'days'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 border-[#EE8C7F]/30 hover:bg-[#FDF5F4] hover:text-[#EE8C7F]"
                              onClick={() => handlePaymentSettlement(customer._id)}
                            >
                              Settle
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 border-[#EE8C7F]/30 hover:bg-[#FDF5F4] hover:text-[#EE8C7F]"
                              onClick={() => openEditCustomerDialog(customer)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() =>
                                handleDeleteRecord(customer._id, customer.customerPhone)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
              <CardHeader>
                <CardTitle className="text-[#1E1E1E]">Monthly Credit Report</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={monthlyReports}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#EE8C7F20" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #EE8C7F30' }} />
                    <Legend />
                    <Bar dataKey="totalAmount" fill="#EE8C7F" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily">
            <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#1E1E1E]">Daily Credit Report</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCSV(dailyReports, "daily-report")}
                  className="border-[#EE8C7F]/30 hover:bg-[#FDF5F4] hover:text-[#EE8C7F]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-[#EE8C7F]/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FDF5F4] hover:bg-[#FDF5F4]">
                      <TableHead className="font-semibold text-[#1E1E1E]">Date</TableHead>
                      <TableHead className="text-right font-semibold text-[#1E1E1E]">Total Amount</TableHead>
                      <TableHead className="text-right font-semibold text-[#1E1E1E]">Bill Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyReports.map((day) => (
                      <TableRow key={day.date} className="hover:bg-[#FDF5F4]/50 border-b border-[#EE8C7F]/10">
                        <TableCell className="text-[#1E1E1E]">{new Date(day.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-semibold text-[#EE8C7F]">
                          ₹{day.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{day.billCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="customerName" className="text-right">
                Name
              </label>
              <Input
                id="customerName"
                name="customerName"
                value={newCustomer.customerName}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="customerPhone" className="text-right">
                Phone
              </label>
              <Input
                id="customerPhone"
                name="customerPhone"
                value={newCustomer.customerPhone}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="totalDue" className="text-right">
                Total Due (₹)
              </label>
              <Input
                id="totalDue"
                name="totalDue"
                type="number"
                value={newCustomer.totalDue}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="lastBillDate" className="text-right">
                Bill Date
              </label>
              <Input
                id="lastBillDate"
                name="lastBillDate"
                type="date"
                value={newCustomer.lastBillDate}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomerOpen(false)} className="border-[#EE8C7F]/30 hover:bg-[#FDF5F4]">
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C45D50] text-white">Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editCustomerOpen} onOpenChange={setEditCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-customerName" className="text-right">
                Name
              </label>
              <Input
                id="edit-customerName"
                name="customerName"
                value={editingCustomer.customerName}
                onChange={handleEditInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-customerPhone" className="text-right">
                Phone
              </label>
              <Input
                id="edit-customerPhone"
                name="customerPhone"
                value={editingCustomer.customerPhone}
                onChange={handleEditInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-totalDue" className="text-right">
                Total Due (₹)
              </label>
              <Input
                id="edit-totalDue"
                name="totalDue"
                type="number"
                value={editingCustomer.totalDue}
                onChange={handleEditInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-lastBillDate" className="text-right">
                Bill Date
              </label>
              <Input
                id="edit-lastBillDate"
                name="lastBillDate"
                type="date"
                value={editingCustomer.lastBillDate}
                onChange={handleEditInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomerOpen(false)} className="border-[#EE8C7F]/30 hover:bg-[#FDF5F4]">
              Cancel
            </Button>
            <Button onClick={handleEditCustomer} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C45D50] text-white">Update Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Customers Dialog */}
      <Dialog open={importCustomersOpen} onOpenChange={setImportCustomersOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Customers from CSV</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Select CSV File
              </Button>
              <span className="text-sm">
                {importFile ? importFile.name : "No file selected"}
              </span>
              <Button 
                variant="outline"
                size="sm"
                onClick={downloadTemplateCSV}
              >
                Download Template
              </Button>
            </div>

            {importPreview.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Preview ({importPreview.length} customers)</h3>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Due</TableHead>
                        <TableHead>Bill Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.slice(0, 5).map((customer, index) => (
                        <TableRow key={index}>
                          <TableCell>{customer.customerName}</TableCell>
                          <TableCell>{customer.customerPhone}</TableCell>
                          <TableCell>₹{customer.totalDue.toFixed(2)}</TableCell>
                          <TableCell>{customer.lastBillDate || new Date().toISOString().split('T')[0]}</TableCell>
                        </TableRow>
                      ))}
                      {importPreview.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                            ... and {importPreview.length - 5} more rows
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportCustomersOpen(false);
              setImportFile(null);
              setImportPreview([]);
            }} className="border-[#EE8C7F]/30 hover:bg-[#FDF5F4]">
              Cancel
            </Button>
            <Button 
              onClick={handleImportCustomers}
              disabled={!importPreview.length}
              className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C45D50] text-white"
            >
              Import {importPreview.length} Customers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default CreditBillReport;