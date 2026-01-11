"use client"
import { useState, useEffect } from 'react';
import { Loader2, Package, ChevronDown, ChevronUp, FileText, Calendar, ShoppingCart, IndianRupee, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SupplierInvoicesDashboard() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSupplier, setExpandedSupplier] = useState(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/supplierinvoice`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch supplier data');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Error fetching data');
        }
        
        // Use the already grouped suppliers data from the API
        setSuppliers(data.suppliers);
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
        setError(err.message || 'Failed to load supplier data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  const toggleSupplier = (supplierName) => {
    if (expandedSupplier === supplierName) {
      setExpandedSupplier(null);
    } else {
      setExpandedSupplier(supplierName);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-[#EE8C7F]" />
              <p className="text-gray-600">Loading supplier invoices...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="glass rounded-2xl shadow-lg border border-red-200 p-12">
            <div className="flex flex-col items-center justify-center gap-3 text-red-500">
              <p className="text-lg font-semibold">Error: {error}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Supplier Invoices Dashboard</h1>
              <p className="text-sm text-gray-500">Track and manage all supplier invoices</p>
            </div>
          </div>
        </Card>

        {suppliers.length === 0 ? (
          <Card className="glass rounded-2xl shadow-lg border border-[#EE8C7F]/20 p-16">
            <div className="text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-500">No supplier invoices found.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier, index) => (
              <Card
                key={index}
                className="glass shadow-lg hover:shadow-xl transition-all rounded-2xl overflow-hidden border border-[#EE8C7F]/20"
              >
                <div
                  className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] px-6 py-5 flex justify-between items-center cursor-pointer hover:from-[#FAE5E2] hover:to-[#F5CEC7] transition-colors"
                  onClick={() => toggleSupplier(supplier.name)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#1E1E1E]">{supplier.name}</h2>
                      <p className="text-sm text-gray-600">{supplier.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{supplier.invoiceCount}</span> Invoices
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <IndianRupee className="h-5 w-5 text-[#EE8C7F]" />
                        <p className="text-lg font-semibold text-[#EE8C7F]">
                          {supplier.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedSupplier === supplier.name ? (
                        <ChevronUp className="h-6 w-6 text-[#EE8C7F]" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-[#EE8C7F]" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedSupplier === supplier.name && (
                  <div className="px-6 pb-6 pt-4 bg-white transition-all duration-300 ease-in-out">
                    <div className="overflow-x-auto rounded-lg border border-[#EE8C7F]/20">
                      <table className="min-w-full divide-y divide-[#EE8C7F]/20 text-sm">
                        <thead className="bg-[#FDF5F4]">
                          <tr>
                            <th className="px-6 py-3 text-left font-semibold text-[#1E1E1E]">Invoice No</th>
                            <th className="px-6 py-3 text-left font-semibold text-[#1E1E1E]">Purchase Date</th>
                            <th className="px-6 py-3 text-right font-semibold text-[#1E1E1E]">Items</th>
                            <th className="px-6 py-3 text-right font-semibold text-[#1E1E1E]">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-[#EE8C7F]/10">
                          {supplier.invoices.map((invoice, idx) => (
                            <tr key={idx} className="hover:bg-[#FDF5F4]/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-[#1E1E1E] font-medium">
                                {invoice.invoiceNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-[#EE8C7F]" />
                                  {new Date(invoice.purchaseDate).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                                <div className="flex items-center justify-end gap-2">
                                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                                  {invoice.itemCount}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-[#EE8C7F]">
                                ₹{invoice.totalAmount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2]">
                            <td colSpan="3" className="px-6 py-4 text-right font-bold text-[#1E1E1E]">
                              Total:
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-[#EE8C7F] text-lg">
                              ₹{supplier.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

}