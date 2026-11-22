import { useEffect, useState } from "react";

import {
  CalendarDays,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Clock,
  MapPin,
  Users,
  IndianRupee,
  CalendarCheck,
  CalendarX,
  Activity,
  ArrowUpRight,
  ImageOff,
  Building2,
  Ticket,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../api/eventApi";

import { getCategories } from "../../api/categoryApi";

import "./EventsPage.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  category_id: "",
  venue: "",
  city: "",
  organizer: "",
  event_date: "",
  event_time: "",
  ticket_price: "",
  total_seats: "",
  banner_url: "",
  status: "upcoming",
};

const STATUSES = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function getError(error, fallback) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return fallback;
}

function EventBanner({ url, title }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <div className="ep-banner-placeholder">
        <ImageOff size={38} />
        <span>No event banner</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${title} banner`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const [firstPage, categoryResponse] = await Promise.all([
        getEvents({ page: 1, limit: 20 }),
        getCategories(),
      ]);

      const allEvents = [...(firstPage.events || [])];
      const total = Number(firstPage.total ?? allEvents.length);
      const limit = Number(firstPage.limit || 20);

      for (
        let page = 2;
        page <= Math.ceil(total / limit);
        page++
      ) {
        const response = await getEvents({ page, limit });

        allEvents.push(...(response.events || []));
      }

      setEvents(allEvents);
      setCategories(categoryResponse.categories || []);
    } catch (error) {
      const message = getError(error, "Unable to load events");

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingId(event.id);

    setForm({
      title: event.title || "",
      description: event.description || "",
      category_id: event.category_id || "",
      venue: event.venue || "",
      city: event.city || "",
      organizer: event.organizer || "",
      event_date: event.event_date || "",
      event_time: event.event_time?.slice(0, 5) || "",
      ticket_price: event.ticket_price ?? "",
      total_seats: event.total_seats ?? "",
      banner_url: event.banner_url || "",
      status: event.status || "upcoming",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const price = Number(form.ticket_price);
    const seats = Number(form.total_seats);

    if (!form.title.trim()) {
      toast.error("Event title is required");
      return;
    }

    if (!form.venue.trim() || !form.city.trim()) {
      toast.error("Venue and city are required");
      return;
    }

    if (
      form.ticket_price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast.error("Enter a valid ticket price");
      return;
    }

    if (!Number.isInteger(seats) || seats < 1) {
      toast.error("Enter a valid seat capacity");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: form.category_id,
        venue: form.venue.trim(),
        city: form.city.trim(),
        organizer: form.organizer.trim(),
        event_date: form.event_date,
        event_time: form.event_time,
        ticket_price: price,
        total_seats: seats,
        banner_url: form.banner_url.trim() || null,
        status: form.status,
      };

      if (editingId) {
        await updateEvent(editingId, payload);

        toast.success("Event updated successfully");
      } else {
        await createEvent(payload);

        toast.success("Event created successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });

      await loadEvents();
    } catch (error) {
      toast.error(getError(error, "Unable to save event"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?`
    );

    if (!confirmed) return;

    try {
      setBusyId(event.id);

      await deleteEvent(event.id);

      toast.success("Event removed successfully");

      await loadEvents();
    } catch (error) {
      toast.error(getError(error, "Unable to delete event"));
    } finally {
      setBusyId(null);
    }
  };

  const getCategoryName = (event) => {
    return (
      event.categories?.name ||
      categories.find(
        (category) => category.id === event.category_id
      )?.name ||
      "Uncategorized"
    );
  };

  const countByStatus = (status) =>
    events.filter((event) => event.status === status).length;

  const summaryCards = [
    {
      title: "Total Events",
      value: events.length,
      icon: CalendarDays,
      color: "#a78bfa",
      filter: "all",
    },
    {
      title: "Upcoming",
      value: countByStatus("upcoming"),
      icon: Clock,
      color: "#60a5fa",
      filter: "upcoming",
    },
    {
      title: "Ongoing",
      value: countByStatus("ongoing"),
      icon: Activity,
      color: "#34d399",
      filter: "ongoing",
    },
    {
      title: "Completed",
      value: countByStatus("completed"),
      icon: CalendarCheck,
      color: "#fbbf24",
      filter: "completed",
    },
    {
      title: "Cancelled",
      value: countByStatus("cancelled"),
      icon: CalendarX,
      color: "#fb7185",
      filter: "cancelled",
    },
  ];

  const filteredEvents = events.filter((event) => {
    const matchesSearch = `
      ${event.title}
      ${event.venue || ""}
      ${event.city || ""}
      ${event.organizer || ""}
    `
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      event.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" ||
      event.category_id === categoryFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory
    );
  });

  return (
    <div className="events-page">
      {/* Page Header */}

      <section className="ep-hero">
        <div>
          <span className="ep-eyebrow">
            <CalendarDays size={16} />
            EVENT MANAGEMENT
          </span>

          <h1>
            Entertainment <span>Events</span>
          </h1>

          <p>
            Create and manage concerts, live shows,
            festivals and entertainment experiences.
          </p>
        </div>

        <button
          className="ep-primary-button"
          onClick={openAddModal}
        >
          <Plus size={19} />
          Add Event
        </button>
      </section>

      {/* Statistics Cards */}

      <div className="ep-summary-grid">
        {summaryCards.map(
          ({ title, value, icon: Icon, color, filter }, index) => (
            <button
              type="button"
              key={title}
              className={`ep-stat-card ${
                statusFilter === filter ? "selected" : ""
              }`}
              style={{
                "--accent": color,
                "--delay": `${index * 80}ms`,
              }}
              onClick={() => setStatusFilter(filter)}
              aria-pressed={statusFilter === filter}
            >
              <div className="ep-stat-top">
                <div className="ep-stat-icon">
                  <Icon size={23} />
                </div>

                <ArrowUpRight
                  className="ep-stat-arrow"
                  size={18}
                />
              </div>

              <span>{title}</span>
              <strong>{value}</strong>
            </button>
          )
        )}
      </div>

      {/* Search and Filters */}

      <div className="ep-toolbar">
        <div className="ep-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search events, venue or city..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="ep-filters">
          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>

            {STATUSES.map((status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}
          </select>

          <button
            className="ep-secondary-button"
            disabled={loading}
            onClick={loadEvents}
          >
            <RefreshCw
              size={17}
              className={loading ? "ep-spinner" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="ep-section-heading">
        <h2>Event Collection</h2>
        <span>{filteredEvents.length} Events</span>
      </div>

      {/* Event Cards */}

      {loading ? (
        <div className="ep-empty">
          <RefreshCw size={36} className="ep-spinner" />
          <h3>Loading events...</h3>
        </div>
      ) : error ? (
        <div className="ep-empty">
          <h3>{error}</h3>

          <button
            className="ep-primary-button"
            onClick={loadEvents}
          >
            Try Again
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="ep-empty">
          <CalendarDays size={48} />

          <h3>No events found</h3>

          <p>Add an event or change your filters.</p>

          <button
            className="ep-primary-button"
            onClick={openAddModal}
          >
            <Plus size={17} />
            Add Event
          </button>
        </div>
      ) : (
        <div className="ep-event-grid">
          {filteredEvents.map((event, index) => (
            <article
              key={event.id}
              className="ep-event-card"
              style={{
                "--delay": `${Math.min(index, 8) * 70}ms`,
              }}
            >
              <div className="ep-banner">
                <EventBanner
                  url={event.banner_url}
                  title={event.title}
                />

                <div className="ep-banner-gradient" />

                <span className={`ep-status ${event.status}`}>
                  {event.status}
                </span>

                <span className="ep-category-tag">
                  {getCategoryName(event)}
                </span>
              </div>

              <div className="ep-event-content">
                <h3 title={event.title}>{event.title}</h3>

                <p className="ep-description">
                  {event.description || "No description available"}
                </p>

                <div className="ep-event-details">
                  <div>
                    <CalendarDays size={17} />
                    <span>{event.event_date || "Not scheduled"}</span>
                  </div>

                  <div>
                    <Clock size={17} />
                    <span>
                      {event.event_time?.slice(0, 5) || "—"}
                    </span>
                  </div>

                  <div className="ep-detail-full">
                    <MapPin size={17} />
                    <span>
                      {event.venue}, {event.city}
                    </span>
                  </div>

                  <div className="ep-detail-full">
                    <Building2 size={17} />
                    <span>
                      {event.organizer || "Organizer not specified"}
                    </span>
                  </div>
                </div>

                <div className="ep-capacity">
                  <div className="ep-capacity-icon">
                    <Users size={20} />
                  </div>

                  <div>
                    <small>Seat Capacity</small>
                    <strong>{event.total_seats} Seats</strong>
                  </div>
                </div>

                <div className="ep-card-footer">
                  <div className="ep-price">
                    <small>Ticket Price</small>

                    <strong>
                      <IndianRupee size={18} />

                      {Number(
                        event.ticket_price || 0
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="ep-actions">
                    <button
                      className="ep-edit"
                      title="Edit event"
                      aria-label={`Edit ${event.title}`}
                      disabled={busyId !== null}
                      onClick={() => openEditModal(event)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      className="ep-delete"
                      title="Delete event"
                      aria-label={`Delete ${event.title}`}
                      disabled={busyId !== null}
                      onClick={() => handleDelete(event)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}

      {showModal && (
        <div
          className="ep-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="ep-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ep-modal-header">
              <div className="ep-modal-icon">
                <CalendarDays size={25} />
              </div>

              <button
                className="ep-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            <h2 id="event-modal-title">
              {editingId ? "Edit Event" : "Create New Event"}
            </h2>

            <p className="ep-modal-subtitle">
              Configure your entertainment event details.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="ep-form-grid">
                <label className="ep-field">
                  Event Title *
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter event title"
                    autoFocus
                    required
                  />
                </label>

                <label className="ep-field">
                  Category *
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>

                    {categories
                      .filter(
                        (category) =>
                          category.is_active ||
                          category.id === form.category_id
                      )
                      .map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="ep-field ep-full-width">
                  Description
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe your event..."
                  />
                </label>

                <label className="ep-field">
                  Venue *
                  <input
                    name="venue"
                    value={form.venue}
                    onChange={handleChange}
                    placeholder="Event venue"
                    required
                  />
                </label>

                <label className="ep-field">
                  City *
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Hyderabad"
                    required
                  />
                </label>

                <label className="ep-field ep-full-width">
                  Organizer
                  <input
                    name="organizer"
                    value={form.organizer}
                    onChange={handleChange}
                    placeholder="Organizer or company name"
                  />
                </label>

                <label className="ep-field">
                  Event Date *
                  <input
                    type="date"
                    name="event_date"
                    value={form.event_date}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="ep-field">
                  Event Time *
                  <input
                    type="time"
                    name="event_time"
                    value={form.event_time}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="ep-field">
                  Ticket Price (₹) *
                  <input
                    type="number"
                    name="ticket_price"
                    min="0"
                    step="0.01"
                    value={form.ticket_price}
                    onChange={handleChange}
                    placeholder="999"
                    required
                  />
                </label>

                <label className="ep-field">
                  Total Seats *
                  <input
                    type="number"
                    name="total_seats"
                    min="1"
                    step="1"
                    value={form.total_seats}
                    onChange={handleChange}
                    placeholder="500"
                    required
                  />
                </label>

                <label className="ep-field ep-full-width">
                  Banner URL
                  <input
                    type="url"
                    name="banner_url"
                    value={form.banner_url}
                    onChange={handleChange}
                    placeholder="https://example.com/banner.jpg"
                  />
                </label>

                {form.banner_url && (
                  <div className="ep-banner-preview ep-full-width">
                    <EventBanner
                      url={form.banner_url}
                      title={form.title}
                    />
                  </div>
                )}

                <label className="ep-field ep-full-width">
                  Event Status *
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {STATUSES.map((status) => (
                      <option
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="ep-modal-footer">
                <button
                  type="button"
                  className="ep-secondary-button"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ep-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="ep-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Ticket size={17} />
                      {editingId ? "Update Event" : "Create Event"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}