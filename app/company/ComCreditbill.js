"use client"
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' And ' + convertLessThanThousand(n % 100) : '');
  };

  if (num < 1000) return convertLessThanThousand(num);
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;
  return (thousands > 0 ? convertLessThanThousand(thousands) + ' Thousand ' : '') +
    (remainder > 0 ? convertLessThanThousand(remainder) : '');
};

const CreditBill = ({
  shopName,
  supplierName,
  supplierAddress,
  purchaseDate,
  items,
  date = '',
  dueDate,
  previousDue = 0,
  invoiceNumber,
  showGst = true,
  gstPercentage = 0,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const calculateAmount = (purchasePrice, quantity, purchaseDiscount = 0) => {
    // Calculate subtotal
    const subtotal = Number(purchasePrice) * Number(quantity);
    
    // Calculate discount amount
    const discountAmount = (subtotal * Number(purchaseDiscount)) / 100;
    
    // Calculate final amount after discount
    const finalAmount = subtotal - discountAmount;
    
    return {
      subtotal: subtotal,
      discountAmount: discountAmount,
      finalAmount: finalAmount
    };
  };

  const calculateGSTDetails = (purchasePrice, quantity, gstPercentage, purchaseDiscount) => {
    // Get amount after discount
    const { finalAmount } = calculateAmount(purchasePrice, quantity, purchaseDiscount);
    
    // Calculate GST on discounted amount
    const gstRate = gstPercentage / 100;
    const gstWholeprice = finalAmount * gstRate;
    const sgst = gstWholeprice / 2;
    const cgst = gstWholeprice / 2;

    return {
      amount: finalAmount,
      gstAmount: gstWholeprice,
      sgst: Number(sgst.toFixed(2)),
      cgst: Number(cgst.toFixed(2))
    };
  };

  const calculateSubTotal = () => {
    return items.reduce((total, item) => {
      const { finalAmount } = calculateAmount(
        item.purchaseprice, 
        item.quantity, 
        item.purchaseDiscount
      );
      return total + finalAmount;
    }, 0);
  };

  const calculateTotalGSTDetails = () => {
    return items.reduce((totals, item) => {
      const gstDetails = calculateGSTDetails(
        item.purchaseprice, 
        item.quantity, 
        item.gstPercentage,
        item.purchaseDiscount
      );
      return {
        totalSgst: totals.totalSgst + gstDetails.sgst,
        totalCgst: totals.totalCgst + gstDetails.cgst
      };
    }, { totalSgst: 0, totalCgst: 0 });
  };

  const subtotal = calculateSubTotal();
  const { totalSgst, totalCgst } = calculateTotalGSTDetails();
  const totalGst = Number((totalSgst + totalCgst).toFixed(2));
  const totalAmount = subtotal + Number(previousDue) + totalGst;
  const roundedTotal = Math.floor(totalAmount);
  const roundingDiff = (totalAmount - roundedTotal).toFixed(2);
  const finalAmount = roundedTotal;

  const saveBill = async () => {
    try {
      setIsSaving(true);
      const loadingToast = toast.loading('Saving bill...');

      const billData = {
        shopName,
        supplierName,
        supplierAddress,
        purchaseDate,
        dueDate,
        invoiceNumber,
        items,
        previousDue,
        subtotal,
        totalSgst,
        totalCgst,
        totalGst,
        finalAmount
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/InvoiceBill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData)
      });

      if (!response.ok) {
        throw new Error('Failed to save bill');
      }

      const savedBill = await response.json();
      toast.dismiss(loadingToast);
      toast.success('Bill saved successfully!', {
        duration: 4000,
        position: 'top-right'
      });
      console.log('Bill saved:', savedBill);
    } catch (error) {
      toast.error(error.message || 'Error saving bill', {
        duration: 4000,
        position: 'top-right'
      });
      console.error('Error saving bill:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-[225mm] min-h-[297mm] mx-auto p-8 bg-white border border-gray-300 shadow-lg rounded-lg">
      {/* Header Section */}
      <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">{shopName}</h1>
        <div className="mt-4 text-2xl font-semibold text-gray-700">CREDIT BILL</div>
      </div>

      {/* Bill Details Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Invoice No:</span>
            <span className="text-gray-600">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Bill Date:</span>
            <span className="text-gray-600">{purchaseDate}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Due Date:</span>
            <span className="text-gray-600">{dueDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Supplier Name:</span>
            <span className="text-gray-600">{supplierName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Supplier Address:</span>
            <span className="text-gray-600">{supplierAddress}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="py-3 px-4 text-left">Item</th>
              {showGst && <th className="py-3 px-4 text-left">HSN</th>}
              {showGst && <th className="py-3 px-4 text-right">GST%</th>}
              <th className="py-3 px-4 text-right">Batch</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Dis%</th>
              <th className="py-3 px-4 text-right">Net Amt</th>
              <th className="py-3 px-4 text-right">SGST</th>
              <th className="py-3 px-4 text-right">CGST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => {
              const amount = calculateAmount(
                item.purchaseprice, 
                item.quantity, 
                item.purchaseDiscount
              );
              const gstDetails = calculateGSTDetails(
                item.purchaseprice, 
                item.quantity, 
                item.gstPercentage,
                item.purchaseDiscount
              );
              return (
                <tr key={index} className="text-gray-600">
                  <td className="py-3 px-4">{item.productName}</td>
                  {showGst && <td className="py-3 px-4">{item.hsnCode}</td>}
                  {showGst && <td className="py-3 px-4 text-right">{item.gstPercentage}%</td>}
                  <td className="py-3 px-4 text-right">{item.Batch}</td>
                  <td className="py-3 px-4 text-right">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">₹{Number(item.purchaseprice).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">{item.purchaseDiscount}%</td>
                  <td className="py-3 px-4 text-right">₹{amount.finalAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">₹{gstDetails.sgst.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">₹{gstDetails.cgst.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-8">
        <div className="col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">GST Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total SGST</span>
                <span>₹{totalSgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total CGST</span>
                <span>₹{totalCgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total GST</span>
                <span>₹{totalGst.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Bill Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Previous Due</span>
                <span>₹{Number(previousDue).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rounded Off</span>
                <span>-₹{roundingDiff}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Final Amount</span>
                <span>₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-gray-700">
        <p className="italic">Rupees {numberToWords(Math.round(finalAmount))} Only</p>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-center">
        <button 
          onClick={saveBill}
          disabled={isSaving}
          className={`px-8 py-3 rounded-lg text-white font-semibold transition-colors ${
            isSaving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Bill'}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center border-t border-gray-200 pt-6">
        <p className="font-semibold text-red-600 mb-2">Please pay before {dueDate}</p>
        <p className="text-gray-600">Thank you for your business!</p>
      </div>
    </div>
  );
};

export default CreditBill;