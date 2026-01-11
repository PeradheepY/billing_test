'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DailyCashWithDateSelect from '@/components/DailyCashScroll';

export default function Home() {
    const [username, setUsername] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [formData, setFormData] = useState({
    type: 'payIn',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchTransactions = async () => {
    const params = new URLSearchParams({
      ...(dateFilter.startDate && { startDate: dateFilter.startDate }),
      ...(dateFilter.endDate && { endDate: dateFilter.endDate })
    });
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data);
  };


 

  useEffect(() => {
    fetchTransactions();
  }, [dateFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
       body: JSON.stringify({ ...formData, username }),
    });

    if (res.ok) {
      setFormData({
        type: 'payIn',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchTransactions();
    }
  };

  const calculateSummary = (transactions) => {
    return transactions.reduce((summary, t) => {
      if (t.type === 'payIn') {
        summary.payIn += t.amount;
      } else {
        summary.expenses += t.amount;
      }
      summary.balance = summary.payIn - summary.expenses;
      return summary;
    }, { payIn: 0, expenses: 0, balance: 0 });
  };

  const groupTransactionsByDate = (transactions) => {
    return transactions.reduce((grouped, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = {
          payIn: 0,
          expenses: 0,
          transactions: []
        };
      }
      
      if (transaction.type === 'payIn') {
        grouped[date].payIn += transaction.amount;
      } else {
        grouped[date].expenses += transaction.amount;
      }
      
      grouped[date].transactions.push(transaction);
      return grouped;
    }, {});
  };

  const summary = calculateSummary(transactions);
  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex gap-4">
        <input
          type="date"
          value={dateFilter.startDate}
          onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="date"
          value={dateFilter.endDate}
          onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
          className="p-2 border rounded"
        />
        <button
          onClick={() => setDateFilter({ startDate: '', endDate: '' })}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear Dates
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total PayIn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-green-600">₹{summary.payIn}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-red-600">₹{summary.expenses}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-blue-600">₹{summary.balance}</p>
          </CardContent>
        </Card>
        <DailyCashWithDateSelect />
      </div>
      <div className="mb-4">
      <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="p-2 border rounded"
            required
          >
            <option value="payIn">PayIn</option>
            <option value="expense">Expense</option>
          </select>

          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="p-2 border rounded"
            required
          />

          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            className="p-2 border rounded"
            required
          />

          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="p-2 border rounded"
            required
          />

          <input
            type="text"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Transaction
        </button>
      </form>

      <div className="space-y-6">
        {Object.entries(groupedTransactions).map(([date, data]) => (
          <div key={date} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{date}</h3>
              <div className="flex gap-4">
                <span className="text-green-600">payIn: ₹{data.payIn}</span>
                <span className="text-red-600">Expenses: ₹{data.expenses}</span>
                <span className="text-blue-600">Balance: ₹{data.payIn - data.expenses}</span>
              </div>
            </div>
            
            <table className="w-full border-collapse">
              <thead>
                <tr>
                <th className="border p-2">UserName</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Category</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((transaction) => (
                  <tr key={transaction._id}>
                     <td className="border p-2">{transaction.username}</td>
                    <td className="border p-2">{transaction.type}</td>
                    <td className="border p-2">{transaction.category}</td>
                    <td className={`border p-2 ${
                      transaction.type === 'payIn' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{transaction.amount}
                    </td>
                    <td className="border p-2">{transaction.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

