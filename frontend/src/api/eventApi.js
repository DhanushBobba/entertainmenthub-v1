import api from "./axiosClient";

export const getEvents = async (params = {}) => {
  return (await api.get("/events/", { params })).data;
};

export const getEvent = async (id) => {
  return (await api.get(`/events/${id}`)).data;
};

export const createEvent = async (payload) => {
  return (await api.post("/events/", payload)).data;
};

export const updateEvent = async (id, payload) => {
  return (await api.put(`/events/${id}`, payload)).data;
};

export const deleteEvent = async (id) => {
  return (await api.delete(`/events/${id}`)).data;
};