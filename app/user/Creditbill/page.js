"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import QRCode from "react-qr-code";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' And ' + convertLessThanThousand(n % 100) : '');
  };

  if (num < 1000) return convertLessThanThousand(num);
  
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;
  
  return (thousands > 0 ? convertLessThanThousand(thousands) + ' Thousand ' : '') + 
         (remainder > 0 ? convertLessThanThousand(remainder) : '');
};

const generateBillNumber = () => {
  const prefix = "BILLCT";
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

const CreditBill = ({
  shopName = "Your Business Name",
  customerName = "",
  customerPhone = "",
  items = [],
  date = new Date().toLocaleDateString(),
  dueDate = "",
  previousDue = 0,
  billNumber = generateBillNumber(),
  showGst = false,
  purchaseDate,
  partialPayment = 0,
  remainingCredit = 0,
  totalAmount = 0,
  onSave // Optional callback after saving
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [stripe, setStripe] = useState(null);
  
  // State for QR code amount - Fixed to ensure it's string
  const [qrCodeAmount, setQrCodeAmount] = useState("");
  // State for editing mode - explicitly set to false initially
  const [isEditingAmount, setIsEditingAmount] = useState(false);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await stripePromise;
      setStripe(stripeInstance);
    };
    initializeStripe();
  }, []);

  // Replace the existing useEffect for payment request initialization with this:
  useEffect(() => {
    if (stripe && typeof window !== 'undefined') {
      const balanceAmount = calculateBalanceAmount();
      // Ensure the amount is always positive - use Math.abs()
      const paymentAmount = Math.abs(Math.floor(balanceAmount) * 100); // Amount in paise
      
      const pr = stripe.paymentRequest({
        country: 'IN',
        currency: 'inr',
        total: {
          label: 'Total Amount',
          amount: paymentAmount, // This will now always be positive
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
        }
      });

      pr.on('paymentmethod', async (ev) => {
        try {
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/create-payment-intent`, {
            amount: paymentAmount,
            currency: 'inr',
          });

          const { clientSecret } = response.data;

          const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: ev.paymentMethod.id,
          });

          if (error) {
            ev.complete('fail');
            alert('Payment failed');
          } else {
            ev.complete('success');
            alert('Payment successful');
            saveBill();
          }
        } catch (error) {
          console.error('Error processing payment:', error);
          ev.complete('fail');
          alert('Payment failed');
        }
      });
    }
  }, [stripe]);

  // Initialize QR code amount when balance amount changes
  useEffect(() => {
    const balance = Math.floor(calculateBalanceAmount());
    setQrCodeAmount(balance.toString());
  }, [items, previousDue, remainingCredit, partialPayment]);

  const generateUPIUrl = (amount, billNumber, shopName) => {
    // Format UPI ID with valid characters
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'asdeepa812@okaxis'; // Example: your phone number@upi
    const merchantName = encodeURIComponent(shopName.replace(/[^a-zA-Z0-9\s]/g, ''));
    const transactionNote = encodeURIComponent(`Bill_${billNumber}`);
    const formattedAmount = Number(amount).toFixed(2); // Ensure amount has 2 decimal places
  
    // Construct UPI URL with all required parameters
    const upiUrl = `upi://pay?pa=${upiId}`
      + `&pn=${merchantName}`
      + `&tn=${transactionNote}`
      + `&am=${formattedAmount}`
      + `&cu=INR`
      + `&mode=04` // Mode 04 for QR code payments
      + `&sign=`; // Optional signature field
  
    return upiUrl;
  };
  
  const calculateAmount = (price, quantity) => {
    const numPrice = Number(price) || 0;
    const numQuantity = Number(quantity) || 0;
    return numPrice * numQuantity;
  };

  const calculateSubTotal = () => {
    return items.reduce((total, item) => {
      const itemAmount = calculateAmount(item.price, item.quantity);
      return total + itemAmount;
    }, 0);
  };

  const calculateTotalAmount = () => {
    return calculateSubTotal() + Number(previousDue);
  };

  // New function to calculate balance amount
  const calculateBalanceAmount = () => {
    return (totalAmount + previousDue) - partialPayment;
  };

  // Handle QR code amount input change - Fixed to properly update state
  const handleQrAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setQrCodeAmount(value);
    }
  };

  // Start editing the QR code amount - Fixed to ensure state changes
  const startEditAmount = () => {
    console.log("Edit button clicked"); // Debug log
    setIsEditingAmount(true);
  };

  // Save the edited QR code amount - Fixed to handle empty values better
  const saveQrAmount = () => {
    // Convert empty string to balance amount
    if (qrCodeAmount === '' || isNaN(Number(qrCodeAmount))) {
      setQrCodeAmount(Math.floor(calculateBalanceAmount()).toString());
    }
    setIsEditingAmount(false);
  };
  
  // Get the payment amount (either custom or balance amount) - Improved to handle edge cases
  const getPaymentAmount = () => {
    if (qrCodeAmount === '' || isNaN(Number(qrCodeAmount))) {
      return Math.floor(calculateBalanceAmount());
    }
    return Number(qrCodeAmount);
  };

  const saveBill = async () => {
    setIsSaving(true);
    try {
      // The final bill amount is now the balance amount
      const balanceAmount = Math.floor(calculateBalanceAmount());
      
      const billData = {
        billNumber,
        shopName,
        customerName,
        customerPhone,
        date: new Date(date),
        dueDate: new Date(dueDate),
        items,
        previousDue,
        subTotal: calculateSubTotal(),
        roundingDiff: Number((calculateBalanceAmount() - balanceAmount).toFixed(2)),
        finalAmount: balanceAmount, // This is now the balance amount
        // Only record payment amount if different from balance amount
        paymentAmount: getPaymentAmount() !== balanceAmount ? getPaymentAmount() : undefined
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/cashbill/creditbill`, billData);
      
      if (onSave) onSave(response.data);
      alert('Credit Bill saved successfully!');
    } catch (error) {
      console.error('Error saving credit bill:', error);
      alert('Failed to save credit bill');
    } finally {
      setIsSaving(false);
    }
  };

  const balanceAmount = calculateBalanceAmount();
  const roundedBalance = Math.floor(balanceAmount);
  const roundingDiff = (balanceAmount - roundedBalance).toFixed(2);
  const paymentAmount = getPaymentAmount();

  // Debug - let's log the current state to help troubleshoot
  console.log("Current state:", { 
    isEditingAmount, 
    qrCodeAmount, 
    paymentAmount, 
    roundedBalance,
    remainingCredit,
    previousDue,
    partialPayment,
    balanceAmount
  });

  return (
    <div className="w-[300px] mx-auto p-2 bg-white">
      {/* Header */}
      <div className="text-center mb-4 pb-2 border-b border-gray-300">
              <h1 className="text-xl font-bold text-gray-800">{shopName}</h1>
              <p className="text-xs text-gray-600">BHAVANI MAINROAD</p>
              <p className="text-xs text-gray-600">SANTHAI (OPP)</p>
              <p className="text-xs text-gray-600">Olagadam, Erode, TN</p>
              <p className="text-xs text-gray-600">Phone: (+91) 9488239034</p>
              <p className="text-xs text-gray-600">33EFKPA9656F1ZC</p>
            </div>

      {/* Credit Bill Title */}
      <div className="text-center font-bold text-sm mb-2">
        CREDIT BILL
      </div>

      {/* Invoice Info */}
      <div className="text-xs mb-2 border-b border-gray-300 pb-2">
        <div className="flex justify-between">
          <span>Bill No:</span>
          <span>{billNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Purchase Date:</span>
          <span>{purchaseDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{customerName}</span>
        </div>
        <div className="flex justify-between">
          <span>Phone:</span>
          <span>{customerPhone}</span>
        </div>
      </div>

      {/* Items */}
      <div className="text-xs mb-2">
        <div className="border-b border-gray-300 pb-1 mb-1">
          <div className="flex justify-between font-semibold text-xs">
            <span className="w-32">DESCRIPTION</span>
            {showGst && (
              <>
                <span className="w-12">GST%</span>
              </>
            )}
            <span className="w-12 text-center">UNIT</span>
            <span className="w-16 text-right">RATE</span>
            <span className="w-10 text-right">QTY</span>
            <span className="w-16 text-right">Total</span>
          </div>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex justify-between mb-1 border-b border-gray-200 text-xs">
            <span className="w-24">{item.productName}</span>xxx   
            {showGst && (
              <>
                <span className="w-12">{item.gstPercentage}%</span>
              </>
            )}
            <span className="w-12 text-center">{item.unit}</span>
            <span className="w-16 text-right">₹{Number(item.price).toFixed(2)}</span>
            <span className="w-16 text-right">{item.quantity}</span>
            <span className="w-16 text-right">₹{calculateAmount(item.price, item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Total with Previous Due and Rounding */}
      <div className="border-t border-gray-300 pt-2 mt-2">
      <div className="text-right">
          <span className="font-bold">-------------</span>
        </div>
      <div className="flex justify-between text-xs">
          <span className="font-bold">Total Amount:</span>
          <span>₹{totalAmount.toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="font-bold">-------------</span>
        </div>
        <div className="flex justify-between text-xs text-red-600">
          <span>Previous Bal:</span>
          <span>₹{Number(previousDue).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-bold">Currect Bal:</span>
          <span>₹{totalAmount.toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="font-bold">-------------</span>
        </div>
        <div className="flex justify-between text-sm mt-2 pt-2 border-t">
          <span className="font-bold">Total Bal:</span>
          <span>₹{(totalAmount + previousDue).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-bold">CASH Received:</span>
          <span>₹{partialPayment.toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="font-bold">-------------</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Rounded Off:</span>
          <span>-₹{roundingDiff}</span>
        </div>
        <div className="text-right">
           <span className="font-bold">-------------</span>
        </div>
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>Balance Amount:</span>
          <span>₹{roundedBalance.toFixed(2)}</span>
        </div>
        </div>
        <div className="text-right">
            <span className="font-bold">-------------</span>
        </div>
       
      {/* Amount in Words */}
      <div className="mt-2 text-xs italic">
        <p>Rupees {numberToWords(roundedBalance)} Only</p>
      </div>
      <div className="flex justify-between border-t border-gray-300 pt-1">
            <span>Total Items: {items.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Qty: {items.length.toFixed(2)}</span>
          </div>
      {/* Payment Section */}
      <div className="mt-4 space-y-4">
        {/* Google Pay Button */}
        <button 
          onClick={() => setShowQRCode(!showQRCode)}
          className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
        >
          {showQRCode ? 'Hide QR Code' : 'Pay with Google Pay'}
        </button>

        {/* QR Code Display with Editable Amount */}
        {showQRCode && (
          <div className="flex flex-col items-center space-y-2">
            {/* Editable Amount Field - Above QR Code - FIXED */}
            <div className="flex flex-col w-full mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Payment Amount:</span>
                
                {isEditingAmount ? (
                  <div className="flex gap-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2">₹</span>
                      <input
                        type="text"
                        value={qrCodeAmount}
                        onChange={handleQrAmountChange}
                        className="w-32 pl-6 py-1 border rounded text-sm"
                        autoFocus
                      />
                    </div>
                    <button 
                      onClick={saveQrAmount}
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">₹{paymentAmount.toFixed(2)}</span>
                    <button 
                      onClick={startEditAmount}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Payment different from bill amount warning */}
            {paymentAmount !== roundedBalance && (
              <p className="text-xs text-amber-600 w-full text-center">
                Note: Payment amount is different from bill amount. This partial payment will be recorded but will not change the original bill amount.
              </p>
            )}
            
            <div className="p-4 bg-white rounded-lg shadow">
              <QRCode
                value={generateUPIUrl(paymentAmount, billNumber, shopName)}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-600">Scan with any UPI app to pay</p>
            <p className="text-sm font-semibold">Amount: ₹{paymentAmount.toFixed(2)}</p>
            
            {/* Direct Payment Links */}
            <div className="flex flex-col gap-2 w-full mt-2">
              <a
                href={`gpay://upi/pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'mannathan05-3@okaxis'}&pn=${encodeURIComponent(shopName)}&am=${paymentAmount.toFixed(2)}&cu=INR&tn=Bill_${billNumber}`}
                className="w-full bg-green-500 text-white py-2 px-4 rounded text-center text-sm"
              >
                Open in Google Pay
              </a>
              <a
                href={`phonepe://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'mannathan05-3@okaxis'}&pn=${encodeURIComponent(shopName)}&am=${paymentAmount.toFixed(2)}&cu=INR&tn=Bill_${billNumber}`}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded text-center text-sm"
              >
                Open in PhonePe
              </a>
              <a
                href={`paytm://upi/pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'mannathan05-3@okaxis'}&pn=${encodeURIComponent(shopName)}&am=${paymentAmount.toFixed(2)}&cu=INR&tn=Bill_${billNumber}`}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded text-center text-sm"
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
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 
                     transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving Bill...' : 'Save Credit Bill'}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-xs border-t border-gray-300 pt-2">
        <p className="font-bold text-red-600 mb-1">
          Please pay before {dueDate}
        </p>
        <p>Thank you for your business!</p>
        <div className="mt-2">* * * * * * * * * *</div>
      </div>
    </div>
  );
};

export default CreditBill;