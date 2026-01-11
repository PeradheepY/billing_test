'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function BillSearchPage() {
  const [billNumber, setBillNumber] = useState('');
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Add comprehensive print styles when component mounts
  useEffect(() => {
    // Create a style element for print media
    const style = document.createElement('style');
    style.type = 'text/css';
    style.media = 'print';
    
    // CSS for thermal printer optimization with complete background removal
    style.innerHTML = `
      @media print {
        /* Hide everything by default */
        body * {
          visibility: hidden;
          background: none !important;
        }
        
        /* Only show the bill */
        .thermal-bill, .thermal-bill * {
          visibility: visible !important;
          background: none !important;
          color: black !important;
        }
        
        /* Position the bill at the top of the page */
        .thermal-bill {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          width: 80mm !important; /* Standard thermal receipt width */
          margin: 0 auto !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }

          a, a:visited {
          text-decoration: none !important;
          color: black !important;
        }
        
        /* Hide specific elements even within the bill */
        .no-print, .no-print * {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Remove all colors except black for text */
        * {
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Ensure all borders print in black */
        .border-gray-200, .border-gray-300, .border-b, .border {
          border-color: black !important;
        }
        
        /* Hide all navigation elements, sidebars, etc. */
        nav, aside, header, footer, .sidebar, [role="navigation"] {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const searchBill = async () => {
    if (!billNumber) {
      setError('Please enter a bill number');
      return;
    }

    setLoading(true);
    setError('');
    setBill(null);

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/cashbill/access`, {
        params: { billNumber }
      });
      setBill(response.data);
    } catch (err) {
      setError('Bill not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateAmount = (price, quantity) => {
    return Number(price) * Number(quantity);
  };

  const printBill = () => {
    // You could add additional logic here if needed
    window.print();
  };

  const renderThermalBill = () => {
    if (!bill) return null;

    // Calculate totals
    const rawTotal = bill.items.reduce((sum, item) => 
      sum + calculateAmount(item.price, item.quantity), 0);
    
    const roundedTotal = Math.round(rawTotal);
    const roundingDiff = (rawTotal - roundedTotal).toFixed(2);

    return (
      <div className="mt-4 p-4 bg-white max-w-md mx-auto border border-gray-200 shadow-sm thermal-bill" style={{ fontFamily: 'monospace' }}>
        {/* Shop Header */}
        <div className="text-center mb-4 pb-2 border-b border-gray-300">
          <h1 className="text-xl font-bold text-gray-800">{bill.shopName}</h1>
          <p className="text-xs text-gray-600">BHAVANI MAINROAD</p>
          <p className="text-xs text-gray-600">SANTHAI (OPP)</p>
          <p className="text-xs text-gray-600">Olagadam, Erode, TN</p>
          <p className="text-xs text-gray-600">Phone: (+91) 9488239034</p>
          <p className="text-xs text-gray-600">33EFKPA9656F1ZC</p>
        </div>

        {/* Bill Header */}
        <div className="text-center font-bold text-sm mb-4 text-gray-700">
          {bill.dueDate ? "CREDIT BILL" : "CASH BILL"}
        </div>

        {/* Bill Details */}
        <div className="text-xs mb-4 pb-2 border-b border-gray-300">
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Bill No:</span>
            <span>{bill.billNumber}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Date:</span>
            <span>{formatDate(bill.date)}</span>
          </div>
          {bill.dueDate && (
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Due Date:</span>
              <span>{formatDate(bill.dueDate)}</span>
            </div>
          )}
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Name:</span>
            <span>{bill.customerName || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Phone No:</span>
            <span>{bill.customerPhone || 'N/A'}</span>
          </div>
        </div>

        {/* Items Table Header */}
        <div className="text-xs mb-2">
          <div className="flex justify-between font-semibold border-b border-gray-300 pb-1">
            <span className="w-24">Item</span>
            {bill.showGst && <span className="w-16">HSN</span>}
            <span className="w-12 text-center">Unit</span>
            <span className="w-16 text-right">Price</span>
            <span className="w-10 text-right">Qty</span>
            {bill.showGst && <span className="w-12 text-right">GST%</span>}
            <span className="w-16 text-right">Amount</span>
          </div>

          {/* Items Listing */}
          {bill.items.map((item, index) => {
            const itemAmount = calculateAmount(item.price, item.quantity);
            return (
              <div key={index} className="flex justify-between py-1 border-b border-gray-200">
                <span className="w-24 truncate">{item.productName}</span>
                {bill.showGst && <span className="w-16">{item.hsnCode || 'N/A'}</span>}
                <span className="w-12 text-center">{item.unit}</span>
                <span className="w-16 text-right">₹{Number(item.price).toFixed(2)}</span>
                <span className="w-10 text-right">{item.quantity}</span>
                {bill.showGst && <span className="w-12 text-right">{item.gstPercentage || 0}%</span>}
                <span className="w-16 text-right">₹{itemAmount.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        {/* Total Calculation */}
        <div className="mt-4 pt-2 border-t border-gray-300">
          <div className="flex justify-between text-xs mb-1">
            <span>Sub Total:</span>
            <span>₹{rawTotal.toFixed(2)}</span>
          </div>
          
          {/* Credit bill specific fields */}
          {bill.dueDate && (
            <>
              <div className="flex justify-between text-xs text-red-600 mb-1">
                <span>Previous Due:</span>
                <span>₹{Number(bill.previousDue || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold">Amount Paid:</span>
                <span>₹{Number(bill.partialPayment || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold">Credit Amount:</span>
                <span>₹{Number(bill.remainingCredit || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2 pt-2 border-t mb-1">
                <span className="font-bold">Total Outstanding:</span>
                <span>₹{Number((bill.remainingCredit || 0) + (bill.previousDue || 0)).toFixed(2)}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between text-xs mb-1">
            <span>Rounded Off:</span>
            <span className="text-red-600">-₹{Math.abs(roundingDiff)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm mt-2">
            <span>Final Amount:</span>
            <span className="text-green-700">₹{roundedTotal.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-xs mt-4 pt-2 border-t border-gray-300">
          <p>Thank you for your business!</p>
        </div>
        
        {/* Print and Back buttons - these will be hidden when printing */}
        <div className="no-print text-center mt-4">
          <button 
            onClick={printBill} 
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 mr-4"
          >
            Print Bill
          </button>
          <Link href="/user/customers">
            <button className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">
              Back to Form
            </button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bill Search</h1>
      <div className="flex mb-4">
        <input
          type="text"
          value={billNumber}
          onChange={(e) => setBillNumber(e.target.value)}
          placeholder="Enter Bill Number"
          className="flex-grow p-2 border rounded-l"
        />
        <button
          onClick={searchBill}
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded-r"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      
      {renderThermalBill()}
    </div>
  );
}