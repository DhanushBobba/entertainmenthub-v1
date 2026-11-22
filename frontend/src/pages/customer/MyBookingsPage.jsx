import { useEffect, useState, useRef } from "react";

import { Link } from "react-router-dom";

import {
  Ticket,
  Film,
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  ImageOff,
  ShieldCheck,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getBookings,
  cancelBooking,
} from "../../api/bookingApi";

import "../../styles/customer/MyBookingsPage.css";

const PAGE_SIZE = 8;

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function getTitle(booking) {
  return (
    booking.movies?.title ||
    booking.events?.title ||
    "Entertainment Booking"
  );
}

function getImage(booking) {
  return (
    booking.movies?.poster_url ||
    booking.events?.banner_url ||
    ""
  );
}

function isCancellable(booking) {
  return ["pending", "confirmed"].includes(
    booking.booking_status
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`mb-status ${status || "unknown"}`}>
      <span className="mb-status-dot" />

      {status?.replaceAll("_", " ") || "Unknown"}
    </span>
  );
}

/* =====================================
   BOOKING CARD IMAGE
===================================== */

function BookingImage({ url, title }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <div className="mb-image-fallback">
        <ImageOff size={25} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/* =====================================
   PREMIUM BOOKING CARD
===================================== */

function BookingCard({ booking, index, onView }) {
  const isMovie = booking.booking_type === "movie";

  return (
    <article
      className="mb-booking-card"
      style={{
        "--delay": `${Math.min(index, 8) * 70}ms`,
      }}
    >
      {/* Booking Poster */}

      <div className="mb-poster">

        <BookingImage
          url={getImage(booking)}
          title={getTitle(booking)}
        />

        <span className="mb-type-tag">
          {isMovie ? (
            <Film size={12} />
          ) : (
            <CalendarDays size={12} />
          )}

          {isMovie ? "Movie" : "Event"}
        </span>

      </div>

      {/* Booking Content */}

      <div className="mb-card-content">

        <div className="mb-card-top">

          <h3 title={getTitle(booking)}>
            {getTitle(booking)}
          </h3>

          <StatusBadge status={booking.booking_status} />

        </div>

        <span className="mb-reference">
          Ref: {String(booking.id).slice(0, 8).toUpperCase()}
        </span>

        <div className="mb-card-details">

          <div>
            <CalendarDays size={15} />

            <span>
              {formatDate(
                booking.booking_date || booking.created_at
              )}
            </span>
          </div>

          <div>
            <Ticket size={15} />

            <span>
              {booking.quantity} Ticket(s)
            </span>
          </div>

        </div>

        <div className="mb-payment-row">
          <span>Payment</span>

          <StatusBadge status={booking.payment_status} />
        </div>

        <div className="mb-card-footer">

          <div className="mb-price">

            <small>Total amount</small>

            <strong>
              ₹{formatPrice(booking.total_amount)}
            </strong>

          </div>

          <button
            type="button"
            className="mb-view-button"
            onClick={() => onView(booking)}
          >
            <Eye size={15} />
            View Ticket
          </button>

        </div>

      </div>

    </article>
  );
}

/* =====================================
   MAIN MY BOOKINGS PAGE
===================================== */

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  const [cancelling, setCancelling] = useState(false);

  const [confirmCancellation, setConfirmCancellation] =
    useState(false);

  const dialogRef = useRef(null);

  /* Load Customer Bookings */

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      setLoading(true);
      setError("");

      try {
        // Backend returns bookings belonging to
        // the currently authenticated customer.

        const firstResult = await getBookings({
          page: 1,
          limit: 20,
        });

        const allBookings = [
          ...(firstResult.bookings || []),
        ];

        const total = Number(
          firstResult.total ?? allBookings.length
        );

        const limit = Number(
          firstResult.limit || 20
        );

        const totalPages = Math.ceil(total / limit);

        for (
          let currentPage = 2;
          currentPage <= totalPages;
          currentPage++
        ) {
          if (cancelled) return;

          const result = await getBookings({
            page: currentPage,
            limit,
          });

          allBookings.push(...(result.bookings || []));
        }

        if (!cancelled) {
          const uniqueBookings = [
            ...new Map(
              allBookings.map((item) => [item.id, item])
            ).values(),
          ];

          setBookings(uniqueBookings);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            typeof err.response?.data?.detail === "string"
              ? err.response.data.detail
              : "Unable to load your bookings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* Booking Statistics */

  const summaryCards = [
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: Ticket,
      color: "#a78bfa",
      filter: "all",
    },
    {
      title: "Confirmed",
      value: bookings.filter(
        (booking) => booking.booking_status === "confirmed"
      ).length,
      icon: CheckCircle2,
      color: "#34d399",
      filter: "confirmed",
    },
    {
      title: "Pending",
      value: bookings.filter(
        (booking) => booking.booking_status === "pending"
      ).length,
      icon: Clock,
      color: "#fbbf24",
      filter: "pending",
    },
    {
      title: "Completed",
      value: bookings.filter(
        (booking) => booking.booking_status === "completed"
      ).length,
      icon: CheckCircle2,
      color: "#60a5fa",
      filter: "completed",
    },
    {
      title: "Cancelled",
      value: bookings.filter(
        (booking) => booking.booking_status === "cancelled"
      ).length,
      icon: XCircle,
      color: "#fb7185",
      filter: "cancelled",
    },
  ];

  /* Search and Filters */

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = [
      getTitle(booking),
      booking.id,
      booking.booking_type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      booking.booking_status === statusFilter;

    const matchesType =
      typeFilter === "all" ||
      booking.booking_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* Open Digital Ticket */

  function openTicket(booking) {
    setSelectedBooking(booking);
    setConfirmCancellation(false);

    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }

  function closeTicket() {
    if (cancelling) return;

    dialogRef.current?.close();
    setSelectedBooking(null);
    setConfirmCancellation(false);
  }

  /* Cancel Booking */

  async function handleCancelBooking() {
    if (
      !selectedBooking ||
      !isCancellable(selectedBooking) ||
      cancelling
    ) {
      return;
    }

    setCancelling(true);

    try {
      await cancelBooking(selectedBooking.id);

      toast.success("Booking cancelled successfully");

      dialogRef.current?.close();

      setSelectedBooking(null);
      setConfirmCancellation(false);

      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      toast.error(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to cancel this booking."
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="my-bookings-page">

      {/* =====================================
          PREMIUM PAGE HEADER
      ===================================== */}

      <section className="mb-hero">

        <div>

          <span className="mb-eyebrow">
            <Ticket size={14} />
            YOUR ENTERTAINMENT JOURNEY
          </span>

          <h1>
            My <span>Bookings</span>
          </h1>

          <p>
            Manage your movie tickets, upcoming events
            and entertainment experiences.
          </p>

        </div>

        <Link
          to="/customer/home"
          className="mb-primary-button"
        >
          Explore Entertainment
          <ArrowRight size={16} />
        </Link>

      </section>

      {/* =====================================
          BOOKING SUMMARY CARDS
      ===================================== */}

      <div className="mb-summary-grid">

        {summaryCards.map(
          ({
            title,
            value,
            icon: Icon,
            color,
            filter,
          }, index) => (
            <button
              key={title}
              type="button"
              className={`mb-stat-card ${
                statusFilter === filter ? "selected" : ""
              }`}
              style={{
                "--accent": color,
                "--delay": `${index * 80}ms`,
              }}
              aria-pressed={statusFilter === filter}
              onClick={() => {
                setStatusFilter(filter);
                setPage(1);
              }}
            >
              <div className="mb-stat-top">
                <div className="mb-stat-icon">
                  <Icon size={20} />
                </div>

                <ArrowRight
                  size={14}
                  className="mb-stat-arrow"
                />
              </div>

              <span>{title}</span>

              <strong>
                {loading || error ? "—" : value}
              </strong>

            </button>
          )
        )}

      </div>

      {/* =====================================
          SEARCH AND FILTERS
      ===================================== */}

      <div className="mb-toolbar">

        <div className="mb-search">

          <Search size={18} />

          <input
            type="search"
            placeholder="Search your bookings..."
            aria-label="Search bookings"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

        </div>

        <div className="mb-filters">

          <select
            aria-label="Booking type"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Types</option>
            <option value="movie">Movies</option>
            <option value="event">Events</option>
          </select>

          <select
            aria-label="Booking status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            className="mb-refresh"
            disabled={loading}
            onClick={() =>
              setRefreshKey((previous) => previous + 1)
            }
          >
            <RefreshCw
              size={16}
              className={loading ? "mb-spinner" : ""}
            />

            Refresh
          </button>

        </div>

      </div>

      {/* Booking Directory Heading */}

      <div className="mb-section-heading">

        <div>
          <h2>
            <Ticket size={21} />
            Booking History
          </h2>

          <p>Your movie and event reservations</p>
        </div>

        {!loading && !error && (
          <span>
            {filteredBookings.length} Bookings
          </span>
        )}

      </div>

      {/* =====================================
          LOADING, ERROR AND EMPTY STATES
      ===================================== */}

      {loading ? (

        <div className="mb-empty">

          <RefreshCw size={32} className="mb-spinner" />

          <p>Loading your bookings...</p>

        </div>

      ) : error ? (

        <div className="mb-empty">
          <XCircle size={34} />

          <h3>Unable to load bookings</h3>

          <p>{error}</p>

          <button
            className="mb-primary-button"
            onClick={() =>
              setRefreshKey((previous) => previous + 1)
            }
          >
            Try Again
          </button>
        </div>

      ) : visibleBookings.length === 0 ? (

        <div className="mb-empty">

          <div className="mb-empty-icon">
            <Ticket size={33} />
          </div>

          <h3>
            {bookings.length
              ? "No matching bookings"
              : "No bookings yet"}
          </h3>

          <p>
            {bookings.length
              ? "Try changing your search or filters."
              : "Book your first movie or event today."}
          </p>

          {bookings.length ? (
            <button
              className="mb-primary-button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setTypeFilter("all");
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          ) : (
            <Link
              to="/customer/home"
              className="mb-primary-button"
            >
              Explore Movies & Events
              <ArrowRight size={16} />
            </Link>
          )}

        </div>

      ) : (

        <>
          {/* Booking Cards */}

          <div className="mb-bookings-grid">

            {visibleBookings.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                index={index}
                onView={openTicket}
              />
            ))}

          </div>

          {/* Pagination */}

          {totalPages > 1 && (

            <div className="mb-pagination">

              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>

            </div>

          )}

        </>

      )}

      {/* =====================================
          PREMIUM DIGITAL TICKET POPUP
      ===================================== */}

      <dialog
        ref={dialogRef}
        className="mb-ticket-dialog"
        aria-label="Booking ticket details"
        onCancel={(event) => {
          event.preventDefault();
          closeTicket();
        }}
      >
        {selectedBooking && (

          <div className="mb-ticket-modal">

            <div className="mb-modal-header">

              <div>
                <Ticket size={20} />
                <h2>Booking Details</h2>
              </div>

              <button
                type="button"
                className="mb-close"
                onClick={closeTicket}
                disabled={cancelling}
                aria-label="Close ticket"
              >
                <X size={20} />
              </button>

            </div>

            {/* Digital Ticket */}

            <div className="mb-digital-ticket">

              <div className="mb-ticket-header">

                <div className="mb-ticket-icon">
                  <Ticket size={27} />
                </div>

                <span>ENTERTAINHUB</span>

                <h2>{getTitle(selectedBooking)}</h2>

                <StatusBadge
                  status={selectedBooking.booking_status}
                />

              </div>

              <div className="mb-ticket-divider" />

              <div className="mb-ticket-body">

                <div className="mb-ticket-info-grid">

                  <div>
                    <small>Booking Type</small>

                    <strong>
                      {selectedBooking.booking_type}
                    </strong>
                  </div>

                  <div>
                    <small>Booking Date</small>

                    <strong>
                      {formatDate(
                        selectedBooking.booking_date ||
                          selectedBooking.created_at
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>Ticket Quantity</small>

                    <strong>
                      {selectedBooking.quantity}
                    </strong>
                  </div>

                  <div>
                    <small>Unit Price</small>

                    <strong>
                      ₹{formatPrice(selectedBooking.unit_price)}
                    </strong>
                  </div>

                  <div>
                    <small>Booking Status</small>

                    <StatusBadge
                      status={selectedBooking.booking_status}
                    />
                  </div>

                  <div>
                    <small>Payment Status</small>

                    <StatusBadge
                      status={selectedBooking.payment_status}
                    />
                  </div>

                </div>

                <div className="mb-ticket-total">

                  <div>
                    <small>Total Amount</small>

                    <strong>
                      <IndianRupee size={21} />

                      {formatPrice(
                        selectedBooking.total_amount
                      )}
                    </strong>
                  </div>

                  <Ticket size={30} />

                </div>

                <div className="mb-booking-reference">

                  <small>Booking Reference</small>

                  <strong>{selectedBooking.id}</strong>

                </div>

              </div>

            </div>

            {/* Booking Status Information */}

            <div className="mb-ticket-note">

              <ShieldCheck size={17} />

              <span>
                This is your booking record.
                Ticket validity depends on the booking
                and payment status.
              </span>

            </div>

            {/* Booking Cancellation */}

            {isCancellable(selectedBooking) && (

              <div className="mb-cancellation">

                {confirmCancellation ? (

                  <>
                    <h3>Cancel this booking?</h3>

                    <p>
                      Are you sure you want to cancel
                      this reservation? This action cannot
                      be undone.
                    </p>

                    <div className="mb-cancel-actions">

                      <button
                        className="mb-secondary-button"
                        disabled={cancelling}
                        onClick={() =>
                          setConfirmCancellation(false)
                        }
                      >
                        Keep Booking
                      </button>

                      <button
                        className="mb-danger-button"
                        disabled={cancelling}
                        onClick={handleCancelBooking}
                      >
                        {cancelling
                          ? "Cancelling..."
                          : "Confirm Cancellation"}
                      </button>

                    </div>
                  </>

                ) : (

                  <button
                    className="mb-danger-button"
                    onClick={() =>
                      setConfirmCancellation(true)
                    }
                  >
                    <XCircle size={16} />
                    Cancel Booking
                  </button>

                )}

              </div>

            )}

          </div>

        )}
      </dialog>

    </div>
  );
}