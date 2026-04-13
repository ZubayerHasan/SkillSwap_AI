import axiosInstance from "./axiosInstance";
import axios from "axios";

export const registerUser = (data) => axiosInstance.post("/auth/register", data);
export const loginUser = (data) => axiosInstance.post("/auth/login", data);
export const logoutUser = () => axiosInstance.post("/auth/logout");
export const refreshToken = () => axiosInstance.post("/auth/refresh", {});
export const verifyEmail = (token, email) => axiosInstance.get(`/auth/verify-email?token=${token}${email ? `&email=${email}` : ""}`);
export const resendVerification = (email) => axiosInstance.post("/auth/resend-verification", { email });
export const forgotPassword = (email) => axiosInstance.post("/auth/forgot-password", { email });
export const resetPassword = (data) => axiosInstance.post("/auth/reset-password", data);
export const getMe = () => axiosInstance.get("/auth/me");
