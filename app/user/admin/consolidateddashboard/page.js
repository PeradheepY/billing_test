"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp, DollarSign, Users, Clock, LayoutDashboard, IndianRupee, CheckCircle2, AlertTriangle, Loader2, TrendingDown, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Dashboard = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const summaryRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing-summary`);
        if (!summaryRes.ok) throw new Error('Failed to fetch summary data');
        const summaryJson = await summaryRes.json();

        // Parse the enhanced summary data including settlement metrics
        setSummaryData({
          regular: {
            totalAmount: parseFloat(summaryJson.data.regular.totalAmount),
            totalBills: summaryJson.data.regular.totalBills,
            averageAmount: parseFloat(summaryJson.data.regular.averageAmount)
          },
          credit: {
            totalAmount: parseFloat(summaryJson.data.credit.totalAmount),
            totalBills: summaryJson.data.credit.totalBills,
            totalDue: parseFloat(summaryJson.data.credit.totalDue),
            averageAmount: parseFloat(summaryJson.data.credit.averageAmount)
          },
          settlements: {
            totalSettled: parseFloat(summaryJson.data.settlements.totalSettled),
            totalCount: summaryJson.data.settlements.totalCount,
            averageSettlement: parseFloat(summaryJson.data.settlements.averageSettlement),
            partialSettlements: {
              count: summaryJson.data.settlements.partialSettlements.count,
              amount: parseFloat(summaryJson.data.settlements.partialSettlements.amount)
            },
            remainingBalance: parseFloat(summaryJson.data.settlements.remainingBalance),
            settlementRate: parseFloat(summaryJson.data.settlements.settlementRate)
          }
        });

        // Fetch and process monthly/daily data as before...
        const monthlyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/monthly`);
        const dailyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/daily`);
        
        // Process the data...
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#EE8C7F', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-[#EE8C7F]" />
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Billing Dashboard</h1>
              <p className="text-sm text-gray-500">Comprehensive business analytics and insights</p>
            </div>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive" className="border-red-200 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-all border border-[#EE8C7F]/20 overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#EE8C7F]/20 to-[#D67568]/20 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Total Revenue</span>
                  <div className="p-2 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-lg shadow-md">
                    <IndianRupee className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-[#EE8C7F]">
                {formatCurrency((summaryData?.regular.totalAmount || 0) + (summaryData?.credit.totalAmount || 0))}
              </div>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {summaryData?.regular.totalBills + summaryData?.credit.totalBills || 0} total bills
              </div>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-all border border-emerald-200 overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Settlement Status</span>
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-emerald-600">
                {formatCurrency(summaryData?.settlements.totalSettled || 0)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Settlement Rate: <span className="font-semibold text-emerald-600">{formatPercentage(summaryData?.settlements.settlementRate / 100 || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-all border border-amber-200 overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Partial Settlements</span>
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-amber-600">
                {summaryData?.settlements.partialSettlements.count || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Amount: <span className="font-semibold text-amber-600">{formatCurrency(summaryData?.settlements.partialSettlements.amount || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-all border border-red-200 overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100 to-rose-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Outstanding Balance</span>
                  <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg shadow-md">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(summaryData?.settlements.remainingBalance || 0)}
              </div>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                From {summaryData?.credit.totalBills || 0} credit bills
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settlement Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
            <CardHeader className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-[#1E1E1E]">
                <div className="p-2 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-lg shadow-md">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                Settlement Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="settledAmount" fill="#EE8C7F" name="Settled Amount" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="partialAmount" fill="#f59e0b" name="Partial Settlements" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="outstandingAmount" fill="#ef4444" name="Outstanding" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
            <CardHeader className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-[#1E1E1E]">
                <div className="p-2 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-lg shadow-md">
                  <PieChartIcon className="w-5 h-5 text-white" />
                </div>
                Settlement Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Fully Settled',
                          value: summaryData?.settlements.totalSettled || 0
                        },
                        {
                          name: 'Partially Settled',
                          value: summaryData?.settlements.partialSettlements.amount || 0
                        },
                        {
                          name: 'Outstanding',
                          value: summaryData?.settlements.remainingBalance || 0
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {summaryData && Object.keys(summaryData).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;