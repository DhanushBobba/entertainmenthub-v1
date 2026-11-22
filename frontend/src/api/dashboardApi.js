import api from "./axiosClient";

export const getDashboardStatistics = async () => {
  return (await api.get("/dashboard/statistics")).data;
};

export const getRecentBookings = async () => {
  return (await api.get("/dashboard/recent-bookings")).data;
};

export const getUpcomingEvents = async () => {
  return (await api.get("/dashboard/upcoming-events")).data;
};