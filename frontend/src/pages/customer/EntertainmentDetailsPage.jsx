import { useEffect, useState } from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Film,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Ticket,
  Globe,
  Minus,
  Plus,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ImageOff,
  ArrowRight,
} from "lucide-react";

import toast from "react-hot-toast";

import { getMovie } from "../../api/movieApi";
import { getEvent } from "../../api/eventApi";
import { createBooking } from "../../api/bookingApi";

import "../../styles/customer/EntertainmentDetailsPage.css";

const formatPrice = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

export default function EntertainmentDetailsPage({ type }) {
  const { id } = useParams();

  const isMovie = type === "movie";

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /* Load Movie or Event Details */

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setLoading(true);
      setError("");
      setItem(null);
      setBooking(null);
      setQuantity(1);
      setImageFailed(false);

      try {
        const response = isMovie
          ? await getMovie(id)
          : await getEvent(id);

        const result = isMovie
          ? response.movie || response
          : response.event || response;

        if (!result?.id) {
          throw new Error("Entertainment not found");
        }

        if (
          isMovie &&
          !["now_showing", "upcoming"].includes(result.status)
        ) {
          throw new Error("Movie is currently unavailable");
        }

        if (
          !isMovie &&
          !["upcoming", "ongoing"].includes(result.status)
        ) {
          throw new Error("Event is currently unavailable");
        }

        if (!cancelled) {
          setItem(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            typeof err.response?.data?.detail === "string"
              ? err.response.data.detail
              : err.message || "Unable to load details"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [id, isMovie, refreshKey]);

  const ticketPrice = Number(item?.ticket_price || 0);

  const totalAmount = ticketPrice * quantity;

  const maxQuantity = isMovie
    ? 10
    : Math.max(
        0,
        Math.min(10, Number(item?.total_seats || 0))
      );

  const canBook =
    item &&
    !booking &&
    quantity >= 1 &&
    quantity <= maxQuantity &&
    (
      isMovie
        ? item.status === "now_showing"
        : ["upcoming", "ongoing"].includes(item.status)
    );

  const imageUrl = isMovie
    ? item?.poster_url
    : item?.banner_url;

  const backUrl = isMovie
    ? "/customer/home?view=movies"
    : "/customer/home?view=events";

  /* Quantity Selection */

  function decreaseQuantity() {
    setQuantity((previous) =>
      Math.max(1, previous - 1)
    );
  }

  function increaseQuantity() {
    setQuantity((previous) =>
      Math.min(maxQuantity, previous + 1)
    );
  }

  /* Create Ticket Booking */

  async function handleBooking() {
    if (!canBook || submitting) return;

    setSubmitting(true);

    try {
      const response = await createBooking({
        booking_type: type,
        item_id: item.id,
        quantity,
      });

      setBooking({
        ...(response.booking || response),
        quantity,
      });

      toast.success("Booking created successfully");
    } catch (err) {
      toast.error(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to create booking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* Loading State */

  if (loading) {
    return (
      <div className="ed-state">
        <RefreshCw
          size={32}
          className="ed-spinner"
        />

        <p>Loading details...</p>
      </div>
    );
  }

  /* Error State */

  if (error || !item) {
    return (
      <div className="ed-state">
        <Film size={36} />

        <h2>Unable to load details</h2>

        <p>{error}</p>

        <button
          className="ed-primary-button"
          onClick={() =>
            setRefreshKey((value) => value + 1)
          }
        >
          Try Again
        </button>

        <Link to={backUrl} className="ed-back">
          <ArrowLeft size={16} />
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="entertainment-details">

      {/* Back Navigation */}

      <Link to={backUrl} className="ed-back">
        <ArrowLeft size={17} />

        Back to {isMovie ? "Movies" : "Events"}
      </Link>

      {/* Cinematic Details Hero */}

      <section
        className={`ed-hero ${
          isMovie ? "movie" : "event"
        }`}
      >
        {imageUrl && !imageFailed && (
          <div
            className="ed-hero-background"
            style={{
              backgroundImage: `url("${imageUrl}")`,
            }}
          />
        )}

        <div className="ed-hero-overlay" />

        {/* Poster */}

        <div className="ed-poster">

          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={item.title}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="ed-image-placeholder">
              <ImageOff size={40} />
              <span>No image available</span>
            </div>
          )}

        </div>

        {/* Entertainment Information */}

        <div className="ed-hero-content">

          <span className="ed-type-badge">
            {isMovie ? (
              <Film size={15} />
            ) : (
              <CalendarDays size={15} />
            )}

            {isMovie ? "MOVIE" : "LIVE EVENT"}
          </span>

          <h1>{item.title}</h1>

          <div className="ed-meta">

            <span
              className={`ed-status ${item.status}`}
            >
              {item.status?.replaceAll("_", " ")}
            </span>

            {isMovie ? (
              <>
                <span>
                  <Globe size={15} />
                  {item.language || "Not specified"}
                </span>

                <span>
                  <Clock size={15} />

                  {item.duration_minutes
                    ? `${item.duration_minutes} min`
                    : "TBA"}
                </span>
              </>
            ) : (
              <>
                <span>
                  <CalendarDays size={15} />
                  {item.event_date || "TBA"}
                </span>

                <span>
                  <MapPin size={15} />
                  {item.city || "TBA"}
                </span>
              </>
            )}

          </div>

          <p className="ed-hero-description">
            {item.description ||
              "Discover a memorable entertainment experience."}
          </p>

          <div className="ed-hero-price">

            <small>Ticket price</small>

            <strong>
              ₹{formatPrice(item.ticket_price)}
            </strong>

            <span>per person</span>

          </div>

        </div>
      </section>

      {/* Details and Booking Section */}

      <div className="ed-main-grid">

        <div className="ed-information">

          {/* About */}

          <section className="ed-panel">

            <h2>
              {isMovie ? (
                <Film size={21} />
              ) : (
                <CalendarDays size={21} />
              )}

              About the {isMovie ? "Movie" : "Event"}
            </h2>

            <p>
              {item.description ||
                "Detailed information is currently unavailable."}
            </p>

          </section>

          {/* Information Cards */}

          <section className="ed-panel">

            <h2>
              <Ticket size={21} />
              {isMovie ? "Movie Information" : "Event Information"}
            </h2>

            <div className="ed-information-grid">

              {(isMovie
                ? [
                    {
                      label: "Director",
                      value: item.director || "Not specified",
                      icon: Users,
                    },
                    {
                      label: "Language",
                      value: item.language || "Not specified",
                      icon: Globe,
                    },
                    {
                      label: "Duration",
                      value: item.duration_minutes
                        ? `${item.duration_minutes} minutes`
                        : "TBA",
                      icon: Clock,
                    },
                    {
                      label: "Release Date",
                      value: item.release_date || "TBA",
                      icon: CalendarDays,
                    },
                  ]
                : [
                    {
                      label: "Venue",
                      value: item.venue || "TBA",
                      icon: MapPin,
                    },
                    {
                      label: "Date",
                      value: item.event_date || "TBA",
                      icon: CalendarDays,
                    },
                    {
                      label: "Time",
                      value: item.event_time?.slice(0, 5) || "TBA",
                      icon: Clock,
                    },
                    {
                      label: "Total Seat Capacity",
                      value: `${item.total_seats || 0} seats`,
                      icon: Users,
                    },
                    {
                      label: "Organizer",
                      value: item.organizer || "Not specified",
                      icon: Users,
                    },
                  ]
              ).map(({ label, value, icon: Icon }) => (
                <div
                  className="ed-information-card"
                  key={label}
                >
                  <div className="ed-info-icon">
                    <Icon size={19} />
                  </div>

                  <div>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}

            </div>

          </section>

          {/* Movie Cast */}

          {isMovie && item.cast_members && (
            <section className="ed-panel">

              <h2>
                <Users size={21} />
                Cast
              </h2>

              <div className="ed-cast-list">

                {(Array.isArray(item.cast_members)
                  ? item.cast_members
                  : String(item.cast_members).split(",")
                )
                  .map((name) => String(name).trim())
                  .filter(Boolean)
                  .map((name, index) => (
                    <div
                      className="ed-cast-card"
                      key={`${name}-${index}`}
                    >
                      <div className="ed-cast-avatar">
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <span>{name}</span>
                    </div>
                  ))}

              </div>

            </section>
          )}

        </div>

        {/* Booking Panel */}

        <aside className="ed-booking-panel">

          {booking ? (

            /* Booking Created Successfully */

            <div className="ed-success">

              <div className="ed-success-icon">
                <CheckCircle2 size={42} />
              </div>

              <h2>Booking Created!</h2>

              <p>
                Your booking for {item.title} has
                been created successfully.
              </p>

              <div className="ed-success-details">

                {booking.id && (
                  <div>
                    <span>Booking ID</span>
                    <strong>{booking.id}</strong>
                  </div>
                )}

                <div>
                  <span>Tickets</span>
                  <strong>{booking.quantity}</strong>
                </div>

                <div>
                  <span>Total Amount</span>

                  <strong>
                    ₹{formatPrice(
                      booking.total_amount ?? totalAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Booking Status</span>

                  <strong>
                    {booking.booking_status || "Created"}
                  </strong>
                </div>

                <div>
                  <span>Payment Status</span>

                  <strong>
                    {booking.payment_status || "Not confirmed"}
                  </strong>
                </div>

              </div>

              <Link
                to="/customer/home"
                className="ed-primary-button"
              >
                Continue Exploring
                <ArrowRight size={17} />
              </Link>

            </div>

          ) : (

            /* Ticket Selection */

            <>
              <div className="ed-booking-icon">
                <Ticket size={25} />
              </div>

              <h2>Book Your Tickets</h2>

              <p className="ed-booking-subtitle">
                Select your tickets and enjoy the experience.
              </p>

              <div className="ed-booking-price">
                <span>Price per ticket</span>

                <strong>
                  ₹{formatPrice(ticketPrice)}
                </strong>
              </div>

              <label className="ed-quantity-label">
                Number of tickets
              </label>

              <div className="ed-quantity-selector">

                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || submitting}
                  aria-label="Decrease ticket quantity"
                >
                  <Minus size={18} />
                </button>

                <strong>{quantity}</strong>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={
                    quantity >= maxQuantity || submitting
                  }
                  aria-label="Increase ticket quantity"
                >
                  <Plus size={18} />
                </button>

              </div>

              <div className="ed-booking-summary">

                <div>
                  <span>Ticket Price</span>
                  <strong>
                    ₹{formatPrice(ticketPrice)}
                  </strong>
                </div>

                <div>
                  <span>Quantity</span>
                  <strong>{quantity}</strong>
                </div>

                <div className="ed-booking-total">

                  <span>Total Amount</span>

                  <strong>
                    ₹{formatPrice(totalAmount)}
                  </strong>

                </div>

              </div>

              <button
                type="button"
                className="ed-primary-button"
                disabled={!canBook || submitting}
                onClick={handleBooking}
              >
                {submitting ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="ed-spinner"
                    />

                    Creating Booking...
                  </>
                ) : (
                  <>
                    <Ticket size={18} />

                    {canBook
                      ? "Book Now"
                      : "Booking Unavailable"}

                    {canBook && <ArrowRight size={17} />}
                  </>
                )}
              </button>

              <div className="ed-security-note">
                <ShieldCheck size={17} />

                <span>
                  Final ticket price and availability
                  are validated by the server.
                </span>
              </div>

            </>

          )}

        </aside>

      </div>

    </div>
  );
}