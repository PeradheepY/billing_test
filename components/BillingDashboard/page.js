import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const BillingDashboard = ({ billingData = [] }) => {
  const [timeframe, setTimeframe] = useState('daily');

  // Ensure billingData is an array
  const safeData = Array.isArray(billingData) ? billingData : [];

  // Process daily data
  const getDailyData = () => {
    const dailyTotals = {};
    safeData.forEach(bill => {
      if (bill?.date && bill?.totalAmount) {
        const date = new Date(bill.date).toLocaleDateString();
        dailyTotals[date] = (dailyTotals[date] || 0) + bill.totalAmount;
      }
    });
    return Object.entries(dailyTotals).map(([date, total]) => ({
      date,
      total
    }));
  };

  // Process monthly data
  const getMonthlyData = () => {
    const monthlyTotals = {};
    safeData.forEach(bill => {
      if (bill?.date && bill?.totalAmount) {
        const date = new Date(bill.date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + bill.totalAmount;
      }
    });
    return Object.entries(monthlyTotals).map(([month, total]) => ({
      month,
      total
    }));
  };

  // Process popular items
  const getPopularItems = () => {
    const itemCounts = {};
    safeData.forEach(bill => {
      if (Array.isArray(bill?.items)) {
        bill.items.forEach(item => {
          if (item?.productName && item?.quantity) {
            itemCounts[item.productName] = (itemCounts[item.productName] || 0) + item.quantity;
          }
        });
      }
    });
    return Object.entries(itemCounts)
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const totalRevenue = safeData.reduce((sum, bill) => sum + (bill?.totalAmount || 0), 0);
    const totalOrders = safeData.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = new Set(safeData.filter(bill => bill?.customerEmail).map(bill => bill.customerEmail)).size;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      uniqueCustomers
    };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const stats = getSummaryStats();
  const timeSeriesData = timeframe === 'daily' ? getDailyData() : getMonthlyData();
  const popularItems = getPopularItems();

  if (safeData.length === 0) {
    return (
      <div className="w-full p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No billing data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{stats.averageOrderValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unique Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.uniqueCustomers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded ${timeframe === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTimeframe('daily')}
            >
              Daily
            </button>
            <button
              className={`px-4 py-2 rounded ${timeframe === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTimeframe('monthly')}
            >
              Monthly
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <LineChart width={800} height={300} data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeframe === 'daily' ? 'date' : 'month'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      {/* Popular Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <BarChart width={400} height={300} data={popularItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Items Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <PieChart width={400} height={300}>
                <Pie
                  data={popularItems}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {popularItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingDashboard;