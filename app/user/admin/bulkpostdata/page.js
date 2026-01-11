'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BulkOrderForm() {
  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to show notifications
  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        
        if (lines.length > 1) {
          // Get headers and normalize them
          const headers = lines[0].split(',').map(header => 
            header.trim()
              .toLowerCase()
              .replace(/["'\r]/g, '')
              .replace(/\s+/g, '')
          );
          
          console.log('CSV Headers:', headers); // Debug: check processed headers
          
          // Get data from all remaining lines
          const importedProducts = lines.slice(1)
            .filter(line => line.trim() !== '')
            .map(line => {
              const values = line.split(',').map(value => 
                value.trim().replace(/["'\r]/g, '')
              );
              
              // Initialize product object with all fields from single product form
              const product = {
                productId: '',
                productName: '',
                category: '',
                purchaseprice: 0,
                purchaseDiscount: 0,
                price: 0,
                MRP: 0,
                quantity: 0,
                unit: 'pcs',
                hsnCode: '',
                gstPercentage: 0,
                tax: 0,
                expireDate: '',
              };

              // Map CSV headers to product fields (with more variations)
              headers.forEach((header, index) => {
                switch (header) {
                  case 'productid':
                  case 'id':
                  case 'skuid':
                    product.productId = values[index];
                    break;
                  case 'productname':
                  case 'product':
                  case 'name':
                    product.productName = values[index];
                    break;
                  case 'category':
                  case 'cat':
                    product.category = values[index];
                    break;
                  case 'purchaseprice':
                  case 'purchase':
                  case 'costprice':
                    product.purchaseprice = parseFloat(values[index]) || 0;
                    break;
                  case 'purchasediscount':
                  case 'discount':
                  case 'pdiscount':
                    product.purchaseDiscount = parseFloat(values[index]) || 0;
                    break;
                  case 'price':
                  case 'sellingprice':
                  case 'saleprice':
                    product.price = parseFloat(values[index]) || 0;
                    break;
                  case 'mrp':
                  case 'maximumretailprice':
                  case 'maximumprice':
                    product.MRP = parseFloat(values[index]) || 0;
                    break;
                  case 'quantity':
                  case 'qty':
                    product.quantity = parseFloat(values[index]) || 0;
                    break;
                  case 'unit':
                    product.unit = values[index] || 'pcs';
                    break;
                  case 'hsncode':
                  case 'hsn':
                    product.hsnCode = values[index];
                    break;
                  case 'gstpercentage':
                  case 'gst%':
                  case 'gst':
                  case 'gstpercent':
                    product.gstPercentage = parseFloat(values[index]) || 0;
                    break;
                  case 'carriagecharge':
                  case 'tax':
                  case 'carriage':
                    product.tax = parseFloat(values[index]) || 0;
                    break;
                  case 'expiredate':
                  case 'expiry':
                  case 'expire':
                    product.expireDate = values[index];
                    break;
                }
              });

              return product;
            });
          
          console.log('Imported products:', importedProducts); // Debug: check what was imported
          setProducts(importedProducts);
          showNotification(`Successfully imported ${importedProducts.length} products`, "success");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmitAll = async () => {
    setIsLoading(true);
    
    try {
      // Array to collect errors
      const errors = [];
      const successResponses = [];
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const productData = {
          ...product,
          quantity: parseFloat(product.quantity),
          purchaseprice: parseFloat(product.purchaseprice),
          purchaseDiscount: parseFloat(product.purchaseDiscount),
          price: parseFloat(product.price),
          MRP: parseFloat(product.MRP),
          gstPercentage: parseFloat(product.gstPercentage),
          tax: parseFloat(product.tax),
        };
        
        console.log('Submitting product:', productData); // Debug: check what's being sent
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bulkdata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            // Collect error messages with product info for better feedback
            errors.push(`Error with '${product.productName}': ${data.error || data.message || 'Unknown error'}`);
          } else {
            successResponses.push(data);
          }
        } catch (error) {
          errors.push(`Error with '${product.productName}': ${error.message || 'Unknown error'}`);
        }
      }
      
      const successful = successResponses.length;
      
      if (errors.length > 0) {
        // Display the first few errors (to avoid overwhelming the user)
        const displayErrors = errors.slice(0, 3).join('; ');
        const moreErrors = errors.length > 3 ? ` and ${errors.length - 3} more errors` : '';
        showNotification(`${displayErrors}${moreErrors}`, "error");
      }
      
      if (successful > 0) {
        showNotification(`Successfully submitted ${successful} out of ${products.length} products`, "success");
        
        if (successful === products.length) {
          setProducts([]);
          // Use a slight delay before reloading to ensure the notification is seen
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (error) {
      console.error('Error submitting products:', error);
      showNotification(`Error submitting products: ${error.message || 'Unknown error'}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] py-10">
      <div className="max-w-6xl mx-auto p-6 glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
        <h1 className="text-3xl font-bold text-[#1E1E1E] mb-6 text-center">Bulk Product Import</h1>
      
      {notification && (
        <Alert variant={notification.type === "success" ? "default" : "destructive"} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#1E1E1E] mb-2">
          Import Products from CSV
        </label>
        <div className="space-y-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FDF5F4] file:text-[#EE8C7F] hover:file:bg-[#FAE5E2] transition-colors"
          />
          <p className="text-sm text-gray-500">
            CSV Headers: productId, productName, category, purchaseprice, purchaseDiscount, price, MRP, quantity, unit, hsnCode, gstPercentage, tax (carriageCharge), expireDate
          </p>
        </div>
      </div>

      {products.length > 0 && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-xl border border-[#EE8C7F]/20">
            <table className="min-w-full divide-y divide-[#EE8C7F]/20">
              <thead className="bg-[#FDF5F4]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Product ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">HSN Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Purchase Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Selling Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">MRP</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">GST %</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Carriage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Expire Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1E1E1E] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#EE8C7F]/10">
                {products.map((product, index) => (
                  <tr key={index} className="hover:bg-[#FDF5F4]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{product.productId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.hsnCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{product.purchaseprice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.purchaseDiscount}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{product.MRP.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.gstPercentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{product.tax.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.expireDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitAll}
              disabled={isLoading}
              className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] text-white font-semibold py-2.5 px-6 rounded-xl hover:from-[#D67568] hover:to-[#C45D50] transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : `Submit All Products (${products.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}