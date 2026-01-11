"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, RefreshCcw, XCircle } from 'lucide-react';

const BalanceCalculator = () => {
  const denominations = [
    { value: 2000, type: 'note' },
    { value: 500, type: 'note' },
    { value: 200, type: 'note' },
    { value: 100, type: 'note' },
    { value: 50, type: 'note' },
    { value: 20, type: 'note' },
    { value: 10, type: 'note' },
    { value: 5, type: 'note' },
    { value: 2, type: 'coin' },
    { value: 1, type: 'coin' }
  ];

  const [quantities, setQuantities] = useState(
    Object.fromEntries(denominations.map(d => [d.value, '']))
  );
  const [amountRequired, setAmountRequired] = useState('');

  const calculateReceived = () => {
    return denominations.reduce((sum, d) => {
      const qty = parseInt(quantities[d.value]) || 0;
      return sum + (d.value * qty);
    }, 0);
  };

  const calculateBalance = () => {
    const received = calculateReceived();
    const required = parseFloat(amountRequired) || 0;
    return received - required;
  };

  const handleQuantityChange = (denomination, value) => {
    setQuantities(prev => ({
      ...prev,
      [denomination]: value
    }));
  };

  const resetCalculator = () => {
    setQuantities(Object.fromEntries(denominations.map(d => [d.value, ''])));
    setAmountRequired('');
  };

  const balance = calculateBalance();
  const received = calculateReceived();

  return (
    <div className="min-h-screen bg-gray-50 p-2 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl bg-white">
        <CardHeader className="bg-slate-900 text-white py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <CardTitle className="text-lg">Balance Calculator</CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 space-y-3">
          {/* Amount Required Section */}
          <div className="bg-slate-50 rounded p-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700 w-24">Amount Required:</span>
              <Input
                type="number"
                value={amountRequired}
                onChange={(e) => setAmountRequired(e.target.value)}
                className="h-8 text-sm"
                placeholder="Enter amount"
              />
            </div>
          </div>

          {/* Denominations Section */}
          <div className="bg-slate-50 rounded p-2">
            <div className="text-sm font-medium text-slate-700 mb-2">Cash Received:</div>
            <div className="grid grid-cols-2 gap-2">
              {denominations.map(({ value, type }) => (
                <div key={value} className="flex items-center bg-white p-2 rounded border border-slate-100">
                  <span className="text-sm font-medium text-slate-600 w-16">₹{value}</span>
                  <Input
                    type="number"
                    value={quantities[value]}
                    onChange={(e) => handleQuantityChange(value, e.target.value)}
                    className="h-7 text-sm w-16 px-1"
                    placeholder="0"
                  />
                  <span className="text-sm ml-1 text-slate-500">
                    = ₹{(value * (parseInt(quantities[value]) || 0)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-medium text-blue-600">Received</div>
              <div className="font-bold text-blue-700">₹{received.toLocaleString()}</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="font-medium text-purple-600">Required</div>
              <div className="font-bold text-purple-700">
                ₹{parseFloat(amountRequired || 0).toLocaleString()}
              </div>
            </div>
            <div className={`p-2 rounded ${balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`font-medium ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Balance
              </div>
              <div className={`font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                ₹{Math.abs(balance).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              onClick={resetCalculator}
              className="h-8 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              <RefreshCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={() => window.close()}
              className="h-8 text-sm bg-slate-800 hover:bg-slate-900 text-white"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceCalculator;