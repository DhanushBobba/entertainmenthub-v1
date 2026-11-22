import { useEffect, useState } from "react";

import {
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  ShieldOff,
  ArrowUpRight,
  Mail,
  Phone,
  CalendarDays,
  User,
  X,
  Hash,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getUsers,
  updateUserStatus,
} from "../../api/userApi";

import "./CustomersPage.css";

function getError(error, fallback) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return fallback;
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

function CustomerAvatar({ customer, large = false }) {
  const [failed, setFailed] = useState(false);

  const initials = (customer.full_name || "Customer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className={`cm-avatar ${large ? "large" : ""}`}>
      {customer.avatar_url && !failed ? (
        <img
          src={customer.avatar_url}
          alt={`${customer.full_name || "Customer"} avatar`}
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const firstPage = await getUsers({
        page: 1,
        limit: 20,
      });

      const allUsers = [...(firstPage.users || [])];

      const total = Number(
        firstPage.total ?? allUsers.length
      );

      const limit = Number(firstPage.limit || 20);

      for (
        let page = 2;
        page <= Math.ceil(total / limit);
        page++
      ) {
        const response = await getUsers({
          page,
          limit,
        });

        allUsers.push(...(response.users || []));
      }

      setCustomers(
        allUsers.filter(
          (customer) => customer.role === "customer"
        )
      );
    } catch (error) {
      const message = getError(
        error,
        "Unable to load customers"
      );

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleStatusChange = async (customer) => {
    if (busyId !== null) return;

    const nextStatus = !customer.is_active;

    const action = nextStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${
        customer.full_name || customer.email
      }?`
    );

    if (!confirmed) return;

    try {
      setBusyId(customer.id);

      await updateUserStatus(
        customer.id,
        nextStatus
      );

      setCustomers((previous) =>
        previous.map((item) =>
          item.id === customer.id
            ? { ...item, is_active: nextStatus }
            : item
        )
      );

      setSelectedCustomer((previous) =>
        previous?.id === customer.id
          ? { ...previous, is_active: nextStatus }
          : previous
      );

      toast.success(
        nextStatus
          ? "Customer activated successfully"
          : "Customer deactivated successfully"
      );
    } catch (error) {
      toast.error(
        getError(error, "Unable to update customer status")
      );
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = customers.filter(
    (customer) => customer.is_active
  ).length;

  const inactiveCount = customers.length - activeCount;

  const summaryCards = [
    {
      title: "Total Customers",
      value: customers.length,
      icon: Users,
      color: "#a78bfa",
      description: "Registered customers",
      filter: "all",
    },
    {
      title: "Active Customers",
      value: activeCount,
      icon: UserCheck,
      color: "#34d399",
      description: "Accounts currently enabled",
      filter: "active",
    },
    {
      title: "Inactive Customers",
      value: inactiveCount,
      icon: UserX,
      color: "#fb7185",
      description: "Accounts currently disabled",
      filter: "inactive",
    },
  ];

  const filteredCustomers = customers.filter((customer) => {
    const searchableText = `
      ${customer.full_name || ""}
      ${customer.email || ""}
      ${customer.phone || ""}
      ${customer.id || ""}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(
      search.trim().toLowerCase()
    );

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && customer.is_active) ||
      (statusFilter === "inactive" && !customer.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="customers-page">
      {/* Page Header */}

      <section className="cm-hero">
        <div>
          <span className="cm-eyebrow">
            <Users size={16} />
            USER MANAGEMENT
          </span>

          <h1>
            Customer <span>Management</span>
          </h1>

          <p>
            Manage registered customers and monitor
            account activity across EntertainHub.
          </p>
        </div>

        <button
          className="cm-primary-button"
          disabled={loading || busyId !== null}
          onClick={loadCustomers}
        >
          <RefreshCw
            size={17}
            className={loading ? "cm-spinner" : ""}
          />

          Refresh Data
        </button>
      </section>

      {/* Summary Cards */}

      <div className="cm-summary-grid">
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
              className={`cm-stat-card ${
                statusFilter === filter ? "selected" : ""
              }`}
              style={{
                "--accent": color,
                "--delay": `${index * 100}ms`,
              }}
              onClick={() => setStatusFilter(filter)}
              aria-pressed={statusFilter === filter}
            >
              <div className="cm-stat-top">
                <div className="cm-stat-icon">
                  <Icon size={25} />
                </div>

                <ArrowUpRight
                  size={19}
                  className="cm-stat-arrow"
                />
              </div>

              <span className="cm-stat-label">
                {title}
              </span>

              <strong>{value}</strong>

              <span className="cm-stat-description">
                {description}
              </span>
            </button>
          )
        )}
      </div>

      {/* Customer Directory */}

      <section className="cm-panel">
        <div className="cm-panel-header">
          <div>
            <h2>
              <Users size={22} />
              Customer Directory
            </h2>

            <p>
              View and manage registered entertainment customers.
            </p>
          </div>

          <span className="cm-count">
            {filteredCustomers.length} Customers
          </span>
        </div>

        {/* Search and Filters */}

        <div className="cm-toolbar">
          <div className="cm-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search name, email or phone..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              aria-label="Search customers"
            />

            {search && (
              <button
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="cm-filters">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter customer status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              className="cm-secondary-button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Customer Table */}

        {loading ? (
          <div className="cm-empty">
            <RefreshCw size={35} className="cm-spinner" />
            <h3>Loading customers...</h3>
          </div>
        ) : error ? (
          <div className="cm-empty">
            <UserX size={40} />
            <h3>{error}</h3>

            <button
              className="cm-primary-button"
              onClick={loadCustomers}
            >
              Try Again
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="cm-empty">
            <div className="cm-empty-icon">
              <Users size={40} />
            </div>

            <h3>No customers found</h3>

            <p>
              Registered customers will appear here.
            </p>
          </div>
        ) : (
          <div className="cm-table-wrapper">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th>Registered On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td className="cm-row-number">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td>
                      <div className="cm-customer">
                        <CustomerAvatar customer={customer} />

                        <div>
                          <strong>
                            {customer.full_name || "Customer"}
                          </strong>

                          <small>
                            {customer.email || "—"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {customer.phone || "Not provided"}
                    </td>

                    <td>
                      <span className="cm-role">
                        <User size={13} />
                        Customer
                      </span>
                    </td>

                    <td>
                      {formatDate(customer.created_at)}
                    </td>

                    <td>
                      <span
                        className={`cm-status ${
                          customer.is_active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        <span className="cm-status-dot" />

                        {customer.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="cm-actions">
                        <button
                          className="cm-action-button cm-view"
                          title="View customer"
                          aria-label={`View ${customer.full_name}`}
                          onClick={() =>
                            setSelectedCustomer(customer)
                          }
                          disabled={busyId !== null}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          className={`cm-action-button ${
                            customer.is_active
                              ? "cm-block"
                              : "cm-unblock"
                          }`}
                          title={
                            customer.is_active
                              ? "Deactivate account"
                              : "Activate account"
                          }
                          aria-label={
                            customer.is_active
                              ? "Deactivate account"
                              : "Activate account"
                          }
                          disabled={busyId !== null}
                          onClick={() =>
                            handleStatusChange(customer)
                          }
                        >
                          {busyId === customer.id ? (
                            <RefreshCw
                              size={17}
                              className="cm-spinner"
                            />
                          ) : customer.is_active ? (
                            <ShieldOff size={18} />
                          ) : (
                            <ShieldCheck size={18} />
                          )}
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

      {/* Customer Details Modal */}

      {selectedCustomer && (
        <div
          className="cm-modal-overlay"
          onClick={() => {
            if (busyId === null) {
              setSelectedCustomer(null);
            }
          }}
        >
          <div
            className="cm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cm-modal-header">
              <h2 id="customer-modal-title">
                Customer Profile
              </h2>

              <button
                className="cm-close"
                aria-label="Close customer details"
                disabled={busyId !== null}
                onClick={() => setSelectedCustomer(null)}
              >
                <X size={22} />
              </button>
            </div>

            {/* Profile Header */}

            <div className="cm-profile-hero">
              <CustomerAvatar
                customer={selectedCustomer}
                large
              />

              <h2>
                {selectedCustomer.full_name || "Customer"}
              </h2>

              <p>{selectedCustomer.email}</p>

              <span
                className={`cm-status ${
                  selectedCustomer.is_active
                    ? "active"
                    : "inactive"
                }`}
              >
                <span className="cm-status-dot" />

                {selectedCustomer.is_active
                  ? "Active Account"
                  : "Inactive Account"}
              </span>
            </div>

            {/* Customer Information */}

            <div className="cm-detail-grid">
              <div className="cm-detail-card">
                <div className="cm-detail-icon">
                  <User size={18} />
                </div>

                <span>Full Name</span>

                <strong>
                  {selectedCustomer.full_name || "—"}
                </strong>
              </div>

              <div className="cm-detail-card">
                <div className="cm-detail-icon">
                  <Mail size={18} />
                </div>

                <span>Email Address</span>

                <strong>
                  {selectedCustomer.email || "—"}
                </strong>
              </div>

              <div className="cm-detail-card">
                <div className="cm-detail-icon">
                  <Phone size={18} />
                </div>

                <span>Phone Number</span>

                <strong>
                  {selectedCustomer.phone || "Not provided"}
                </strong>
              </div>

              <div className="cm-detail-card">
                <div className="cm-detail-icon">
                  <CalendarDays size={18} />
                </div>

                <span>Registered On</span>

                <strong>
                  {formatDate(selectedCustomer.created_at)}
                </strong>
              </div>

              <div className="cm-detail-card cm-full-width">
                <div className="cm-detail-icon">
                  <Hash size={18} />
                </div>

                <span>Customer ID</span>

                <strong>{selectedCustomer.id}</strong>
              </div>
            </div>

            {/* Account Management */}

            <div className="cm-account-panel">
              <div>
                <h3>Account Management</h3>

                <p>
                  Enable or disable customer access to
                  protected application features.
                </p>
              </div>

              <button
                className={`cm-account-button ${
                  selectedCustomer.is_active
                    ? "deactivate"
                    : "activate"
                }`}
                disabled={busyId !== null}
                onClick={() =>
                  handleStatusChange(selectedCustomer)
                }
              >
                {busyId === selectedCustomer.id ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="cm-spinner"
                    />
                    Updating...
                  </>
                ) : selectedCustomer.is_active ? (
                  <>
                    <ShieldOff size={17} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ShieldCheck size={17} />
                    Activate
                  </>
                )}
              </button>
            </div>

            <div className="cm-modal-footer">
              <button
                className="cm-secondary-button"
                disabled={busyId !== null}
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}