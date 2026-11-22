import api from "./axiosClient";

export const getCategories = async () => {
  return (await api.get("/categories/")).data;
};

export const createCategory = async (payload) => {
  return (await api.post("/categories/", payload)).data;
};

export const updateCategory = async (id, payload) => {
  return (await api.put(`/categories/${id}`, payload)).data;
};

export const deleteCategory = async (id) => {
  return (await api.delete(`/categories/${id}`)).data;
};