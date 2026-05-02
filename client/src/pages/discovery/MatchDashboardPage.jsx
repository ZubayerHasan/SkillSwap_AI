import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/common/Button";
import { getSmartMatches } from "../../api/matchApi";
import { createExchangeRequest } from "../../api/walletApi";

const scoreToPercent = (score) => Math.min(100, Math.round((score / 100) * 100));

const getDefaultProposedTime = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const MatchDashboardPage = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(20);
  const [submittingId, setSubmittingId] = useState(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSmartMatches({ limit });

      const results =
        response?.data?.data?.results ||
        response?.data?.results ||
        [];

      setMatches(results);
    } catch (err) {
      console.error("Failed to fetch smart matches:", err);
      setError(
        err?.response?.data?.message ||
          "Could not load smart matches right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [limit]);

  const summary = useMemo(() => {
    const total = matches.length;
    const reciprocal = matches.filter((m) => m.reciprocalMatch).length;
    const avgScore =
      total > 0
        ? Math.round(
            matches.reduce((sum, m) => sum + (m.totalScore || 0), 0) / total
          )
        : 0;

    return { total, reciprocal, avgScore };
  }, [matches]);

  const handleRequestExchange = async (match) => {
    if (!match?.reciprocalOffer?._id) {
      toast.error("This match is not ready for exchange yet because your offered skill is missing.");
      return;
    }

    if (!match?.matchedOffer?._id) {
      toast.error("The requested skill could not be identified.");
      return;
    }

    const proposedTime = window.prompt(
      "Enter proposed time in this format: YYYY-MM-DDTHH:mm",
      getDefaultProposedTime()
    );

    if (proposedTime === null) return;

    if (!proposedTime.trim()) {
      toast.error("Proposed time is required.");
      return;
    }

    const message =
      window.prompt(
        "Optional message for the exchange request:",
        `Hi ${match.name}, I'd like to exchange skills with you.`
      ) || "";

    try {
      setSubmittingId(match.userId);

      await createExchangeRequest({
        receiverId: match.userId,
        offeredSkillId: match.reciprocalOffer._id,
        requestedSkillId: match.matchedOffer._id,
        proposedTime,
        message,
      });

      toast.success("Exchange request sent successfully!");
      navigate("/exchanges");
    } catch (err) {
      console.error("Failed to create exchange request:", err);
      toast.error(
        err?.response?.data?.message || "Failed to send exchange request."
      );
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Smart Match Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Ranked match suggestions based on skill fit, reciprocity,
              availability overlap, and trust signals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">
              Limit:
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>

            <button
              onClick={fetchMatches}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Matches</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {summary.total}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Reciprocal Matches</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {summary.reciprocal}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Average Score</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {summary.avgScore}
            </h2>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
            Loading smart matches...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
            No smart matches found yet.
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {matches.map((match) => {
              const percent = scoreToPercent(match.totalScore || 0);
              const canRequestExchange =
                Boolean(match?.reciprocalOffer?._id) &&
                Boolean(match?.matchedOffer?._id);

              return (
                <div
                  key={match.userId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          match?.avatar?.url ||
                          "https://via.placeholder.com/64?text=User"
                        }
                        alt={match?.name || "User"}
                        className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {match.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {match.university || "University not added"}
                        </p>
                        {match.department ? (
                          <p className="text-xs text-slate-500">
                            {match.department}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Match Score
                      </p>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {match.totalScore}
                      </h3>
                      <p className="text-sm text-slate-600">{percent}% fit</p>
                    </div>
                  </div>

                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Matched Need</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {match?.matchedNeed?.displayName ||
                          match?.matchedNeed?.skillName ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Matched Offer</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {match?.matchedOffer?.displayName ||
                          match?.matchedOffer?.skillName ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Overlap</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {match?.overlapHours || 0} hrs
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Reciprocity</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {match?.reciprocalMatch ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 p-3 text-center">
                      <p className="text-xs text-slate-500">Skill</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {match?.scoreBreakdown?.skillScore ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3 text-center">
                      <p className="text-xs text-slate-500">Reciprocity</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {match?.scoreBreakdown?.reciprocityScore ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3 text-center">
                      <p className="text-xs text-slate-500">Availability</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {match?.scoreBreakdown?.availabilityScore ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3 text-center">
                      <p className="text-xs text-slate-500">Quality</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {match?.scoreBreakdown?.qualityScore ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {(match?.reasons || []).map((reason, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Trust Score</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {match?.trustScore ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Profile Completeness</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {match?.profileCompleteness ?? 0}%
                      </p>
                    </div>
                  </div>

                  {match?.bio ? (
                    <p className="mb-4 text-sm text-slate-600">{match.bio}</p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/profile/${match.userId}`)}
                              >
                      View Profile
                    </Button>

                    <button
                      onClick={() => handleRequestExchange(match)}
                      disabled={!canRequestExchange || submittingId === match.userId}
                      className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                        !canRequestExchange || submittingId === match.userId
                          ? "cursor-not-allowed bg-slate-400"
                          : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {submittingId === match.userId
                        ? "Sending..."
                        : canRequestExchange
                        ? "Request Exchange"
                        : "Need Reciprocal Offer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default MatchDashboardPage;