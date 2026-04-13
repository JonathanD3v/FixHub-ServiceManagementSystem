import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      roles: ["admin", "staff", "technician"],
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      roles: ["admin", "staff"],
    },
    {
      name: "Services",
      path: "/admin/services",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      roles: ["admin", "staff"],
    },
    {
      name: "Service Requests",
      path: "/admin/service-requests",
      icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9l-6-6H9z M13 3v6h6",
      roles: ["admin", "staff", "technician"],
    },
    {
      name: "Suppliers",
      path: "/admin/suppliers",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M12 12a4 4 0 100-8 4 4 0 000 8zm8 8v-2a4 4 0 00-3-3.87M4 20v-2a4 4 0 013-3.87",
      roles: ["admin", "staff"],
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: "M9 17v-6m4 6V7m4 10v-3M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z",
      roles: ["admin", "staff"],
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
      roles: ["admin", "staff"],
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      roles: ["admin", "staff"],
    },
    // { name: 'Settings', path: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];
  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  );

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-white text-xl font-bold">FixHub</h1>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <svg
                className={`mr-3 h-6 w-6 ${
                  location.pathname === item.path
                    ? "text-white"
                    : "text-gray-400 group-hover:text-gray-300"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={item.icon}
                />
              </svg>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
        <button onClick={logout} className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <svg
                className="inline-block h-6 w-6 text-gray-400 group-hover:text-gray-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white group-hover:text-gray-300">
                Logout
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
