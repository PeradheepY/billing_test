"use client"
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  Users,
  ShoppingCart,
  Settings,
  BarChart,
  ChevronDown,
  ChevronRight,
  Building2,
  FileText,
  Receipt,
  Package,
  TrendingUp,
  CreditCard,
  History,
  ClipboardList,
  Truck,
  User,
  Shield,
  Briefcase,
  Sparkles
} from "lucide-react";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [userExpanded, setUserExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [companyExpanded, setCompanyExpanded] = useState(false);
  const pathname = usePathname();

  const isActive = (href) => pathname === href;

  const userMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: '/user/admin/totalamount', accessKey: "3" },
    { icon: CreditCard, label: "Cash/Credit Bill", href: "/user/creditcash", accessKey: "4" },
    { icon: Users, label: "Customer Report", href: "/user/customers", accessKey: "5" },
    { icon: TrendingUp, label: "Daily Sales Report", href: "/user/dailysales", accessKey: "6" },
    { icon: BarChart, label: "Sales Inventory", href: "/user/sales"},
    { icon: History, label: "Credit History Report", href: "/user/credithistory", accessKey: "7" },
  ]
  
  const adminMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/user/admin/consolidateddashboard", accessKey: "8" },
    { icon: Package, label: "Product List", href: "/user/admin/getdata", accessKey: "9" },
    { icon: PackageSearch, label: "Product Inventory", href: "/user/inventory" },
    { icon: ShoppingCart, label: "Add Product", href: "/user/admin/postdata", accessKey: "j" },
    { icon: ClipboardList, label: "Bulk Product", href: "/user/admin/bulkpostdata", accessKey: "k" },
    { icon: Users, label: "Credit Customer Settlement", href: "/user/admin/CreditCustomerReport", accessKey: "l" },
    { icon: Receipt, label: "Cash Customer Report", href: "/user/admin/dashboard", accessKey: "m" },
    { icon: TrendingUp, label: "Total Sales Report", href: "/user/dashboardcardcustomer", accessKey: "n" },
  ];
  
  const companyMenuItems = [
    { icon: FileText, label: "Supplier Credit Bills", href: "/company/creditpage", accessKey: "o" },
    { icon: Receipt, label: "Supplier Credit Settlement", href: "/company/companycreditreport", accessKey: "p" },
    { icon: History, label: "Supplier Credit History", href: "/company/companycredithistory", accessKey: "q" },
    { icon: Building2, label: "Supplier List", href: "/company/companydash", accessKey: "r" },
    { icon: Truck, label: "Supplier Invoices", href: "/company/supplierinvoice", accessKey: "s" },
  ];

  // Section icons for collapsed view
  const sectionIcons = {
    user: User,
    admin: Shield,
    company: Briefcase
  };

  // Collapsed Menu Item Component
  const CollapsedMenuItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <Link
        href={item.href}
        className={`flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200 group relative
          ${active 
            ? "bg-gradient-to-r from-[#EE8C7F] to-[#D67568] text-white shadow-md" 
            : "hover:bg-[#FDF5F4] text-gray-600 hover:text-[#EE8C7F]"
          }`}
        title={item.label}
      >
        <Icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-400 group-hover:text-[#EE8C7F]"}`} />
        
        {/* Tooltip */}
        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100]">
          {item.label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </Link>
    );
  };

  // Collapsed Section Component
  const CollapsedSection = ({ items, sectionType, title }) => {
    const SectionIcon = sectionIcons[sectionType];
    
    return (
      <div className="mb-4">
        {/* Section Icon Header */}
        <div 
          className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] group relative cursor-pointer"
          title={title}
        >
          <SectionIcon className="w-5 h-5 text-[#EE8C7F]" />
          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100]">
            {title}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="space-y-1">
          {items.map((item, index) => (
            <CollapsedMenuItem key={index} item={item} />
          ))}
        </div>
        
        {/* Divider */}
        <div className="w-8 h-px mx-auto mt-3 bg-[#EE8C7F]/20"></div>
      </div>
    );
  };

  const MenuSection = ({ title, items, expanded, setExpanded, colorClass, sectionType }) => {
    const SectionIcon = sectionIcons[sectionType];
    
    return (
      <div className="mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center w-full px-4 py-3 rounded-xl ${colorClass} transition-all duration-200 shadow-sm hover:shadow-md group relative`}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="ml-2 font-semibold text-sm">{title}</span>
        </button>
        
        {expanded && (
          <div className="mt-2 space-y-1 pl-2">
            {items.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  href={item.href}
                  key={index}
                  className={`flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${active 
                      ? "bg-gradient-to-r from-[#EE8C7F] to-[#D67568] text-white shadow-md" 
                      : "hover:bg-[#FDF5F4] hover:translate-x-1 text-gray-600 hover:text-[#EE8C7F]"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-400 group-hover:text-[#EE8C7F]"}`} />
                  <span className="ml-3 text-sm font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-gradient-to-b from-white via-white to-[#FDF5F4]/30 border-r border-[#EE8C7F]/10 h-screen transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } fixed left-0 top-0 shadow-xl z-50 flex flex-col`}
    >
      {/* Logo Section */}
      <div className={`${collapsed ? 'p-3' : 'p-5'} border-b border-[#EE8C7F]/10 bg-white/80 backdrop-blur-sm flex-shrink-0`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <div 
            className={`${collapsed ? 'w-10 h-10' : 'w-11 h-11'} bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl flex items-center justify-center shadow-lg transition-all duration-300`}
          >
            <Sparkles className={`${collapsed ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
          </div>
          {!collapsed && (
            <span 
              className="ml-3 font-bold text-xl"
              style={{ 
                background: "linear-gradient(135deg, #EE8C7F 0%, #C45D50 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              BillGenius
            </span>
          )}
        </div>
      </div>

      {/* Navigation Sections - Scrollable */}
      <nav className={`${collapsed ? 'p-2 pt-4' : 'p-4'} mt-2 flex-1 overflow-y-auto`}>
        {collapsed ? (
          /* Collapsed View - Show only icons */
          <>
            <CollapsedSection 
              items={userMenuItems} 
              sectionType="user" 
              title="User Section"
            />
            <CollapsedSection 
              items={adminMenuItems} 
              sectionType="admin" 
              title="Admin Section"
            />
            <CollapsedSection 
              items={companyMenuItems} 
              sectionType="company" 
              title="Company Bills"
            />
          </>
        ) : (
          /* Expanded View - Show full menu */
          <>
            <MenuSection
              title="User Section"
              items={userMenuItems}
              expanded={userExpanded}
              setExpanded={setUserExpanded}
              colorClass="bg-gradient-to-r from-[#FDF5F4] to-[#FAE5E2] text-[#EE8C7F] hover:from-[#FAE5E2] hover:to-[#F5CEC7]"
              sectionType="user"
            />
            <MenuSection
              title="Admin Section"
              items={adminMenuItems}
              expanded={adminExpanded}
              setExpanded={setAdminExpanded}
              colorClass="bg-gradient-to-r from-[#FDF5F4]/80 to-[#FAE5E2]/80 text-[#D67568] hover:from-[#FDF5F4] hover:to-[#FAE5E2]"
              sectionType="admin"
            />
            <MenuSection
              title="Company Bills"
              items={companyMenuItems}
              expanded={companyExpanded}
              setExpanded={setCompanyExpanded}
              colorClass="bg-gradient-to-r from-[#FAE5E2] to-[#FDF5F4] text-[#C45D50] hover:from-[#F5CEC7] hover:to-[#FAE5E2]"
              sectionType="company"
            />
          </>
        )}
      </nav>

      {/* User Profile Section - Fixed at Bottom */}
      <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-[#EE8C7F]/10 bg-white backdrop-blur-sm flex-shrink-0`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <div 
            className={`${collapsed ? 'w-10 h-10' : 'w-11 h-11'} bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-full flex items-center justify-center shadow-lg transition-all duration-300`}
          >
            <span className={`text-white font-bold ${collapsed ? 'text-xs' : 'text-sm'}`}>BM</span>
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-semibold text-[#1E1E1E]">Your Business Name</p>
              <p className="text-xs text-[#EE8C7F] font-medium">Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;