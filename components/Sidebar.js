"use client";

import { Home, FileText, Settings, Receipt, X, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/billing", icon: FileText, label: "Billing" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Overlay for mobile */}
      {collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 z-50 w-72 no-print h-full bg-gradient-to-b from-[#1E1E1E] to-[#2D2D2D] text-white transition-all duration-300 shadow-2xl ${
          collapsed ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#EE8C7F] to-[#D67568] rounded-xl shadow-lg">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">BillMaster Pro</h2>
              <p className="text-xs text-gray-400">Smart Billing</p>
            </div>
          </div>
          <button
            onClick={() => setCollapsed(false)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-4">
            Main Menu
          </p>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? "bg-gradient-to-r from-[#EE8C7F] to-[#D67568] text-white shadow-lg shadow-[#EE8C7F]/20"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${active ? "text-white" : "text-gray-400 group-hover:text-[#EE8C7F]"}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {active && <ChevronRight className="h-4 w-4" />}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <div className="glass rounded-xl p-4 bg-white/5">
            <p className="text-sm font-medium text-white mb-1">Need Help?</p>
            <p className="text-xs text-gray-400 mb-3">Contact our support team</p>
            <a
              href="/support"
              className="block w-full text-center py-2 px-4 bg-gradient-to-r from-[#EE8C7F] to-[#D67568] rounded-lg text-white text-sm font-medium hover:from-[#D67568] hover:to-[#C45D50] transition-all shadow-md"
            >
              Get Support
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
