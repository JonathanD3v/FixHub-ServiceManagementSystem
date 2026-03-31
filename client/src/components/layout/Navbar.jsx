import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) return null;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-md border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent tracking-wide"
          >
            FixHub
          </Link>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? (
                <>
                  <SunIcon className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-800 dark:text-gray-200">Light</span>
                </>
              ) : (
                <>
                  <MoonIcon className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-800 dark:text-gray-200">Dark</span>
                </>
              )}
            </button>

            {user ? (
              <>
                {/* Profile */}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {user?.profileImage ? (
                      <img
                        src={`${
                          import.meta.env.VITE_SERVER_URL || "http://localhost:5555"
                        }${user.profileImage}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user?.name?.charAt(0) || "U"}</span>
                    )}
                  </div>
                  <span className="text-gray-700 dark:text-gray-200 text-sm font-medium hidden sm:block">
                    {user?.name || "User"}
                  </span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white hover:opacity-90 transition shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login */}
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Login
                </Link>

                {/* Register */}
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 transition shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;