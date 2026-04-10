import React from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/profile/me", icon: "👤", label: "My Profile" },
  { to: "/skills", icon: "🎯", label: "My Skills" },
  { to: "/availability", icon: "📅", label: "Availability" },
  { to: "/discover", icon: "🔍", label: "Discover" },
  { to: "/exchanges", icon: "🤝", label: "Exchanges" },
  { to: "/wallet", icon: "⚡", label: "Wallet" },
  { to: "/notifications", icon: "🔔", label: "Notifications" },
];

const Sidebar = ({ collapsed = false }) => (
  <aside className={`hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30 border-r border-border bg-background-secondary transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-brand-dim text-brand border border-brand/20"
                : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
            }`
          }
        >
          <span className="text-base">{item.icon}</span>
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
