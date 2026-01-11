'use client';

import { useEffect, useState } from 'react';
import BillingDashboard from '@/components/BillingDashboard/page';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/regularbillingreport`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Optional: Set up polling for real-time updates
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#EE8C7F]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-4 glass rounded-2xl shadow-lg border border-red-200">
        <CardContent className="p-6">
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] p-4">
      <h1 className="text-3xl font-bold mb-6 text-[#1E1E1E]">Billing Dashboard</h1>
      {data && <BillingDashboard billingData={data.raw} />}
    </div>
  );
}