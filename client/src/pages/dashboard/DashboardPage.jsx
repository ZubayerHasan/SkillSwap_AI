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
import OnboardingWizard from "../../components/common/OnboardingWizard";
import ReviewForm from "../../components/reviews/ReviewForm";
import { useQuery } from "@tanstack/react-query";
import { getWallet, getIncomingRequests, getMyExchanges } from "../../api/walletApi";
import { getUserReviews } from "../../api/reviewApi";

const STAT_CARDS = [
  { key: "credits", icon: "⚡", label: "Credits", color: "text-accent" },
  { key: "profile", icon: "📊", label: "Profile", color: "text-brand", suffix: "%" },
  { key: "requests", icon: "📨", label: "Requests", color: "text-warning" },
  { key: "trust", icon: "⭐", label: "Trust Score", color: "text-success" },
];

const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const completeness = useSelector(selectProfileCompleteness);
  const [showOnboarding, setShowOnboarding] = useState(!user?.hasCompletedOnboarding);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [exchangeToReview, setExchangeToReview] = useState(null);

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
    queryFn: () => getUserReviews(user?._id).then((r) => r.data.data?.reviews || []),
    staleTime: 60000,
    enabled: !!user?._id,
  });

  const { data: completedData } = useQuery({
    queryKey: ["exchanges", "completed"],
    queryFn: () => getMyExchanges("completed").then((r) => r.data.data || {}),
    staleTime: 60000,
  });

  const pendingRequests = incomingData?.requests || [];
  const reviews = reviewsData || [];
  const completedExchanges = completedData?.exchanges || [];

  const statValues = {
    credits: walletData?.currentBalance ?? 0,
    profile: completeness ?? 0,
    requests: pendingRequests.length,
    trust: user?.trustScore ?? 50,
  };

  return (
    <PageWrapper>
      {/* Onboarding Wizard */}
      {showOnboarding && user && !user.hasCompletedOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="space-y-6 stagger-children">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-text-secondary text-sm mt-1">Here's your SkillSwap overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((s) => (
            <Card key={s.key} className="p-5 text-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-2xl font-mono font-bold ${s.color}`}>
                {statValues[s.key]}{s.suffix || ""}
              </div>
              <p className="text-xs text-text-muted mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/skills" className="card p-5 hover:border-brand/40 transition-all duration-200 group">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-text-primary group-hover:text-brand transition-colors">My Skills</h3>
            <p className="text-xs text-text-muted mt-1">Add or manage your skills</p>
          </Link>
          <Link to="/matches" className="card p-5 hover:border-accent/40 transition-all duration-200 group">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">Find Matches</h3>
            <p className="text-xs text-text-muted mt-1">Discover skill swap partners</p>
          </Link>
          <Link to="/exchanges" className="card p-5 hover:border-success/40 transition-all duration-200 group">
            <div className="text-2xl mb-2">🤝</div>
            <h3 className="font-semibold text-text-primary group-hover:text-success transition-colors">Exchanges</h3>
            <p className="text-xs text-text-muted mt-1">View active exchanges</p>
          </Link>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-text-primary">Pending Requests</h2>
              <Link to="/exchanges" className="text-xs text-brand hover:text-brand-hover">View all</Link>
            </div>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <div key={req._id} className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated">
                  <Avatar src={req.requesterId?.avatar?.url} name={req.requesterId?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{req.requesterId?.name}</p>
                    <p className="text-xs text-text-muted">{req.offeredSkillId?.displayName} ↔ {req.requestedSkillId?.displayName}</p>
                  </div>
                  <Link to="/exchanges" className="btn-primary !px-3 !py-1.5 text-xs">View</Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display font-semibold text-text-primary mb-4">Recent Reviews</h2>
            <div className="space-y-3">
              {reviews.slice(0, 3).map((r) => (
                <div key={r._id} className="flex items-start gap-3 p-3 rounded-xl bg-background-elevated">
                  <Avatar src={r.reviewerId?.avatar?.url} name={r.reviewerId?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{r.reviewerId?.name || "User"}</p>
                    <p className="text-xs text-text-muted line-clamp-2">{r.comment}</p>
                  </div>
                  <div className="text-xs text-warning font-mono">{"⭐".repeat(r.rating)}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Leave Review">
        {exchangeToReview && (
          <ReviewForm exchange={exchangeToReview} currentUser={user} onSuccess={() => setReviewModalOpen(false)} />
        )}
      </Modal>
    </PageWrapper>
  );
};

export default DashboardPage;