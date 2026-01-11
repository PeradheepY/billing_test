"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProductTable() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [rowSelection, setRowSelection] = useState({}); // Changed from selectedItems to rowSelection for tanstack table

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/getdata`);
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        const json = await res.json();
        setData(json.data);
        setFilteredData(json.data);

        // Check for low stock products
        const lowStock = json.data.filter(product => product.quantity < 10);
        setLowStockProducts(lowStock);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleEdit = (_id) => {
    if (!_id) {
      console.error("_id is missing");
      return;
    }
    router.push(`${process.env.NEXT_PUBLIC_API_URL}/editdata/${_id}`);
  };

  const handleDelete = async (_id) => {
    if (!_id) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deletedata/${_id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete item");
      }

      const updatedData = data.filter((item) => item._id !== _id);
      setData(updatedData);
      setFilteredData(updatedData);
      setRowSelection({}); // Clear selection after delete

      alert("Item deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete the item");
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);

    if (selectedIds.length === 0) {
      alert("No items selected");
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} items ? `)) {
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deletedata/${id}`, {
            method: "DELETE",
          })
        )
      );

      const updatedData = data.filter((item) => !selectedIds.includes(item._id));
      setData(updatedData);
      setFilteredData(updatedData);
      setRowSelection({}); // Clear selection after bulk delete
      alert("Selected items deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete items");
    }
  };

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
    setFilteredData(filtered);
    setPageIndex(0); // Reset to first page on search
  };

  const exportToCSV = () => {
    const headers = [
      "Product ID",
      "Product Name",
      "Category",
      "HSN Code",
      "GST %",
      "Purchase Price",
      "Purchase Discount",
      "Discounted Purchase Price",
      "Selling Price",
      "MRP",
      "Quantity",
      "Expire Date",
      "Unit",
      "Tax",
      "Cost Amt"
    ];

    const csvData = filteredData.map(item => {
      const originalPrice = item.purchaseprice;
      const discount = item.purchaseDiscount || 0;
      const discountedPrice = originalPrice * (1 - discount / 100);
      const tax = item.tax;
      // Calculate costAmt without showing totalWithGst
      const costAmt = item.price + (item.price * item.gstPercentage / 100) + tax;
      const expireDate = item.expireDate
        ? new Date(item.expireDate).toLocaleDateString('en-GB')
        : 'N/A';

      return [
        item.productId || '',
        item.productName,
        item.category,
        item.hsnCode,
        `${item.gstPercentage}% `,
        originalPrice.toFixed(2),
        `${discount.toFixed(2)}% `,
        discountedPrice.toFixed(2),
        item.price,
        item.MRP,
        item.quantity,
        expireDate,
        item.unit,
        item.tax,
        costAmt.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "products.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "productName",
      header: "Product Name",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#FDF5F4] flex items-center justify-center border border-[#EE8C7F]/20">
              <Package className="h-5 w-5 text-[#EE8C7F]" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-[#1E1E1E]">{row.getValue("productName")}</span>
              <span className="text-xs text-gray-500">ID: {row.original.productId}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div className="text-gray-600">{row.getValue("category")}</div>,
    },
    {
      accessorKey: "purchaseprice",
      header: "Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("purchaseprice"));
        return <div className="font-medium">₹{price.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const quantity = parseFloat(row.getValue("quantity"));
        return (
          <div className="flex items-center">
            <span className={`font - medium ${quantity < 10 ? "text-red-600" : "text-gray-700"} `}>
              {quantity.toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const quantity = parseFloat(row.getValue("quantity"));
        return (
          <Badge variant={quantity < 10 ? "destructive" : "secondary"} className={quantity < 10 ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-[#FDF5F4] text-[#EE8C7F] hover:bg-[#FAE5E2]"}>
            {quantity < 10 ? "Low Stock" : "Active"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Selling Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        return <div className="text-gray-600">₹{price.toFixed(2)}</div>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(row.original._id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(row.original._id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection, // Update rowSelection state
    state: {
      pagination: {
        pageSize,
        pageIndex,
      },
      rowSelection, // Pass rowSelection state to table
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex,
          pageSize,
        });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      }
    },
    manualPagination: false,
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-8 max-w-[1600px] mx-auto space-y-8">
      {lowStockProducts.length > 0 && (
        <Alert variant="destructive" className="mb-6 border-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            {lowStockProducts.length} products are running low on stock.
          </AlertDescription>
        </Alert>
      )}

      <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-[#1E1E1E]">Product Lists</CardTitle>
              <CardDescription>Manage your products and inventory.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 border-[#EE8C7F]/30 hover:bg-[#FDF5F4]">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C45D50] text-white shadow-md gap-2" onClick={() => router.push('/user/admin/addproduct')}>
                <Plus className="h-4 w-4" />
                Add Products
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Type product name..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 bg-white border-[#EE8C7F]/20 focus-visible:ring-[#EE8C7F]"
              />
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(rowSelection).length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2 border-[#EE8C7F]/30 hover:bg-[#FDF5F4]">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[#EE8C7F]/20 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-[#FDF5F4] hover:bg-[#FDF5F4]">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold text-[#1E1E1E] bg-[#FDF5F4]">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-[#FDF5F4]/50 border-b border-[#EE8C7F]/10">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 mr-4">
                <p className="text-sm font-medium">Rows per page</p>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPageIndex(0);
                  }}
                  className="h-8 w-[70px] rounded-md border border-input bg-transparent px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(old => Math.max(old - 1, 0))}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(old => Math.min(old + 1, table.getPageCount() - 1))}
                disabled={!table.getCanNextPage()}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
