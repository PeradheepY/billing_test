"use client"
import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Save, X, Plus, Search, BarChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast, { Toaster } from "react-hot-toast";

// Product Search Component with Suggestions
const ProductSearch = ({ onProductSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch product suggestions
  const fetchSuggestions = async (term) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/search?productName=${encodeURIComponent(term)}`);
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.data);
      } else {
        console.error("Error fetching suggestions:", data.message);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(Boolean(value));
  };

  const handleSelectProduct = (product) => {
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    onProductSelect(product);
  };

  return (
    <div className="relative w-full">
      <div className="flex w-full">
        <Input
          type="text"
          placeholder="Search for a product..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(Boolean(searchTerm))}
          className="w-full pl-4 pr-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
        />
        <Button variant="ghost" size="icon" className="ml-2 text-gray-500">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-2 text-center text-gray-500">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((product) => (
                <li
                  key={product._id}
                  onClick={() => handleSelectProduct(product)}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium">{product.productName}</div>
                  <div className="text-sm text-gray-500">
                    In Stock: {product.quantity} {product.unit || "units"}
                  </div>
                </li>
              ))}
            </ul>
          ) : searchTerm.length >= 2 ? (
            <div className="p-2 text-center text-gray-500">No products found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Editable Product Row Component
const EditableProductRow = ({ product, onUpdate, onDelete, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    productName: product.productName,
    quantity: product.quantity,
    unit: product.unit || "",
    price: product.price || 0,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "quantity" || name === "price" ? Number(value) : value });
  };

  const handleUpdate = async () => {
    try {
      // API call to update product
      const response = await fetch(`/api/inventory/${encodeURIComponent(product.productName)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: formData.quantity,
          productName: formData.productName,
          unit: formData.unit,
          price: formData.price,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Product updated successfully");
        onUpdate({ ...product, ...formData });
        setIsEditing(false);
      } else {
        toast.error(data.message || "Failed to update product");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error updating product:", error);
    }
  };

  const handleDelete = async () => {
    try {
      // API call to delete product
      const response = await fetch(`/api/inventory/${encodeURIComponent(product.productName)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Product deleted successfully");
        onDelete(product._id);
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error deleting product:", error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      productName: product.productName,
      quantity: product.quantity,
      unit: product.unit || "",
      price: product.price || 0,
    });
    setIsEditing(false);
    onCancel();
  };

  return (
    <>
      <TableRow className={`hover:bg-gray-50/50 transition-colors ${isEditing ? "bg-blue-50/50" : ""}`}>
        <TableCell className="font-medium">
          {isEditing ? (
            <Input
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              className="h-8"
            />
          ) : (
            <div className="flex flex-col">
              <span className="text-gray-900">{product.productName}</span>
              <span className="text-xs text-gray-500">ID: {product.productId || product._id.slice(-6)}</span>
            </div>
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Input
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              className="h-8 w-24"
            />
          ) : (
            <Badge variant={product.quantity < 10 ? "destructive" : "secondary"} className={product.quantity < 10 ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-[#FDF5F4] text-[#EE8C7F] hover:bg-[#FAE5E2]"}>
              {product.quantity}
            </Badge>
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Input
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              placeholder="e.g., kg"
              className="h-8 w-20"
            />
          ) : (
            <span className="text-gray-600">{product.unit || "N/A"}</span>
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="h-8 w-28"
            />
          ) : (
            <span className="font-medium text-gray-900">₹{product.price?.toFixed(2) || "0.00"}</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleUpdate} className="h-8 w-8 p-0 bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C45D50] text-white shadow-md">
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDeleteDialog(true)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{product.productName}" from your inventory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Main Inventory Management Component
const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setFilteredProducts(data.data);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductUpdate = (updatedProduct) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product._id === updatedProduct._id ? updatedProduct : product
      )
    );
  };

  const handleProductDelete = (productId) => {
    setProducts(prevProducts =>
      prevProducts.filter(product => product._id !== productId)
    );
  };

  const handleAddProduct = (newProduct) => {
    setProducts(prevProducts => [...prevProducts, newProduct]);
    toast.success("Product added successfully");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProductSelect = (product) => {
    // Focus on the selected product
    setSearchTerm(product.productName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-8 max-w-[1600px] mx-auto space-y-8">
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

      <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#1E1E1E]">Inventory Management</CardTitle>
          <CardDescription>Track and manage your product stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inventory" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-[#FDF5F4] p-1 rounded-xl">
              <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#EE8C7F] rounded-lg">Inventory</TabsTrigger>
              <TabsTrigger value="sales" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#EE8C7F] rounded-lg">Sales</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#EE8C7F]/20 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-gradient-to-b from-[#EE8C7F] to-[#D67568] rounded-full"></div>
                  <h2 className="text-lg font-semibold text-[#1E1E1E]">Product Inventory</h2>
                </div>
                <div className="w-full sm:w-96">
                  <ProductSearch onProductSelect={handleProductSelect} />
                </div>
              </div>

              <div className="rounded-xl border border-[#EE8C7F]/20 bg-white overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EE8C7F] mr-3"></div>
                    Loading inventory...
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FDF5F4] hover:bg-[#FDF5F4]">
                        <TableHead className="font-semibold text-[#1E1E1E]">Product Name</TableHead>
                        <TableHead className="font-semibold text-[#1E1E1E]">Quantity</TableHead>
                        <TableHead className="font-semibold text-[#1E1E1E]">Unit</TableHead>
                        <TableHead className="font-semibold text-[#1E1E1E]">Price</TableHead>
                        <TableHead className="font-semibold text-[#1E1E1E] w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <EditableProductRow
                          key={product._id}
                          product={product}
                          onUpdate={handleProductUpdate}
                          onDelete={handleProductDelete}
                          onCancel={() => { }}
                        />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Search className="h-12 w-12 text-[#EE8C7F]/40 mb-4" />
                    <p className="text-lg font-medium text-[#1E1E1E]">No products found</p>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by adding products"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sales">
              <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-[#FDF5F4] rounded-xl border border-dashed border-[#EE8C7F]/30">
                <BarChart className="h-16 w-16 text-[#EE8C7F]/40 mb-4" />
                <h3 className="text-lg font-medium text-[#1E1E1E]">Sales Analytics</h3>
                <p className="text-sm text-gray-500 mt-1">Detailed sales tracking functionality coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;