import { useState } from "react";

import {
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";

import {
  Film,
  User,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clapperboard,
  CalendarDays,
  Ticket,
} from "lucide-react";

import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";

import "../../styles/auth.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const { register, user } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  /* =====================================
     PASSWORD VALIDATION
  ===================================== */

  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: form.password.length >= 8,
    },
    {
      label: "Uppercase letter",
      valid: /[A-Z]/.test(form.password),
    },
    {
      label: "Lowercase letter",
      valid: /[a-z]/.test(form.password),
    },
    {
      label: "At least one number",
      valid: /[0-9]/.test(form.password),
    },
    {
      label: "Special character",
      valid: /[^A-Za-z0-9]/.test(form.password),
    },
  ];

  const passwordScore = passwordChecks.filter(
    (item) => item.valid
  ).length;

  const passwordStrength =
    passwordScore <= 2
      ? "weak"
      : passwordScore <= 4
      ? "medium"
      : "strong";

  const passwordsMatch =
    form.confirm_password.length > 0 &&
    form.password === form.confirm_password;

  /* =====================================
     UPDATE FORM
  ===================================== */

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /* =====================================
     AUTHENTICATED USER REDIRECTION
  ===================================== */

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

  /* =====================================
     REGISTER CUSTOMER
  ===================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    if (form.full_name.trim().length < 2) {
      toast.error("Please enter a valid full name");
      return;
    }

    if (form.password.length < 8) {
      toast.error(
        "Password must contain at least 8 characters"
      );
      return;
    }

    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const response = await register({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      toast.success(
        response.email_confirmation_required
          ? "Registration submitted. Check your email."
          : "Account created successfully!"
      );

      navigate("/login?mode=customer", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page auth-user-mode auth-register-page">

      {/* =====================================
          TOP RIGHT LOGIN SWITCH
      ===================================== */}

      <nav
        className="auth-mode-switch"
        aria-label="Login navigation"
      >
        <Link
          to="/login?mode=customer"
          className="auth-mode-button active"
        >
          <User size={16} />

          <span>User Login</span>
        </Link>

        <Link
          to="/login?mode=admin"
          className="auth-mode-button"
        >
          <ShieldCheck size={17} />

          <span>Admin Login</span>
        </Link>
      </nav>

      {/* =====================================
          LEFT HERO SECTION
      ===================================== */}

      <section className="auth-hero register-hero">
        <div className="hero-content">

          {/* Brand */}

          <div className="brand">
            <Film size={32} />

            <span>EntertainHub</span>
          </div>

          {/* Hero Badge */}

          <div className="hero-badge">
            THE ENTERTAINMENT EXPERIENCE
          </div>

          {/* Hero Heading */}

          <h1>
            Discover.
            <br />

            Experience.
            <br />

            <span>Enjoy.</span>
          </h1>

          <p>
            Join EntertainHub and explore a world
            of movies, concerts, live events and
            unforgettable entertainment experiences.
          </p>

          {/* Premium Animated Feature Cards */}

          <div className="hero-features">
            <div>
              <Clapperboard />

              <span>Discover Movies</span>
            </div>

            <div>
              <CalendarDays />

              <span>Explore Events</span>
            </div>

            <div>
              <Ticket />

              <span>Easy Booking</span>
            </div>
          </div>

        </div>
      </section>

      {/* =====================================
          RIGHT REGISTRATION SECTION
      ===================================== */}

      <section className="auth-form-section">

        <div className="auth-card register-card">

          {/* Mobile Brand */}

          <div className="mobile-brand">
            <Film size={28} />

            <span>EntertainHub</span>
          </div>

          {/* Registration Icon */}

          <div className="auth-portal-icon customer">
            <UserPlus size={25} />
          </div>

          {/* Registration Badge */}

          <div className="auth-portal-badge customer">
            <span className="auth-portal-dot" />

            CUSTOMER REGISTRATION
          </div>

          {/* Heading */}

          <h2>Create your account</h2>

          <p className="auth-subtitle">
            Start your entertainment journey today.
          </p>

          {/* =====================================
              REGISTRATION FORM
          ===================================== */}

          <form onSubmit={handleSubmit}>

            {/* Full Name */}

            <label htmlFor="register-name">
              Full name
              <span className="register-required"> *</span>
            </label>

            <div className="input-wrapper">
              <User size={19} />

              <input
                id="register-name"
                type="text"
                name="full_name"
                placeholder="Enter your full name"
                autoComplete="name"
                value={form.full_name}
                onChange={updateField}
                minLength={2}
                maxLength={100}
                disabled={submitting}
                required
              />
            </div>

            {/* Email Address */}

            <label htmlFor="register-email">
              Email address
              <span className="register-required"> *</span>
            </label>

            <div className="input-wrapper">
              <Mail size={19} />

              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={form.email}
                onChange={updateField}
                disabled={submitting}
                required
              />
            </div>

            {/* Password */}

            <label htmlFor="register-password">
              Password
              <span className="register-required"> *</span>
            </label>

            <div className="input-wrapper">
              <Lock size={19} />

              <input
                id="register-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={updateField}
                minLength={8}
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
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {/* =====================================
                PASSWORD STRENGTH INDICATOR
            ===================================== */}

            {form.password.length > 0 && (
              <div className="register-password-strength">

                <div className="register-strength-header">
                  <span>Password strength</span>

                  <strong className={passwordStrength}>
                    {passwordStrength}
                  </strong>
                </div>

                <div
                  className="register-strength-bars"
                  role="img"
                  aria-label={`Password strength: ${passwordStrength}`}
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={
                        level <= passwordScore
                          ? `filled ${passwordStrength}`
                          : ""
                      }
                    />
                  ))}
                </div>

              </div>
            )}

            {/* Confirm Password */}

            <label htmlFor="register-confirm-password">
              Confirm password
              <span className="register-required"> *</span>
            </label>

            <div
              className={`input-wrapper ${
                form.confirm_password
                  ? passwordsMatch
                    ? "register-input-success"
                    : "register-input-error"
                  : ""
              }`}
            >
              <Lock size={19} />

              <input
                id="register-confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirm_password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={form.confirm_password}
                onChange={updateField}
                disabled={submitting}
                aria-invalid={
                  form.confirm_password.length > 0 &&
                  !passwordsMatch
                }
                aria-describedby={
                  form.confirm_password
                    ? "register-password-match"
                    : undefined
                }
                required
              />

              {form.confirm_password && (
                passwordsMatch ? (
                  <CheckCircle2
                    size={17}
                    className="register-match-icon"
                  />
                ) : (
                  <XCircle
                    size={17}
                    className="register-error-icon"
                  />
                )
              )}

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {/* Password Matching Message */}

            {form.confirm_password && (
              <p
                id="register-password-match"
                className={`register-password-message ${
                  passwordsMatch
                    ? "success"
                    : "error"
                }`}
                aria-live="polite"
              >
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 size={13} />
                    Passwords match
                  </>
                ) : (
                  <>
                    <XCircle size={13} />
                    Passwords do not match
                  </>
                )}
              </p>
            )}

            {/* =====================================
                CREATE ACCOUNT BUTTON
            ===================================== */}

            <button
              className="auth-button"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <>
                  <span className="auth-mini-spinner" />

                  Creating account...
                </>
              ) : (
                <>
                  Create Account

                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          {/* =====================================
              SIGN IN LINK
          ===================================== */}

          <p className="auth-footer">
            Already have an account?{" "}

            <Link to="/login?mode=customer">
              Sign in
            </Link>
          </p>

          {/* Customer Account Information */}

       
        </div>

      </section>

    </div>
  );
}