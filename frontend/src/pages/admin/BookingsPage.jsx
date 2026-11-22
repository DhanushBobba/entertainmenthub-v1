import { useEffect, useState } from "react";

import {
  Ticket,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  CircleCheck,
  ArrowUpRight,
  IndianRupee,
  Film,
  CalendarDays,
  User,
  Mail,
  X,
  CreditCard,
  Hash,
  Users,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getBookings,
  updateBookingStatus,
} from "../../api/bookingApi";

import "./BookingsPage.css";

const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

const STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getError(error, fallback) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return fallback;
}

function getItemName(booking) {
  return (
    booking.movies?.title ||
    booking.events?.title ||
    "Entertainment"
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`bp-status ${status}`}>
      <span className="bp-status-dot" />
      {status || "Unknown"}
    </span>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const firstPage = await getBookings({
        page: 1,
        limit: 20,
      });

      const allBookings = [...(firstPage.bookings || [])];

      const total = Number(
        firstPage.total ?? allBookings.length
      );

      const limit = Number(firstPage.limit || 20);

      for (
        let page = 2;
        page <= Math.ceil(total / limit);
        page++
      ) {
        const response = await getBookings({
          page,
          limit,
        });

        allBookings.push(...(response.bookings || []));
      }

      setBookings(allBookings);
    } catch (error) {
      const message = getError(
        error,
        "Unable to load bookings"
      );

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const openDetails = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.booking_status);
  };

  const closeDetails = () => {
    if (saving) return;

    setSelectedBooking(null);
    setNewStatus("");
  };

  const handleStatusUpdate = async () => {
    if (!selectedBooking) return;

    if (newStatus === selectedBooking.booking_status) {
      toast.error("Please select a different status");
      return;
    }

    const allowed =
      STATUS_TRANSITIONS[selectedBooking.booking_status] || [];

    if (!allowed.includes(newStatus)) {
      toast.error("Invalid booking status transition");
      return;
    }

    if (
      newStatus === "cancelled" &&
      !window.confirm("Are you sure you want to cancel this booking?")
    ) {
      return;
    }

    try {
      setSaving(true);

      await updateBookingStatus(
        selectedBooking.id,
        newStatus
      );

      toast.success("Booking status updated successfully");

      setSelectedBooking(null);
      setNewStatus("");

      await loadBookings();
    } catch (error) {
      toast.error(
        getError(error, "Unable to update booking status")
      );
    } finally {
      setSaving(false);
    }
  };

  const countByStatus = (status) =>
    bookings.filter(
      (booking) => booking.booking_status === status
    ).length;

  const totalBookingValue = bookings.reduce(
    (total, booking) =>
      total + Number(booking.total_amount || 0),
    0
  );

  const summaryCards = [
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: Ticket,
      color: "#a78bfa",
      filter: "all",
    },
    {
      title: "Pending",
      value: countByStatus("pending"),
      icon: Clock,
      color: "#fbbf24",
      filter: "pending",
    },
    {
      title: "Confirmed",
      value: countByStatus("confirmed"),
      icon: CheckCircle2,
      color: "#60a5fa",
      filter: "confirmed",
    },
    {
      title: "Completed",
      value: countByStatus("completed"),
      icon: CircleCheck,
      color: "#34d399",
      filter: "completed",
    },
    {
      title: "Cancelled",
      value: countByStatus("cancelled"),
      icon: XCircle,
      color: "#fb7185",
      filter: "cancelled",
    },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const searchableText = `
      ${booking.id}
      ${booking.profiles?.full_name || ""}
      ${booking.profiles?.email || ""}
      ${getItemName(booking)}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(
      search.trim().toLowerCase()
    );

    const matchesBookingStatus =
      bookingFilter === "all" ||
      booking.booking_status === bookingFilter;

    const matchesPaymentStatus =
      paymentFilter === "all" ||
      booking.payment_status === paymentFilter;

    const matchesType =
      typeFilter === "all" ||
      booking.booking_type === typeFilter;

    return (
      matchesSearch &&
      matchesBookingStatus &&
      matchesPaymentStatus &&
      matchesType
    );
  });

  const allowedStatuses = selectedBooking
    ? STATUS_TRANSITIONS[selectedBooking.booking_status] || []
    : [];

  return (
    <div className="bookings-page">
      {/* Header */}

      <section className="bp-hero">
        <div>
          <span className="bp-eyebrow">
            <Ticket size={16} />
            RESERVATION MANAGEMENT
          </span>

          <h1>
            Bookings <span>Management</span>
          </h1>

          <p>
            Monitor customer reservations, manage ticket
            bookings and track booking activity.
          </p>
        </div>

        <button
          className="bp-primary-button"
          onClick={loadBookings}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "bp-spinner" : ""}
          />
          Refresh Data
        </button>
      </section>

      {/* Statistics Cards */}

      <div className="bp-summary-grid">
        {summaryCards.map(
          ({ title, value, icon: Icon, color, filter }, index) => (
            <button
              type="button"
              key={title}
              className={`bp-stat-card ${
                bookingFilter === filter ? "selected" : ""
              }`}
              style={{
                "--accent": color,
                "--delay": `${index * 80}ms`,
              }}
              onClick={() => setBookingFilter(filter)}
              aria-pressed={bookingFilter === filter}
            >
              <div className="bp-stat-top">
                <div className="bp-stat-icon">
                  <Icon size={23} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="bp-stat-arrow"
                />
              </div>

              <span>{title}</span>
              <strong>{value}</strong>
            </button>
          )
        )}
      </div>

      {/* Total Booking Value */}

      <div className="bp-revenue-card">
        <div className="bp-revenue-icon">
          <IndianRupee size={30} />
        </div>

        <div>
          <span>Total Booking Value</span>
          <h2>{formatCurrency(totalBookingValue)}</h2>
          <p>Combined value of all booking records</p>
        </div>

        <CreditCard
          size={65}
          className="bp-revenue-decoration"
        />
      </div>

      {/* Booking Directory */}

      <section className="bp-panel">
        <div className="bp-panel-header">
          <div>
            <h2>
              <Ticket size={22} />
              Booking Directory
            </h2>

            <p>View and manage customer reservations</p>
          </div>

          <span className="bp-count">
            {filteredBookings.length} Records
          </span>
        </div>

        {/* Search and Filters */}

        <div className="bp-toolbar">
          <div className="bp-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search customer or booking..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              aria-label="Search bookings"
            />
          </div>

          <div className="bp-filters">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              aria-label="Booking type"
            >
              <option value="all">All Types</option>
              <option value="movie">Movie</option>
              <option value="event">Event</option>
            </select>

            <select
              value={bookingFilter}
              onChange={(event) =>
                setBookingFilter(event.target.value)
              }
              aria-label="Booking status"
            >
              <option value="all">Booking Status</option>

              {BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(event.target.value)
              }
              aria-label="Payment status"
            >
              <option value="all">Payment Status</option>

              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1)}
                </option>
              ))}
            </select>

            <button
              className="bp-secondary-button"
              onClick={() => {
                setSearch("");
                setBookingFilter("all");
                setPaymentFilter("all");
                setTypeFilter("all");
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Bookings Table */}

        {loading ? (
          <div className="bp-empty">
            <RefreshCw size={34} className="bp-spinner" />
            <h3>Loading bookings...</h3>
          </div>
        ) : error ? (
          <div className="bp-empty">
            <XCircle size={35} />
            <h3>{error}</h3>

            <button
              className="bp-primary-button"
              onClick={loadBookings}
            >
              Try Again
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bp-empty">
            <div className="bp-empty-icon">
              <Ticket size={38} />
            </div>

            <h3>No bookings found</h3>

            <p>
              Customer reservations will appear here.
            </p>
          </div>
        ) : (
          <div className="bp-table-wrapper">
            <table className="bp-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Entertainment</th>
                  <th>Tickets</th>
                  <th>Amount</th>
                  <th>Booking Status</th>
                  <th>Payment</th>
                  <th>Booking Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <span
                        className="bp-booking-id"
                        title={booking.id}
                      >
                        #{booking.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>

                    <td>
                      <div className="bp-customer">
                        <div className="bp-avatar">
                          {(
                            booking.profiles?.full_name || "C"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {booking.profiles?.full_name ||
                              "Customer"}
                          </strong>

                          <small>
                            {booking.profiles?.email || "—"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="bp-item">
                        <div className="bp-item-icon">
                          {booking.booking_type === "movie" ? (
                            <Film size={17} />
                          ) : (
                            <CalendarDays size={17} />
                          )}
                        </div>

                        <div>
                          <strong>{getItemName(booking)}</strong>

                          <small>{booking.booking_type}</small>
                        </div>
                      </div>
                    </td>

                    <td>{booking.quantity}</td>

                    <td className="bp-amount">
                      {formatCurrency(booking.total_amount)}
                    </td>

                    <td>
                      <StatusBadge
                        status={booking.booking_status}
                      />
                    </td>

                    <td>
                      <StatusBadge
                        status={booking.payment_status}
                      />
                    </td>

                    <td>
                      {formatDate(booking.booking_date)}
                    </td>

                    <td>
                      <button
                        className="bp-view-button"
                        title="View booking details"
                        aria-label={`View booking ${booking.id}`}
                        onClick={() => openDetails(booking)}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Booking Details Modal */}

      {selectedBooking && (
        <div
          className="bp-modal-overlay"
          onClick={closeDetails}
        >
          <div
            className="bp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bp-modal-header">
              <div className="bp-modal-icon">
                <Ticket size={27} />
              </div>

              <button
                className="bp-close"
                onClick={closeDetails}
                disabled={saving}
                aria-label="Close details"
              >
                <X size={23} />
              </button>
            </div>

            <h2 id="booking-modal-title">Booking Details</h2>

            <p className="bp-modal-subtitle">
              View reservation and payment information.
            </p>

            <div className="bp-detail-section">
              <h3>
                <User size={18} />
                Customer Information
              </h3>

              <div className="bp-detail-grid">
                <div className="bp-detail-item">
                  <span>
                    <User size={14} />
                    Customer Name
                  </span>

                  <strong>
                    {selectedBooking.profiles?.full_name ||
                      "Customer"}
                  </strong>
                </div>

                <div className="bp-detail-item">
                  <span>
                    <Mail size={14} />
                    Email Address
                  </span>

                  <strong>
                    {selectedBooking.profiles?.email || "—"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="bp-detail-section">
              <h3>
                <Ticket size={18} />
                Reservation Information
              </h3>

              <div className="bp-detail-grid">
                <div className="bp-detail-item bp-full-width">
                  <span>
                    <Hash size={14} />
                    Booking ID
                  </span>

                  <strong>{selectedBooking.id}</strong>
                </div>

                <div className="bp-detail-item">
                  <span>Entertainment</span>

                  <strong>
                    {getItemName(selectedBooking)}
                  </strong>
                </div>

                <div className="bp-detail-item">
                  <span>Booking Type</span>

                  <strong className="bp-capitalize">
                    {selectedBooking.booking_type}
                  </strong>
                </div>

                <div className="bp-detail-item">
                  <span>
                    <Users size={14} />
                    Ticket Quantity
                  </span>

                  <strong>
                    {selectedBooking.quantity}
                  </strong>
                </div>

                <div className="bp-detail-item">
                  <span>Ticket Price</span>

                  <strong>
                    {formatCurrency(selectedBooking.unit_price)}
                  </strong>
                </div>

                <div className="bp-detail-item">
                  <span>Booking Date</span>

                  <strong>
                    {formatDate(selectedBooking.booking_date)}
                  </strong>
                </div>

                <div className="bp-detail-item">
                  <span>Current Status</span>

                  <div>
                    <StatusBadge
                      status={selectedBooking.booking_status}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}

            <div className="bp-detail-section">
              <h3>
                <CreditCard size={18} />
                Payment Information
              </h3>

              <div className="bp-payment-summary">
                <div>
                  <span>Total Amount</span>

                  <h2>
                    {formatCurrency(selectedBooking.total_amount)}
                  </h2>
                </div>

                <StatusBadge
                  status={selectedBooking.payment_status}
                />
              </div>
            </div>

            {/* Status Management */}

            {allowedStatuses.length > 0 && (
              <div className="bp-status-update">
                <label htmlFor="new-booking-status">
                  Update Booking Status
                </label>

                <select
                  id="new-booking-status"
                  value={newStatus}
                  onChange={(event) =>
                    setNewStatus(event.target.value)
                  }
                  disabled={saving}
                >
                  <option value={selectedBooking.booking_status}>
                    Current: {selectedBooking.booking_status}
                  </option>

                  {allowedStatuses.map((status) => (
                    <option value={status} key={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1)}
                    </option>
                  ))}
                </select>

                <small>
                  Updating booking status does not process a payment
                  or refund.
                </small>
              </div>
            )}

            <div className="bp-modal-footer">
              <button
                className="bp-secondary-button"
                onClick={closeDetails}
                disabled={saving}
              >
                Close
              </button>

              {allowedStatuses.length > 0 && (
                <button
                  className="bp-primary-button"
                  disabled={
                    saving ||
                    newStatus === selectedBooking.booking_status
                  }
                  onClick={handleStatusUpdate}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="bp-spinner"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Update Status
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}