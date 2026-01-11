// components/ProductSearch.js
"use client"
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

const ProductSearch = ({ initialValue, onSelect, index }) => {
  const [productName, setProductName] = useState(initialValue || '');
  const [productSuggestions, setProductSuggestions] = useState([]);

  // Fetch product suggestions when productName changes
  useEffect(() => {
    const fetchProductSuggestions = async () => {
      if (productName.trim().length > 0) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/getProduct?productName=${productName}`);
          const data = await response.json();
          
          if (data.success && data.data.length > 0) {
            setProductSuggestions(data.data);
          } else {
            setProductSuggestions([]);
          }
        } catch (error) {
          console.error("Error fetching product suggestions:", error);
          setProductSuggestions([]);
        }
      } else {
        setProductSuggestions([]);
      }
    };

    // Debounce the search to avoid too many requests
    const debounceTimer = setTimeout(() => {
      fetchProductSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [productName]);

  // Handle product selection from datalist
  const handleProductSelect = (e) => {
    const selectedProductName = e.target.value;
    setProductName(selectedProductName);
    
    const selectedProduct = productSuggestions.find(
      product => product.productName === selectedProductName
    );
    
    if (selectedProduct) {
      onSelect(selectedProduct);
    }
  };

  return (
    <div>
      <Input
        list={`productList-${index}`}
        value={productName}
        onChange={(e) => {
          setProductName(e.target.value);
          handleProductSelect(e);
        }}
        className="w-full bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
        placeholder="Search products..."
      />
      <datalist id={`productList-${index}`}>
        {productSuggestions.map((product, i) => (
          <option key={i} value={product.productName} />
        ))}
      </datalist>
    </div>
  );
};

export default ProductSearch;