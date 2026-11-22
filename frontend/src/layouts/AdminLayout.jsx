import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Film,
  CalendarDays,
  Tags,
  Ticket,
  Users,
  LogOut,
  Clapperboard,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Movies", path: "/admin/movies", icon: Film },
  { name: "Events", path: "/admin/events", icon: CalendarDays },
  { name: "Categories", path: "/admin/categories", icon: Tags },
  { name: "Bookings", path: "/admin/bookings", icon: Ticket },
  { name: "Customers", path: "/admin/customers", icon: Users },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Clapperboard size={32} />
          <div>
            <h2>EntertainHub</h2>
            <small>Admin Portal</small>
          </div>
        </div>

        <nav className="admin-navigation">
          {menuItems.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>

        <button className="admin-logout" onClick={logout}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h3>Administration</h3>
            <small>Entertainment Management System</small>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <strong>{user?.full_name || "Administrator"}</strong>
              <small>Admin</small>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}