import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectCurrentUser } from "../../store/slices/authSlice";
import {
  getIncomingRequests,
  getOutgoingRequests,
  acceptExchangeRequest,
  declineExchangeRequest,
  getMyExchanges,
  confirmExchange,
} from "../../api/walletApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import { SkeletonCard } from "../../components/common/SkeletonLoader";
import { formatDate, formatTime } from "../../components/common/formatters";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  scheduled: { variant: "brand", label: "Scheduled", icon: "📅" },
  in_progress: { variant: "warning", label: "In Progress", icon: "⏳" },
  awaiting_completion: { variant: "accent", label: "Awaiting Completion", icon: "🔄" },
  completed: { variant: "success", label: "Completed", icon: "✅" },
  disputed: { variant: "danger", label: "Disputed", icon: "⚠️" },
};

const REQUEST_STATUS = {
  pending: { variant: "warning", label: "Pending" },
  accepted: { variant: "success", label: "Accepted" },
  declined: { variant: "danger", label: "Declined" },
  expired: { variant: "muted", label: "Expired" },
  counter: { variant: "brand", label: "Counter Sent" },
};

const EXCHANGE_TABS = [
  { key: "upcoming", label: "Upcoming", filter: (e) => ["scheduled", "in_progress"].includes(e.status) },
  { key: "awaiting", label: "Awaiting", filter: (e) => e.status === "awaiting_completion" },
  { key: "completed", label: "Completed", filter: (e) => e.status === "completed" },
  { key: "all", label: "All", filter: () => true },
];

