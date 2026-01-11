"use client";

import { Bell, LogOut, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const TopBar = ({ collapsed, setCollapsed }) => {
  const router = useRouter();

  const logout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        router.push("/login"); // Redirect to login after logout
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div
      className={`fixed top-0 no-print right-0 h-16 z-50 transition-all duration-300 ${
        collapsed ? "left-16" : "left-64"
      }`}
      style={{
        background: "linear-gradient(135deg, #FDF5F4 0%, #FAE5E2 100%)",
        borderBottom: "1px solid rgba(238, 140, 127, 0.2)",
        boxShadow: "0 2px 10px rgba(238, 140, 127, 0.1)"
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Brand */}
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ 
              background: "linear-gradient(135deg, #EE8C7F 0%, #D67568 100%)",
              boxShadow: "0 4px 12px rgba(238, 140, 127, 0.4)"
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 
            className="text-xl font-bold"
            style={{ 
              background: "linear-gradient(135deg, #EE8C7F 0%, #C45D50 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            BillGenius
          </h1>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div 
            className="relative flex items-center"
            style={{
              background: "rgba(255, 255, 255, 0.7)",
              borderRadius: "12px",
              border: "1px solid rgba(238, 140, 127, 0.2)"
            }}
          >
            <Search className="w-4 h-4 ml-4" style={{ color: "#D67568" }} />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full px-3 py-2.5 bg-transparent text-sm focus:outline-none"
              style={{ color: "#1E1E1E" }}
            />
          </div>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
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
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ 
              background: "linear-gradient(135deg, #EE8C7F 0%, #D67568 100%)",
              boxShadow: "0 4px 12px rgba(238, 140, 127, 0.3)"
            }}
          >
            <LogOut className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
