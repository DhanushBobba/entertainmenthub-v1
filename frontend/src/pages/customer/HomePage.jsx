import { useEffect, useState } from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  Film,
  Clapperboard,
  CalendarDays,
  Ticket,
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  RefreshCw,
  ImageOff,
  Radio,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import { getMovies } from "../../api/movieApi";
import { getEvents } from "../../api/eventApi";

import "../../styles/customer/HomePage.css";

/* =========================================
   CURRENCY FORMATTER
========================================= */

function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-IN");
}

/* =========================================
   ENTERTAINMENT IMAGE
========================================= */

function EntertainmentImage({ url, title }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <div className="ch-image-fallback">
        <ImageOff size={30} />
        <span>No image available</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title || "Entertainment"}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/* =========================================
   PREMIUM MOVIE CARD
========================================= */

function MovieCard({ movie, index }) {
  return (
    <article
      className="ch-movie-card"
      style={{
        "--delay": `${Math.min(index, 8) * 70}ms`,
      }}
    >
      <div className="ch-movie-poster">

        <EntertainmentImage
          url={movie.poster_url}
          title={movie.title}
        />

        <div className="ch-poster-overlay" />

        <span
          className={`ch-status ${movie.status}`}
        >
          {movie.status === "now_showing"
            ? "Now Showing"
            : movie.status === "completed"
              ? "Completed"
              : "Coming Soon"}
        </span>

      </div>

      <div className="ch-card-content">

        <h3 title={movie.title}>
          {movie.title}
        </h3>

        <div className="ch-movie-meta">

          <span>
            {movie.language || "Multi-language"}
          </span>

          <span>
            <Clock size={13} />

            {movie.duration_minutes
              ? `${movie.duration_minutes} min`
              : "TBA"}
          </span>

        </div>

        <p className="ch-description">
          {movie.description ||
            "Discover a new cinematic experience."}
        </p>

        <div className="ch-card-footer">
          <div className="ch-price">

            <small>Ticket price</small>

            <strong>
              ₹{formatPrice(movie.ticket_price)}
            </strong>

          </div>
        </div>

        <Link
          to={`/customer/movies/${movie.id}`}
          className="ch-book-button"
        >
          <Ticket size={14} />

          {movie.status === "now_showing"
            ? "Book Now"
            : "View Details"}

          <ArrowRight size={14} />
        </Link>

      </div>
    </article>
  );
}

/* =========================================
   PREMIUM EVENT CARD
========================================= */

function EventCard({ event, index }) {
  return (
    <article
      className="ch-event-card"
      style={{
        "--delay": `${Math.min(index, 8) * 70}ms`,
      }}
    >
      <div className="ch-event-banner">

        <EntertainmentImage
          url={event.banner_url}
          title={event.title}
        />

        <div className="ch-poster-overlay" />

        <span
          className={`ch-status ${event.status}`}
        >
          {event.status === "ongoing"
            ? "Live Now"
            : event.status === "completed"
              ? "Completed"
              : "Upcoming"}
        </span>

      </div>

      <div className="ch-card-content">

        <h3 title={event.title}>
          {event.title}
        </h3>

        <p className="ch-description">
          {event.description ||
            "Enjoy an unforgettable live experience."}
        </p>

        <div className="ch-event-details">

          <span>
            <CalendarDays size={15} />

            {event.event_date ||
              "Date to be announced"}
          </span>

          <span>
            <MapPin size={15} />

            {[event.venue, event.city]
              .filter(Boolean)
              .join(", ") ||
              "Venue to be announced"}
          </span>

        </div>

        <div className="ch-card-footer">
          <div className="ch-price">

            <small>Starting from</small>

            <strong>
              ₹{formatPrice(event.ticket_price)}
            </strong>

          </div>
        </div>

        <Link
          to={`/customer/events/${event.id}`}
          className="ch-book-button"
        >
          <Ticket size={14} />

          {event.status === "completed"
            ? "View Details"
            : "Book Now"}

          <ArrowRight size={14} />
        </Link>

      </div>
    </article>
  );
}

/* =========================================
   REUSABLE PREMIUM ENTERTAINMENT SECTION
========================================= */

function EntertainmentSection({
  title,
  subtitle,
  icon: Icon,
  theme,
  items = [],
  type,
  badge,
  link,
  limit,
  emptyMessage,
}) {
  const Card =
    type === "movie" ? MovieCard : EventCard;

  const displayedItems = limit
    ? items.slice(0, limit)
    : items;

  return (
    <section
      className={`ch-section ch-category-section ${theme}`}
    >

      {/* Section Header */}

      <div className="ch-category-header">

        <div className="ch-category-title-wrapper">

          <div className="ch-category-icon">
            <Icon size={23} />
          </div>

          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

        </div>

        <div className="ch-category-actions">

          {badge && (
            <span className="ch-category-badge">

              <span className="ch-category-dot" />

              {badge}

            </span>
          )}

          <span className="ch-category-count">
            {items.length}{" "}
            {type === "movie" ? "Movies" : "Events"}
          </span>

          {link && (
            <Link
              to={link}
              className="ch-category-view"
            >
              View All
              <ArrowRight size={15} />
            </Link>
          )}

        </div>
      </div>

      <div className="ch-category-divider" />

      {/* Single Row Entertainment Cards */}

      {displayedItems.length > 0 ? (

        <div
          className={
            type === "movie"
              ? "ch-movie-grid"
              : "ch-event-grid"
          }
        >
          {displayedItems.map((item, index) => (
            <Card
              key={item.id}
              {...(type === "movie"
                ? { movie: item }
                : { event: item })}
              index={index}
            />
          ))}
        </div>

      ) : (

        <div className="ch-category-empty">

          <div className="ch-category-empty-icon">
            <Icon size={28} />
          </div>

          <h3>Nothing to display yet</h3>

          <p>{emptyMessage}</p>

        </div>

      )}

    </section>
  );
}

