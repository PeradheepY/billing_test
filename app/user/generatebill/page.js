"use client"
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrintableBill from "../PrintableBill/page";
import { Button } from '@/components/ui/button';
import { Loader2, Receipt, Store, User, Phone, Package, Plus, Trash2, DollarSign, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PrintableBillWrapper from "./PrintableBillWrapper";
export default function GenerateBill() {
  const [customers, setCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showGst, setShowGst] = useState(false);
  const [items, setItems] = useState([{ 
    productName: "", 
    price: "", 
    quantity: 1, 
    unit: "pcs",
    hsnCode: "",
    gstPercentage: "",
    productSuggestions: [] 
  }]);
  const [loading, setLoading] = useState(false);
  const [fetchingCustomers, setFetchingCustomers] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showPrintableBill, setShowPrintableBill] = useState(false);
  const [shopName, setShopName] = useState("Your Business Name");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState({});
  const [billData, setBillData] = useState(null);
  const [productSearchDebounce, setProductSearchDebounce] = useState({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsProductDropdownOpen({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      setFetchingCustomers(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setCustomers(data.data);
        }
      } catch (error) {
        console.error("Error:", error);
        showNotification("Error fetching customers");
      } finally {
        setFetchingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchProductSuggestions = async (index, productName) => {
      if (productName.trim()) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/getProduct?productName=${productName}`);
          const data = await res.json();
          if (data.success) {
            setItems(prevItems => {
              const newItems = [...prevItems];
              newItems[index] = {
                ...newItems[index],
                productSuggestions: data.data
              };
              return newItems;
            });
          }
        } catch (err) {
          console.error("Error:", err);
        }
      } else {
        setItems(prevItems => {
          const newItems = [...prevItems];
          newItems[index] = {
            ...newItems[index],
            productSuggestions: []
          };
          return newItems;
        });
      }
    };

    Object.values(productSearchDebounce).forEach(timer => clearTimeout(timer));
    const newDebounce = {};
    items.forEach((item, index) => {
      if (item.productName) {
        newDebounce[index] = setTimeout(() => {
          fetchProductSuggestions(index, item.productName);
        }, 300);
      }
    });
    setProductSearchDebounce(newDebounce);
    
    return () => Object.values(newDebounce).forEach(timer => clearTimeout(timer));
  }, [items]);

  const handleCustomerSelect = (customerId) => {
    const selected = customers.find(customer => customer.id === customerId);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerPhone(selected.phone);
    }
  };

  const handlePrint = React.useCallback(() => {
    window.print();
  }, []);

  const handleProductSelect = (index, product) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        productName: product.productName,
        price: product.price,
        unit: product.unit || newItems[index].unit,
        hsnCode: product.hsnCode || "",
        gstPercentage: product.gstPercentage || "",
        productSuggestions: []
      };
      return newItems;
    });
    setIsProductDropdownOpen(prev => ({ ...prev, [index]: false }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const addItem = React.useCallback(() => {
    setItems(prev => [
      ...prev,
      { 
        productName: "", 
        price: "", 
        quantity: 1, 
        unit: "pcs",
        hsnCode: "",
        gstPercentage: "",
        productSuggestions: [] 
      }
    ]);
  }, []);

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
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
  }, [handlePrint]);

  const calculateAmount = (price, quantity) => {
    return parseFloat(price || 0) * parseFloat(quantity || 0);
  };

  const calculateTotalAmount = () => {
    return items.reduce((total, item) => {
      const amount = calculateAmount(item.price, item.quantity);
      return total + amount;
    }, 0);
  };
  

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
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
  }, [addItem]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
  
    try {
      // First attempt to update quantities
      try {
        await Promise.all(
          items.map(async (item) => {
            const updateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/updateQuantity/${item.productName}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                quantity: item.quantity
              }),
            });
  
            if (!updateRes.ok) {
              throw new Error(`Failed to update quantity for ${item.productName}`);
            }
          })
        );
        
        // Only if quantity updates succeed, proceed with bill generation
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            customerPhone,
            items: items.map(item => ({
              ...item,
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.price),
              amount: calculateAmount(item.price, item.quantity),
              hsnCode: showGst ? item.hsnCode : undefined,
              gstPercentage: showGst ? parseFloat(item.gstPercentage) : undefined
            })),
            showGst
          }),
        });
  
        const data = await res.json();
  
        if (res.ok) {
          showNotification("Bill generated successfully", "success");
          setBillData(data.bill || { billNumber: 'N/A', date: new Date() });
          setShowPrintableBill(true);
        } else {
          throw new Error(data.message || "Error generating bill");
        }
  
      } catch (updateError) {
        console.error("Error updating quantities:", updateError);
        showNotification("Failed to update quantities. Please try again.", "error");
        // Don't proceed with bill generation if quantity update fails
        return;
      }
    } catch (err) {
      console.error("Error:", err);
      showNotification(err.message || "Error generating bill");
    } finally {
      setLoading(false);
    }
  };

 
  
  const renderProductNameCell = (item, index) => (
    <div className="relative dropdown-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={item.productName}
          onChange={(e) => {
            handleItemChange(index, "productName", e.target.value);
            setIsProductDropdownOpen(prev => ({ ...prev, [index]: true }));
          }}
          onFocus={() => setIsProductDropdownOpen(prev => ({ ...prev, [index]: true }))}
          placeholder="Search product..."
          required
          className="w-full pl-10 p-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#EE8C7F] focus:ring-2 focus:ring-[#EE8C7F]/20 transition-all"
        />
      </div>
      {isProductDropdownOpen[index] && item.productSuggestions?.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-[#EE8C7F]/20 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {item.productSuggestions.map((product, suggestionIndex) => (
            <div
              key={suggestionIndex}
              className="p-3 hover:bg-[#FDF5F4] cursor-pointer transition-colors border-b border-gray-100 last:border-0"
              onClick={() => handleProductSelect(index, product)}
            >
              <div className="font-medium text-[#1E1E1E]">{product.productName}</div>
              <div className="text-sm text-[#EE8C7F] font-semibold">
                ₹{product.price} / {product.unit || 'pcs'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (showPrintableBill) {
    return (
      <div>
        <div className="print-only">
          <PrintableBillWrapper>  
          <PrintableBill
            shopName={shopName}
            customerName={customerName}
            customerPhone={customerPhone}
            items={items}
            date={billData?.date || new Date()}
            showGst={showGst}
            billNumber={billData?.billNumber}
          />
          </PrintableBillWrapper>
        </div>
        <div className="no-print text-center mt-4 space-x-4">
          <Button 
            onClick={() => window.print()} 
            className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-lg"
          >
            Print Bill (Ctrl + G)
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowPrintableBill(false)} 
            className="border-[#EE8C7F] text-[#EE8C7F] hover:bg-[#FDF5F4]"
          >
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
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Cash Bill</h1>
              <p className="text-sm text-gray-500">Generate bills for cash transactions</p>
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
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                placeholder="Enter your shop name"
              />
            </div>
          </Card>

          {/* Customer Selection */}
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-[#EE8C7F]" />
              <h3 className="text-lg font-semibold text-[#1E1E1E]">Select Existing Customer</h3>
            </div>
            <Select onValueChange={handleCustomerSelect} disabled={fetchingCustomers}>
              <SelectTrigger className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]">
                <SelectValue placeholder={fetchingCustomers ? "Loading customers..." : "Select a customer"} />
              </SelectTrigger>
              <SelectContent className="z-20 max-h-60 overflow-y-auto border border-[#EE8C7F]/20 rounded-xl shadow-lg bg-white">
                {customers.map((customer) => (
                  <SelectItem
                    key={customer.id}
                    value={customer.id}
                    className="px-4 py-2 hover:bg-[#FDF5F4] cursor-pointer"
                  >
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-sm text-[#EE8C7F]">{customer.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Customer Details */}
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-[#EE8C7F]" />
              <h3 className="text-lg font-semibold text-[#1E1E1E]">Customer Details</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Customer Name
                </label>
                <Input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Customer Phone
                </label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox 
                  id="showGst" 
                  checked={showGst} 
                  onCheckedChange={setShowGst}
                  className="border-gray-300 text-[#EE8C7F] focus:ring-[#EE8C7F]"
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
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-[#EE8C7F]/20 rounded-xl bg-[#FDF5F4]/30 hover:bg-[#FDF5F4] transition-colors relative"
                >
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    {renderProductNameCell(item, index)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                      required
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
                      className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8C7F] focus:border-[#EE8C7F]"
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="ltr">ltr</option>
                      <option value="gms">gms</option>
                      <option value="Nos">Nos</option>
                      <option value="ml">ml</option>
                      <option value="bags">bags</option>
                    </select>
                  </div>
                  {showGst && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                        <Input
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)}
                          className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                          placeholder="HSN Code"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                        <Input
                          type="number"
                          value={item.gstPercentage}
                          onChange={(e) => handleItemChange(index, "gstPercentage", e.target.value)}
                          className="bg-white border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                          placeholder="GST %"
                        />
                      </div>
                    </>
                  )}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <Input
                      type="text"
                      value={`₹${calculateAmount(item.price, item.quantity).toFixed(2)}`}
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

          {/* Fixed Bottom Bar */}
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
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-5 w-5" />
                    Generate Bill
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
