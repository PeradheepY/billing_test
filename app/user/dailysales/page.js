'use client';

import { useEffect, useState } from 'react';
import DailySalesReport from '@/components/DailySalesReport';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ReportsPage() {
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBillingData = async (fromDate, toDate) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pdfdaily/items?fromDate=${fromDate}&toDate=${toDate}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch data (status: ${response.status})`);
      }

      const data = await response.json();
      setBillingData(data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Failed to load sales data. Please try again.');
      toast.error('Failed to load sales data.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await fetchBillingData(thirtyDaysAgo.toISOString(), today.toISOString());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleBillUpdate = async (billId, isCreditBill, items) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdfdaily/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, isCreditBill, items, action: 'update' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update bill (status: ${response.status})`);
      }

      await refreshData();
      toast.success('Bill updated successfully.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error('Failed to update bill.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };

  const handleItemDelete = async (billId, isCreditBill, itemIndices) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdfdaily/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, isCreditBill, itemIndices }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete item (status: ${response.status})`);
      }

      await refreshData();
      toast.success('Item deleted successfully.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#EFEFEF] via-white to-[#FDF5F4] p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass p-6 rounded-2xl shadow-xl flex items-center gap-3 border border-[#EE8C7F]/20">
              <Loader2 className="h-6 w-6 animate-spin text-[#EE8C7F]" />
              <span className="text-[#1E1E1E] font-medium">Loading sales data...</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto relative">
          {error ? (
            <Card className="glass rounded-2xl shadow-lg border border-red-200 p-8">
              <div className="text-center">
                <p className="text-red-600 mb-4 text-lg">{error}</p>
                <Button onClick={refreshData} className="bg-gradient-to-r from-[#EE8C7F] to-[#D67568] hover:from-[#D67568] hover:to-[#C56558] text-white shadow-md">
                  Retry
                </Button>
              </div>
            </Card>
          ) : (
            <DailySalesReport 
              billingData={billingData}
              onBillUpdate={handleBillUpdate}
              onItemDelete={handleItemDelete}
            />
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
}