import api from "./axiosClient";

export const getUsers = async (params = {}) => {
  return (await api.get("/users/", { params })).data;
};

export const getUser = async (id) => {
  return (await api.get(`/users/${id}`)).data;
};

export const updateUserStatus = async (id, isActive) => {
  return (
    await api.patch(`/users/${id}/status`, {
      is_active: isActive,
    })
  ).data;
};

export const updateMyProfile = async (payload) => {
  return (await api.patch("/users/me", payload)).data;
};