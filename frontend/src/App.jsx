import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import ProtectedRoute from "./routes/ProtectedRoute";

/* =========================================
   AUTHENTICATION PAGES
========================================= */

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

/* =========================================
   LAYOUTS
========================================= */

import AdminLayout from "./layouts/AdminLayout";
import CustomerLayout from "./layouts/CustomerLayout";

/* =========================================
   ADMIN PAGES
========================================= */

import DashboardPage from "./pages/admin/DashboardPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import MoviesPage from "./pages/admin/MoviesPage";
import EventsPage from "./pages/admin/EventsPage";
import BookingsPage from "./pages/admin/BookingsPage";
import CustomersPage from "./pages/admin/CustomersPage";

/* =========================================
   CUSTOMER PAGES
========================================= */

import CustomerHomePage from "./pages/customer/HomePage";
import EntertainmentDetailsPage from "./pages/customer/EntertainmentDetailsPage";
import MyBookingsPage from "./pages/customer/MyBookingsPage";
import CustomerProfilePage from "./pages/customer/ProfilePage";

/* =========================================
   DEFAULT REDIRECTION
========================================= */

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="screen-loader">
        <div className="spinner" />

        <p>Loading EntertainHub...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login?mode=customer"
        replace
      />
    );
  }

  return (
    <Navigate
      to={
        user.role === "admin"
          ? "/admin/dashboard"
          : "/customer/home"
      }
      replace
    />
  );
}

/* =========================================
   APPLICATION ROUTES
========================================= */

function AppRoutes() {
  return (
    <Routes>

      {/* Default Route */}

      <Route
        path="/"
        element={<HomeRedirect />}
      />

      {/* ================================
          PUBLIC AUTHENTICATION ROUTES
      ================================= */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      {/* ================================
          ADMIN PROTECTED ROUTES
      ================================= */}

      <Route
        element={<ProtectedRoute role="admin" />}
      >
        <Route
          path="/admin"
          element={<AdminLayout />}
        >

          {/* Default Admin Page */}

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          {/* Admin Dashboard */}

          <Route
            path="dashboard"
            element={<DashboardPage />}
          />

          {/* Categories Management */}

          <Route
            path="categories"
            element={<CategoriesPage />}
          />

          {/* Movies Management */}

          <Route
            path="movies"
            element={<MoviesPage />}
          />

          {/* Events Management */}

          <Route
            path="events"
            element={<EventsPage />}
          />

          {/* Bookings Management */}

          <Route
            path="bookings"
            element={<BookingsPage />}
          />

          {/* Customers Management */}

          <Route
            path="customers"
            element={<CustomersPage />}
          />

          {/* Admin Fallback */}

          <Route
            path="*"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

        </Route>
      </Route>

      {/* ================================
          CUSTOMER PROTECTED ROUTES
      ================================= */}

      <Route
        element={<ProtectedRoute role="customer" />}
      >
        <Route
          path="/customer"
          element={<CustomerLayout />}
        >

          {/* Default Customer Page */}

          <Route
            index
            element={
              <Navigate
                to="home"
                replace
              />
            }
          />

          {/* Customer Home */}

          <Route
            path="home"
            element={<CustomerHomePage />}
          />

          {/* Movie Details */}

          <Route
            path="movies/:id"
            element={
              <EntertainmentDetailsPage
                key="movie"
                type="movie"
              />
            }
          />

          {/* Event Details */}

          <Route
            path="events/:id"
            element={
              <EntertainmentDetailsPage
                key="event"
                type="event"
              />
            }
          />

          {/* Customer Booking History */}

          <Route
            path="bookings"
            element={<MyBookingsPage />}
          />

          {/* Customer Profile */}

          <Route
            path="profile"
            element={<CustomerProfilePage />}
          />

          {/* Customer Fallback */}

          <Route
            path="*"
            element={
              <Navigate
                to="/customer/home"
                replace
              />
            }
          />

        </Route>
      </Route>

      {/* ================================
          GLOBAL FALLBACK ROUTE
      ================================= */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

/* =========================================
   MAIN APPLICATION
========================================= */

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <AppRoutes />

        {/* Premium Toast Notifications */}

        <Toaster
          position="top-right"
          gutter={10}
          reverseOrder={false}

          toastOptions={{
            duration: 3500,

            style: {
              background: "#191522",
              color: "#f5f3ff",
              border: "1px solid #8b5cf640",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: 500,
              boxShadow:
                "0 8px 30px #00000040, 0 0 20px #8b5cf610",
              maxWidth: "380px",
            },

            success: {
              duration: 3000,

              iconTheme: {
                primary: "#34d399",
                secondary: "#15131f",
              },
            },

            error: {
              duration: 4000,

              iconTheme: {
                primary: "#fb7185",
                secondary: "#15131f",
              },
            },

            loading: {
              iconTheme: {
                primary: "#a78bfa",
                secondary: "#15131f",
              },
            },
          }}
        />

      </AuthProvider>
    </BrowserRouter>
  );
}