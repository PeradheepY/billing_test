"use client"
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  PieChart as PieChartIcon, 
  BarChart3,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BillingDashboard = () => {
  // Existing state
  const [bills, setBills] = useState({
    regular: [],
    credit: [],
    settlements: [],
  });
  
  const [totals, setTotals] = useState({
    totalRegularAmount: 0,
    totalCreditAmount: 0,
    totalPendingAmount: 0,
    totalSettledAmount: 0,
    partialSettlements: 0,
    fullSettlements: 0,
    partialPayments: 0, // Added new state for partial payments
  });

  const [dailyTotals, setDailyTotals] = useState({
    cashTotal: 0,
    creditTotal: 0,
    salesTotal: 0,
    partialPaymentTotal: 0, // Added new state for daily partial payments
  });
  
  // New state for date range
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date()
  });
  
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingData, setBillingData] = useState([]);

  const COLORS = {
    regular: "#EE8C7F",   // Coral primary
    credit: "#1E1E1E",    // Dark
    pending: "#F5A99F",   // Coral light
    full: "#D67568",      // Coral dark
    partial: "#EE8C7F",   // Coral primary
    partialPayment: "#EFEFEF" // Light gray
  };

  const showNotification = (message, type = "default") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const calculateSettlementTotals = (summary, settlements) => {
    if (!summary) return {
      totalSettled: 0,
      partialSettlements: summary?.partialSettlements || 0,
      fullSettlements: summary?.fullSettlements || 0,
    };

    return {
      totalSettled: summary.totalSettled,
      partialSettlements: summary.partialSettlements,
      fullSettlements: summary.fullSettlements,
    };
  };

  const fetchBillingData = async (fromDate, toDate) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pdfdaily/items?fromDate=${fromDate}&toDate=${toDate}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch data (status: ${response.status})`);
      }

      const data = await response.json();
      setBillingData(data);

      // Calculate totals from the fetched data
      const calculatedTotals = data.reduce((acc, bill) => {
        if (bill.isCreditBill) {
          acc.creditTotal += bill.totalAmount || 0;
          // Track partial payments
          if (bill.partialPayment) {
            acc.partialPaymentTotal += bill.partialPayment || 0;
          }
        } else {
          acc.cashTotal += bill.totalAmount || 0;
        }
        return acc;
      }, {
        cashTotal: 0,
        creditTotal: 0,
        partialPaymentTotal: 0
      });

      calculatedTotals.salesTotal = calculatedTotals.cashTotal + calculatedTotals.creditTotal;
      setDailyTotals(calculatedTotals);
      
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Failed to load sales data. Please try again.');
      toast.error('Failed to load sales data.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      await fetchBillingData(fromDate.toISOString(), toDate.toISOString());
    }
  };
  const fetchBills = async () => {
    try {
      const [regularRes, creditRes, settlementRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consolidatebill`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consolidatecreditbill`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settlement/summary`),
      ]);

      const [regularData, creditData, settlementData] = await Promise.all([
        regularRes.json(),
        creditRes.json(),
        settlementRes.json(),
      ]);

      setBills({
        regular: regularData.bills || [],
        credit: creditData.bills || [],
        settlements: settlementData.recentSettlements || [],
      });

      const settlementTotals = calculateSettlementTotals(
        settlementData.summary,
        settlementData.recentSettlements
      );

      // Calculate total partial payments from credit bills
      const totalPartialPayments = (creditData.bills || []).reduce(
        (sum, bill) => sum + (bill.partialPayment || 0), 
        0
      );

      const pendingAmount = (creditData.summary?.totalAmount || 0) - 
                          settlementTotals.totalSettled;

      setTotals({
        totalRegularAmount: regularData.summary?.totalRevenue || 0,
        totalCreditAmount: creditData.summary?.totalAmount || 0,
        totalPendingAmount: Math.max(0, pendingAmount),
        totalSettledAmount: settlementTotals.totalSettled,
        partialSettlements: settlementTotals.partialSettlements,
        fullSettlements: settlementTotals.fullSettlements,
        partialPayments: totalPartialPayments, // Set the new total
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("Error fetching billing data", "error");
    }
  };
  useEffect(() => {
    fetchBills();
    const intervalId = setInterval(fetchBills, 300000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    refreshData();
    const intervalId = setInterval(refreshData, 300000);
    return () => clearInterval(intervalId);
  }, [dateRange]);

  const revenueData = [
    { name: "Regular Bills", value: totals.totalRegularAmount, color: COLORS.regular },
    { name: "Full Settlements", value: totals.fullSettlements, color: COLORS.full },
    { name: "Partial Settlements", value: totals.partialSettlements, color: COLORS.partial },
    { name: "Partial Payments", value: totals.partialPayments, color: COLORS.partialPayment }
  ];

  const creditStatusData = [
    { name: "Pending", value: totals.totalPendingAmount, color: COLORS.pending },
    { name: "Full Settlements", value: totals.fullSettlements, color: COLORS.full },
    { name: "Partial Settlements", value: totals.partialSettlements, color: COLORS.partial },
    { name: "Partial Payments", value: totals.partialPayments, color: COLORS.partialPayment }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EFEFEF] via-white to-[#FDF5F4]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-[#EFEFEF] border-t-[#EE8C7F] animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-[#EE8C7F] animate-pulse" />
            </div>
          </div>
          <span className="text-[#1E1E1E] font-medium text-lg">Loading financial data...</span>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFEFEF] via-white to-[#FDF5F4] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="glass rounded-3xl p-6 md:p-8 shadow-xl shadow-[#EE8C7F]/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#EE8C7F] uppercase tracking-wider">Dashboard</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] tracking-tight">Financial Overview</h1>
              <p className="text-[#1E1E1E]/60 mt-2 text-base">Track your revenue, credits, and settlements in real-time.</p>
            </div>
            
            <div className="flex items-center gap-3 glass-coral rounded-2xl p-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-[#1E1E1E] hover:text-[#EE8C7F] hover:bg-white/50 rounded-xl px-4 py-2 transition-smooth">
                    <CalendarIcon className="h-4 w-4 text-[#EE8C7F]" />
                    <span className="font-medium text-sm">
                      {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'Pick a date'} 
                      {dateRange.to && dateRange.to !== dateRange.from ? ` - ${format(dateRange.to, 'MMM dd, yyyy')}` : ''}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass rounded-2xl border-0 shadow-2xl" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      setDateRange({
                        from: range?.from || new Date(),
                        to: range?.to || range?.from || new Date()
                      });
                    }}
                    numberOfMonths={2}
                    className="rounded-2xl"
                  />
                </PopoverContent>
              </Popover>
              <Button 
                onClick={refreshData} 
                size="sm" 
                className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] text-white hover:from-[#D67568] hover:to-[#C56459] rounded-xl shadow-lg shadow-[#EE8C7F]/25 px-5 py-2 transition-smooth"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Daily Stats Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-[#EE8C7F]/10 rounded-lg">
              <Activity className="h-4 w-4 text-[#EE8C7F]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E1E1E]">
              {dateRange.from === dateRange.to ? "Today's Activity" : "Period Activity"}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Cash Bills Card */}
            <div className="glass rounded-3xl p-6 hover:shadow-xl hover:shadow-[#EE8C7F]/10 transition-smooth group cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[#1E1E1E]/60">Cash Bills</p>
                  <h3 className="text-3xl font-bold text-[#1E1E1E] mt-2 group-hover:text-[#EE8C7F] transition-smooth">
                    ₹{dailyTotals.cashTotal.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#EE8C7F]/20 to-[#EE8C7F]/5 group-hover:from-[#EE8C7F] group-hover:to-[#D67568] transition-smooth">
                  <Wallet className="h-6 w-6 text-[#EE8C7F] group-hover:text-white transition-smooth" />
                </div>
              </div>
              <div className="mt-5">
                <span className="text-xs font-semibold text-[#EE8C7F] bg-[#EE8C7F]/10 px-3 py-1.5 rounded-full">Direct Income</span>
              </div>
            </div>

            {/* Credit Bills Card */}
            <div className="glass rounded-3xl p-6 hover:shadow-xl hover:shadow-[#1E1E1E]/10 transition-smooth group cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[#1E1E1E]/60">Credit Bills</p>
                  <h3 className="text-3xl font-bold text-[#1E1E1E] mt-2 group-hover:text-[#1E1E1E]/80 transition-smooth">
                    ₹{dailyTotals.creditTotal.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1E1E1E]/10 to-[#1E1E1E]/5 group-hover:from-[#1E1E1E] group-hover:to-[#333] transition-smooth">
                  <CreditCard className="h-6 w-6 text-[#1E1E1E] group-hover:text-white transition-smooth" />
                </div>
              </div>
              <div className="mt-5">
                <span className="text-xs font-semibold text-[#1E1E1E]/70 bg-[#1E1E1E]/10 px-3 py-1.5 rounded-full">Credit Issued</span>
              </div>
            </div>

            {/* Partial Payments Card */}
            <div className="glass rounded-3xl p-6 hover:shadow-xl hover:shadow-[#EE8C7F]/10 transition-smooth group cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[#1E1E1E]/60">Partial Payments</p>
                  <h3 className="text-3xl font-bold text-[#1E1E1E] mt-2 group-hover:text-[#D67568] transition-smooth">
                    ₹{dailyTotals.partialPaymentTotal.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#F5A99F]/30 to-[#F5A99F]/10 group-hover:from-[#F5A99F] group-hover:to-[#EE8C7F] transition-smooth">
                  <DollarSign className="h-6 w-6 text-[#D67568] group-hover:text-white transition-smooth" />
                </div>
              </div>
              <div className="mt-5">
                <span className="text-xs font-semibold text-[#D67568] bg-[#D67568]/10 px-3 py-1.5 rounded-full">Collected</span>
              </div>
            </div>

            {/* Total Sales Card */}
            <div className="bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-3xl p-6 shadow-xl shadow-[#EE8C7F]/25 group cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white/80">Total Sales</p>
                  <h3 className="text-3xl font-bold text-white mt-2">
                    ₹{dailyTotals.salesTotal.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-5">
                <span className="text-xs font-semibold text-white bg-white/20 px-3 py-1.5 rounded-full">Gross Revenue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Stats Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-[#EE8C7F]/10 rounded-lg">
              <PieChartIcon className="h-4 w-4 text-[#EE8C7F]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E1E1E]">Overall Performance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border-l-4 border-l-[#EE8C7F] hover:shadow-lg transition-smooth">
                <p className="text-sm font-medium text-[#1E1E1E]/60">Total Cash Bills</p>
                <p className="text-2xl font-bold text-[#1E1E1E] mt-1">₹{totals.totalRegularAmount.toFixed(2)}</p>
                <p className="text-xs text-[#1E1E1E]/40 mt-2">Direct payments received</p>
              </div>
              <div className="glass rounded-2xl p-5 border-l-4 border-l-[#1E1E1E] hover:shadow-lg transition-smooth">
                <p className="text-sm font-medium text-[#1E1E1E]/60">Total Credit Bills</p>
                <p className="text-2xl font-bold text-[#1E1E1E] mt-1">₹{totals.totalCreditAmount.toFixed(2)}</p>
                <p className="text-xs text-[#1E1E1E]/40 mt-2">Total credit outstanding</p>
              </div>
              <div className="glass rounded-2xl p-5 border-l-4 border-l-[#D67568] hover:shadow-lg transition-smooth">
                <p className="text-sm font-medium text-[#1E1E1E]/60">Total Sales Volume</p>
                <p className="text-2xl font-bold text-[#1E1E1E] mt-1">₹{(totals.totalRegularAmount + totals.totalCreditAmount).toFixed(2)}</p>
                <p className="text-xs text-[#1E1E1E]/40 mt-2">Cumulative sales amount</p>
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border-l-4 border-l-[#F5A99F] hover:shadow-lg transition-smooth">
                <p className="text-sm font-medium text-[#1E1E1E]/60">Partial Settlements</p>
                <p className="text-2xl font-bold text-[#1E1E1E] mt-1">₹{totals.partialSettlements.toFixed(2)}</p>
                <p className="text-xs text-[#1E1E1E]/40 mt-2">Recovered from credits</p>
              </div>
              <div className="glass rounded-2xl p-5 border-l-4 border-l-[#EE8C7F] hover:shadow-lg transition-smooth">
                <p className="text-sm font-medium text-[#1E1E1E]/60">Initial Partial Payments</p>
                <p className="text-2xl font-bold text-[#1E1E1E] mt-1">₹{totals.partialPayments.toFixed(2)}</p>
                <p className="text-xs text-[#1E1E1E]/40 mt-2">Upfront credit payments</p>
              </div>
              <div className="glass rounded-2xl p-5 border-l-4 border-l-[#D67568] hover:shadow-lg transition-smooth">
                <p className="text-sm font-medium text-[#1E1E1E]/60">Total Collections</p>
                <p className="text-2xl font-bold text-[#1E1E1E] mt-1">₹{(totals.totalRegularAmount + totals.totalSettledAmount).toFixed(2)}</p>
                <p className="text-xs text-[#1E1E1E]/40 mt-2">Cash + Settlements</p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border-l-4 border-l-[#EE8C7F] hover:shadow-lg transition-smooth">
                <p className="text-sm font-medium text-[#1E1E1E]/60">Cash + Partial Payments</p>
                <p className="text-2xl font-bold text-[#1E1E1E] mt-1">₹{(totals.totalRegularAmount + totals.partialPayments).toFixed(2)}</p>
                <p className="text-xs text-[#1E1E1E]/40 mt-2">Total liquid cash</p>
              </div>
              
              {/* Decorative card */}
              <div className="glass-coral rounded-2xl p-6 flex flex-col items-center justify-center text-center h-[calc(100%-1rem)]">
                <div className="p-3 bg-[#EE8C7F]/10 rounded-full mb-3">
                  <Sparkles className="h-6 w-6 text-[#EE8C7F]" />
                </div>
                <p className="text-sm font-medium text-[#1E1E1E]/60">More metrics</p>
                <p className="text-xs text-[#1E1E1E]/40 mt-1">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-smooth">
            <div className="border-b border-[#1E1E1E]/5 bg-gradient-to-r from-[#EE8C7F]/5 to-transparent p-5">
              <h3 className="text-base font-semibold text-[#1E1E1E] flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-[#EE8C7F]" />
                Revenue Distribution
              </h3>
            </div>
            <div className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value) => `₹${value.toFixed(2)}`} 
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-[#1E1E1E]/70 text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-smooth">
            <div className="border-b border-[#1E1E1E]/5 bg-gradient-to-r from-[#EE8C7F]/5 to-transparent p-5">
              <h3 className="text-base font-semibold text-[#1E1E1E] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#EE8C7F]" />
                Credit Status Overview
              </h3>
            </div>
            <div className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creditStatusData} barSize={50}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 11, fill: '#1E1E1E', opacity: 0.5}} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 11, fill: '#1E1E1E', opacity: 0.5}} 
                      tickFormatter={(value) => `₹${value/1000}k`} 
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(238, 140, 127, 0.05)'}}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value) => `₹${value.toFixed(2)}`} 
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {creditStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <Alert
          className={`fixed bottom-6 right-6 shadow-2xl border-0 rounded-2xl backdrop-blur-xl ${
            notification.type === "error"
              ? "bg-red-500/90 text-white"
              : "bg-gradient-to-r from-[#EE8C7F] to-[#D67568] text-white"
          }`}
        >
          <AlertDescription className="font-medium">{notification.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BillingDashboard;