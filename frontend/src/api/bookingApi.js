import api from "./axiosClient";

export const getBookings = async (params = {}) => {
  return (await api.get("/bookings/", { params })).data;
};

export const getBooking = async (id) => {
  return (await api.get(`/bookings/${id}`)).data;
};

export const createBooking = async (payload) => {
  return (await api.post("/bookings/", payload)).data;
};

export const updateBookingStatus = async (id, status) => {
  return (
    await api.patch(`/bookings/${id}/status`, {
      booking_status: status,
    })
  ).data;
};

export const cancelBooking = async (id) => {
  return (await api.patch(`/bookings/${id}/cancel`)).data;
};