/* =========================================
   CUSTOMER HOME PAGE
========================================= */

export default function HomePage() {
  const { user } = useAuth();

  const [searchParams] = useSearchParams();

  const requestedView = searchParams.get("view");

  const view = ["movies", "events"].includes(
    requestedView
  )
    ? requestedView
    : "home";

  /* Application States */

  const [movies, setMovies] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  /* =====================================
     FETCH ENTERTAINMENT DATA
  ===================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      setLoading(true);
      setError("");

      try {
        const [movieResult, eventResult] =
          await Promise.all([
            getMovies({ page: 1 }),
            getEvents({ page: 1 }),
          ]);

        if (cancelled) return;

        setMovies(movieResult.movies || []);
        setEvents(eventResult.events || []);

      } catch {

        if (!cancelled) {
          setError(
            "Unable to load entertainment. Please try again."
          );
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    }

    loadHomeData();

    return () => {
      cancelled = true;
    };

  }, [refreshKey]);

  /* =====================================
     ENTERTAINMENT SEARCH
  ===================================== */

  const query = search.trim().toLowerCase();

  const filteredMovies = movies.filter((movie) => {
    const visible = [
      "now_showing",
      "upcoming",
      "completed",
    ].includes(movie.status);

    const searchable = [
      movie.title,
      movie.language,
      movie.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return visible && searchable.includes(query);
  });

  const filteredEvents = events.filter((event) => {
    const visible = [
      "upcoming",
      "ongoing",
      "completed",
    ].includes(event.status);

    const searchable = [
      event.title,
      event.city,
      event.venue,
      event.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return visible && searchable.includes(query);
  });

  /* =====================================
     INDIVIDUAL ENTERTAINMENT SECTIONS
  ===================================== */

  const nowShowing = filteredMovies.filter(
    (movie) => movie.status === "now_showing"
  );

  const upcomingMovies = filteredMovies.filter(
    (movie) => movie.status === "upcoming"
  );

  const completedMovies = filteredMovies.filter(
    (movie) => movie.status === "completed"
  );

  const upcomingEvents = filteredEvents.filter(
    (event) => event.status === "upcoming"
  );

  const liveEvents = filteredEvents.filter(
    (event) => event.status === "ongoing"
  );

  const completedEvents = filteredEvents.filter(
    (event) => event.status === "completed"
  );

  /* Customer Information */

  const firstName =
    user?.full_name?.trim().split(/\s+/)[0] || "Guest";

  const showMovies = view !== "events";
  const showEvents = view !== "movies";

  /* =====================================
     QUICK ACCESS CARDS
  ===================================== */

  const quickAccessCards = [
    {
      title: "Movies",
      description: "Discover blockbuster movies",
      icon: Film,
      color: "#a78bfa",
      link: "/customer/home?view=movies",
    },
    {
      title: "Live Events",
      description: "Explore exciting experiences",
      icon: CalendarDays,
      color: "#60a5fa",
      link: "/customer/home?view=events",
    },
    {
      title: "Now Showing",
      description: "Explore available movie tickets",
      icon: Ticket,
      color: "#34d399",
      link: "/customer/home?view=movies",
    },
  ];

  return (
    <div className="customer-home">

      {/* PREMIUM CINEMATIC HERO */}

      <section className="ch-hero ch-image-hero">

        {/* Cinematic Gradient Overlay */}

        <div className="ch-hero-overlay" />

        {/* Hero Content */}

        <div className="ch-hero-content">

          <div className="ch-hero-badge">
            <Sparkles size={14} />
            YOUR ENTERTAINMENT DESTINATION
          </div>

          <p className="ch-welcome">
            Welcome back, {firstName}
          </p>

          <h1>
            {view === "movies"
              ? "Discover Movies."
              : view === "events"
                ? "Experience Live Events."
                : "Discover. Book."}

            <br />

            <span>Enjoy.</span>
          </h1>

          <p className="ch-hero-description">
            Explore blockbuster movies, exciting live
            events and unforgettable experiences.
            Your entertainment journey starts here.
          </p>

          <div className="ch-hero-actions">

            <Link
              to="/customer/home?view=movies"
              className="ch-primary-button"
            >
              <Clapperboard size={17} />
              Explore Movies
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/customer/home?view=events"
              className="ch-secondary-button"
            >
              <CalendarDays size={17} />
              Explore Events
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================
          PREMIUM QUICK ACCESS CARDS
      ===================================== */}

      <div className="ch-quick-grid">

        {quickAccessCards.map(
          (
            {
              title,
              description,
              icon: Icon,
              color,
              link,
            },
            index
          ) => (
            <Link
              key={title}
              to={link}
              className="ch-quick-card"
              style={{
                "--accent": color,
                "--delay": `${index * 100}ms`,
              }}
            >

              <div className="ch-quick-icon">
                <Icon size={21} />
              </div>

              <div className="ch-quick-info">

                <strong>{title}</strong>

                <span>{description}</span>

              </div>

              <ArrowRight
                size={17}
                className="ch-quick-arrow"
              />

            </Link>
          )
        )}

      </div>

      {/* =====================================
          SEARCH AND REFRESH TOOLBAR
      ===================================== */}

      <div className="ch-toolbar">

        <div className="ch-search">

          <Search size={20} />

          <input
            type="search"
            placeholder="Search featured movies, events, languages or locations..."
            aria-label="Search entertainment"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <button
          type="button"
          className="ch-refresh"
          disabled={loading}
          onClick={() =>
            setRefreshKey((value) => value + 1)
          }
        >
          <RefreshCw
            size={17}
            className={
              loading ? "ch-spinning" : ""
            }
          />

          Refresh
        </button>

      </div>

      {/* =====================================
          LOADING AND ERROR STATES
      ===================================== */}

      {loading ? (

        <div className="ch-empty">

          <RefreshCw
            className="ch-spinning"
            size={30}
          />

          <p>Loading entertainment...</p>

        </div>

      ) : error ? (

        <div className="ch-empty">

          <p>{error}</p>

          <button
            type="button"
            className="ch-primary-button"
            onClick={() =>
              setRefreshKey((value) => value + 1)
            }
          >
            Try Again
          </button>

        </div>

      ) : (

        <>

          {/* =====================================
              NOW SHOWING MOVIES — GREEN
          ===================================== */}

          {showMovies && (
            <EntertainmentSection
              title="Now Showing"
              subtitle="Experience the latest blockbuster movies"
              icon={Clapperboard}
              theme="ch-theme-now"
              items={nowShowing}
              type="movie"
              badge="Now Playing"
              link={
                view === "home"
                  ? "/customer/home?view=movies"
                  : null
              }
              limit={
                view === "home" ? 6 : undefined
              }
              emptyMessage="New blockbuster movies will appear here."
            />
          )}

          {/* =====================================
              COMING SOON — PURPLE
          ===================================== */}

          {showMovies && (
            <EntertainmentSection
              title="Coming Soon"
              subtitle="Get ready for upcoming cinematic experiences"
              icon={Clock}
              theme="ch-theme-upcoming"
              items={upcomingMovies}
              type="movie"
              badge="Upcoming"
              limit={
                view === "home" ? 6 : undefined
              }
              emptyMessage="Stay tuned for upcoming movie releases."
            />
          )}

          {/* =====================================
              LIVE SHOWS — RED
          ===================================== */}

          {showEvents && (
            <EntertainmentSection
              title="Live Shows"
              subtitle="Experience the excitement happening right now"
              icon={Radio}
              theme="ch-theme-live"
              items={liveEvents}
              type="event"
              badge={
                liveEvents.length
                  ? "Live Now"
                  : "Live Shows"
              }
              limit={
                view === "home" ? 4 : undefined
              }
              emptyMessage="There are no live shows at the moment."
            />
          )}

          {/* =====================================
              UPCOMING EVENTS — BLUE
          ===================================== */}

          {showEvents && (
            <EntertainmentSection
              title="Upcoming Events"
              subtitle="Discover unforgettable experiences near you"
              icon={CalendarDays}
              theme="ch-theme-events"
              items={upcomingEvents}
              type="event"
              badge="Upcoming Events"
              link={
                view === "home"
                  ? "/customer/home?view=events"
                  : null
              }
              limit={
                view === "home" ? 4 : undefined
              }
              emptyMessage="New and exciting events are coming soon."
            />
          )}

          {/* =====================================
              COMPLETED MOVIES — GOLD
          ===================================== */}

          {showMovies && (
            <EntertainmentSection
              title="Completed Movies"
              subtitle="Explore previously featured movies"
              icon={CheckCircle2}
              theme="ch-theme-completed"
              items={completedMovies}
              type="movie"
              badge="Archive"
              limit={
                view === "home" ? 6 : undefined
              }
              emptyMessage="Completed movies will appear here."
            />
          )}

          {/* =====================================
              COMPLETED EVENTS — GOLD
          ===================================== */}

          {showEvents && (
            <EntertainmentSection
              title="Completed Events"
              subtitle="Explore past entertainment experiences"
              icon={CheckCircle2}
              theme="ch-theme-completed"
              items={completedEvents}
              type="event"
              badge="Archive"
              limit={
                view === "home" ? 4 : undefined
              }
              emptyMessage="Previously completed events will appear here."
            />
          )}

        </>

      )}

    </div>
  );
}