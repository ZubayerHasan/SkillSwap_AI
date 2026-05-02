import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicProfile } from "../../api/profileApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import ProgressBar from "../../components/common/ProgressBar";
import { ProficiencyBadge, TrustBadge } from "../../components/common/Badge";

const PublicProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile", "public", userId],
    queryFn: () => getPublicProfile(userId).then((res) => res.data.data),
    enabled: Boolean(userId),
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="max-w-3xl mx-auto space-y-4">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="card h-24 animate-shimmer" />
            ))}
        </div>
      </PageWrapper>
    );
  }

  if (isError) {
    return (
      <PageWrapper>
        <div className="max-w-3xl mx-auto">
          <Card className="p-6 text-center">
            <h1 className="text-xl font-display font-bold text-text-primary">
              Profile not found
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {error?.response?.data?.message || "Could not load this user's profile."}
            </p>
            <Button className="mt-4" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  const user = data?.user;
  const skills = data?.skills || [];

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">
              Public Profile
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              View this user's profile, trust score, and offered skills.
            </p>
          </div>

          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar src={user?.avatar?.url} name={user?.name} size="xl" />

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-display font-bold text-text-primary">
                  {user?.name || "Unknown User"}
                </h2>
                <TrustBadge score={user?.trustScore || 50} />
              </div>

              <p className="mt-1 text-sm text-text-muted">
                {user?.university || "University not added"}
              </p>

              {user?.department && (
                <p className="text-sm text-text-muted">{user.department}</p>
              )}

              <div className="mt-4">
                <ProgressBar
                  value={user?.profileCompleteness || 0}
                  label="Profile Completeness"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-text-primary">About</h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Bio
              </p>
              <p className="mt-1 text-sm text-text-primary">
                {user?.bio || "No bio added yet."}
              </p>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-sm text-text-muted">Trust Score</span>
              <span className="text-sm text-text-primary">
                {user?.trustScore ?? 50}/100
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-sm text-text-muted">Member Since</span>
              <span className="text-sm text-text-primary">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4">
            Offered Skills
          </h3>

          {skills.length === 0 ? (
            <p className="text-sm text-text-secondary">
              This user has not added any active skills yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {skills.map((skill) => (
                <div
                  key={skill._id}
                  className="rounded-xl border border-border bg-background-elevated p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-text-primary">
                        {skill.displayName || skill.skillName}
                      </h4>
                      <p className="mt-1 text-xs text-text-muted">
                        {skill.category}
                      </p>
                    </div>

                    <ProficiencyBadge level={skill.proficiencyLevel} />
                  </div>

                  <p className="mt-3 text-xs text-text-secondary">
                    Endorsements: {skill.endorsementCount || 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default PublicProfilePage;