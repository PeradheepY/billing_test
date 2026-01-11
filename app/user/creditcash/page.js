"use client"
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Store, User, Phone, CreditCard, Calendar, MapPin, FileText, Plus, Trash2, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import PrintableBill from '../PrintableBill/page';
import CreditBill from '@/app/user/Creditbill/page';
import PrintableBillWrapper from '@/app/user/generatebill/PrintableBillWrapper';
import ProductSearch from '@/components/ProductSearch'


const IntegratedBilling = () => {
  // Common state
  const [billType, setBillType] = useState('cash');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // New state for payment method
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPrintableBill, setShowPrintableBill] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [showGst, setShowGst] = useState(false);
  const [billData, setBillData] = useState(null);
  const [fetchingCustomers, setFetchingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  // Add state for partial payment
  const [partialPayment, setPartialPayment] = useState('0');
  const [showPartialPayment, setShowPartialPayment] = useState(false);
  
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateFormatted = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };
  
  // Form data state
  const [formData, setFormData] = useState({
    shopName: "Your Business Name",
    customerName: '',
    customerPhone: '',
    aadharNumber: '', // New field
    villageArea: '',  // New field
    billNumber: '',
    dueDate: '',
    purchaseDate: getTodayDateFormatted(), // Initialize with today's date in YYYY-MM-DD format
    previousDue: '0',
    paymentMethod: 'cash', // Add payment method to form data
    items: [{
      productName: '',
      price: '',
      quantity: '1',
      unit: 'pcs',
      hsnCode: '',
      gstPercentage: '',
      purchaseprice: '', // Added purchase price field
      tax: '0', // Added tax field
    }]
  });

  // Helper function for notifications
  const showNotificationMessage = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Generate bill number on mount
  useEffect(() => {
    if (!formData.billNumber) {
      const timestamp = new Date().getTime();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const prefix = billType === 'credit' ? 'BILLCT-' : 'BILLCA-';
      setFormData(prev => ({
        ...prev,
        billNumber: `${prefix}${timestamp}-${randomSuffix}`
      }));
    }
  }, [billType]);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setFetchingCustomers(true);
      try {
        // Fetch customers from both endpoints
        const cashEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/billing`;
        const creditEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/creditbill`;
        
        const [cashResponse, creditResponse] = await Promise.all([
          fetch(cashEndpoint),
          fetch(creditEndpoint)
        ]);
        
        
        const cashData = await cashResponse.json();
        const creditData = await creditResponse.json();
        
        // Combine both customer lists with unique entries
        const allCustomers = [];
        
        // Process cash bill customers
        if (cashData.success) {
          const cashCustomers = Array.isArray(cashData.data) ? cashData.data : cashData.customers;
          if (Array.isArray(cashCustomers)) {
            allCustomers.push(...cashCustomers);
          }
        }
        
        // Process credit bill customers
        if (creditData.success) {
          const creditCustomers = Array.isArray(creditData.data) ? creditData.data : creditData.customers;
          if (Array.isArray(creditCustomers)) {
            // Add credit customers, avoiding duplicates based on phone number
            creditCustomers.forEach(creditCustomer => {
              // Check if customer already exists in the list
              const existingIndex = allCustomers.findIndex(
                c => c.phone === creditCustomer.phone
              );
              
              if (existingIndex === -1) {
                // New customer, add to list
                allCustomers.push(creditCustomer);
              } else {
                // Existing customer, update with any credit-specific info if needed
                // For example, merging previousDue values if they differ
                if (creditCustomer.previousDue && 
                    (!allCustomers[existingIndex].previousDue || 
                     parseFloat(creditCustomer.previousDue) > parseFloat(allCustomers[existingIndex].previousDue))) {
                  allCustomers[existingIndex].previousDue = creditCustomer.previousDue;
                }
              }
            });
          }
        }
        
        setCustomers(allCustomers);
      } catch (error) {
        console.error("Customer fetch error:", error);
        showNotificationMessage("Error fetching customers");
      } finally {
        setFetchingCustomers(false);
      }
    };
  
    fetchCustomers();
  }, []); // Only fetch once on component mount
  
  // Add a function to filter customers based on search query
  const getFilteredCustomers = () => {
    if (!customerSearchQuery) {
      return customers;
    }
    
    const query = customerSearchQuery.toLowerCase();
    return customers.filter(customer => 
      (customer.name && customer.name.toLowerCase().includes(query)) ||
      (customer.phone && String(customer.phone).includes(query))
    );
  };

  // Fixed getFilteredCustomers function with string conversion
  const findCustomerByPhone = (phoneNumber) => {
    return customers.find(c => 
      String(c.phone) === String(phoneNumber)
    );
  };

  // Updated handleCustomerSelect function
  const handleCustomerSelect = (selectedValue) => {
    const selectedCustomer = customers.find(customer => {
      // Check if matches by any of the possible identifiers
      return customer.id?.toString() === selectedValue || 
             customer.phone?.toString() === selectedValue ||
             customer.aadharNumber?.toString() === selectedValue ||
             customer.villageArea?.toString() === selectedValue;
    });

    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerName: selectedCustomer.name || '',
        customerPhone: selectedCustomer.phone?.toString() || '',
        previousDue: selectedCustomer.previousDue?.toString() || '0',
        aadharNumber: selectedCustomer.aadharNumber?.toString() || '',
        villageArea: selectedCustomer.villageArea?.toString() || ''
      }));
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return { ...prev, items: newItems };
    });
  };

  // Calculate Cost Amount for an item
  const calculateCostAmount = (item) => {
    const pprice = parseFloat(item.purchaseprice || 0);
    const gst = parseFloat(item.gstPercentage || 0);
    const tax = parseFloat(item.tax || 0);
    const totalWithGst = pprice + (pprice * gst / 100);
    return totalWithGst + tax;
  };

  // Handle product selection
  const handleProductSelect = (index, product) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        productName: product.productName,
        price: product.price,
        unit: product.unit || newItems[index].unit,
        hsnCode: product.hsnCode || '',
        gstPercentage: product.gstPercentage || '',
        purchaseprice: product.purchaseprice || '', // Added purchase price from product
        tax: product.tax || '0', // Added tax from product
      };
      return { ...prev, items: newItems };
    });
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productName: '',
        price: '',
        quantity: '1',
        unit: 'pcs',
        hsnCode: '',
        gstPercentage: '',
        purchaseprice: '', // Added purchase price field
        tax: '0', // Added tax field
      }]
    }));
  };

  // Remove item
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Calculate amounts
  const calculateAmount = (price, quantity) => {
    return parseFloat(price || 0) * parseFloat(quantity || 0);
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((total, item) => 
      total + calculateAmount(item.price, item.quantity), 0
    );
  };
  
  // Calculate remaining credit amount
  const calculateRemainingCredit = () => {
    const totalAmount = calculateTotalAmount();
    const payment = parseFloat(partialPayment || 0);
    return Math.max(0, totalAmount - payment);
  };
  
  const handlePrint = () => {
    window.print();
  };

  // Handle bill type change
  const handleBillTypeChange = (newType) => {
    setBillType(newType);
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const prefix = newType === 'credit' ? 'BILLCT-' : 'BILLCA-';
    setFormData(prev => ({
      ...prev,
      billNumber: `${prefix}${timestamp}-${randomSuffix}`
    }));
    
    // Show partial payment option for credit bills
    setShowPartialPayment(newType === 'credit');
    
    // Reset payment method when changing bill type
    if (newType === 'credit') {
      setPaymentMethod('credit');
      setFormData(prev => ({ ...prev, paymentMethod: 'credit' }));
    } else {
      setPaymentMethod('cash');
      setFormData(prev => ({ ...prev, paymentMethod: 'cash' }));
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if F1 key is pressed (key code 112)
      if (event.ctrlKey && event.key === 'g') {
        // Prevent the default F1 behavior (usually opens help)
        event.preventDefault();
        // Trigger print function
        handlePrint();
      }
    };

    // Add event listener when component mounts
    window.addEventListener('keydown', handleKeyDown);

    // Remove event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
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
  
  // Handle form submission
 const handleSubmit = async (e) => {
   e.preventDefault();
   if (loading) return;
   setLoading(true);
 
   try {
     const totalAmount = calculateTotalAmount();
     const remainingCredit = calculateRemainingCredit();
     
     // Prepare items with costAmt calculated
     const itemsWithCostAmt = formData.items.map(item => ({
       ...item,
       amount: calculateAmount(item.price, item.quantity),
       costAmt: calculateCostAmount(item), // Add calculated costAmt
     }));
     
     const endpoint = billType === 'credit' 
       ? `${process.env.NEXT_PUBLIC_API_URL}/api/creditbill`
       : `${process.env.NEXT_PUBLIC_API_URL}/api/billing`;
 
     // Format date for API submission if needed
     const formattedPurchaseDate = formData.purchaseDate;
 
     const response = await fetch(endpoint, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         ...formData,
         purchaseDate: formattedPurchaseDate, // Use consistent date format
         items: itemsWithCostAmt, // Use the items with costAmt
         isCreditBill: billType === 'credit',
         partialPayment: parseFloat(partialPayment || 0),
         remainingCredit: remainingCredit,
         totalAmount: totalAmount,
         paymentMethod: paymentMethod, // Include payment method in the request
         showGst: showGst
       }),
     });
 
     const data = await response.json();
 
     if (response.ok) {
       showNotificationMessage("Bill generated successfully", "success");
       setBillData({
         ...data.bill,
         purchaseDate: formattedPurchaseDate, // Store consistently formatted date
         partialPayment: parseFloat(partialPayment || 0),
         remainingCredit: remainingCredit,
         paymentMethod: paymentMethod,
         showGst: showGst
       });
       setShowPrintableBill(true);
       
       // Update product quantities and record sales
       await Promise.all(
         formData.items.map(async (item) => {
           try {
             // Update product quantity
             const quantityResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/updateQuantity/${encodeURIComponent(item.productName)}`, {
               method: "PATCH",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ 
                 quantity: item.quantity,
                 // These details will be used to record the sale in our updated API
                 billNumber: formData.billNumber,
                 billType: billType,
                 customerName: formData.customerName,
                 customerPhone: formData.customerPhone
               }),
             });
             
             if (!quantityResponse.ok) {
               console.error(`Failed to update quantity for ${item.productName}`);
             }
           } catch (error) {
             console.error(`Error updating quantity for ${item.productName}:`, error);
           }
         })
       );
     } else {
       showNotificationMessage(data.message || "Error generating bill");
     }
   } catch (error) {
     showNotificationMessage(error.message || "Error generating bill");
   } finally {
     setLoading(false);
   }
 };
  
  // Alternative for generating bill (F1 shortcut)
  const handleGenerateBill = () => {
    // Simulate form submission
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    document.querySelector('form')?.dispatchEvent(submitEvent);
  };

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
          <PrintableBillWrapper>
            {billType === 'cash' ? (
              <PrintableBill
                shopName={formData.shopName}
                customerName={formData.customerName}
                customerPhone={formData.customerPhone}
                items={formData.items}
                date={billData?.purchaseDate || formData.purchaseDate} // Use consistent date format
                purchaseDate={formData.purchaseDate}
                showGst={billData?.showGst || showGst}
                billNumber={formData.billNumber}
                /* paymentMethod={paymentMethod} */ // Pass payment method to bill
              />
            ) : (
              <CreditBill
                customerName={formData.customerName}
                customerPhone={formData.customerPhone}
                billNumber={formData.billNumber}
                items={formData.items}
                dueDate={formData.dueDate}
                purchaseDate={formData.purchaseDate}
                showGst={billData?.showGst || showGst}
                previousDue={parseFloat(formData.previousDue)}
                partialPayment={billData?.partialPayment || 0}
                remainingCredit={billData?.remainingCredit || 0}
                totalAmount={calculateTotalAmount()}
                // Add purchase date here
                /* paymentMethod={paymentMethod}  */// Pass payment method to bill
              />
            )}
          </PrintableBillWrapper>
        </div>
        <div className="no-print text-center mt-4">
          <Button onClick={() => window.print()} className="mr-4">
            Print Bill (Ctrl + G)
          </Button>
          <Button variant="secondary" onClick={() => setShowPrintableBill(false)}>
            Back to Form
          </Button>
        </div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFEFEF] via-white to-[#FDF5F4] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E1E1E]">
                  {billType === 'credit' ? 'Credit Bill' : 'Cash Bill'}
                </h1>
                <p className="text-sm text-gray-500">Generate and manage your bills</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={billType} onValueChange={handleBillTypeChange}>
                <SelectTrigger className="w-[180px] bg-gradient-to-r from-[#EE8C7F] to-[#D67568] text-white border-0 hover:from-[#D67568] hover:to-[#C56558] shadow-md">
                  <SelectValue placeholder="Select bill type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash Bill</SelectItem>
                  <SelectItem value="credit">Credit Bill</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={paymentMethod} 
                onValueChange={handlePaymentMethodChange}
                disabled={billType === 'credit'}
              >
                <SelectTrigger className="w-[180px] bg-gradient-to-r from-[#F5A99F] to-[#EE8C7F] text-white border-0 hover:from-[#EE8C7F] hover:to-[#D67568] disabled:opacity-50 shadow-md">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {notification && (
          <Alert variant={notification.type === "success" ? "default" : "destructive"} className="mb-4 border-l-4 border-l-[#EE8C7F] glass">
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-32">
          {/* Shop Details */}
          <Card className="p-6 glass border-[#EE8C7F]/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-[#EE8C7F]" />
              <h2 className="text-lg font-semibold text-[#1E1E1E]">Shop Information</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                <Input
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Customer Selection - FIXED VERSION */}
          <Card className="p-6 glass border-[#EE8C7F]/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-[#EE8C7F]" />
              <h2 className="text-lg font-semibold text-[#1E1E1E]">Customer Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Search by name or phone"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="flex-grow border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                  />
                  <Select onValueChange={handleCustomerSelect}>
                    <SelectTrigger className="min-w-[200px] border-gray-200 focus:border-[#EE8C7F]">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                  {getFilteredCustomers()
                    .filter(customer => {
                      // Filter out customers without valid identifiers
                      const hasValidId = customer.id && customer.id.toString().trim() !== '';
                      const hasValidPhone = customer.phone && customer.phone.toString().trim() !== '';
                      const hasValidAadhar = customer.aadharNumber && customer.aadharNumber.toString().trim() !== '';
                      const hasValidVillage = customer.villageArea && customer.villageArea.toString().trim() !== '';
                      
                      return hasValidId || hasValidPhone || hasValidAadhar || hasValidVillage;
                    })
                    .map((customer) => {
                      // Create a unique value that's guaranteed to not be empty
                      const uniqueValue = customer.id?.toString() || 
                                        customer.phone?.toString() || 
                                        customer.aadharNumber?.toString() || 
                                        customer.villageArea?.toString() || 
                                        `customer_${Math.random().toString(36).substr(2, 9)}`;
                      
                      return (
                        <SelectItem key={uniqueValue} value={uniqueValue}>
                          {customer.name || 'Unknown'} - {customer.phone || 'No Phone'} - {customer.aadharNumber || 'No Aadhar'} - {customer.villageArea || 'No Area'}
                        </SelectItem>
                      );
                    })
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <Input
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
              <Input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                required
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number</label>
              <Input
                value={formData.aadharNumber}
                onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Village/Area</label>
              <Input
                value={formData.villageArea}
                onChange={(e) => handleInputChange('villageArea', e.target.value)}
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <Input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                required
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
              />
            </div>
          </div>
        </div>
      </Card>
          {/* Credit Bill Specific Fields */}
          {billType === 'credit' && (
            <Card className="p-6 bg-gradient-to-br from-[#FDF5F4] to-[#FAE5E2] border-[#EE8C7F]/30 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-[#EE8C7F]" />
                <h2 className="text-lg font-semibold text-[#1E1E1E]">Credit Information</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    required
                    className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Previous Due</label>
                  <Input
                    type="number"
                    value={formData.previousDue}
                    onChange={(e) => handleInputChange('previousDue', e.target.value)}
                    className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F] bg-white"
                  />
                </div>
              </div>
            </Card>
          )}
          
          {/* Partial Payment Field (for Credit Bills) */}
          {showPartialPayment && (
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Partial Payment Amount</label>
                  <Input
                    type="number"
                    value={partialPayment}
                    onChange={(e) => setPartialPayment(e.target.value)}
                    className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F] bg-white"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm glass p-4 rounded-lg border border-[#EE8C7F]/20 w-full">
                    <p className="text-gray-600">Total Bill: <span className="font-semibold text-[#1E1E1E]">₹{calculateTotalAmount().toFixed(2)}</span></p>
                    <p className="text-gray-600">Amount Paid: <span className="font-semibold text-[#EE8C7F]">₹{parseFloat(partialPayment || 0).toFixed(2)}</span></p>
                    <p className="font-bold text-amber-600">Remaining Credit: ₹{calculateRemainingCredit().toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Items Table */}
          <Card className="p-6 glass border-[#EE8C7F]/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#EE8C7F]" />
                <h2 className="text-lg font-semibold text-[#1E1E1E]">Product Items</h2>
              </div>
              <div className="flex items-center space-x-2 bg-[#FDF5F4] px-4 py-2 rounded-lg border border-[#EE8C7F]/20">
                <Checkbox 
                  checked={showGst}
                  onCheckedChange={setShowGst}
                  className="data-[state=checked]:bg-[#EE8C7F] data-[state=checked]:border-[#EE8C7F]"
                />
                <label className="text-sm font-medium text-gray-700">
                  Include GST Details
                </label>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#EE8C7F]/20">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Purchase Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Tax</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Cost Amt</th>
                    {showGst && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">HSN Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">GST %</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#EE8C7F]/10">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-[#FDF5F4] transition-colors">
                      <td className="px-4 py-3 w-1/4">
                        <ProductSearch
                          key={`product-search-${index}`}
                          initialValue={item.productName}
                          onSelect={(product) => handleProductSelect(index, product)}
                          index={index}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          required
                          className="w-full border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          className="w-full border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={item.unit}
                          onValueChange={(value) => handleItemChange(index, 'unit', value)}
                        >
                          <SelectTrigger className="border-gray-200 focus:border-[#EE8C7F]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcs">pcs</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="litre">litre</SelectItem>
                            <SelectItem value="gms">gms</SelectItem>
                            <SelectItem value="Nos">Nos</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="bags">bags</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={item.purchaseprice}
                          onChange={(e) => handleItemChange(index, 'purchaseprice', e.target.value)}
                          className="w-full border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={item.tax}
                          onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                          className="w-full border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#1E1E1E]">
                        ₹{calculateCostAmount(item).toFixed(2)}
                      </td>
                      {showGst && (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              value={item.hsnCode}
                              onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                              className="w-full border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={item.gstPercentage}
                              onChange={(e) => handleItemChange(index, 'gstPercentage', e.target.value)}
                              className="w-full border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                            />
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-right font-semibold text-[#EE8C7F]">
                        ₹{calculateAmount(item.price, item.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button 
              type="button" 
              onClick={addItem} 
              variant="outline" 
              className="mt-4 bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white border-0 shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item (Ctrl+Enter)
            </Button>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#EE8C7F] to-[#D67568] p-6 shadow-2xl border-t border-[#D67568] z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/30">
                  <p className="text-white/80 text-sm font-medium mb-1">Total Amount</p>
                  <h3 className="text-3xl font-bold text-white">
                    ₹{calculateTotalAmount().toFixed(2)}
                  </h3>
                </div>
                {showPartialPayment && (
                  <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-amber-300/30">
                    <p className="text-white/80 text-sm font-medium mb-1">Credit Amount</p>
                    <h3 className="text-2xl font-bold text-white">
                      ₹{calculateRemainingCredit().toFixed(2)}
                    </h3>
                  </div>
                )}
                <div className="text-white/90">
                  <p className="text-sm">Payment Method</p>
                  <p className="font-semibold capitalize text-lg">{paymentMethod}</p>
                </div>
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="bg-white text-[#EE8C7F] hover:bg-[#EFEFEF] px-8 py-6 text-lg font-semibold shadow-xl"
                accessKey="1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Bill...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-5 w-5" />
                    Generate Bill (F1)
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

export default IntegratedBilling;