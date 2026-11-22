import api from "./axiosClient";

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const refreshToken = async (token) => {
  const response = await api.post("/auth/refresh", {
    refresh_token: token,
  });

  return response.data;
};

export const logout = async (token) => {
  const response = await api.post("/auth/logout", {
    refresh_token: token,
  });

  return response.data;
};