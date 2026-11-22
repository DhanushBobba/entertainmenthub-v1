import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  Edit3,
  Save,
  X,
  Ticket,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  LoaderCircle,
} from "lucide-react";

import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { updateMyProfile } from "../../api/userApi";
import { getCurrentUser } from "../../api/authApi";

import "../../styles/customer/ProfilePage.css";

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState(user);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    setProfile(user);
  }, [user]);

  const customerName = profile?.full_name || "Customer";

  const initials = customerName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )
    : "Not available";

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function startEditing() {
    setForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    });

    setEditing(true);
  }

  function cancelEditing() {
    setForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    });

    setEditing(false);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (saving) return;

    const fullName = form.full_name.trim();
    const phone = form.phone.trim();

    if (fullName.length < 2) {
      toast.error("Please enter a valid full name");
      return;
    }

    if (
      phone &&
      !/^\+?[0-9\s-]{7,20}$/.test(phone)
    ) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        full_name: fullName,
        phone: phone || null,
      };

      const response = await updateMyProfile(payload);

      let updatedProfile = {
        ...profile,
        ...payload,
        ...(response?.profile || response?.user || {}),
      };

      try {
        const latestProfile = await getCurrentUser();

        updatedProfile = {
          ...updatedProfile,
          ...latestProfile,
        };
      } catch {
        // Profile update succeeded.
        // Retain the saved information if refresh fails.
      }

      setProfile(updatedProfile);

      if (typeof setUser === "function") {
        setUser(updatedProfile);
      }

      setEditing(false);

      toast.success("Profile updated successfully");
    } catch (error) {
      const detail = error.response?.data?.detail;

      toast.error(
        typeof detail === "string"
          ? detail
          : "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="cp-loading">
        <LoaderCircle size={30} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="cp-page">

      {/* Page Header */}

      <div className="cp-page-heading">
        <div>
          <div className="cp-eyebrow">
            <Sparkles size={14} />
            YOUR ACCOUNT
          </div>

          <h1>
            My <span>Profile</span>
          </h1>

          <p>
            Manage your personal information and account.
          </p>
        </div>

        <Link
          to="/customer/bookings"
          className="cp-bookings-button"
        >
          <Ticket size={17} />
          My Bookings
          <ArrowUpRight size={15} />
        </Link>
      </div>

      {/* Main Profile Layout */}

      <div className="cp-grid">

        {/* Left Profile Card */}

        <aside className="cp-identity-card">

          <div className="cp-cover">
            <div className="cp-cover-orb" />
            <div className="cp-cover-orb second" />

            <span className="cp-cover-label">
              <Sparkles size={13} />
              ENTERTAINHUB MEMBER
            </span>
          </div>

          <div className="cp-identity-content">

            <div className="cp-avatar-container">
              <div className="cp-avatar">
                {initials || "C"}
              </div>

              {profile.is_active && (
                <div className="cp-avatar-status" />
              )}
            </div>

            <h2>{customerName}</h2>

            <p className="cp-email">
              {profile.email}
            </p>

            <span
              className={`cp-status ${
                profile.is_active
                  ? "active"
                  : "inactive"
              }`}
            >
              <span />
              {profile.is_active
                ? "Active Account"
                : "Inactive Account"}
            </span>

            <div className="cp-divider" />

            <div className="cp-mini-details">

              <div className="cp-mini-item">
                <div className="cp-mini-icon purple">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <small>Account type</small>
                  <strong className="cp-capitalize">
                    {profile.role || "Customer"}
                  </strong>
                </div>
              </div>

              <div className="cp-mini-item">
                <div className="cp-mini-icon blue">
                  <CalendarDays size={18} />
                </div>

                <div>
                  <small>Member since</small>
                  <strong>{joinedDate}</strong>
                </div>
              </div>

              <div className="cp-mini-item">
                <div className="cp-mini-icon green">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <small>Account status</small>
                  <strong>
                    {profile.is_active
                      ? "Active"
                      : "Inactive"}
                  </strong>
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* Right Personal Information Card */}

        <section className="cp-information-card">

          <div className="cp-card-header">
            <div className="cp-card-title">

              <div className="cp-section-icon">
                <User size={22} />
              </div>

              <div>
                <h2>Personal Information</h2>
                <p>Update your account details</p>
              </div>

            </div>

            {!editing && (
              <button
                type="button"
                className="cp-edit-button"
                onClick={startEditing}
              >
                <Edit3 size={15} />
                Edit Profile
              </button>
            )}
          </div>

          <form
            className="cp-form"
            onSubmit={handleSave}
          >

            <div className="cp-form-grid">

              {/* Full Name */}

              <div className="cp-field">
                <label htmlFor="cp-name">
                  Full name
                </label>

                <div className="cp-input-wrapper">
                  <User size={18} />

                  <input
                    id="cp-name"
                    name="full_name"
                    value={
                      editing
                        ? form.full_name
                        : profile.full_name || ""
                    }
                    onChange={updateField}
                    placeholder="Enter your full name"
                    readOnly={!editing || saving}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Email */}

              <div className="cp-field">
                <label htmlFor="cp-email">
                  Email address
                </label>

                <div className="cp-input-wrapper cp-readonly">
                  <Mail size={18} />

                  <input
                    id="cp-email"
                    type="email"
                    value={profile.email || ""}
                    readOnly
                  />

                  <ShieldCheck size={15} />
                </div>
              </div>

              {/* Phone */}

              <div className="cp-field">
                <label htmlFor="cp-phone">
                  Mobile number
                </label>

                <div className="cp-input-wrapper">
                  <Phone size={18} />

                  <input
                    id="cp-phone"
                    type="tel"
                    name="phone"
                    placeholder="Add your mobile number"
                    value={
                      editing
                        ? form.phone
                        : profile.phone || ""
                    }
                    onChange={updateField}
                    readOnly={!editing || saving}
                    maxLength={20}
                  />
                </div>
              </div>

              {/* Role */}

              <div className="cp-field">
                <label htmlFor="cp-role">
                  Account role
                </label>

                <div className="cp-input-wrapper cp-readonly">
                  <ShieldCheck size={18} />

                  <input
                    id="cp-role"
                    value={profile.role || "customer"}
                    readOnly
                    className="cp-capitalize"
                  />
                </div>
              </div>

            </div>

            <div className="cp-security-note">
              <ShieldCheck size={21} />

              <div>
                <strong>Your account is protected</strong>

                <p>
                  Your email and account role cannot be
                  changed from this page.
                </p>
              </div>
            </div>

            {editing && (
              <div className="cp-form-actions">

                <button
                  type="button"
                  className="cp-cancel-button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  type="submit"
                  className="cp-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle
                      size={17}
                      className="cp-spinner"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving changes..."
                    : "Save Changes"}
                </button>

              </div>
            )}

          </form>
        </section>
      </div>

      {/* Quick Access Card */}

      <Link
        to="/customer/bookings"
        className="cp-quick-card"
      >
        <div className="cp-quick-icon">
          <Ticket size={25} />
        </div>

        <div className="cp-quick-content">
          <h3>Your Entertainment Journey</h3>

          <p>
            View your tickets, booking history and
            upcoming experiences.
          </p>
        </div>

        <div className="cp-quick-arrow">
          <ArrowUpRight size={21} />
        </div>
      </Link>

    </div>
  );
}