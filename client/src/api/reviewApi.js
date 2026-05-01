import axios from "./axiosInstance";

export const createReview = (data) =>
  axios.post("/reviews", data);

export const getUserReviews = (userId) =>
  axios.get(`/reviews/${userId}`);