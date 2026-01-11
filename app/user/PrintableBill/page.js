"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import QRCode from "react-qr-code";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Helper function to convert numbers to words
const numberToWords = (number) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertLessThanOneThousand = (num) => {
    if (num === 0) return '';
    
    if (num < 20) return ones[num];
    
    const ten = Math.floor(num / 10);
    const one = num % 10;
    
    return ten === 0 ? ones[one]
      : `${tens[ten]}${one > 0 ? ' ' + ones[one] : ''}`;
  };
  
  if (number === 0) return 'Zero';
  
  const thousand = Math.floor(number / 1000);
  const remaining = number % 1000;
  
  let words = '';
  
  if (thousand > 0) {
    words += `${convertLessThanOneThousand(thousand)} Thousand`;
    if (remaining > 0) words += ' ';
  }
  
  if (remaining > 0) {
    const hundred = Math.floor(remaining / 100);
    const tens = remaining % 100;
    
    if (hundred > 0) {
      words += `${ones[hundred]} Hundred`;
      if (tens > 0) words += ' and ';
    }
    
    if (tens > 0) {
      words += convertLessThanOneThousand(tens);
    }
  }
  
  return words;
};

const PrintableBill = ({
  shopName = "Your Business Name",
  customerName = "",
  customerPhone = "",
  items = [],
  date = null,
  purchaseDate = null,
  billNumber,
  showGst = false,
  onSave
}) => {
  date = purchaseDate;
  // Initialize date in an effect to avoid hydration mismatch
  const [currentDate, setCurrentDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // State for editable QR code amount - separate from bill total
  const [qrCodeAmount, setQrCodeAmount] = useState("");
  const [isEditingAmount, setIsEditingAmount] = useState(false);

  // Calculate bill amounts
  const [billCalculations, setBillCalculations] = useState({
    rawTotal: 0,
    roundedTotal: 0,
    roundingDiff: "0.00"
  });

  // Calculate amounts helper functions
  const calculateAmount = (price, quantity) => {
    const numPrice = Number(price) || 0;
    const numQuantity = Number(quantity) || 0;
    return numPrice * numQuantity;
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => {
      const amount = calculateAmount(item.price, item.quantity);
      return sum + amount;
    }, 0);
  };

  // Initialize date and calculations
  useEffect(() => {
    // Use the provided date or set current date
    setCurrentDate(date || new Date());
    
    // Calculate bill totals
    const rawTotal = calculateTotalAmount();
    const roundedTotal = Math.floor(rawTotal);
    const roundingDiff = (rawTotal - roundedTotal).toFixed(2);
    
    setBillCalculations({
      rawTotal,
      roundedTotal,
      roundingDiff
    });
    
    // Set initial QR code amount to match the rounded total
    setQrCodeAmount(Math.floor(rawTotal).toString());
  }, [date, items]); // Re-calculate when date or items change

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generateUPIUrl = (amount, billNumber, shopName) => {
    // Safely access env variables with fallback
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'agroclinic147@fbl';
    const merchantName = encodeURIComponent(shopName.replace(/[^a-zA-Z0-9\s]/g, ''));
    const transactionNote = encodeURIComponent(`Bill_${billNumber}`);
    const formattedAmount = Number(amount).toFixed(2);
  
    const upiUrl = `upi://pay?pa=${upiId}`
      + `&pn=${merchantName}`
      + `&tn=${transactionNote}`
      + `&am=${formattedAmount}`
      + `&cu=INR`
      + `&mode=04`
      + `&sign=`;
  
    return upiUrl;
  };

  const saveBill = async () => {
    setIsSaving(true);
    try {
      // Safely use the API URL with fallback
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const billData = {
        billNumber,
        shopName,
        customerName,
        customerPhone,
        date: currentDate,
        items,
        subTotal: billCalculations.rawTotal,
        roundingDiff: Number(billCalculations.roundingDiff),
        finalAmount: billCalculations.roundedTotal
      };

      const response = await axios.post(`${apiUrl}/api/cashbill`, billData);
      
      if (onSave) onSave(response.data);
      alert('Bill saved successfully!');
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Failed to save bill');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle QR code amount input change
  const handleQrAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and up to 2 decimal places
    if (value === '' || /^\d+\.?\d{0,2}$/.test(value)) {
      setQrCodeAmount(value);
    }
  };

  // Start editing the QR code amount
  const startEditAmount = () => {
    setIsEditingAmount(true);
  };

  // Save the edited QR code amount
  const saveQrAmount = () => {
    // If empty, reset to bill amount
    if (qrCodeAmount === '') {
      setQrCodeAmount(billCalculations.roundedTotal.toString());
    }
    setIsEditingAmount(false);
  };
  
  // Get the payment amount (either custom or bill total)
  const getPaymentAmount = () => {
    // If qrCodeAmount is a valid number, use it; otherwise use the bill total
    const amount = parseFloat(qrCodeAmount);
    return isNaN(amount) ? billCalculations.roundedTotal : amount;
  };
  
  const paymentAmount = getPaymentAmount();
  
  // If we're on server or not initialized yet, show loading
  if (typeof window === 'undefined' || currentDate === null) {
    return <div className="w-[350px] mx-auto p-4 bg-white shadow-lg rounded-lg">Loading...</div>;
  }
  
  return (
    <div className="w-[350px] mx-auto p-4 bg-white shadow-lg rounded-lg">
  {/* Shop Details */}
  <div className="text-center mb-4 pb-2 border-b border-gray-300">
    <h1 className="text-2xl font-bold text-gray-800">{shopName}</h1>
    <p className="text-sm text-gray-600">BHAVANI MAINROAD</p>
    <p className="text-sm text-gray-600">SANTHAI (OPP)</p>
    <p className="text-sm text-gray-600">Olagadam, Erode, TN</p>
    <p className="text-sm text-gray-600">Phone: (+91) 9488239034</p>
    <p className="text-sm text-gray-600">33EFKPA9656F1ZC</p>
  </div>

  {/* Bill Header */}
  <div className="text-center font-bold text-base mb-4 text-gray-700">
    CASH BILL
  </div>

  {/* Bill Details */}
  <div className="text-sm mb-4 pb-2 border-b border-gray-300">
    <div className="flex justify-between mb-1">
      <span className="font-semibold">Bill No:</span>
      <span>{billNumber}</span>
    </div>
    <div className="flex justify-between mb-1">
      <span className="font-semibold">PurchaseDate:</span>
      <span>{formatDate(date || currentDate)}</span>
    </div>
    <div className="flex justify-between mb-1">
      <span className="font-semibold">Name:</span>
      <span>{customerName}</span>
    </div>
    <div className="flex justify-between">
      <span className="font-semibold">Phone No:</span>
      <span>{customerPhone}</span>
    </div>
  </div>

  {/* Items Table Header */}
  <div className="text-sm mb-2">
    <div className="flex justify-between font-semibold border-b border-gray-300 pb-1">
      <span className="w-24">Item</span>
      {showGst && <span className="w-16">HSN</span>}
      <span className="w-12 text-center">Unit</span>
      <span className="w-16 text-right">Price</span>
      <span className="w-10 text-right">Qty</span>
      {showGst && <span className="w-12 text-right">GST%</span>}
      <span className="w-16 text-right">Amount</span>
    </div>

    {/* Items Listing */}
    {items.map((item, index) => {
      const itemAmount = calculateAmount(item.price, item.quantity);
      return (
        <div key={index} className="flex justify-between py-1 border-b border-gray-200">
          <span className="w-24 truncate">{item.productName}</span>
          {showGst && <span className="w-16">{item.hsnCode}</span>}
          <span className="w-12 text-center">{item.unit}</span>
          <span className="w-16 text-right">₹{Number(item.price).toFixed(2)}</span>
          <span className="w-10 text-right">{item.quantity}</span>
          {showGst && <span className="w-12 text-right">{item.gstPercentage}%</span>}
          <span className="w-16 text-right">₹{itemAmount.toFixed(2)}</span>
        </div>
      );
    })}
  </div>

  {/* Total Calculation */}
  <div className="mt-4 pt-2 border-t border-gray-300">
    <div className="flex justify-between text-sm mb-1">
      <span>Sub Total:</span>
      <span>₹{billCalculations.rawTotal.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-sm mb-1">
      <span>Rounded Off:</span>
      <span className="text-red-600">-₹{billCalculations.roundingDiff}</span>
    </div>
    <div className="flex justify-between font-bold text-base mt-2">
      <span>Final Amount:</span>
      <span className="text-green-700">₹{billCalculations.roundedTotal.toFixed(2)}</span>
    </div>
  </div>

  {/* Amount in Words */}
  <div className="mt-4 text-sm italic text-gray-700">
    <p>Rupees {numberToWords(billCalculations.roundedTotal)} Only</p>
  </div>

  {/* Payment Section */}
  <div className="mt-4 space-y-4">
    {/* Google Pay Button */}
    <button 
      onClick={() => setShowQRCode(!showQRCode)}
      className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors text-base"
    >
      {showQRCode ? 'Hide QR Code' : 'Pay with Google Pay'}
    </button>

    {/* QR Code Display with Editable Amount */}
    {showQRCode && (
      <div className="flex flex-col items-center space-y-2">
        {/* Editable Amount Field - Above QR Code */}
        <div className="flex items-center gap-2 w-full mb-2">
          <span className="text-base font-semibold">Payment Amount:</span>
          
          {isEditingAmount ? (
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                <input
                  type="text"
                  value={qrCodeAmount}
                  onChange={handleQrAmountChange}
                  className="w-full pl-7 py-1 border rounded text-base"
                  autoFocus
                  // Add onBlur to save when focus is lost
                  onBlur={saveQrAmount}
                  // Add key handler to save on Enter key
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveQrAmount();
                    }
                  }}
                />
              </div>
              <button 
                onClick={saveQrAmount}
                className="bg-green-500 text-white px-2 py-1 rounded text-base"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex-1 flex justify-between items-center">
              <span className="text-base font-semibold">₹{paymentAmount.toFixed(2)}</span>
              <button 
                onClick={startEditAmount}
                className="text-blue-500 underline text-sm"
              >
                Edit
              </button>
            </div>
          )}
        </div>
        
        {/* Payment different from bill amount warning */}
        {paymentAmount !== billCalculations.roundedTotal && (
          <p className="text-sm text-amber-600 w-full text-center">
            Note: Payment amount is different from bill amount
          </p>
        )}
        
        {/* QR Code */}
        <div className="p-4 bg-white rounded-lg shadow">
          <QRCode
            value={generateUPIUrl(paymentAmount, billNumber, shopName)}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>
        
        <p className="text-base text-gray-600">Scan with any UPI app to pay</p>
        
        {/* Direct Payment Links */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <a
            href={`gpay://upi/pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'mannathan05-3@okaxis'}&pn=${encodeURIComponent(shopName)}&am=${paymentAmount.toFixed(2)}&cu=INR&tn=Bill_${billNumber}`}
            className="w-full bg-green-500 text-white py-2 px-4 rounded text-center text-base"
          >
            Open in Google Pay
          </a>
          <a
            href={`phonepe://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'mannathan05-3@okaxis'}&pn=${encodeURIComponent(shopName)}&am=${paymentAmount.toFixed(2)}&cu=INR&tn=Bill_${billNumber}`}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded text-center text-base"
          >
            Open in PhonePe
          </a>
          <a
            href={`paytm://upi/pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'mannathan05-3@okaxis'}&pn=${encodeURIComponent(shopName)}&am=${paymentAmount.toFixed(2)}&cu=INR&tn=Bill_${billNumber}`}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded text-center text-base"
          >
            Open in Paytm
          </a>
        </div>
      </div>
    )}
  </div>
  
  {/* Save Bill Button */}
  <div className="mt-4 text-center">
    <button 
      onClick={saveBill} 
      disabled={isSaving}
      className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors 
                 disabled:bg-blue-300 disabled:cursor-not-allowed text-base"
    >
      {isSaving ? 'Saving Bill...' : 'Save Bill'}
    </button>
  </div>
  
  {/* Footer */}
  <div className="mt-4 text-center text-sm border-t border-gray-300 pt-2 text-gray-600">
    <p>Thank you for your business!</p>
    <p>Please keep this bill for your records</p>
    <div className="mt-2 text-gray-400">* * * * * * * * * *</div>
  </div>
</div>
  );
};

export default PrintableBill;