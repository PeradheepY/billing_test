"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SettlementForm = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("customer");
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0], // Default to last month
    end: new Date().toISOString().split("T")[0] // Default to today
  });
  
  // Customer form state
  const [customerData, setCustomerData] = useState({
    customerName: "",
    customerPhone: "",
    totalDue: "",
    lastBillDate: new Date().toISOString().split("T")[0]
  });
  
  // Supplier form state
  const [supplierData, setSupplierData] = useState({
    supplierName: "",
    invoiceNumber: "",
    totalDue: "",
    lastBillDate: new Date().toISOString().split("T")[0]
  });
  
  // Fetch customers data
 
  
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSupplierChange = (e) => {
    const { name, value } = e.target;
    setSupplierData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form data
      if (!customerData.customerName || !customerData.customerPhone || !customerData.totalDue) {
        throw new Error("All fields are required");
      }
      
      const payload = {
        ...customerData,
        totalDue: parseFloat(customerData.totalDue),
        start: dateRange.start,  // Include start date
        end: dateRange.end       // Include end date
      };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setNotification({
          type: "success",
          message: "Customer settlement record added successfully"
        });
        // Reset form
        setCustomerData({
          customerName: "",
          customerPhone: "",
          totalDue: "",
          lastBillDate: new Date().toISOString().split("T")[0]
        });
      } else {
        throw new Error(data.message || "Failed to add customer record");
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error adding customer record"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form data
      if (!supplierData.supplierName || !supplierData.invoiceNumber || !supplierData.totalDue) {
        throw new Error("All fields are required");
      }
      
      const payload = {
        ...supplierData,
        totalDue: parseFloat(supplierData.totalDue),
        start: dateRange.start,  // Include start date
        end: dateRange.end       // Include end date
      };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ledger/supplier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setNotification({
          type: "success",
          message: "Supplier settlement record added successfully"
        });
        // Reset form
        setSupplierData({
          supplierName: "",
          invoiceNumber: "",
          totalDue: "",
          lastBillDate: new Date().toISOString().split("T")[0]
        });
      } else {
        throw new Error(data.message || "Failed to add supplier record");
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error adding supplier record"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-4">
      {notification && (
        <Alert
          variant={notification.type === "success" ? "default" : "destructive"}
          className="mb-4"
          onMouseEnter={() => setTimeout(() => setNotification(null), 3000)}
        >
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}
      
      
       
      
      <Card>
        <CardHeader>
          <CardTitle>Add Settlement Record</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="supplier">Supplier</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer">
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={customerData.customerName}
                    onChange={handleCustomerChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={customerData.customerPhone}
                    onChange={handleCustomerChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="totalDue">Total Due (₹)</Label>
                  <Input
                    id="totalDue"
                    name="totalDue"
                    type="number"
                    value={customerData.totalDue}
                    onChange={handleCustomerChange}
                    placeholder="Enter total due amount"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastBillDate">Last Bill Date</Label>
                  <Input
                    id="lastBillDate"
                    name="lastBillDate"
                    type="date"
                    value={customerData.lastBillDate}
                    onChange={handleCustomerChange}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Adding..." : "Add Customer Record"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="supplier">
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Supplier Name</Label>
                  <Input
                    id="supplierName"
                    name="supplierName"
                    value={supplierData.supplierName}
                    onChange={handleSupplierChange}
                    placeholder="Enter supplier name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    name="invoiceNumber"
                    value={supplierData.invoiceNumber}
                    onChange={handleSupplierChange}
                    placeholder="Enter invoice number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplierTotalDue">Total Due (₹)</Label>
                  <Input
                    id="supplierTotalDue"
                    name="totalDue"
                    type="number"
                    value={supplierData.totalDue}
                    onChange={handleSupplierChange}
                    placeholder="Enter total due amount"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplierLastBillDate">Last Bill Date</Label>
                  <Input
                    id="supplierLastBillDate"
                    name="lastBillDate"
                    type="date"
                    value={supplierData.lastBillDate}
                    onChange={handleSupplierChange}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Adding..." : "Add Supplier Record"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettlementForm;