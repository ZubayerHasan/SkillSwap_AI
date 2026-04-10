import axiosInstance from "./axiosInstance";

export const getWallet = () => axiosInstance.get("/wallet/me");
export const getTransactions = (params) => axiosInstance.get("/wallet/transactions", { params });
export const exportTransactions = () => axiosInstance.get("/wallet/transactions/export", { responseType: "blob" });

// Notifications
export const getNotifications = (params) => axiosInstance.get("/notifications", { params });
export const markAllNotificationsRead = () => axiosInstance.put("/notifications/read-all");
export const markNotificationRead = (id) => axiosInstance.put(`/notifications/${id}/read`);

// Exchanges
export const createExchangeRequest = (data) => axiosInstance.post("/exchanges/request", data);
export const getIncomingRequests = () => axiosInstance.get("/exchanges/requests/incoming");
export const getOutgoingRequests = () => axiosInstance.get("/exchanges/requests/outgoing");
export const acceptExchangeRequest = (id) => axiosInstance.put(`/exchanges/requests/${id}/accept`);
export const declineExchangeRequest = (id, reason) => axiosInstance.put(`/exchanges/requests/${id}/decline`, { reason });
export const counterExchangeRequest = (id, data) => axiosInstance.put(`/exchanges/requests/${id}/counter`, data);
export const getMyExchanges = (status) => axiosInstance.get("/exchanges", { params: { status } });
