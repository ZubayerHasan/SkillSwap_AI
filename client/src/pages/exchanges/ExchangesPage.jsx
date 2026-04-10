import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIncomingRequests, getOutgoingRequests, acceptExchangeRequest, declineExchangeRequest } from "../../api/walletApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import Badge from "../../components/common/Badge";
import { formatDate } from "../../components/common/formatters";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  pending: { variant: "warning", label: "Pending" },
  accepted: { variant: "success", label: "Accepted" },
  declined: { variant: "danger", label: "Declined" },
  expired: { variant: "muted", label: "Expired" },
  counter: { variant: "brand", label: "Counter Sent" },
};

const ExchangesPage = () => {
  const [tab, setTab] = useState("incoming");
  const qc = useQueryClient();

  const { data: incomingData, isLoading: loadIn } = useQuery({ queryKey: ["exchanges", "incoming"], queryFn: () => getIncomingRequests().then(r => r.data.data) });
  const { data: outgoingData, isLoading: loadOut } = useQuery({ queryKey: ["exchanges", "outgoing"], queryFn: () => getOutgoingRequests().then(r => r.data.data) });

  const acceptMut = useMutation({ mutationFn: acceptExchangeRequest, onSuccess: () => { qc.invalidateQueries({ queryKey: ["exchanges"] }); toast.success("Exchange accepted! 🤝"); }, onError: e => toast.error(e.response?.data?.message || "Failed") });
  const declineMut = useMutation({ mutationFn: (id) => declineExchangeRequest(id, ""), onSuccess: () => { qc.invalidateQueries({ queryKey: ["exchanges"] }); toast.success("Request declined"); }, onError: e => toast.error(e.response?.data?.message || "Failed") });

  const incoming = incomingData?.requests || [];
  const outgoing = outgoingData?.requests || [];

  return (
    <PageWrapper>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Exchange Requests</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-background-secondary p-1 rounded-xl w-fit">
          {[["incoming", `Incoming (${incoming.length})`], ["outgoing", `Outgoing (${outgoing.length})`]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === v ? "bg-brand text-white" : "text-text-muted hover:text-text-primary"}`}>{l}</button>
          ))}
        </div>

        {tab === "incoming" && (
          <div className="space-y-4">
            {loadIn ? Array(2).fill(0).map((_, i) => <div key={i} className="card h-32 animate-shimmer" />) :
              incoming.length === 0 ? (
                <div className="text-center py-16 text-text-muted">
                  <div className="text-5xl mb-4">📬</div>
                  <p className="text-text-primary font-medium">No incoming requests</p>
                  <p className="text-sm mt-1">Share your skills on the discovery page</p>
                </div>
              ) : incoming.map(req => (
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
            }
          </div>
        )}

        {tab === "outgoing" && (
          <div className="space-y-4">
            {loadOut ? Array(2).fill(0).map((_, i) => <div key={i} className="card h-24 animate-shimmer" />) :
              outgoing.length === 0 ? (
                <div className="text-center py-16 text-text-muted">
                  <div className="text-5xl mb-4">📤</div>
                  <p className="text-text-primary font-medium">No outgoing requests</p>
                  <p className="text-sm mt-1">Go to Discover to find skills and send requests</p>
                </div>
              ) : outgoing.map(req => (
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
                    {STATUS_BADGE[req.status] && (
                      <Badge variant={STATUS_BADGE[req.status].variant}>{STATUS_BADGE[req.status].label}</Badge>
                    )}
                  </div>
                </Card>
              ))
            }
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ExchangesPage;
