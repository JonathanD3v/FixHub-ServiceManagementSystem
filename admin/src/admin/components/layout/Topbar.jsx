import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <div className="flex items-center">
            <span className="text-gray-700 mr-4">{user?.name || 'Admin'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar; 