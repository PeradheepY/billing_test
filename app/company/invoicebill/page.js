'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
export default function BillSearchPage() {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchBill = async () => {
    if (!invoiceNumber) {
      setError('Please enter an invoice number');
      return;
    }

    setLoading(true);
    setError('');
    setBill(null);

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/company/InvoiceBill/${invoiceNumber}`);
      setBill(response.data);
    } catch (err) {
      setError('Invoice not found');
    } finally {
      setLoading(false);
    }
  };

  const renderBillDetails = () => {
    if (!bill) return null;

    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-indigo-600">Invoice Details</h2>
        <p><strong className="text-lg">Invoice Number:</strong> {bill.invoiceNumber}</p>
        <p><strong className="text-lg">Shop Name:</strong> {bill.shopName}</p>
        <p><strong className="text-lg">Supplier Name:</strong> {bill.supplierName}</p>
        <p><strong className="text-lg">Supplier Address:</strong> {bill.supplierAddress}</p>
        <p><strong className="text-lg">Purchase Date:</strong> {new Date(bill.purchaseDate).toLocaleDateString()}</p>
        <p><strong className="text-lg">Due Date:</strong> {new Date(bill.dueDate).toLocaleDateString()}</p>
        <p><strong className="text-lg">Previous Due:</strong> ₹{bill.previousDue.toFixed(2)}</p>
        <p><strong className="text-lg">Subtotal:</strong> ₹{bill.subtotal.toFixed(2)}</p>
        <p><strong className="text-lg">Total SGST:</strong> ₹{bill.totalSgst.toFixed(2)}</p>
        <p><strong className="text-lg">Total CGST:</strong> ₹{bill.totalCgst.toFixed(2)}</p>
        <p><strong className="text-lg">Total GST:</strong> ₹{bill.totalGst.toFixed(2)}</p>
        <p><strong className="text-lg">Final Amount:</strong> ₹{bill.finalAmount.toFixed(2)}</p>

        <h3 className="mt-6 text-xl font-semibold text-gray-700">Items:</h3>
        <table className="w-full border-collapse table-auto mt-4">
          <thead className="bg-indigo-100 text-white">
            <tr>
              <th className="border p-2">Product Name</th>
              <th className="border p-2">HSN Code</th>
              <th className="border p-2">GST Percentage</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Purchase Price</th>
              <th className="border p-2">Purchase Discount</th>
              <th className="border p-2">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-100">
                <td className="border p-2">{item.productName}</td>
                <td className="border p-2">{item.hsnCode || "N/A"}</td>
                <td className="border p-2">{item.gstPercentage}%</td>
                <td className="border p-2">{item.quantity}</td>
                <td className="border p-2">₹{item.purchaseprice.toFixed(2)}</td>
                <td className="border p-2">{item.purchaseDiscount}%</td>
                <td className="border p-2">₹{(item.quantity * item.purchaseprice)*(1-item.purchaseDiscount/100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-2">
          <p className="text-lg"><strong>Subtotal:</strong> ₹{bill.subtotal.toFixed(2)}</p>
          <p className="text-lg"><strong>Final Amount:</strong> ₹{bill.finalAmount.toFixed(2)}</p>
        </div>
        <div className="no-print text-center mt-4">
          <button onClick={() => window.print()} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 mr-4">
            Print Bill
          </button>
          <button className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">
          <Link href="/company/companycredithistory" className="mr-2 h-4 w-16" >
          Back to Form
          </Link>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-indigo-700">Invoice Search</h1>
      <div className="flex mb-6 space-x-4">
        <input
          type="text"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Enter Invoice Number"
          className="flex-grow p-3 border rounded-lg border-gray-300 shadow-md focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={searchBill}
          disabled={loading}
          className="bg-indigo-600 text-white p-3 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-500 text-lg">{error}</p>}
      
      {renderBillDetails()}
    </div>
  );
}