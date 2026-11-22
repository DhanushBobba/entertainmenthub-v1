import { useEffect, useState } from "react";
import {
  Film,
  CalendarDays,
  Users,
  Ticket,
  IndianRupee,
  Tags,
  RefreshCw,
  ArrowUpRight,
  LayoutDashboard,
  Activity,
  MapPin,
  Clock,
} from "lucide-react";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getDashboardStatistics,
  getRecentBookings,
  getUpcomingEvents,
} from "../../api/dashboardApi";

import "./DashboardPage.css";

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResult, bookingsResult, eventsResult] =
        await Promise.all([
          getDashboardStatistics(),
          getRecentBookings(),
          getUpcomingEvents(),
        ]);

      setStats(statsResult.statistics || {});
      setBookings(bookingsResult.bookings || []);
      setEvents(eventsResult.events || []);
    } catch {
      setError("Unable to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = [
    {
      title: "Total Movies",
      value: stats.total_movies || 0,
      icon: Film,
      color: "#a78bfa",
      subtitle: `${stats.now_showing_movies || 0} now showing`,
    },
    {
      title: "Total Events",
      value: stats.total_events || 0,
      icon: CalendarDays,
      color: "#60a5fa",
      subtitle: `${stats.upcoming_events || 0} upcoming events`,
    },
    {
      title: "Total Customers",
      value: stats.total_customers || 0,
      icon: Users,
      color: "#34d399",
      subtitle: `${stats.active_customers || 0} active customers`,
    },
    {
      title: "Total Bookings",
      value: stats.total_bookings || 0,
      icon: Ticket,
      color: "#fbbf24",
      subtitle: `${stats.confirmed_bookings || 0} confirmed`,
    },
    {
      title: "Total Revenue",
      value: `₹${Number(
        stats.total_revenue || 0
      ).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "#f472b6",
      subtitle: "Recorded revenue",
    },
    {
      title: "Categories",
      value: stats.total_categories || 0,
      icon: Tags,
      color: "#22d3ee",
      subtitle: "Entertainment categories",
    },
  ];

  const chartData = [
    {
      name: "Pending",
      count: stats.pending_bookings || 0,
      color: "#fbbf24",
    },
    {
      name: "Confirmed",
      count: stats.confirmed_bookings || 0,
      color: "#8b5cf6",
    },
    {
      name: "Completed",
      count: stats.completed_bookings || 0,
      color: "#34d399",
    },
    {
      name: "Cancelled",
      count: stats.cancelled_bookings || 0,
      color: "#fb7185",
    },
  ];

  if (loading) {
    return (
      <div className="premium-dashboard">
        <div className="pd-loading">
          <RefreshCw size={32} className="pd-spinner" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-dashboard">
        <div className="pd-loading">
          <p>{error}</p>
          <button className="pd-button" onClick={loadDashboard}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-dashboard">
      <div className="pd-hero">
        <div className="pd-hero-content">
          <span className="pd-eyebrow">
            <LayoutDashboard size={15} />
            ADMIN OVERVIEW
          </span>

          <h1>
            Entertainment <span>Dashboard</span>
          </h1>

          <p>
            Monitor your movies, events, customers and bookings
            in one place.
          </p>

          <span className="pd-live">
            <span className="pd-live-dot" />
            Live platform overview
          </span>
        </div>

        <button className="pd-button" onClick={loadDashboard}>
          <RefreshCw size={17} />
          Refresh Data
        </button>
      </div>

      <div className="pd-stats-grid">
        {cards.map(
          ({ title, value, icon: Icon, color, subtitle }, index) => (
            <article
              className="pd-stat-card"
              key={title}
              style={{
                "--accent": color,
                "--delay": `${index * 80}ms`,
              }}
            >
              <div className="pd-card-top">
                <div className="pd-stat-icon">
                  <Icon size={24} />
                </div>

                <ArrowUpRight
                  size={20}
                  className="pd-card-arrow"
                />
              </div>

              <p className="pd-card-label">{title}</p>
              <h2>{value}</h2>
              <span className="pd-card-subtitle">{subtitle}</span>
            </article>
          )
        )}
      </div>

      <div className="pd-panels-grid">
        <section className="pd-panel">
          <div className="pd-panel-header">
            <div>
              <h2>
                <Activity size={21} />
                Booking Analytics
              </h2>
              <p>Overview of booking statuses</p>
            </div>

            <span className="pd-panel-tag">Statistics</span>
          </div>

          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="#ffffff0d"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="name"
                tick={{ fill: "#a0a0b5", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: "#a0a0b5" }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{ fill: "#ffffff08" }}
                contentStyle={{
                  background: "#191625",
                  border: "1px solid #41365e",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#e9d5ff" }}
              />

              <Bar
                dataKey="count"
                name="Bookings"
                radius={[8, 8, 0, 0]}
                maxBarSize={65}
                animationDuration={1200}
              >
                {chartData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="pd-panel">
          <div className="pd-panel-header">
            <div>
              <h2>
                <CalendarDays size={21} />
                Upcoming Events
              </h2>
              <p>Scheduled entertainment events</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="pd-empty">
              <CalendarDays size={40} />
              <p>No upcoming events</p>
            </div>
          ) : (
            <div className="pd-event-list">
              {events.map((event) => (
                <div className="pd-event" key={event.id}>
                  <div className="pd-event-icon">
                    <CalendarDays size={22} />
                  </div>

                  <div className="pd-event-details">
                    <strong>{event.title}</strong>

                    <span>
                      <MapPin size={13} />
                      {event.venue} — {event.city}
                    </span>

                    <span>
                      <Clock size={13} />
                      {event.event_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="pd-panel">
        <div className="pd-panel-header">
          <div>
            <h2>
              <Ticket size={21} />
              Recent Bookings
            </h2>
            <p>Latest customer booking activity</p>
          </div>

          <span className="pd-panel-tag">
            {bookings.length} records
          </span>
        </div>

        <div className="pd-table-wrapper">
          <table className="pd-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Entertainment</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="pd-empty">
                      <Ticket size={35} />
                      <p>No bookings found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="pd-customer">
                        <div className="pd-customer-avatar">
                          {(booking.profiles?.full_name || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span>
                          {booking.profiles?.full_name || "Customer"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {booking.movies?.title ||
                        booking.events?.title ||
                        "—"}
                    </td>

                    <td className="pd-capitalize">
                      {booking.booking_type}
                    </td>

                    <td className="pd-amount">
                      ₹
                      {Number(
                        booking.total_amount || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={`pd-status ${booking.booking_status}`}
                      >
                        <span />
                        {booking.booking_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}