import axiosInstance from "./axiosInstance";

export const getMyProfile = () => axiosInstance.get("/profile/me");
export const updateProfile = (data) => axiosInstance.put("/profile/me", data);
export const uploadAvatar = (formData) =>
  axiosInstance.post("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000, // longer timeout for file uploads
  });
export const getPublicProfile = (userId) => axiosInstance.get(`/profile/${userId}`);
export const getMyPortfolio = () => axiosInstance.get("/profile/portfolio/me");
export const addPortfolioItem = (formData) =>
  axiosInstance.post("/profile/portfolio", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000,
  });
export const deletePortfolioItem = (itemId) => axiosInstance.delete(`/profile/portfolio/${itemId}`);
