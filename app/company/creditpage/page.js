// app/credit-bill/page.js
"use client"
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from '@/components/ui/card';
import { Loader2, Receipt, Store, User, MapPin, Calendar, FileText, Package, Plus, Trash2, DollarSign } from 'lucide-react';
import CreditBill from '@/app/company/ComCreditbill';
import { format } from 'date-fns';
import A4PrintWrapper from './A4PrintWrapper'

const CreditBillPage = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPrintableBill, setShowPrintableBill] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [showGst, setShowGst] = useState(false);
  
  const generateBillNumber = () => {
    const prefix = "CB";
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };
  
  const [formData, setFormData] = useState({
    shopName: "Your Business Name",
    supplierName: '',
    supplierAddress: '',
    invoiceNumber: '',
    items: [
      {
        productName: '',
        productId: '',
        Batch: '',
        purchaseprice: '',
        price: '',
        tax: '',
        quantity: '1',
        unit: 'pcs',
        hsnCode: '',
        gstPercentage: '',
        expireDate: '',
        purchaseDiscount: '',
        productSuggestions: [],
      },
    ],
    dueDate: '',
    purchaseDate: new Date().toLocaleDateString('en-CA'),
    previousDue: '0',
    billNumber: generateBillNumber()
  });

  // Helper function to show notifications
  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/comcreditbill`);
        const data = await response.json();
        if (data.success) {
          setCustomers(data.customers);
        } else {
          showNotification("Error fetching customers");
        }
      } catch (error) {
        showNotification("Error fetching customers");
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerSelect = (invoiceNumber) => {
    const selectedCustomer = customers.find(customer => customer.phone === invoiceNumber);
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        supplierName: selectedCustomer.name,
        supplierAddress: selectedCustomer.address,
        previousDue: selectedCustomer.previousDue?.toString() || '0'
        // Don't override invoiceNumber, let user specify a new one
      }));
    }
  };
  
  // Fetch product details when product name changes
  useEffect(() => {
    const fetchProductDetails = async (index, productName) => {
      if (productName.trim()) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/getProduct?productName=${productName}`);
          const data = await res.json();

          if (data.success && data.data.length > 0) {
            const product = data.data[0];
            setFormData(prev => {
              const newItems = [...prev.items];
              newItems[index] = {
                ...newItems[index],
                productSuggestions: data.data
              };
              return { ...prev, items: newItems };
            });
          }
        } catch (err) {
          showNotification("Error fetching product details");
        }
      }
    };

    const debounceTimer = setTimeout(() => {
      formData.items.forEach((item, index) => {
        if (item.productName) {
          fetchProductDetails(index, item.productName);
        }
      });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [formData.items]);

  const calculateAmount = (purchasePrice, quantity, purchaseDiscount, gstPercentage) => {
    // Convert inputs to numbers and handle null/undefined values
    const numPrice = parseFloat(purchasePrice || 0);
    const numQuantity = parseFloat(quantity || 0);
    const numDiscount = parseFloat(purchaseDiscount || 0);
    
    // Only consider GST if showGst is true
    const numGst = showGst ? parseFloat(gstPercentage || 0) : 0;
  
    // Calculate subtotal before discount 
    const subtotal = numPrice * numQuantity;
  
    // Calculate discount amount
    const discountAmount = subtotal * numDiscount / 100;
    
    // Apply discount
    const afterDiscount = subtotal - discountAmount;
    
    // Calculate GST amount only if showGst is true
    const gstAmount = showGst ? (afterDiscount * numGst / 100) : 0;
    
    // Final amount including GST
    const finalAmount = afterDiscount + gstAmount;
    
    return finalAmount;
  };

 const handleSubmit = async (e) => {
     e.preventDefault();
     if (loading) return;
     
     // Validate invoice number
     if (!formData.invoiceNumber.trim()) {
       showNotification("Invoice number is required");
       return;
     }
     
     setLoading(true);
   
     try {
       // First, update the quantities for all items in the credit bill
       await Promise.all(
         formData.items.map(item => 
           fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/updateQuantity/${encodeURIComponent(item.productName)}`, {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ 
               quantity: item.quantity,
               purchaseprice: item.purchaseprice,
               price: item.price,
               tax: item.tax,
               productId: item.productId,
               hsnCode: item.hsnCode,
               gstPercentage: item.gstPercentage,
               expireDate: item.expireDate,
               Batch: item.Batch,
               unit: item.unit
             }),
           })
         )
       );
   
       // Then, save the credit bill record
       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/comcreditbill`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           ...formData,
           isCreditBill: true,
           showGst: showGst,
         }),
       });
   
       const data = await response.json();
   
       if (response.ok) {
         showNotification("Bill generated successfully", "success");
         setShowPrintableBill(true);
       } else {
         // Display the specific error message from the backend
         showNotification(data.message || data.error || "Error generating bill");
       }
     } catch (error) {
       console.error("Error:", error);
       // Display the error message for client-side errors
       showNotification(error.message || "Error generating bill");
     } finally {
       setLoading(false);
     }
   };

  const handlePrint = () => {
    window.print();
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        productName: '', 
        productId: '',
        purchaseprice: '', 
        quantity: '1',
        unit: 'pcs',
        tax: "",
        hsnCode: "",
        gstPercentage: "",
        expireDate: "",
        purchaseDiscount: "",
        Batch: "",
        productSuggestions: [] 
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      
      if (field === "productName") {
        // If the value matches a suggestion, update product-related fields only
        const suggestion = prev.items[index].productSuggestions.find(
          p => p.productName === value
        );
        
        if (suggestion) {
          newItems[index] = {
            ...newItems[index],
            productName: suggestion.productName,
            hsnCode: suggestion.hsnCode || '',
            gstPercentage: suggestion.gstPercentage || '',
            // Keep the existing price instead of overwriting it
            purchaseprice: suggestion.purchaseprice,
            productId: suggestion.productId,
            price: suggestion.price,
            tax: suggestion.tax,
            productSuggestions: prev.items[index].productSuggestions
          };
        } else {
          // If no match, just update the product name
          newItems[index] = {
            ...newItems[index],
            [field]: value
          };
        }
      } else {
        // For other fields (including price), update normally
        newItems[index] = {
          ...newItems[index],
          [field]: value
        };
      }
      
      return { ...prev, items: newItems };
    });
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((total, item) => 
      total + calculateAmount(
        item.purchaseprice, 
        item.quantity, 
        item.purchaseDiscount, 
        item.gstPercentage
      ), 0
    );
  };
useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Ctrl+Enter is pressed
      if (event.ctrlKey && event.key === 'Enter') {
        addItem();
      }
    };

    // Add the event listener to the document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F1') {
        event.preventDefault(); // Prevent default F1 behavior (help)
        // Trigger your button click functionality here
        if (!loading) {
          handleGenerateBill();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading]);

  if (showPrintableBill) {
    return (
      <div>
        <div className="print-only">
          <A4PrintWrapper>
          <CreditBill
            shopName={formData.shopName}
            supplierName={formData.supplierName}
            supplierAddress={formData.supplierAddress}
            gstPercentage={formData.gstPercentage}
            Batch={formData.Batch}
            expireDate={formData.expireDate}
            hsnCode={formData.hsnCode}
            purchaseDate={formData.purchaseDate}
            purchaseDiscount={formData.purchaseDiscount}
            invoiceNumber={formData.invoiceNumber}
            items={formData.items}
            dueDate={formData.dueDate}
            showGst={showGst}
            previousDue={parseFloat(formData.previousDue)}
          />
          </A4PrintWrapper>
        </div>
        <div className="no-print text-center mt-4">
          <Button onClick={handlePrint} className="mr-4">
            Print Bill
          </Button>
          <Button variant="secondary" onClick={() => setShowPrintableBill(false)}>
            Back to Form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-6xl mx-auto pb-32 space-y-6">
        {notification && (
          <Alert variant={notification.type === "success" ? "default" : "destructive"} className="mb-4 glass border-[#EE8C7F]/20">
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Supplier Credit Bill</h1>
              <p className="text-sm text-gray-500">Purchase inventory from suppliers on credit</p>
            </div>
          </div>
        </Card>
      
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Information */}
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-[#EE8C7F]" />
              <h3 className="text-lg font-semibold text-[#1E1E1E]">Shop Information</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
              <Input
                value={formData.shopName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  shopName: e.target.value
                }))}
                required
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
          </Card>

          {/* Existing Supplier Selection */}
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-[#EE8C7F]" />
              <h3 className="text-lg font-semibold text-[#1E1E1E]">Select Existing Supplier</h3>
            </div>
            <Select onValueChange={handleCustomerSelect}>
              <SelectTrigger className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Supplier Details */}
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-[#EE8C7F]" />
              <h3 className="text-lg font-semibold text-[#1E1E1E]">Supplier Details</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Supplier Name
                </label>
                <Input
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    supplierName: e.target.value
                  }))}
                  required
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Supplier Address
                </label>
                <Input
                  value={formData.supplierAddress}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    supplierAddress: e.target.value
                  }))}
                  required
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Invoice Number
                </label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    invoiceNumber: e.target.value
                  }))}
                  required
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                  placeholder="Enter invoice number (e.g. A-12, B-123)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Purchase Date
                </label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    purchaseDate: e.target.value
                  }))}
                  required
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Due Date
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dueDate: e.target.value
                  }))}
                  required
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGst}
                  onChange={(e) => setShowGst(e.target.checked)}
                  className="rounded border-gray-300 text-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
                <span className="text-sm font-medium text-gray-700">Include GST Details</span>
              </label>
            </div>
          </Card>

          {/* Products Section */}
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-[#EE8C7F]" />
              <h3 className="text-lg font-semibold text-[#1E1E1E]">Products</h3>
            </div>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-[#EE8C7F]/20 rounded-xl bg-[#FDF5F4]/30 hover:bg-[#FDF5F4] transition-colors relative"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <Input
                      list={`productList-${index}`}
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                      required
                      className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    />
                <datalist id={`productList-${index}`}>
                  {item.productSuggestions.map((product, i) => (
                    <option key={i} value={product.productName} />
                  ))}
                </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                    <Input
                      type="number"
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                      required
                      className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                    <Input
                      type="number"
                      value={item.purchaseprice}
                      onChange={(e) => handleItemChange(index, "purchaseprice", e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                    <Input
                      type="number"
                      value={item.tax}
                      onChange={(e) => handleItemChange(index, "tax", e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rate</label>
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expire Date</label>
                    <Input
                      type="date"
                      value={item.expireDate ? new Date(item.expireDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleItemChange(index, "expireDate", e.target.value)}
                      className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-[#EE8C7F] focus:border-[#EE8C7F]"
                      required
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                  {showGst && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                        <Input
                          value={item.hsnCode}
                          onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)}
                          className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                        <Input
                          value={item.Batch}
                          onChange={(e) => handleItemChange(index, "Batch", e.target.value)}
                          className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                        <Input
                          type="number"
                          value={item.gstPercentage}
                          onChange={(e) => handleItemChange(index, "gstPercentage", e.target.value)}
                          min="0"
                          max="100"
                          className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                        <Input
                          type="number"
                          value={item.purchaseDiscount}
                          onChange={(e) => handleItemChange(index, "purchaseDiscount", e.target.value)}
                          min="0"
                          max="100"
                          className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                        />
                      </div>
                    </>
                  )}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <Input
                      type="number"
                      value={calculateAmount(item.purchaseprice, item.quantity, item.purchaseDiscount, item.gstPercentage).toFixed(2)}
                      readOnly
                      className="bg-[#FDF5F4] border-gray-200 font-semibold text-[#EE8C7F]"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-center">
            <Button 
              type="button" 
              onClick={addItem} 
              className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product (Ctrl + Enter)
            </Button>
          </div>

          {/* Fixed Bottom Bar - Adjusted for sidebar */}
          <div className="fixed bottom-0 left-64 right-0 bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] border-t border-[#EE8C7F]/20 p-4 shadow-lg backdrop-blur-sm z-40 transition-all duration-300">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-lg shadow-md">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <h3 className="text-2xl font-bold text-[#EE8C7F]">
                    ₹{calculateTotalAmount().toFixed(2)}
                  </h3>
                </div>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white px-6 py-6 text-base shadow-lg"
                accessKey="1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-5 w-5" />
                    Generate Bill (F1 or Alt+1)
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditBillPage;