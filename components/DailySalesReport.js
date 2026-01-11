import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon, Edit, Save, X, Trash2, FileText, IndianRupee, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

const DailySalesReport = ({ billingData = [], onDateRangeChange, onBillUpdate, onItemDelete }) => {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date()
  });
  const [editingBill, setEditingBill] = useState(null);
  const [editedItems, setEditedItems] = useState({});
  const [itemToDelete, setItemToDelete] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      onDateRangeChange?.(dateRange.from.toISOString(), dateRange.to.toISOString());
    }
  }, [dateRange, onDateRangeChange]);

  const getFilteredBills = () => {
    return billingData.filter(bill => {
      const billDate = new Date(bill.date);
      const startOfDay = new Date(dateRange.from);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      
      return billDate >= startOfDay && billDate <= endOfDay;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const calculateTotals = (bills) => {
    return bills.reduce((acc, bill) => {
      const amount = bill.totalAmount || 0;
      if (bill.isCreditBill) {
        acc.totalCredit += amount;
      } else {
        acc.totalCash += amount;
      }
      acc.totalSales += amount;
      return acc;
    }, {
      totalCash: 0,
      totalCredit: 0,
      totalSales: 0
    });
  };

  const initiateDelete = (billId, itemIndex, isCreditBill) => {
    setItemToDelete({ billId, itemIndex, isCreditBill });
  };

 /*  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      await onItemDelete(itemToDelete.billId, itemToDelete.isCreditBill, [itemToDelete.itemIndex]);
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setItemToDelete(null);
    }
  }; */

  const handleItemEdit = (billIndex, itemIndex, field, value) => {
    const bill = billingData[billIndex];
    const editKey = `${bill._id}-${itemIndex}`;
    const currentItem = bill.items[itemIndex];
    
    let updatedEditedItem = {
      ...editedItems[editKey],
      [field]: value
    };

    if (field === 'quantity' || field === 'price') {
      const quantity = field === 'quantity' ? value : (editedItems[editKey]?.quantity || currentItem.quantity);
      const price = field === 'price' ? value : (editedItems[editKey]?.price || currentItem.price);
      updatedEditedItem.amount = quantity * price;
    }

    setEditedItems(prev => ({
      ...prev,
      [editKey]: updatedEditedItem
    }));
  };

   const handleSaveEdit = async (billId, isCreditBill) => {
    try {
      const bill = billingData.find(b => b._id === billId);
      const updatedItems = bill.items.map((item, index) => {
        const editKey = `${billId}-${index}`;
        const editedItem = editedItems[editKey];
        
        if (!editedItem) return item;

        return {
          ...item,
          productName: editedItem.productName || item.productName,
          quantity: editedItem.quantity || item.quantity,
          price: editedItem.price || item.price,
          amount: editedItem.amount || item.amount
        };
      });

      await onBillUpdate(billId, isCreditBill, updatedItems);
      
      toast({
        title: "Success",
        description: "Changes saved successfully",
        variant: "default",
      });
      
      setEditingBill(null);
      setEditedItems({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  }; 
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
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      const bill = billingData.find(b => b._id === itemToDelete.billId);
      const deletedItem = bill.items[itemToDelete.itemIndex];
      
      // When deleting an item, increase the inventory by the deleted quantity
      // Because we're adding back to inventory, we use positive quantity
      await updateItemQuantity(deletedItem.productName, deletedItem.quantity);
      
      await onItemDelete(itemToDelete.billId, itemToDelete.isCreditBill, [itemToDelete.itemIndex]);
      
      toast({
        title: "Success",
        description: "Item deleted and inventory updated",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setItemToDelete(null);
    }
  };

 /*  const handleSaveEdit = async (billId, isCreditBill) => {
    try {
      const bill = billingData.find(b => b._id === billId);
      const updatedItems = await Promise.all(bill.items.map(async (item, index) => {
        const editKey = `${billId}-${index}`;
        const editedItem = editedItems[editKey];
        
        if (!editedItem) return item;

        const originalQuantity = item.quantity;
        const newQuantity = editedItem.quantity || originalQuantity;
        const quantityDifference = newQuantity - originalQuantity;

        if (quantityDifference !== 0) {
          // If quantity is increased (positive difference), we need to decrease inventory
          // If quantity is decreased (negative difference), we need to increase inventory
          // So we use negative of the difference to update inventory
          await updateItemQuantity(item.productName, -quantityDifference);
        }

        return {
          ...item,
          productName: editedItem.productName || item.productName,
          quantity: newQuantity,
          price: editedItem.price || item.price,
          amount: editedItem.amount || item.amount
        };
      }));

      await onBillUpdate(billId, isCreditBill, updatedItems);
      
      toast({
        title: "Success",
        description: "Changes saved and inventory updated",
        variant: "default",
      });
      
      setEditingBill(null);
      setEditedItems({});
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save changes",
        variant: "destructive",
      });
    }
  };
 */

  const generateCSV = () => {
    const bills = getFilteredBills();
    let csvContent = "Date,Bill Type,Customer Name,Phone,Item Name,Quantity,Unit,Price,Amount\n";
    
    bills.forEach(bill => {
      bill.items.forEach(item => {
        csvContent += `${format(new Date(bill.date), 'yyyy-MM-dd')},`;
        csvContent += `${bill.isCreditBill ? 'Credit' : 'Cash'},`;
        csvContent += `${bill.customerName},`;
        csvContent += `${bill.customerPhone},`;
        csvContent += `${item.productName},`;
        csvContent += `${item.quantity},`;
        csvContent += `${item.unit},`;
        csvContent += `${item.price},`;
        csvContent += `${item.amount}\n`;
      });
    });

    return csvContent;
  };

  const downloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredBills = getFilteredBills();
  const totals = calculateTotals(filteredBills);
  
  

  

  return (
    <div className="space-y-4">
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="glass border border-[#EE8C7F]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1E1E1E]">Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 hover:bg-gray-100">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Premium Date Range Picker */}
      <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#1E1E1E]">
            <CalendarIcon className="h-6 w-6 text-[#EE8C7F]" />
            Daily Sales Report
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Select date range to view sales data</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-200 hover:border-[#EE8C7F] hover:bg-[#FDF5F4]",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#EE8C7F]" />
                    {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date || new Date() })}
                    initialFocus
                    className="rounded-md border-0"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-200 hover:border-[#EE8C7F] hover:bg-[#FDF5F4]",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#EE8C7F]" />
                    {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date || new Date() })}
                    initialFocus
                    className="rounded-md border-0"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setDateRange({ from: today, to: today });
              }}
              className="bg-[#FDF5F4] border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FAE5E2] hover:border-[#EE8C7F]"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                setDateRange({ from: yesterday, to: yesterday });
              }}
              className="bg-[#FDF5F4] border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FAE5E2] hover:border-[#EE8C7F]"
            >
              Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                setDateRange({ from: sevenDaysAgo, to: today });
              }}
              className="bg-[#FDF5F4] border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FAE5E2] hover:border-[#EE8C7F]"
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                setDateRange({ from: thirtyDaysAgo, to: today });
              }}
              className="bg-[#FDF5F4] border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FAE5E2] hover:border-[#EE8C7F]"
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateRange({ from: firstDayOfMonth, to: today });
              }}
              className="bg-[#FDF5F4] border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FAE5E2] hover:border-[#EE8C7F]"
            >
              This Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cash Sales</p>
                <p className="text-3xl font-bold text-[#EE8C7F] mt-2">₹{totals.totalCash.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass rounded-xl shadow-lg border border-amber-200 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credit Sales</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">₹{totals.totalCredit.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-md">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-[#1E1E1E] mt-2">₹{totals.totalSales.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#1E1E1E] to-[#333] rounded-xl shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-[#1E1E1E]">
              Sales Summary ({format(dateRange.from, 'PP')} - {format(dateRange.to, 'PP')})
            </CardTitle>
            <Button onClick={downloadCSV} className="flex items-center gap-2 bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[#FDF5F4] rounded-lg border border-[#EE8C7F]/20">
              <div className="text-sm text-[#EE8C7F]">Cash Sales</div>
              <div className="text-xl font-bold text-[#D67568]">
                ₹{totals.totalCash.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-sm text-amber-600">Credit Sales</div>
              <div className="text-xl font-bold text-amber-700">
                ₹{totals.totalCredit.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-[#1E1E1E]/5 rounded-lg border border-[#1E1E1E]/10">
              <div className="text-sm text-[#1E1E1E]/70">Total Sales</div>
              <div className="text-xl font-bold text-[#1E1E1E]">
                ₹{totals.totalSales.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredBills.map((bill, billIndex) => (
              <div key={bill._id} className="border border-[#EE8C7F]/20 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold text-[#1E1E1E]">{bill.customerName}</span>
                    <span className="text-sm text-gray-500 ml-2">({bill.customerPhone})</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {format(new Date(bill.date), 'PP')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bill.isCreditBill 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-[#FDF5F4] text-[#EE8C7F]'
                    }`}>
                      {bill.isCreditBill ? 'Credit' : 'Cash'}
                    </span>
                    {editingBill === bill._id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveEdit(bill._id, bill.isCreditBill)}
                          className="border-[#EE8C7F] text-[#EE8C7F] hover:bg-[#FDF5F4]"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBill(null);
                            setEditedItems({});
                          }}
                          className="border-gray-300 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingBill(bill._id)}
                        className="border-[#EE8C7F]/30 text-[#EE8C7F] hover:bg-[#FDF5F4]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#EE8C7F]/20 text-left bg-[#FDF5F4]/50">
                      <th className="py-2 px-2 text-[#1E1E1E] font-semibold">Item</th>
                      <th className="py-2 px-2 text-right text-[#1E1E1E] font-semibold">Qty</th>
                      <th className="py-2 px-2 text-right text-[#1E1E1E] font-semibold">Unit</th>
                      <th className="py-2 px-2 text-right text-[#1E1E1E] font-semibold">Price</th>
                      <th className="py-2 px-2 text-right text-[#1E1E1E] font-semibold">Amount</th>
                      {editingBill === bill._id && <th className="py-2 w-16"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, itemIndex) => {
                      const editKey = `${bill._id}-${itemIndex}`;
                      const isEditing = editingBill === bill._id;
                      const editedItem = editedItems[editKey] || {};
                      
                      return (
                        <tr key={itemIndex} className="border-b border-[#EE8C7F]/10 last:border-0 hover:bg-[#FDF5F4]/30">
                          <td className="py-2 px-2">
                            {isEditing ? (
                              <Input
                                value={editedItem.productName || item.productName}
                                onChange={(e) => handleItemEdit(billIndex, itemIndex, 'productName', e.target.value)}
                                className="w-full focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                              />
                            ) : (
                              <span className="text-[#1E1E1E]">{item.productName}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editedItem.quantity || item.quantity}
                                onChange={(e) => handleItemEdit(billIndex, itemIndex, 'quantity', parseFloat(e.target.value))}
                                className="w-20 ml-auto focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                              />
                            ) : (
                              <span className="text-[#1E1E1E]">{item.quantity}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right text-gray-600">{item.unit}</td>
                          <td className="py-2 px-2 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editedItem.price || item.price}
                                onChange={(e) => handleItemEdit(billIndex, itemIndex, 'price', parseFloat(e.target.value))}
                                className="w-24 ml-auto focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                              />
                            ) : (
                              <span className="text-[#1E1E1E]">₹{item.price.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-[#EE8C7F]">
                            ₹{(editedItem.amount || item.amount).toFixed(2)}
                          </td>
                          {isEditing && (
                            <td className="py-2 px-2 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-800 hover:bg-red-100"
                                onClick={() => initiateDelete(bill._id, itemIndex, bill.isCreditBill)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    <tr className="font-semibold bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2]">
                      <td colSpan={4} className="py-2 px-2 text-right text-[#1E1E1E]">Total:</td>
                      <td className="py-2 px-2 text-right text-[#EE8C7F]">₹{bill.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

};

export default DailySalesReport;