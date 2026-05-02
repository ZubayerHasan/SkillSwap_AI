import axiosInstance from "./axiosInstance";

export const discoverSkills = (params) =>
  axiosInstance.get("/discovery/skills", { params });

export const getSmartMatches = (params) =>
  axiosInstance.get("/discovery/matches", { params });