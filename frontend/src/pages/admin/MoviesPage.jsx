import { useEffect, useState } from "react";

import {
  Film,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  CalendarDays,
  Clock,
  IndianRupee,
  PlayCircle,
  Clapperboard,
  ArrowUpRight,
  Globe,
  ImageOff,
  CircleCheck,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../../api/movieApi";

import { getCategories } from "../../api/categoryApi";

import "./MoviesPage.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  category_id: "",
  language: "Telugu",
  duration_minutes: "",
  release_date: "",
  director: "",
  cast_members: "",
  poster_url: "",
  trailer_url: "",
  ticket_price: "",
  status: "upcoming",
};

const LANGUAGES = [
  "Telugu",
  "Hindi",
  "English",
  "Tamil",
  "Malayalam",
  "Kannada",
  "Other",
];

const STATUSES = [
  { value: "upcoming", label: "Upcoming" },
  { value: "now_showing", label: "Now Showing" },
  { value: "completed", label: "Completed" },
  { value: "inactive", label: "Inactive" },
];

function getError(error, fallback) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return fallback;
}

function formatStatus(status) {
  return STATUSES.find((item) => item.value === status)?.label
    || status;
}

function MoviePoster({ url, title }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <div className="mp-poster-fallback">
        <ImageOff size={40} />
        <span>No poster available</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${title} poster`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [firstPage, categoryResponse] = await Promise.all([
        getMovies({ page: 1, limit: 20 }),
        getCategories(),
      ]);

      const allMovies = [...(firstPage.movies || [])];
      const total = Number(firstPage.total ?? allMovies.length);
      const limit = Number(firstPage.limit || 20);

      for (
        let page = 2;
        page <= Math.ceil(total / limit);
        page++
      ) {
        const response = await getMovies({ page, limit });
        allMovies.push(...(response.movies || []));
      }

      setMovies(allMovies);
      setCategories(categoryResponse.categories || []);
    } catch (error) {
      const message = getError(error, "Unable to load movies");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (movie) => {
    setEditingId(movie.id);

    setForm({
      title: movie.title || "",
      description: movie.description || "",
      category_id: movie.category_id || "",
      language: movie.language || "Telugu",
      duration_minutes: movie.duration_minutes ?? "",
      release_date: movie.release_date || "",
      director: movie.director || "",
      cast_members: Array.isArray(movie.cast_members)
        ? movie.cast_members.join(", ")
        : movie.cast_members || "",
      poster_url: movie.poster_url || "",
      trailer_url: movie.trailer_url || "",
      ticket_price: movie.ticket_price ?? "",
      status: movie.status || "upcoming",
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

    if (!form.title.trim()) {
      toast.error("Movie title is required");
      return;
    }

    const duration = Number(form.duration_minutes);
    const price = Number(form.ticket_price);

    if (!Number.isInteger(duration) || duration <= 0) {
      toast.error("Enter a valid movie duration");
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

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: form.category_id,
        language: form.language,
        duration_minutes: duration,
        release_date: form.release_date,
        director: form.director.trim(),
        cast_members: form.cast_members.trim(),
        poster_url: form.poster_url.trim() || null,
        trailer_url: form.trailer_url.trim() || null,
        ticket_price: price,
        status: form.status,
      };

      if (editingId) {
        await updateMovie(editingId, payload);
        toast.success("Movie updated successfully");
      } else {
        await createMovie(payload);
        toast.success("Movie added successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });

      await loadData();
    } catch (error) {
      toast.error(getError(error, "Unable to save movie"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movie) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${movie.title}"?`
    );

    if (!confirmed) return;

    try {
      setBusyId(movie.id);

      await deleteMovie(movie.id);

      toast.success("Movie removed successfully");

      await loadData();
    } catch (error) {
      toast.error(getError(error, "Unable to delete movie"));
    } finally {
      setBusyId(null);
    }
  };

  const getCategoryName = (movie) => {
    return (
      movie.categories?.name ||
      categories.find(
        (category) => category.id === movie.category_id
      )?.name ||
      "Uncategorized"
    );
  };

  const summaryCards = [
    {
      title: "Total Movies",
      value: movies.length,
      icon: Film,
      color: "#a78bfa",
      filter: "all",
    },
    {
      title: "Now Showing",
      value: movies.filter(
        (movie) => movie.status === "now_showing"
      ).length,
      icon: PlayCircle,
      color: "#34d399",
      filter: "now_showing",
    },
    {
      title: "Upcoming Movies",
      value: movies.filter(
        (movie) => movie.status === "upcoming"
      ).length,
      icon: CalendarDays,
      color: "#60a5fa",
      filter: "upcoming",
    },
    {
      title: "Completed Movies",
      value: movies.filter(
        (movie) => movie.status === "completed"
      ).length,
      icon: CircleCheck,
      color: "#fbbf24",
      filter: "completed",
    },
  ];

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = `${movie.title} ${
      movie.director || ""
    } ${movie.language || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      movie.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" ||
      movie.category_id === categoryFilter;

    const matchesLanguage =
      languageFilter === "all" ||
      movie.language === languageFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesLanguage
    );
  });

  return (
    <div className="movies-page">
      {/* Page Header */}

      <section className="mp-hero">
        <div>
          <span className="mp-eyebrow">
            <Clapperboard size={16} />
            CONTENT MANAGEMENT
          </span>

          <h1>
            Movies <span>Management</span>
          </h1>

          <p>
            Manage your movie collection, ticket prices
            and upcoming releases.
          </p>
        </div>

        <button
          className="mp-primary-button"
          onClick={openAddModal}
        >
          <Plus size={19} />
          Add Movie
        </button>
      </section>

      {/* Summary Cards */}

      <div className="mp-summary-grid">
        {summaryCards.map(
          ({ title, value, icon: Icon, color, filter }, index) => (
            <button
              type="button"
              key={title}
              className={`mp-stat-card ${
                statusFilter === filter ? "selected" : ""
              }`}
              style={{
                "--accent": color,
                "--delay": `${index * 80}ms`,
              }}
              onClick={() => setStatusFilter(filter)}
              aria-pressed={statusFilter === filter}
            >
              <div className="mp-stat-top">
                <div className="mp-stat-icon">
                  <Icon size={23} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="mp-stat-arrow"
                />
              </div>

              <span>{title}</span>
              <strong>{value}</strong>
            </button>
          )
        )}
      </div>

      {/* Search and Filters */}

      <div className="mp-toolbar">
        <div className="mp-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search movies..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="mp-filters">
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
            value={languageFilter}
            onChange={(event) =>
              setLanguageFilter(event.target.value)
            }
            aria-label="Filter by language"
          >
            <option value="all">All Languages</option>

            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
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
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <button
            className="mp-secondary-button"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "mp-spinner" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="mp-section-heading">
        <h2>Movie Collection</h2>

        <span>{filteredMovies.length} Movies</span>
      </div>

      {/* Movie Cards */}

      {loading ? (
        <div className="mp-empty-state">
          <RefreshCw size={34} className="mp-spinner" />
          <h3>Loading movies...</h3>
        </div>
      ) : error ? (
        <div className="mp-empty-state">
          <h3>{error}</h3>
          <button
            className="mp-primary-button"
            onClick={loadData}
          >
            Try Again
          </button>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="mp-empty-state">
          <Film size={48} />

          <h3>No movies found</h3>

          <p>Add movies or change your filters.</p>

          <button
            className="mp-primary-button"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Movie
          </button>
        </div>
      ) : (
        <div className="mp-movie-grid">
          {filteredMovies.map((movie, index) => (
            <article
              className="mp-movie-card"
              key={movie.id}
              style={{
                "--delay": `${Math.min(index, 8) * 70}ms`,
              }}
            >
              <div className="mp-poster">
                <MoviePoster
                  url={movie.poster_url}
                  title={movie.title}
                />

                <div className="mp-poster-gradient" />

                <span className={`mp-status ${movie.status}`}>
                  {formatStatus(movie.status)}
                </span>

                <span className="mp-category-tag">
                  {getCategoryName(movie)}
                </span>
              </div>

              <div className="mp-movie-content">
                <h3 title={movie.title}>{movie.title}</h3>

                <div className="mp-movie-meta">
                  <span>
                    <Globe size={14} />
                    {movie.language}
                  </span>

                  <span>
                    <Clock size={14} />
                    {movie.duration_minutes} min
                  </span>
                </div>

                <p className="mp-description">
                  {movie.description || "No description available"}
                </p>

                <div className="mp-release">
                  <CalendarDays size={15} />
                  {movie.release_date || "Not announced"}
                </div>

                <div className="mp-card-footer">
                  <div className="mp-price">
                    <small>Ticket Price</small>

                    <strong>
                      <IndianRupee size={18} />
                      {Number(movie.ticket_price || 0)
                        .toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="mp-card-actions">
                    <button
                      className="mp-edit"
                      title="Edit movie"
                      aria-label={`Edit ${movie.title}`}
                      disabled={busyId !== null}
                      onClick={() => openEditModal(movie)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      className="mp-delete"
                      title="Delete movie"
                      aria-label={`Delete ${movie.title}`}
                      disabled={busyId !== null}
                      onClick={() => handleDelete(movie)}
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

      {/* Add / Edit Movie Modal */}

      {showModal && (
        <div className="mp-modal-overlay" onClick={closeModal}>
          <div
            className="mp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="movie-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mp-modal-header">
              <div className="mp-modal-icon">
                <Film size={25} />
              </div>

              <button
                className="mp-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={23} />
              </button>
            </div>

            <h2 id="movie-modal-title">
              {editingId ? "Edit Movie" : "Add New Movie"}
            </h2>

            <p className="mp-modal-subtitle">
              Enter the movie information below.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mp-form-grid">
                <label className="mp-field">
                  Movie Title *
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter movie title"
                    autoFocus
                    required
                  />
                </label>

                <label className="mp-field">
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

                <label className="mp-field mp-full-width">
                  Description
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter movie description"
                  />
                </label>

                <label className="mp-field">
                  Language *
                  <select
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mp-field">
                  Duration (Minutes) *
                  <input
                    type="number"
                    name="duration_minutes"
                    min="1"
                    value={form.duration_minutes}
                    onChange={handleChange}
                    placeholder="150"
                    required
                  />
                </label>

                <label className="mp-field">
                  Release Date *
                  <input
                    type="date"
                    name="release_date"
                    value={form.release_date}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="mp-field">
                  Ticket Price (₹) *
                  <input
                    type="number"
                    name="ticket_price"
                    min="0"
                    step="0.01"
                    value={form.ticket_price}
                    onChange={handleChange}
                    placeholder="250"
                    required
                  />
                </label>

                <label className="mp-field">
                  Director
                  <input
                    name="director"
                    value={form.director}
                    onChange={handleChange}
                    placeholder="Director name"
                  />
                </label>

                <label className="mp-field">
                  Cast Members
                  <input
                    name="cast_members"
                    value={form.cast_members}
                    onChange={handleChange}
                    placeholder="Actor 1, Actor 2"
                  />
                </label>

                <label className="mp-field mp-full-width">
                  Poster URL
                  <input
                    type="url"
                    name="poster_url"
                    value={form.poster_url}
                    onChange={handleChange}
                    placeholder="https://example.com/poster.jpg"
                  />
                </label>

                {form.poster_url && (
                  <div className="mp-preview mp-full-width">
                    <MoviePoster
                      url={form.poster_url}
                      title={form.title}
                    />
                  </div>
                )}

                <label className="mp-field mp-full-width">
                  Trailer URL
                  <input
                    type="url"
                    name="trailer_url"
                    value={form.trailer_url}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </label>

                <label className="mp-field mp-full-width">
                  Movie Status *
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

              <div className="mp-modal-footer">
                <button
                  type="button"
                  className="mp-secondary-button"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="mp-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="mp-spinner"
                      />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Update Movie"
                  ) : (
                    "Create Movie"
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