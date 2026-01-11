import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const DailyCashWithDateSelect = () => {
  const [dailyTotals, setDailyTotals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchDailyTotals = async (startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch billing data
      const billingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pdfdaily/items?fromDate=${startDate}&toDate=${endDate}`
      );

      if (!billingResponse.ok) {
        throw new Error(`Failed to fetch billing data (status: ${billingResponse.status})`);
      }

      const billingData = await billingResponse.json();

      // Fetch transactions data
      const transactionsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions?startDate=${startDate}&endDate=${endDate}`
      );

      if (!transactionsResponse.ok) {
        throw new Error(`Failed to fetch transactions (status: ${transactionsResponse.status})`);
      }

      const transactionsData = await transactionsResponse.json();

      // Create a map of daily totals
      const dailyTotalsMap = new Map();

      // Process billing data
      billingData.forEach(bill => {
        const date = bill.date.split('T')[0];
        if (!dailyTotalsMap.has(date)) {
          dailyTotalsMap.set(date, { cashTotal: 0, balance: 0 });
        }
        if (!bill.isCreditBill) {
          dailyTotalsMap.get(date).cashTotal += bill.totalAmount || 0;
        }
      });

      // Process transactions data
      transactionsData.forEach(transaction => {
        const date = transaction.date.split('T')[0];
        if (!dailyTotalsMap.has(date)) {
          dailyTotalsMap.set(date, { cashTotal: 0, balance: 0 });
        }
        if (transaction.type === 'payIn') {
          dailyTotalsMap.get(date).balance += transaction.amount;
        } else {
          dailyTotalsMap.get(date).balance -= transaction.amount;
        }
      });

      // Convert map to array and sort by date
      const newTotals = Array.from(dailyTotalsMap.entries())
        .map(([date, totals]) => ({
          date,
          ...totals,
          total: totals.cashTotal + totals.balance
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setDailyTotals(newTotals);
    } catch (error) {
      console.error('Error fetching daily totals:', error);
      setError('Failed to load daily totals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyTotals(dateRange.startDate, dateRange.endDate);
  }, [dateRange]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Daily Cash + Balance Totals</CardTitle>
        <div className="flex gap-4 items-center justify-center mt-4">
          <div className="flex items-center gap-2">
          
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="border rounded px-2 py-1"
              max={dateRange.endDate}
            />
          </div>
          <span className="text-gray-500">to</span>
          <div className="flex items-center gap-2">
           
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="border rounded px-2 py-1"
              min={dateRange.startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="text-red-500 text-center p-4">{error}</div>
          )}
          
          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : dailyTotals.length > 0 ? (
            dailyTotals.map((day) => (
              <div 
                key={day.date} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                  <div className="text-xl font-bold text-green-600">
                  ₹{day.total.toFixed(2)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 flex justify-between">
                  <span>Cash Sales: ₹{day.cashTotal.toFixed(2)}</span>
                  <span>Balance: ₹{day.balance.toFixed(2)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 p-4">No data available for selected date range</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCashWithDateSelect;