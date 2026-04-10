import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { selectProfileCompleteness } from "../../store/slices/profileSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import ProgressBar from "../../components/common/ProgressBar";
import Card from "../../components/common/Card";
import { useQuery } from "@tanstack/react-query";
import { getWallet } from "../../api/walletApi";
import { getIncomingRequests } from "../../api/walletApi";

const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const completeness = useSelector(selectProfileCompleteness);

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

  const pendingRequests = incomingData?.requests || [];

  return (
    <PageWrapper>
      <div className="space-y-6 stagger-children">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-text-secondary mt-1">Here's your SkillSwap overview</p>
        </div>

        {/* Profile completeness warning */}
        {completeness < 60 && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
            <p className="text-warning font-semibold text-sm mb-2">⚠️ Your profile needs more detail to appear in match results</p>
            <ProgressBar value={completeness} label="Profile Completeness" />
            <Link to="/profile/me" className="text-xs text-brand hover:text-brand-hover mt-2 inline-block">Complete your profile →</Link>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Credits Balance", value: walletData?.currentBalance ?? user?.currentBalance ?? 0, icon: "⚡", color: "text-accent" },
            { label: "Profile Complete", value: `${completeness}%`, icon: "👤", color: "text-brand" },
            { label: "Pending Requests", value: pendingRequests.length, icon: "📨", color: "text-warning" },
            { label: "Trust Score", value: user?.trustScore ?? 50, icon: "⭐", color: "text-success" },
          ].map((stat) => (
            <Card key={stat.label} className="p-5">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-text-muted mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Pending exchange requests */}
        {pendingRequests.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display font-semibold text-text-primary mb-4">Incoming Exchange Requests ({pendingRequests.length})</h2>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <div key={req._id} className="flex items-center justify-between p-3 bg-background-elevated rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-text-primary"><span className="text-brand">{req.requesterId?.name}</span> wants to exchange</p>
                    <p className="text-xs text-text-muted">{req.offeredSkillId?.displayName} ↔ {req.requestedSkillId?.displayName}</p>
                  </div>
                  <Link to="/exchanges" className="btn-primary !py-1.5 !px-3 text-xs">Review</Link>
                </div>
              ))}
            </div>
            {pendingRequests.length > 3 && (
              <Link to="/exchanges" className="text-xs text-brand hover:text-brand-hover mt-3 inline-block">View all {pendingRequests.length} requests →</Link>
            )}
          </Card>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { to: "/skills", icon: "🎯", title: "Manage Skills", desc: "Add skills you offer or need" },
            { to: "/discover", icon: "🔍", title: "Discover Skills", desc: "Find people to exchange with" },
            { to: "/availability", icon: "📅", title: "Set Availability", desc: "Let others know when you're free" },
          ].map((item) => (
            <Link key={item.to} to={item.to}>
              <Card hover className="p-5 h-full">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-text-primary text-sm">{item.title}</h3>
                <p className="text-xs text-text-muted mt-1">{item.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default DashboardPage;
