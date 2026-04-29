import axiosInstance from "./axiosInstance";

export const getAdminStats = () => axiosInstance.get("/admin/stats");
export const getAdminUsers = (params) => axiosInstance.get("/admin/users", { params });
export const changeUserRole = (id, role, reason) => axiosInstance.patch(`/admin/users/${id}/role`, { role, reason });
export const toggleSuspendUser = (id, reason) => axiosInstance.patch(`/admin/users/${id}/suspend`, { reason });
export const getAuditLog = (params) => axiosInstance.get("/admin/audit", { params });
