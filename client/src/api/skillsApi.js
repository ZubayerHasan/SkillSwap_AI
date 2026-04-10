import axiosInstance from "./axiosInstance";

// Skill Offers
export const createOffer = (data) => axiosInstance.post("/skills/offer", data);
export const getMyOffers = () => axiosInstance.get("/skills/offer/me");
export const updateOffer = (id, data) => axiosInstance.put(`/skills/offer/${id}`, data);
export const deleteOffer = (id) => axiosInstance.delete(`/skills/offer/${id}`);

// Skill Needs
export const createNeed = (data) => axiosInstance.post("/skills/need", data);
export const getMyNeeds = () => axiosInstance.get("/skills/need/me");
export const updateNeed = (id, data) => axiosInstance.put(`/skills/need/${id}`, data);
export const deleteNeed = (id) => axiosInstance.delete(`/skills/need/${id}`);

// Taxonomy
export const getTaxonomy = (q) => axiosInstance.get(`/skills/taxonomy${q ? `?q=${encodeURIComponent(q)}` : ""}`);

// Availability
export const updateAvailability = (data) => axiosInstance.put("/availability", data);
export const getMyAvailability = () => axiosInstance.get("/availability/me");
