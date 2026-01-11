// app/user/dailysales/page.js
"use client"
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, Search, FileText, Package, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DailySalesj = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredSalesData, setFilteredSalesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize with today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
  }, []);

  // Update filtered data when search term or sales data changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSalesData(salesData);
      // Recalculate total based on all sales data
      const total = salesData.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      setTotalRevenue(total);
    } else {
      const filtered = salesData.filter(sale => 
        sale.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSalesData(filtered);
      // Recalculate total based on filtered data
      const filteredTotal = filtered.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      setTotalRevenue(filteredTotal);
    }
  }, [searchTerm, salesData]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sales?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      
      if (data.success) {
        // Group sales by product
        const salesByProduct = data.data.reduce((acc, sale) => {
          const existing = acc.find(item => item.productId === sale.productId);
          if (existing) {
            existing.quantitySold += sale.quantity;
            existing.totalRevenue += sale.totalPrice;
          } else {
            acc.push({
              productId: sale.productId,
              productName: sale.productName,
              quantitySold: sale.quantity,
              totalRevenue: sale.totalPrice,
              unit: sale.unit || 'units'
            });
          }
          return acc;
        }, []);
        
        setSalesData(salesByProduct);
        setFilteredSalesData(salesByProduct);
        
        // Calculate total revenue
        const total = data.data.reduce((sum, sale) => sum + sale.totalPrice, 0);
        setTotalRevenue(total);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to fetch sales data",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
      console.error("Error fetching sales data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Product Name", "Quantity Sold", "Unit", "Total Revenue"];
    const rows = filteredSalesData.map(sale => [
      sale.productName,
      sale.quantitySold,
      sale.unit,
      `₹${sale.totalRevenue.toFixed(2)}`
    ]);
    
    // Add total row
    rows.push(["TOTAL", "", "", `₹${totalRevenue.toFixed(2)}`]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFEFEF] via-white to-[#FDF5F4] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Sales Inventory Report</h1>
              <p className="text-sm text-gray-500">Track product sales and revenue</p>
            </div>
          </div>
        </Card>
        
        {/* Filters and Actions */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="space-y-4">
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Date
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  End Date
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={fetchSales} className="w-full bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Generate Report
                </Button>
              </div>
              
              <div className="flex items-end">
                <Button onClick={() => exportToCSV()} className="w-full bg-gradient-to-r from-[#F5A99F] to-[#EE8C7F] hover:from-[#EE8C7F] hover:to-[#D67568] text-white shadow-md">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Search input for product name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Search Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 border-gray-200 focus:border-[#EE8C7F] focus:ring-[#EE8C7F]"
                />
              </div>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#EE8C7F]" />
              <p className="text-gray-600">Loading sales data...</p>
            </div>
          </Card>
        ) : (
          <>
            <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2]">
                      <th className="border border-[#EE8C7F]/20 p-3 text-left text-sm font-semibold text-[#1E1E1E]">Product Name</th>
                      <th className="border border-[#EE8C7F]/20 p-3 text-right text-sm font-semibold text-[#1E1E1E]">Quantity Sold</th>
                      <th className="border border-[#EE8C7F]/20 p-3 text-left text-sm font-semibold text-[#1E1E1E]">Unit</th>
                      <th className="border border-[#EE8C7F]/20 p-3 text-right text-sm font-semibold text-[#1E1E1E]">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredSalesData.length > 0 ? (
                      filteredSalesData.map((sale, index) => (
                        <tr key={index} className="hover:bg-[#FDF5F4] transition-colors">
                          <td className="border border-[#EE8C7F]/10 p-3 text-[#1E1E1E]">{sale.productName}</td>
                          <td className="border border-[#EE8C7F]/10 p-3 text-right text-[#1E1E1E]">{sale.quantitySold}</td>
                          <td className="border border-[#EE8C7F]/10 p-3 text-gray-600">{sale.unit}</td>
                          <td className="border border-[#EE8C7F]/10 p-3 text-right font-semibold text-[#EE8C7F]">₹{sale.totalRevenue.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="border border-[#EE8C7F]/10 p-8 text-center text-gray-500">
                          {salesData.length > 0 
                            ? "No products match your search criteria."
                            : "No sales data found for the selected date range."}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] font-bold">
                      <td colSpan="3" className="border border-[#EE8C7F]/20 p-3 text-right text-[#1E1E1E]">Total Revenue:</td>
                      <td className="border border-[#EE8C7F]/20 p-3 text-right text-[#EE8C7F] text-lg">₹{totalRevenue.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sales Revenue</p>
                      <p className="text-3xl font-bold text-[#EE8C7F] mt-2">₹{totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
                      <IndianRupee className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="glass rounded-xl shadow-lg border border-[#EE8C7F]/20 hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Products Sold</p>
                      <p className="text-3xl font-bold text-[#1E1E1E] mt-2">{filteredSalesData.length}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#1E1E1E] to-[#333] rounded-xl shadow-md">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="glass rounded-xl shadow-lg border border-amber-200 hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                      <p className="text-3xl font-bold text-amber-600 mt-2">
                        {filteredSalesData.reduce((sum, sale) => sum + sale.quantitySold, 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-md">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailySalesj;