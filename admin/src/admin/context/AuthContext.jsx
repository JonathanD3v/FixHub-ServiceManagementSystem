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
    console.log("AuthContext login called");
    try {
      setError(null);
      console.log("Making API call...");
      const response = await postMethod(LOGIN_API, { email, password });
      console.log("API response received:", response);

      // Store token and user data
      localStorage.setItem("token", response.accessToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      setUser(response.user);
      console.log("User set to:", response.user);
      showToast("Login successful!", "success");
      return response.user;
    } catch (err) {
      console.error("AuthContext login error:", err);
      localStorage.removeItem("user");
      setUser(null);

      setError(err.message);
      showToast(err.message, "error");
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
