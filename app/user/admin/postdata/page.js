'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Package, DollarSign, FileText, Calendar, Hash, Percent } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function OrderForm() {
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    category: '',
    purchaseprice: '',
    purchaseDiscount: '',
    price: '',
    MRP: '',
    quantity: '5',
    unit: 'pcs',
    hsnCode: '',
    gstPercentage: '',
    tax: '',
    expireDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/postdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          purchaseprice: Number(formData.purchaseprice),
          purchaseDiscount: Number(formData.purchaseDiscount),
          price: Number(formData.price),
          MRP: Number(formData.MRP),
          gstPercentage: Number(formData.gstPercentage),
          tax: Number(formData.tax),
        }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(`Success: ${result.message}`);
        // Optional: Reset form
        // setFormData({ ... });
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      toast.error('Error submitting form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-8 max-w-5xl mx-auto space-y-8">
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          style: {
            background: 'green',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: 'red',
          },
        },
      }} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E1E1E]">Add New Product</h1>
          <p className="text-gray-500 mt-2">Create a new product card for your inventory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Product Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#1E1E1E]">
                <Package className="h-5 w-5 text-[#EE8C7F]" />
                Product Information
              </CardTitle>
              <CardDescription>Enter the core details of the product.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="productName" className="text-sm font-medium text-gray-700">Product Name</label>
                <Input
                  type="text"
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Premium Rice"
                  className="bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="productId" className="text-sm font-medium text-gray-700">Product ID</label>
                <Input
                  type="text"
                  id="productId"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  required
                  placeholder="e.g. PRD-001"
                  className="bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-gray-700">Category</label>
                <Input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Grains"
                  className="bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="hsnCode" className="text-sm font-medium text-gray-700">HSN Code</label>
                <Input
                  type="text"
                  id="hsnCode"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 1006"
                  className="bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#1E1E1E]">
                <DollarSign className="h-5 w-5 text-[#EE8C7F]" />
                Pricing & Tax
              </CardTitle>
              <CardDescription>Configure the pricing structure.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="purchaseprice" className="text-sm font-medium text-gray-700">Purchase Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <Input
                    type="number"
                    id="purchaseprice"
                    name="purchaseprice"
                    value={formData.purchaseprice}
                    onChange={handleChange}
                    step="0.01"
                    required
                    className="pl-8 bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="purchaseDiscount" className="text-sm font-medium text-gray-700">Purchase Discount (%)</label>
                <div className="relative">
                  <Input
                    type="number"
                    id="purchaseDiscount"
                    name="purchaseDiscount"
                    value={formData.purchaseDiscount}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="pr-8 bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                  />
                  <Percent className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="gstPercentage" className="text-sm font-medium text-gray-700">GST %</label>
                <div className="relative">
                  <Input
                    type="number"
                    id="gstPercentage"
                    name="gstPercentage"
                    value={formData.gstPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    className="pr-8 bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                  />
                  <Percent className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="MRP" className="text-sm font-medium text-gray-700">MRP</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <Input
                    type="number"
                    id="MRP"
                    name="MRP"
                    value={formData.MRP}
                    onChange={handleChange}
                    required
                    className="pl-8 bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-gray-700">Selling Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <Input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    required
                    className="pl-8 bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="tax" className="text-sm font-medium text-gray-700">Carriage Charge</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <Input
                    type="number"
                    id="tax"
                    name="tax"
                    value={formData.tax}
                    onChange={handleChange}
                    required
                    className="pl-8 bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Inventory & Image */}
        <div className="space-y-8">
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#1E1E1E]">
                <FileText className="h-5 w-5 text-[#EE8C7F]" />
                Inventory Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium text-gray-700">Initial Quantity</label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  className="bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="unit" className="text-sm font-medium text-gray-700">Unit</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-[#EE8C7F]/20 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#EE8C7F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="litre">litre</option>
                  <option value="gms">gms</option>
                  <option value="Nos">Nos</option>
                  <option value="ml">ml</option>
                  <option value="bags">bags</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="expireDate" className="text-sm font-medium text-gray-700">Expiry Date</label>
                <Input
                  type="date"
                  id="expireDate"
                  name="expireDate"
                  value={formData.expireDate}
                  onChange={handleChange}
                  className="bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#1E1E1E]">
                <Upload className="h-5 w-5 text-[#EE8C7F]" />
                Product Image
              </CardTitle>
              <CardDescription>Upload a product image (Placeholder).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-[#EE8C7F]/30 rounded-xl p-8 text-center hover:bg-[#FDF5F4] transition-colors cursor-pointer">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#EE8C7F] to-[#D67568] flex items-center justify-center shadow-md">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-[#1E1E1E]">Click to upload image</p>
                  <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF</p>
                  <p className="text-xs text-[#EE8C7F] mt-2">(Feature coming soon)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C45D50] text-white h-12 text-lg font-medium shadow-lg transition-all hover:shadow-xl rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? 'Adding Product...' : 'Add Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
