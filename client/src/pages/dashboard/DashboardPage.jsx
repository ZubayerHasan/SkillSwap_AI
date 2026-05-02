import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { selectProfileCompleteness } from "../../store/slices/profileSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import ProgressBar from "../../components/common/ProgressBar";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import ReviewForm from "../../components/reviews/ReviewForm";
import { useQuery } from "@tanstack/react-query";
import { getWallet } from "../../api/walletApi";
import { getIncomingRequests } from "../../api/walletApi";
import { getUserReviews } from "../../api/reviewApi";
import { getMyExchanges } from "../../api/walletApi";

// 🔥 ADD THIS
import { createReview } from "../../api/reviewApi";

const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const completeness = useSelector(selectProfileCompleteness);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [exchangeToReview, setExchangeToReview] = useState(null);

  // 🔥 SIMPLE REVIEW STATE
  const [reviewData, setReviewData] = useState({
    reviewedUserId: "",
    rating: 5,
    comment: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    try {
      setLoading(true);

      await createReview(reviewData);

      alert("Review submitted successfully!");

      setReviewData({
        reviewedUserId: "",
        rating: 5,
        comment: "",
      });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWallet().then((r) => r.data.data),
    staleTime: 60000,
  });

  const { data: incomingData } = useQuery({
    queryKey: ["exchanges", "incoming"],
    queryFn: () => getIncomingRequests().then((r) => r.data.data),
    staleTime: 60000,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", user?._id],
    queryFn: () => getUserReviews(user?._id).then((r) => r.data.reviews),
    staleTime: 60000,
    enabled: !!user?._id,
  });

  const { data: completedData } = useQuery({
    queryKey: ["exchanges", "completed"],
    queryFn: () =>
      getMyExchanges("completed").then((r) => r.data.data || r.data || {}),
    staleTime: 60000,
  });

  const pendingRequests = incomingData?.requests || [];
  const reviews = reviewsData || [];

  return (
    <PageWrapper>
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500">SkillSwap Dashboard</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            Credits: {walletData?.currentBalance ?? 0}
          </Card>

          <Card className="p-4">
            Profile: {completeness}%
          </Card>

          <Card className="p-4">
            Requests: {pendingRequests.length}
          </Card>

          <Card className="p-4">
            Trust: {user?.trustScore ?? 50}
          </Card>
        </div>

        {/* 🔥 SIMPLE REVIEW BOX (MAIN FEATURE) */}
        <Card className="p-5 border border-blue-500">
          <h2 className="font-semibold mb-3">Write a Review</h2>

          {/* USER ID */}
          <input
            className="w-full p-2 mb-3 border rounded"
            placeholder="Enter User ID"
            value={reviewData.reviewedUserId}
            onChange={(e) =>
              setReviewData({
                ...reviewData,
                reviewedUserId: e.target.value,
              })
            }
          />

          {/* RATING */}
          <select
            className="w-full p-2 mb-3 border rounded"
            value={reviewData.rating}
            onChange={(e) =>
              setReviewData({
                ...reviewData,
                rating: Number(e.target.value),
              })
            }
          >
            <option value={1}>1 Star</option>
            <option value={2}>2 Stars</option>
            <option value={3}>3 Stars</option>
            <option value={4}>4 Stars</option>
            <option value={5}>5 Stars</option>
          </select>

          {/* COMMENT */}
          <textarea
            className="w-full p-2 mb-3 border rounded"
            rows={3}
            placeholder="Write your review..."
            value={reviewData.comment}
            onChange={(e) =>
              setReviewData({
                ...reviewData,
                comment: e.target.value,
              })
            }
          />

          {/* SUBMIT */}
          <Button onClick={handleSubmitReview} disabled={loading}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </Card>

        {/* RECENT REVIEWS */}
        {reviews.length > 0 && (
          <Card className="p-5">
            <h2 className="font-semibold mb-3">Recent Reviews</h2>

            {reviews.slice(0, 3).map((r) => (
              <div key={r._id} className="border-b py-2">
                <p className="text-sm font-medium">
                  {r.reviewerId?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">{r.comment}</p>
              </div>
            ))}
          </Card>
        )}

        {/* MODAL (UNCHANGED) */}
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title="Leave Review"
        >
          {exchangeToReview && (
            <ReviewForm
              exchange={exchangeToReview}
              currentUser={user}
              onSuccess={() => setReviewModalOpen(false)}
            />
          )}
        </Modal>

      </div>
    </PageWrapper>
  );
};

export default DashboardPage;