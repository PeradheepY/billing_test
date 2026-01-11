"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EditPage() {
  const router = useRouter();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    hsnCode: "",
    gstPercentage: "",
    purchaseDiscount: "",
    purchaseprice: "",
    expireDate: "",
    price: "",
    quantity: "",
    tax: "",
    unit: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/getdata/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch item details");
        }
        const data = await res.json();
        setFormData(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...formData,
        gstPercentage: Number(formData.gstPercentage),
        purchaseprice: Number(formData.purchaseprice),
        purchaseDiscount: Number(formData.purchaseDiscount) || 0,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        tax: Number(formData.tax),
        expireDate: formData.expireDate ? new Date(formData.expireDate) : null,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/editdata/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        throw new Error("Failed to update item");
      }

      toast.success("Item updated successfully! ");
      router.push('/user/admin/getdata');
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Error updating item: " + err.message);
    }
  };

  if (loading) {
    return <div className="text-center mt-10 text-xl">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-xl text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Edit Item</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">Product Name</label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">HSN Code</label>
          <input
            type="text"
            name="hsnCode"
            value={formData.hsnCode}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">GST Percentage (%)</label>
          <input
            type="number"
            name="gstPercentage"
            value={formData.gstPercentage}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Purchase Price</label>
          <input
            type="number"
            name="purchaseprice"
            value={formData.purchaseprice}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Selling Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Purchase Discount (%)</label>
          <input
            type="number"
            name="purchaseDiscount"
            value={formData.purchaseDiscount}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Carriage Charge</label>
          <input
            type="number"
            name="tax"
            value={formData.tax}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Expire Date</label>
          <input
            type="date"
            name="expireDate"
            value={formData.expireDate ? new Date(formData.expireDate).toISOString().split('T')[0] : ''}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Unit</label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="pcs">pcs</option>
            <option value="kg">kg</option>
            <option value="litre">litre</option>
            <option value="gms">gms</option>
            <option value="Nos">Nos</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex gap-4 mt-6">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
