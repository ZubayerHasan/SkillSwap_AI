import axiosInstance from "./axiosInstance";

export const discoverSkills = (params) => axiosInstance.get("/discovery/skills", { params });
