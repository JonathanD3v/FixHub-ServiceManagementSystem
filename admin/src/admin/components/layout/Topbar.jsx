import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-20 flex-shrink-0 h-16 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
      <button
        type="button"
        className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <div className="flex-1 min-w-0 flex items-center justify-between ml-2 md:ml-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
            Dashboard
          </h1>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 capitalize">
            {user?.role || "admin"}
          </span>
        </div>

        <div className="ml-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-semibold shadow-sm">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-slate-800">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-slate-500 truncate max-w-[220px]">
              {user?.email || "admin@example.com"}
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Topbar;