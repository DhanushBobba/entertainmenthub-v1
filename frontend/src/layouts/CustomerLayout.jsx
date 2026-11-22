import { useState } from "react";

import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Film,
  Home,
  Clapperboard,
  CalendarDays,
  LogOut,
  Menu,
  X,
  Ticket,
} from "lucide-react";

import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

import "../styles/customer/CustomerLayout.css";

export default function CustomerLayout() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const currentView =
    location.pathname.startsWith("/customer/profile")
      ? "profile"
      : location.pathname.startsWith("/customer/bookings")
        ? "bookings"
        : location.pathname.startsWith("/customer/movies/")
          ? "movies"
          : location.pathname.startsWith("/customer/events/")
            ? "events"
            : new URLSearchParams(location.search).get("view") ||
              "home";

 const navigation = [
  {
    title: "Home",
    view: "home",
    path: "/customer/home",
    icon: Home,
  },
  {
    title: "Movies",
    view: "movies",
    path: "/customer/home?view=movies",
    icon: Clapperboard,
  },
  {
    title: "Events",
    view: "events",
    path: "/customer/home?view=events",
    icon: CalendarDays,
  },
  {
    title: "My Bookings",
    view: "bookings",
    path: "/customer/bookings",
    icon: Ticket,
  },
];
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();

      toast.success("Logged out successfully");

      navigate("/login?mode=customer", {
        replace: true,
      });
    } catch {
      toast.error("Unable to logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const customerName =
    user?.full_name || "Customer";

  return (
    <div className="customer-layout">

      {/* Navigation Header */}

      <header className="cu-header">

        <div className="cu-header-container">

          {/* Brand */}

          <Link
            to="/customer/home"
            className="cu-brand"
          >
            <div className="cu-brand-icon">
              <Film size={24} />
            </div>

            <span>
              Entertain<span>Hub</span>
            </span>
          </Link>

          {/* Navigation */}

          <nav
            className={`cu-navigation ${
              menuOpen ? "open" : ""
            }`}
          >
            {navigation.map(
              ({ title, view, path, icon: Icon }) => (
                <Link
                  key={title}
                  to={path}
                  className={`cu-nav-link ${
                    currentView === view
                      ? "active"
                      : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={17} />
                  <span>{title}</span>
                </Link>
              )
            )}
          </nav>

          {/* Customer Account */}

          <div className="cu-header-actions">

            <Link
              to="/customer/profile"
              className={`cu-profile ${
                location.pathname === "/customer/profile"
                  ? "active"
                  : ""
              }`}
              title="My Profile"
              aria-label="Open my profile"
              onClick={() => setMenuOpen(false)}
            >
              <div className="cu-avatar">
                {customerName.charAt(0).toUpperCase()}
              </div>

              <div className="cu-profile-info">
                <strong>{customerName}</strong>
                <small>My Profile</small>
              </div>
            </Link>

            <button
              className="cu-logout"
              title="Logout"
              aria-label="Logout"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </button>

            <button
              className="cu-menu-toggle"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>

          </div>

        </div>
      </header>

      {/* Customer Page Content */}

      <main className="cu-main">
        <Outlet />
      </main>

      {/* Footer */}

      <footer className="cu-footer">

        <div className="cu-footer-content">

          <div className="cu-footer-brand">
            <Film size={20} />
            <strong>EntertainHub</strong>
          </div>

          <p>
            Discover. Book. Experience.
          </p>

          <small>
            © {new Date().getFullYear()} EntertainHub.
            All rights reserved.
          </small>

        </div>

      </footer>

    </div>
  );
}