// ─── Exchange Card ────────────────────────────────────────────────────────────
const ExchangeCard = ({ exchange, currentUserId, onConfirm, confirmLoading }) => {
  const isRequester = exchange.requesterId?._id === currentUserId;
  const partner = isRequester ? exchange.receiverId : exchange.requesterId;
  const mySkill = isRequester ? exchange.offeredSkillId : exchange.requestedSkillId;
  const theirSkill = isRequester ? exchange.requestedSkillId : exchange.offeredSkillId;
  const status = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.scheduled;
  const alreadyConfirmed = isRequester ? exchange.requesterConfirmed : exchange.receiverConfirmed;
  const canConfirm = ["scheduled", "in_progress", "awaiting_completion"].includes(exchange.status) && !alreadyConfirmed;

  return (
    <Card className="p-5 hover:border-brand/30 transition-all duration-200">
      <div className="flex flex-col gap-4">
        {/* Header: Partner + Status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={partner?.avatar?.url} name={partner?.name} size="md" />
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{partner?.name || "Unknown"}</p>
              <p className="text-xs text-text-muted">{formatDate(exchange.scheduledTime)} · {formatTime(exchange.scheduledTime)}</p>
            </div>
          </div>
          <Badge variant={status.variant}>
            <span>{status.icon}</span> {status.label}
          </Badge>
        </div>

        {/* Skill Swap Row */}
        <div className="flex items-center gap-3 bg-background-elevated rounded-xl p-3">
          <div className="flex-1 text-center">
            <p className="text-xs text-text-muted mb-1">You teach</p>
            <p className="text-sm font-semibold text-brand">{mySkill?.displayName || "—"}</p>
          </div>
          <div className="text-text-muted text-lg">⇄</div>
          <div className="flex-1 text-center">
            <p className="text-xs text-text-muted mb-1">You learn</p>
            <p className="text-sm font-semibold text-accent">{theirSkill?.displayName || "—"}</p>
          </div>
        </div>

        {/* Credit + Actions */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-text-muted font-mono">
            ⚡ {exchange.creditHours} credit{exchange.creditHours !== 1 ? "s" : ""}
          </span>

          <div className="flex items-center gap-2">
            {exchange.status === "completed" && (
              <Link
                to={`/exchanges?review=${exchange._id}`}
                className="btn-ghost !py-1.5 !px-3 text-xs"
              >
                ⭐ Leave Review
              </Link>
            )}
            {alreadyConfirmed && exchange.status !== "completed" && (
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                You confirmed
              </span>
            )}
            {canConfirm && (
              <Button
                variant="success"
                size="sm"
                loading={confirmLoading}
                onClick={() => onConfirm(exchange)}
              >
                ✓ Mark Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── Completion Success Animation ─────────────────────────────────────────────
const CompletionSuccess = ({ exchange, onClose }) => (
  <div className="text-center space-y-4 py-4">
    <div className="text-6xl animate-bounce">🎉</div>
    <h3 className="text-xl font-display font-bold text-text-primary">Exchange Complete!</h3>
    <p className="text-text-secondary text-sm">
      <span className="text-success font-mono font-bold">{exchange.creditHours}</span> credit{exchange.creditHours !== 1 ? "s" : ""} have been transferred.
    </p>
    <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
      <span className="text-brand font-medium">{exchange.offeredSkillId?.displayName}</span>
      <span>⇄</span>
      <span className="text-accent font-medium">{exchange.requestedSkillId?.displayName}</span>
    </div>
    <div className="flex gap-3 pt-2">
      <Button variant="ghost" className="flex-1" onClick={onClose}>Close</Button>
      <Button className="flex-1" onClick={onClose}>⭐ Leave a Review</Button>
    </div>
  </div>
);

// ─── Main Exchanges Page ──────────────────────────────────────────────────────
const ExchangesPage = () => {
  const [mainTab, setMainTab] = useState("exchanges");
  const [exchangeTab, setExchangeTab] = useState("upcoming");
  const [requestTab, setRequestTab] = useState("incoming");
  const [confirmModal, setConfirmModal] = useState(null);
  const [completedExchange, setCompletedExchange] = useState(null);
  const currentUser = useSelector(selectCurrentUser);
  const qc = useQueryClient();

  // Fetch all exchanges
  const { data: exchangeData, isLoading: loadExchanges } = useQuery({
    queryKey: ["myExchanges"],
    queryFn: () => getMyExchanges().then((r) => r.data.data),
  });

  // Fetch requests
  const { data: incomingData, isLoading: loadIn } = useQuery({
    queryKey: ["exchanges", "incoming"],
    queryFn: () => getIncomingRequests().then((r) => r.data.data),
  });
  const { data: outgoingData, isLoading: loadOut } = useQuery({
    queryKey: ["exchanges", "outgoing"],
    queryFn: () => getOutgoingRequests().then((r) => r.data.data),
  });

  // Mutations
  const confirmMut = useMutation({
    mutationFn: (id) => confirmExchange(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["myExchanges"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      const exchange = res.data.data.exchange;
      if (exchange.status === "completed") {
        setCompletedExchange(exchange);
        toast.success("Exchange completed! Credits transferred 🎉");
      } else {
        toast.success("Confirmation recorded! Waiting for your partner.");
      }
      setConfirmModal(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to confirm"),
  });

  const acceptMut = useMutation({
    mutationFn: acceptExchangeRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchanges"] });
      qc.invalidateQueries({ queryKey: ["myExchanges"] });
      toast.success("Exchange accepted! 🤝");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const declineMut = useMutation({
    mutationFn: (id) => declineExchangeRequest(id, ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchanges"] });
      toast.success("Request declined");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const exchanges = exchangeData?.exchanges || [];
  const incoming = incomingData?.requests || [];
  const outgoing = outgoingData?.requests || [];

  const activeTabDef = EXCHANGE_TABS.find((t) => t.key === exchangeTab);
  const filteredExchanges = exchanges.filter(activeTabDef?.filter || (() => true));

  const tabCounts = EXCHANGE_TABS.reduce((acc, tab) => {
    acc[tab.key] = exchanges.filter(tab.filter).length;
    return acc;
  }, {});

  return (
    <PageWrapper>
      <div className="space-y-6 stagger-children">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Exchanges</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your skill exchanges and requests</p>
        </div>

        {/* Main tabs: Exchanges vs Requests */}
        <div className="flex gap-1 bg-background-secondary p-1 rounded-xl w-fit">
          {[
            ["exchanges", `My Exchanges (${exchanges.length})`],
            ["requests", `Requests (${incoming.length + outgoing.length})`],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setMainTab(v)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mainTab === v ? "bg-brand text-white shadow-glow" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* ─── EXCHANGES VIEW ──────────────────────────────────────────────── */}
        {mainTab === "exchanges" && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-1 flex-wrap">
              {EXCHANGE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setExchangeTab(tab.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    exchangeTab === tab.key
                      ? "bg-brand/15 text-brand border border-brand/30"
                      : "text-text-muted hover:text-text-primary border border-transparent"
                  }`}
                >
                  {tab.label} ({tabCounts[tab.key] || 0})
                </button>
              ))}
            </div>

            {/* Exchange cards */}
            {loadExchanges ? (
              <div className="grid gap-4 md:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredExchanges.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🤝</div>
                <p className="text-text-primary font-display font-semibold text-lg">
                  No {exchangeTab === "all" ? "" : exchangeTab} exchanges yet
                </p>
                <p className="text-text-muted text-sm mt-2">Find someone to swap skills with</p>
                <Link to="/matches" className="btn-primary inline-flex mt-4 !px-6">
                  Browse Matches
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredExchanges.map((ex) => (
                  <ExchangeCard
                    key={ex._id}
                    exchange={ex}
                    currentUserId={currentUser?._id}
                    onConfirm={(exchange) => setConfirmModal(exchange)}
                    confirmLoading={confirmMut.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── REQUESTS VIEW ───────────────────────────────────────────────── */}
        {mainTab === "requests" && (
          <>
            <div className="flex gap-1 bg-background-secondary p-1 rounded-xl w-fit">
              {[
                ["incoming", `Incoming (${incoming.length})`],
                ["outgoing", `Outgoing (${outgoing.length})`],
              ].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setRequestTab(v)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    requestTab === v ? "bg-brand text-white" : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {requestTab === "incoming" && (
                <>
                  {loadIn ? (
                    <><SkeletonCard /><SkeletonCard /></>
                  ) : incoming.length === 0 ? (
                    <div className="text-center py-16 text-text-muted">
                      <div className="text-5xl mb-4">📬</div>
                      <p className="text-text-primary font-medium">No incoming requests</p>
                      <p className="text-sm mt-1">Share your skills on the discovery page</p>
                    </div>
                  ) : (
                    incoming.map((req) => (
                      <Card key={req._id} className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar src={req.requesterId?.avatar?.url} name={req.requesterId?.name} size="md" />
                            <div>
                              <p className="font-semibold text-text-primary">{req.requesterId?.name}</p>
                              <p className="text-xs text-text-muted">{req.requesterId?.university}</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap text-sm">
                              <span className="text-brand font-medium">{req.offeredSkillId?.displayName}</span>
                              <span className="text-text-muted">↔</span>
                              <span className="text-accent font-medium">{req.requestedSkillId?.displayName}</span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">Proposed: {formatDate(req.proposedTime)}</p>
                            {req.message && <p className="text-xs text-text-secondary mt-1 italic">"{req.message}"</p>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button variant="danger" size="sm" loading={declineMut.isPending} onClick={() => declineMut.mutate(req._id)}>Decline</Button>
                            <Button variant="success" size="sm" loading={acceptMut.isPending} onClick={() => acceptMut.mutate(req._id)}>Accept</Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </>
              )}

              {requestTab === "outgoing" && (
                <>
                  {loadOut ? (
                    <><SkeletonCard /><SkeletonCard /></>
                  ) : outgoing.length === 0 ? (
                    <div className="text-center py-16 text-text-muted">
                      <div className="text-5xl mb-4">📤</div>
                      <p className="text-text-primary font-medium">No outgoing requests</p>
                      <p className="text-sm mt-1">Go to Discover to find skills and send requests</p>
                    </div>
                  ) : (
                    outgoing.map((req) => (
                      <Card key={req._id} className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar src={req.receiverId?.avatar?.url} name={req.receiverId?.name} size="md" />
                            <div>
                              <p className="font-semibold text-text-primary">To: {req.receiverId?.name}</p>
                              <p className="text-xs text-text-muted">{req.receiverId?.university}</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <span className="text-brand">{req.offeredSkillId?.displayName}</span>
                              <span className="text-text-muted">↔</span>
                              <span className="text-accent">{req.requestedSkillId?.displayName}</span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">{formatDate(req.proposedTime)}</p>
                          </div>
                          {REQUEST_STATUS[req.status] && (
                            <Badge variant={REQUEST_STATUS[req.status].variant}>{REQUEST_STATUS[req.status].label}</Badge>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Confirm Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Confirm Exchange Completion"
      >
        {confirmModal && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              Confirm that this skill exchange happened? Credits will transfer once
              <span className="text-text-primary font-semibold"> both parties </span>
              confirm.
            </p>
            <div className="bg-background-elevated rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Skills swapped</span>
                <span className="text-text-primary">
                  {confirmModal.offeredSkillId?.displayName} ↔ {confirmModal.requestedSkillId?.displayName}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Credits</span>
                <span className="text-accent font-mono font-bold">{confirmModal.creditHours}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                variant="success"
                className="flex-1"
                loading={confirmMut.isPending}
                onClick={() => confirmMut.mutate(confirmModal._id)}
              >
                ✓ Yes, Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Completion Success Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={!!completedExchange}
        onClose={() => setCompletedExchange(null)}
        title="🎉 Exchange Complete"
      >
        {completedExchange && (
          <CompletionSuccess
            exchange={completedExchange}
            onClose={() => setCompletedExchange(null)}
          />
        )}
      </Modal>
    </PageWrapper>
  );
};

export default ExchangesPage;
