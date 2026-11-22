import { useState } from "react";

import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Film,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Clapperboard,
  Ticket,
  CalendarDays,
  ShieldCheck,
  User,
  LayoutDashboard,
  Settings,
  ChartNoAxesColumn,
} from "lucide-react";

import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import "../../styles/auth.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const { login, user } = useAuth();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const isAdminLogin =
    searchParams.get("mode") === "admin";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  function switchLoginMode(mode) {
    if (submitting) return;

    setSearchParams(
      { mode },
      { replace: true }
    );

    setForm({
      email: "",
      password: "",
    });

    setShowPassword(false);
  }

  if (user) {
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      const profile = await login(form);

      toast.success(
        profile.role === "admin"
          ? "Welcome back, Admin!"
          : "Login successful"
      );

      // Always use the authenticated backend role.
      // Never use the selected UI mode for authorization.

      navigate(
        profile.role === "admin"
          ? "/admin/dashboard"
          : "/customer/home",
        { replace: true }
      );
    } catch (error) {
      toast.error(
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Unable to login. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`auth-page ${
        isAdminLogin
          ? "auth-admin-mode"
          : "auth-user-mode"
      }`}
    >
      {/* =====================================
          TOP RIGHT LOGIN MODE SWITCH
      ===================================== */}

      <div
        className="auth-mode-switch"
        role="group"
        aria-label="Select login mode"
      >
        <button
          type="button"
          className={`auth-mode-button ${
            !isAdminLogin ? "active" : ""
          }`}
          aria-pressed={!isAdminLogin}
          disabled={submitting}
          onClick={() => switchLoginMode("customer")}
        >
          <User size={16} />

          <span>User Login</span>
        </button>

        <button
          type="button"
          className={`auth-mode-button ${
            isAdminLogin ? "active" : ""
          }`}
          aria-pressed={isAdminLogin}
          disabled={submitting}
          onClick={() => switchLoginMode("admin")}
        >
          <ShieldCheck size={17} />

          <span>Admin Login</span>
        </button>
      </div>

      {/* =====================================
          LEFT SIDE HERO SECTION
      ===================================== */}

      <section className="auth-hero">
        <div
          className="hero-content"
          key={
            isAdminLogin
              ? "admin-hero"
              : "customer-hero"
          }
        >
          <div className="brand">
            <Film size={32} />
            <span>EntertainHub</span>
          </div>

          <div className="hero-badge">
            {isAdminLogin
              ? "ENTERTAINHUB ADMIN PORTAL"
              : "YOUR WORLD OF ENTERTAINMENT"}
          </div>

          {isAdminLogin ? (
            <>
              <h1>
                Manage.
                <br />
                Monitor.
                <br />
                <span>Entertainment.</span>
              </h1>

              <p>
                Manage movies, events, bookings,
                customers and revenue from one
                powerful administration workspace.
              </p>
            </>
          ) : (
            <>
              <h1>
                Entertainment.
                <br />
                <span>Without Limits.</span>
              </h1>

              <p>
                Discover movies, experience live events,
                and create unforgettable memories.
              </p>
            </>
          )}

          {/* Dynamic Feature Cards */}

          <div className="hero-features">
            {isAdminLogin ? (
              <>
                <div>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </div>

                <div>
                  <Settings />
                  <span>Management</span>
                </div>

                <div>
                  <ChartNoAxesColumn />
                  <span>Analytics</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Clapperboard />
                  <span>Movies</span>
                </div>

                <div>
                  <CalendarDays />
                  <span>Live Events</span>
                </div>

                <div>
                  <Ticket />
                  <span>Easy Booking</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =====================================
          RIGHT SIDE LOGIN FORM
      ===================================== */}

      <section className="auth-form-section">
        <div
          className="auth-card"
          key={
            isAdminLogin
              ? "admin-form"
              : "customer-form"
          }
        >
          <div className="mobile-brand">
            <Film size={28} />
            EntertainHub
          </div>

          {/* Login Mode Icon */}

          <div
            className={`auth-portal-icon ${
              isAdminLogin ? "admin" : "customer"
            }`}
          >
            {isAdminLogin ? (
              <ShieldCheck size={25} />
            ) : (
              <User size={25} />
            )}
          </div>

          {/* Login Mode Badge */}

          <div
            className={`auth-portal-badge ${
              isAdminLogin ? "admin" : "customer"
            }`}
          >
            <span className="auth-portal-dot" />

            {isAdminLogin
              ? "ADMIN PORTAL"
              : "CUSTOMER PORTAL"}
          </div>

          <h2>
            {isAdminLogin
              ? "Admin Login"
              : "Welcome back"}
          </h2>

          <p className="auth-subtitle">
            {isAdminLogin
              ? "Sign in to manage your entertainment platform."
              : "Sign in to continue to EntertainHub."}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email Address */}

            <label htmlFor="login-email">
              Email address
            </label>

            <div className="input-wrapper">
              <Mail size={19} />

              <input
                id="login-email"
                type="email"
                placeholder={
                  isAdminLogin
                    ? "Enter admin email"
                    : "Enter your email"
                }
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                disabled={submitting}
                required
              />
            </div>

            {/* Password */}

            <label htmlFor="login-password">
              Password
            </label>

            <div className="input-wrapper">
              <Lock size={19} />

              <input
                id="login-password"
                type={
                  showPassword ? "text" : "password"
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                disabled={submitting}
                required
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            {/* Submit Button */}

            <button
              className="auth-button"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <>
                  <span className="auth-mini-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  {isAdminLogin
                    ? "Sign In as Admin"
                    : "Sign In as User"}

                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Customer Registration */}

          {!isAdminLogin && (
            <p className="auth-footer">
              Don't have an account?{" "}
              <Link to="/register">
                Create account
              </Link>
            </p>
          )}

          {/* Admin Security Information */}

          {isAdminLogin && (
            <div className="auth-security-note">
              <ShieldCheck size={17} />

              <span>
                Admin dashboard access is restricted
                to authorized administrators.
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}