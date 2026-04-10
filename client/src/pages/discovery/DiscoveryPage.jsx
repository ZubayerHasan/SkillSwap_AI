import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { discoverSkills } from "../../api/matchApi";
import { createExchangeRequest } from "../../api/walletApi";
import { getMyOffers } from "../../api/skillsApi";
import { selectCurrentUser } from "../../store/slices/authSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import { SkeletonCard } from "../../components/common/SkeletonLoader";
import Avatar from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { ProficiencyBadge, TrustBadge } from "../../components/common/Badge";
import { useDebounce } from "../../hooks/useDebounce";
import toast from "react-hot-toast";

const CATEGORIES = ["", "Programming", "Design", "Music", "Languages", "Math/Science", "Video/Media", "Writing", "Business"];
const PROF_LABELS = { 1: "Beginner", 2: "Intermediate", 3: "Expert" };

const DiscoveryPage = () => {
  const user = useSelector(selectCurrentUser);
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [requestTarget, setRequestTarget] = useState(null); // { skillOffer, user }
  const debouncedQ = useDebounce(searchInput, 300);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["discovery", debouncedQ, category, level],
    queryFn: () => discoverSkills({ q: debouncedQ || undefined, category: category || undefined, level: level || undefined, limit: 12 }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const { data: myOffersData } = useQuery({ queryKey: ["skills", "offers"], queryFn: () => getMyOffers().then(r => r.data.data) });
  const myOffers = myOffersData?.offers || [];

  const [reqForm, setReqForm] = useState({ offeredSkillId: "", proposedTime: "", message: "" });
  const [reqLoading, setReqLoading] = useState(false);

  const sendRequest = async () => {
    if (!reqForm.offeredSkillId) { toast.error("Select a skill you're offering"); return; }
    if (!reqForm.proposedTime) { toast.error("Select a proposed time"); return; }
    setReqLoading(true);
    try {
      await createExchangeRequest({
        receiverId: requestTarget.user._id,
        offeredSkillId: reqForm.offeredSkillId,
        requestedSkillId: requestTarget.skillOffer._id,
        proposedTime: reqForm.proposedTime,
        message: reqForm.message,
      });
      toast.success("Exchange request sent!");
      setRequestTarget(null);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to send request"); }
    finally { setReqLoading(false); }
  };

  const results = data?.results || [];
  const facets = data?.facets || {};

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Discover Skills</h1>
          <p className="text-text-secondary mt-1">Find people to exchange skills with</p>
        </div>

        {/* Search bar */}
        <div className="sticky top-20 z-10">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input pl-12 text-lg !py-3.5 shadow-card border-background-elevated focus:border-brand"
              placeholder="Search for any skill..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {isFetching && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <aside className="hidden md:block w-52 flex-shrink-0 space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Category</h3>
              <div className="space-y-1">
                {CATEGORIES.map(c => {
                  const count = facets.categories?.find(f => f._id === c)?.count;
                  return (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`w-full flex justify-between text-left px-3 py-2 text-sm rounded-lg transition-colors border ${category === c ? "bg-brand-dim/20 text-text-primary border-brand/20" : "text-text-secondary border-transparent hover:bg-background-elevated hover:border-border"}`}>
                      <span>{c || "All"}</span>
                      {count && <span className="text-text-muted">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Level</h3>
              <div className="space-y-1">
                {[["", "All"], ["1", "Beginner"], ["2", "Intermediate"], ["3", "Expert"]].map(([v, l]) => (
                  <button key={v} onClick={() => setLevel(v)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors border ${level === v ? "bg-brand-dim/20 text-text-primary border-brand/20" : "text-text-secondary border-transparent hover:bg-background-elevated hover:border-border"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl font-display font-bold text-text-primary mb-2">No skills found</p>
                <p className="text-text-secondary">Try a different search or filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
                {results.map(skill => (
                  <div key={skill._id} className="card p-5 space-y-4 hover:border-brand/40 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <Avatar src={skill.user?.avatar?.url} name={skill.user?.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary truncate">{skill.user?.name}</p>
                        <p className="text-xs text-text-muted truncate">{skill.user?.university}</p>
                      </div>
                      <TrustBadge score={skill.user?.trustScore || 50} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">{skill.displayName}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-background-elevated rounded-full text-text-muted">{skill.category}</span>
                        <ProficiencyBadge level={skill.proficiencyLevel} />
                      </div>
                      {skill.description && <p className="text-xs text-text-secondary mt-2 line-clamp-2">{skill.description}</p>}
                    </div>
                    {skill.user?._id !== user?._id && (
                      <Button onClick={() => setRequestTarget({ skillOffer: skill, user: skill.user })} variant="primary" size="sm" className="w-full">
                        Send Exchange Request
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exchange Request Modal */}
      <Modal isOpen={!!requestTarget} onClose={() => setRequestTarget(null)} title="Send Exchange Request">
        {requestTarget && (
          <div className="space-y-4">
            <div className="bg-background-elevated rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">You offer</p>
                <select className="input text-sm" value={reqForm.offeredSkillId} onChange={e => setReqForm(f => ({ ...f, offeredSkillId: e.target.value }))} required>
                  <option value="">Select your skill</option>
                  {myOffers.map(o => <option key={o._id} value={o._id}>{o.displayName}</option>)}
                </select>
              </div>
              <div className="text-text-muted text-xl">↔</div>
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">They offer</p>
                <div className="px-3 py-2 bg-blue-500/15 border border-blue-500/30 rounded-lg text-sm text-blue-600 dark:text-blue-400 font-medium">{requestTarget.skillOffer.displayName}</div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Proposed Time</label>
              <input type="datetime-local" className="input" value={reqForm.proposedTime} onChange={e => setReqForm(f => ({ ...f, proposedTime: e.target.value }))} min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Message (optional)</label>
              <textarea rows={3} className="input resize-none" placeholder="Say something..." value={reqForm.message} onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))} maxLength={300} />
              <p className="text-xs text-text-muted mt-1">{reqForm.message.length}/300</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setRequestTarget(null)}>Cancel</Button>
              <Button className="flex-1" loading={reqLoading} onClick={sendRequest}>Send Request</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
};

export default DiscoveryPage;
