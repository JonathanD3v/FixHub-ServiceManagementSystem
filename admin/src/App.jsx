import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./admin/context/AuthContext.jsx";

// Admin Pages
import AdminLayout from "./admin/components/layout/AdminLayout.jsx";
import Login from "./admin/pages/Auth/Login.jsx";
import Dashboard from "./admin/pages/Dashboard.jsx";
import StaffDashboard from "./admin/pages/StaffDashboard.jsx";
import TechnicianDashboard from "./admin/pages/TechnicianDashboard.jsx";
import Products from "./admin/pages/Products.jsx";
import Services from "./admin/pages/Services.jsx";
import Orders from "./admin/pages/Orders.jsx";
import CustomerPage from "./admin/pages/Customer.jsx";
import ServiceRequests from "./admin/pages/ServiceRequests.jsx";
import Suppliers from "./admin/pages/Suppliers.jsx";
import Reports from "./admin/pages/Reports.jsx";

const ADMIN_ACCESS_ROLES = ["admin", "staff", "technician"];

// Role-based Dashboard Router
const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (user?.role === "staff") {
    return <StaffDashboard />;
  } else if (user?.role === "technician") {
    return <TechnicianDashboard />;
  } else {
    return <Dashboard />;
  }
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !ADMIN_ACCESS_ROLES.includes(user.role)) {
    logout();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const PublicLoginRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user && ADMIN_ACCESS_ROLES.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user && !ADMIN_ACCESS_ROLES.includes(user.role)) {
    logout();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/admin/login"
            element={
              <PublicLoginRoute>
                <Login />
              </PublicLoginRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<RoleBasedDashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="services" element={<Services />} />
            <Route path="service-requests" element={<ServiceRequests />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<CustomerPage />} />
          </Route>

          {/* Redirect root to admin dashboard */}
          <Route
            path="/"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
