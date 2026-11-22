import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Tags,
  CheckCircle2,
  CircleOff,
  ArrowUpRight,
  Layers,
  PackageOpen,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categoryApi";

import "./CategoriesPage.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  is_active: true,
};

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadCategories = async () => {
    try {
      setLoading(true);

      const response = await getCategories();

      setCategories(response.categories || []);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to load categories")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingId(category.id);

    setForm({
      name: category.name,
      description: category.description || "",
      is_active: Boolean(category.is_active),
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
    const { name, value, checked, type } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        is_active: form.is_active,
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        toast.success("Category updated successfully");
      } else {
        await createCategory(payload);
        toast.success("Category created successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });

      await loadCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to save category")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setBusyId(category.id);

      await deleteCategory(category.id);

      toast.success("Category deleted successfully");

      await loadCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to delete category")
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (category) => {
    try {
      setBusyId(category.id);

      await updateCategory(category.id, {
        is_active: !category.is_active,
      });

      toast.success(
        category.is_active
          ? "Category deactivated"
          : "Category activated"
      );

      await loadCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to update category status")
      );
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = categories.filter(
    (category) => category.is_active
  ).length;

  const inactiveCount = categories.length - activeCount;

  const summaryCards = [
    {
      title: "Total Categories",
      value: categories.length,
      icon: Tags,
      color: "#a78bfa",
      description: "All entertainment categories",
      filter: "all",
    },
    {
      title: "Active Categories",
      value: activeCount,
      icon: CheckCircle2,
      color: "#34d399",
      description: "Currently available",
      filter: "active",
    },
    {
      title: "Inactive Categories",
      value: inactiveCount,
      icon: CircleOff,
      color: "#fb7185",
      description: "Currently disabled",
      filter: "inactive",
    },
  ];

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = `${category.name} ${
      category.description || ""
    }`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && category.is_active) ||
      (statusFilter === "inactive" && !category.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="premium-categories">
      <div className="pc-hero">
        <div>
          <span className="pc-eyebrow">
            <Layers size={15} />
            CONTENT MANAGEMENT
          </span>

          <h1>
            Entertainment <span>Categories</span>
          </h1>

          <p>
            Organize and manage your movies and entertainment
            events with categories.
          </p>
        </div>

        <button
          className="pc-primary-button"
          onClick={openAddModal}
        >
          <Plus size={19} />
          Add Category
        </button>
      </div>

      <div className="pc-summary-grid">
        {summaryCards.map(
          (
            {
              title,
              value,
              icon: Icon,
              color,
              description,
              filter,
            },
            index
          ) => (
            <button
              type="button"
              key={title}
              className={`pc-summary-card ${
                statusFilter === filter ? "selected" : ""
              }`}
              style={{
                "--accent": color,
                "--delay": `${index * 100}ms`,
              }}
              onClick={() => setStatusFilter(filter)}
              aria-pressed={statusFilter === filter}
            >
              <div className="pc-card-top">
                <div className="pc-summary-icon">
                  <Icon size={24} />
                </div>

                <ArrowUpRight
                  size={19}
                  className="pc-card-arrow"
                />
              </div>

              <span className="pc-summary-label">{title}</span>
              <strong className="pc-summary-value">{value}</strong>
              <span className="pc-summary-description">
                {description}
              </span>
            </button>
          )
        )}
      </div>

      <section className="pc-panel">
        <div className="pc-panel-header">
          <div>
            <h2>
              <Tags size={21} />
              Categories Directory
            </h2>

            <p>Manage all existing categories</p>
          </div>

          <span className="pc-count">
            {filteredCategories.length} Categories
          </span>
        </div>

        <div className="pc-toolbar">
          <div className="pc-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              placeholder="Search categories..."
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="pc-filter-actions">
            <select
              className="pc-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter category status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              className="pc-secondary-button"
              onClick={loadCategories}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={loading ? "pc-spinner" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="pc-empty">
            <RefreshCw size={32} className="pc-spinner" />
            <h3>Loading categories...</h3>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="pc-empty">
            <div className="pc-empty-icon">
              <PackageOpen size={36} />
            </div>

            <h3>No categories found</h3>

            <p>
              {search || statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Create your first entertainment category."}
            </p>

            {!search && statusFilter === "all" && (
              <button
                className="pc-primary-button"
                onClick={openAddModal}
              >
                <Plus size={16} />
                Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="pc-table-wrapper">
            <table className="pc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map((category, index) => (
                  <tr key={category.id}>
                    <td className="pc-row-number">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td>
                      <div className="pc-category-name">
                        <div className="pc-category-avatar">
                          <Tags size={20} />
                        </div>
                        <strong>{category.name}</strong>
                      </div>
                    </td>

                    <td className="pc-description">
                      {category.description || "No description"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className={`pc-status ${
                          category.is_active ? "active" : "inactive"
                        }`}
                        disabled={busyId !== null}
                        onClick={() => handleStatusChange(category)}
                        title="Click to change status"
                      >
                        <span />
                        {category.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td>
                      <div className="pc-actions">
                        <button
                          className="pc-icon-button pc-edit"
                          title="Edit category"
                          aria-label={`Edit ${category.name}`}
                          disabled={busyId !== null}
                          onClick={() => openEditModal(category)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="pc-icon-button pc-delete"
                          title="Delete category"
                          aria-label={`Delete ${category.name}`}
                          disabled={busyId !== null}
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div
          className="pc-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="pc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pc-modal-header">
              <div className="pc-modal-icon">
                {editingId ? (
                  <Pencil size={23} />
                ) : (
                  <Plus size={25} />
                )}
              </div>

              <button
                className="pc-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            <h2 id="category-modal-title">
              {editingId ? "Edit Category" : "Create Category"}
            </h2>

            <p className="pc-modal-subtitle">
              {editingId
                ? "Update your category information."
                : "Add a new entertainment category."}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="pc-form-group">
                <label htmlFor="category-name">
                  Category Name <span>*</span>
                </label>

                <input
                  id="category-name"
                  name="name"
                  placeholder="e.g. Action, Comedy, Music"
                  value={form.name}
                  onChange={handleChange}
                  autoFocus
                  required
                />
              </div>

              <div className="pc-form-group">
                <label htmlFor="category-description">
                  Description
                </label>

                <textarea
                  id="category-description"
                  name="description"
                  rows={4}
                  placeholder="Describe this category..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <label className="pc-toggle-container">
                <div>
                  <strong>Active Category</strong>
                  <small>Make this category available</small>
                </div>

                <div className="pc-toggle">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  <span className="pc-toggle-slider" />
                </div>
              </label>

              <div className="pc-modal-footer">
                <button
                  type="button"
                  className="pc-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pc-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="pc-spinner"
                      />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Update Category"
                  ) : (
                    "Create Category"
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