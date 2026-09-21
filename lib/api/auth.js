import api from "./axios";

export const login = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data.data;
};

export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data.data;
};

export const refresh = async () => {
  const response = await api.post("/auth/refresh", {});
  return response.data.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data.data;
};

export const me = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

export const forgotPassword = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data.data;
};

export const resetPassword = async (payload) => {
  const response = await api.post("/auth/reset-password", payload);
  return response.data.data;
};
