"use client";
import React, { useEffect, useState } from "react";
import { CreditCard, Receipt, ArrowRight, Sprout, PiggyBank } from "lucide-react";

const BillingDashboard = () => {
  const [billingSummary, setBillingSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBillingSummary() {
      try {
        const [summaryRes, settlementRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing-summary`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settlement/summary`),
        ]);

        const [summaryData, settlementData] = await Promise.all([
          summaryRes.json(),
          settlementRes.json(),
        ]);

        // Check if the responses have the expected structure
        if (summaryData.success && settlementData.success) {
          setBillingSummary({
            // Access the nested data structure
            totalRegularAmount: summaryData.data.regular.totalAmount,
            totalRegularBills: summaryData.data.regular.totalBills,
            totalCreditAmount: summaryData.data.credit.totalAmount,
            totalCreditBills: summaryData.data.credit.totalBills,
            // Get settlement data from settlement response
            totalSettledAmount: settlementData.summary.totalSettled,
            totalPendingAmount: summaryData.data.summary.outstandingAmount,
            // Get full/partial settlement counts
            fullSettlements: settlementData.summary.fullCount,
            partialSettlements: settlementData.summary.partialCount,
          });
        } else {
          throw new Error("Failed to fetch data");
        }
      } catch (error) {
        setError("Error fetching billing summary. Please try again later.");
        console.error("Error fetching billing summary:", error);
      }
    }

    fetchBillingSummary();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!billingSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2] flex items-center justify-center">
        <div className="animate-pulse text-[#EE8C7F]">Loading...</div>
      </div>
    );
  }

  const {
    totalRegularAmount,
    totalRegularBills,
    totalCreditAmount,
    totalCreditBills,
    totalSettledAmount,
    totalPendingAmount,
    fullSettlements,
    partialSettlements,
  } = billingSummary || {};

  // Initialize safe values to prevent NaN errors
  const safeTotalRegularAmount = isNaN(totalRegularAmount) ? 0 : totalRegularAmount;
  const safeTotalCreditAmount = isNaN(totalCreditAmount) ? 0 : totalCreditAmount;
  const safeTotalSettledAmount = isNaN(totalSettledAmount) ? 0 : totalSettledAmount;
  const safeTotalPendingAmount = isNaN(totalPendingAmount) ? 0 : totalPendingAmount;
  const safeTotalFullySettled = isNaN(fullSettlements) ? 0 : fullSettlements;
  const safeTotalPartialSettled = isNaN(partialSettlements) ? 0 : partialSettlements;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#FDF5F4] via-white to-[#FAE5E2]"
    >
      {/* Header with Shop Icon */}
      <div className="max-w-6xl mx-auto text-center pt-12 pb-8">
        <div className="flex items-center justify-center mb-4">
          <Receipt className="h-12 w-12 text-[#EE8C7F] mr-4" />
          <h1 className="text-4xl font-bold text-[#1E1E1E]">BillMaster Pro</h1>
        </div>
        <p className="text-gray-600 text-lg">Smart Billing, Simplified Business</p>
      </div>

      {/* Billing Type Cards */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-4">
        {/* Regular Bill Card */}
        <a
          href="/user/generatebill"
          className="group relative overflow-hidden rounded-2xl glass border border-[#EE8C7F]/20 p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE8C7F] opacity-10 rounded-full transform translate-x-16 -translate-y-16" />
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <Receipt className="h-12 w-12 text-[#EE8C7F]" />
              <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-[#EE8C7F] transform group-hover:translate-x-1 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">Cash Bill</h2>
            <p className="text-gray-600 mb-6">Quick billing for walk-in customers.</p>
            <div className="space-y-2">
              <p className="text-gray-700">
                Total Amount:{" "}
                <span className="font-semibold text-[#EE8C7F]">₹{safeTotalRegularAmount}</span>
              </p>
              <p className="text-gray-700">
                Total Bills:{" "}
                <span className="font-semibold text-[#EE8C7F]">{totalRegularBills}</span>
              </p>
            </div>
          </div>
        </a>

        {/* Credit Bill Card */}
        <a
          href="/user/creditpage"
          className="group relative overflow-hidden rounded-2xl glass border border-[#EE8C7F]/20 p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D67568] opacity-10 rounded-full transform translate-x-16 -translate-y-16" />
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <CreditCard className="h-12 w-12 text-[#D67568]" />
              <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-[#D67568] transform group-hover:translate-x-1 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">Credit Bill</h2>
            <p className="text-gray-600 mb-6">Flexible billing for your regular customers.</p>
            <div className="space-y-2">
              <p className="text-gray-700">
                Total Amount:{" "}
                <span className="font-semibold text-[#D67568]">₹{safeTotalCreditAmount.toFixed(2)}</span>
              </p>
              <p className="text-gray-700">
                Total Bills:{" "}
                <span className="font-semibold text-[#D67568]">{totalCreditBills}</span>
              </p>
            </div>
          </div>
        </a>

        {/* Settlements Card */}
        <a
          href="/settlements"
          className="group relative overflow-hidden rounded-2xl glass border border-[#EE8C7F]/20 p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C45D50] opacity-10 rounded-full transform translate-x-16 -translate-y-16" />
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <PiggyBank className="h-12 w-12 text-[#C45D50]" />
              <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-[#C45D50] transform group-hover:translate-x-1 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">Settlements</h2>
            <p className="text-gray-600 mb-6">View your settlement status and payments.</p>
            <div className="space-y-2">
              <p className="text-gray-700">
                Total Settled Amount:{" "}
                <span className="font-semibold text-[#C45D50]">₹{safeTotalSettledAmount}</span>
              </p>
              <p className="text-gray-700">
                Total Pending Amount:{" "}
                <span className="font-semibold text-[#C45D50]">₹{safeTotalPendingAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* Settlement Stats */}
      <div className="max-w-6xl mx-auto mt-8 px-4 pb-12">
        <div className="glass rounded-2xl border border-[#EE8C7F]/20 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#1E1E1E] mb-2">Fully Settled</h3>
              <p className="text-2xl font-semibold text-[#EE8C7F]">{safeTotalFullySettled}</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#1E1E1E] mb-2">Partially Settled</h3>
              <p className="text-2xl font-semibold text-[#D67568]">{safeTotalPartialSettled}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
