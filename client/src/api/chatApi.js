import axiosInstance from "./axiosInstance";

export const getMyConversations = () => axiosInstance.get("/chat/conversations");
export const startConversation = (data) => axiosInstance.post("/chat/conversations", data);
export const getConversationMessages = (conversationId) => axiosInstance.get(`/chat/conversations/${conversationId}/messages`);
export const sendConversationMessage = (conversationId, data) => axiosInstance.post(`/chat/conversations/${conversationId}/messages`, data);
export const markConversationRead = (conversationId) => axiosInstance.put(`/chat/conversations/${conversationId}/read`);