import React, { createContext, useContext, useState, useEffect } from "react";
import { postMethod } from "../services/index.jsx";
import { showToast } from "../utils/Helper.jsx";
import { LOGIN_API } from "../services/constant.js";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    // console.log('AuthContext - Initial load:', { token, storedUser });

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // console.error('Error parsing stored user:', error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);

    // Listen for storage changes (when token is removed by API interceptor)
    const handleStorageChange = (e) => {
      if (e.key === "token" && !e.newValue) {
        setUser(null);
      }
    };

    // Listen for custom logout event from API interceptor
    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:logout", handleLogoutEvent);
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await postMethod(LOGIN_API, { email, password });
      const token = response.accessToken || response.token;
      const loggedInUser = response.user;

      if (!token || !loggedInUser) {
        throw new Error("Invalid login response. Please try again.");
      }

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      setUser(loggedInUser);
      showToast("Login successful!", "success");
      return loggedInUser;
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to login";
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);

      setError(errorMessage);
      showToast(errorMessage, "error");
      throw err;
    }
  };

  const logout = () => {
    // console.log('AuthContext - Logout');
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setError(null);
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
