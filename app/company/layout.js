"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/user/customerbillingdashboard/page";
import { ChevronLeft, Bell, LogOut, Wallet, Calculator } from "lucide-react";
import Link from "next/link";
import { Button } from '@/components/ui/button';

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const openCalculator = () => {
    const width = 500;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      '/cashdeno',
      'Balance Calculator',
      `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,menubar=no,location=no,status=no`
    );
  };

  const logout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        console.log("Logout successful. Redirecting to login...");
        router.push("/userlogin");
      } else {
        console.error("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during logout: ", error);
    }
  };

  return (
    <div className="min-h-screen print:bg-white" style={{ background: "linear-gradient(135deg, #FDF5F4 0%, #FAE5E2 50%, #FDF5F4 100%)" }}>
      {/* Sidebar */}
      <Sidebar className="print:hidden no-print" collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Top Bar */}
      <div
        className={`fixed top-0 right-0 h-16 z-50 transition-all duration-300 print:hidden ${
          collapsed ? "left-16" : "left-64"
        }`}
        style={{
          background: "linear-gradient(135deg, #FDF5F4 0%, #FAE5E2 100%)",
          borderBottom: "1px solid rgba(238, 140, 127, 0.2)",
          boxShadow: "0 2px 10px rgba(238, 140, 127, 0.1)"
        }}
      >
        <div className="h-full px-6 flex items-center justify-end">
          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            <Link href="/user/payinout">
              <Button 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 border-0"
                style={{ 
                  background: "linear-gradient(135deg, #EE8C7F 0%, #D67568 100%)",
                  boxShadow: "0 4px 12px rgba(238, 140, 127, 0.3)"
                }}
              >
                <Wallet className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Pay In/Out</span>
              </Button>
            </Link>
                
            <Button
              onClick={openCalculator}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 border-0"
              style={{ 
                background: "rgba(255, 255, 255, 0.7)",
                border: "1px solid rgba(238, 140, 127, 0.3)",
                color: "#D67568"
              }}
            >
              <Calculator className="w-4 h-4" style={{ color: "#D67568" }} />
              <span className="text-sm font-medium" style={{ color: "#D67568" }}>Calculator</span>
            </Button>
   
            <button 
              className="relative p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ 
                background: "rgba(255, 255, 255, 0.7)",
                border: "1px solid rgba(238, 140, 127, 0.2)"
              }}
            >
              <Bell className="w-5 h-5" style={{ color: "#D67568" }} />
              <span 
                className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full text-white"
                style={{ background: "#EE8C7F" }}
              >
                3
              </span>
            </button>

            <div className="h-8 w-px" style={{ background: "rgba(238, 140, 127, 0.3)" }}></div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ 
                background: "linear-gradient(135deg, #C45D50 0%, #D67568 100%)",
                boxShadow: "0 4px 12px rgba(196, 93, 80, 0.3)"
              }}
            >
              <LogOut className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`fixed top-4 z-50 p-1.5 rounded-full shadow-lg transition-all duration-300 print:hidden hover:scale-110 ${
          collapsed ? "left-12" : "left-60"
        }`}
        style={{
          background: "linear-gradient(135deg, #EE8C7F 0%, #D67568 100%)",
          border: "2px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 4px 12px rgba(238, 140, 127, 0.4)"
        }}
      >
        <ChevronLeft
          className={`w-5 h-5 text-white transition-transform ${
            collapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 print:!ml-0 ${
          collapsed ? "ml-16" : "ml-64"
        } pt-16 print:pt-0`}
      >
        <div className="p-6 printable print:p-0">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
