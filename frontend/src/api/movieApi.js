import api from "./axiosClient";

export const getMovies = async (params = {}) => {
  return (await api.get("/movies/", { params })).data;
};

export const getMovie = async (id) => {
  return (await api.get(`/movies/${id}`)).data;
};

export const createMovie = async (payload) => {
  return (await api.post("/movies/", payload)).data;
};

export const updateMovie = async (id, payload) => {
  return (await api.put(`/movies/${id}`, payload)).data;
};

export const deleteMovie = async (id) => {
  return (await api.delete(`/movies/${id}`)).data;
};