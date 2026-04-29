import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { discoverSkills } from "../../api/matchApi";
import { createExchangeRequest } from "../../api/walletApi";
import { getMyOffers } from "../../api/skillsApi";
import { createBroadcast, getBroadcasts, getMyBroadcasts, fulfillBroadcast } from "../../api/skillsApi";
import { selectCurrentUser } from "../../store/slices/authSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import { SkeletonCard } from "../../components/common/SkeletonLoader";
import Avatar from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { ProficiencyBadge, TrustBadge } from "../../components/common/Badge";
import { useDebounce } from "../../hooks/useDebounce";
import { formatDistanceToNow } from "../../components/common/formatters";
import toast from "react-hot-toast";

const CATEGORIES = ["", "Programming", "Design", "Music", "Languages", "Math/Science", "Video/Media", "Writing", "Business"];
const URGENCY_MAP = { 1: { label: "Low", color: "text-text-muted bg-text-muted/10 border-text-muted/20" }, 2: { label: "Medium", color: "text-warning bg-warning/10 border-warning/20" }, 3: { label: "High", color: "text-danger bg-danger/10 border-danger/20" } };

// ─── Post Broadcast Modal ─────────────────────────────────────────────────────
const PostBroadcastModal = ({ isOpen, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ skillName: "", category: "", description: "", urgency: 2 });

  const mut = useMutation({
    mutationFn: () => createBroadcast(form),
    onSuccess: () => {
      toast.success("Broadcast posted!");
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
      qc.invalidateQueries({ queryKey: ["myBroadcasts"] });
      setForm({ skillName: "", category: "", description: "", urgency: 2 });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to post broadcast"),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post a Skill Need">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">Skill needed *</label>
          <input id="broadcast-skill" className="input" placeholder="e.g. Machine Learning, Guitar, Spanish..." value={form.skillName} onChange={e => setForm(f => ({ ...f, skillName: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">Category *</label>
          <select id="broadcast-category" className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="">Select category...</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">Description</label>
          <textarea rows={3} className="input resize-none" placeholder="Describe what you need help with..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={500} />
          <p className="text-xs text-text-muted mt-1 text-right">{form.description.length}/500</p>
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">Urgency *</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(u => (
              <button key={u} onClick={() => setForm(f => ({ ...f, urgency: u }))}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${form.urgency === u ? URGENCY_MAP[u].color + " border-current" : "border-border text-text-muted hover:border-brand/40"}`}>
                {URGENCY_MAP[u].label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-text-muted">Broadcasts expire in 30 days · Max 3 active at once</p>
        <div className="flex gap-3 pt-1">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button id="post-broadcast-submit" className="flex-1" loading={mut.isPending} onClick={() => mut.mutate()} disabled={!form.skillName || !form.category}>
            Post Broadcast
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Broadcast Card ───────────────────────────────────────────────────────────
const BroadcastCard = ({ b, currentUserId, onFulfill, onHelp }) => {
  const u = URGENCY_MAP[b.urgency] || URGENCY_MAP[2];
  const poster = b.userId;
  const isOwn = poster?._id === currentUserId || b.userId === currentUserId;
  return (
    <div className="card p-5 space-y-3 hover:border-brand/30 transition-all duration-200">
      <div className="flex items-start gap-3">
        <Avatar src={poster?.avatar?.url} name={poster?.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{poster?.name || "Unknown"}</p>
          <p className="text-xs text-text-muted truncate">{poster?.university}</p>
        </div>
        <TrustBadge score={poster?.trustScore || 50} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-bold text-text-primary">{b.displayName}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${u.color}`}>{u.label}</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-background-elevated rounded-full text-text-muted">{b.category}</span>
        {b.description && <p className="text-xs text-text-secondary mt-2 line-clamp-2">{b.description}</p>}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-xs text-text-muted">{b.createdAt ? formatDistanceToNow(new Date(b.createdAt)) + " ago" : ""}</p>
        {isOwn ? (
          <Button size="sm" variant="ghost" className="text-success border-success/30 hover:border-success/60" onClick={() => onFulfill(b._id)}>
            ✓ Mark Fulfilled
          </Button>
        ) : (
          <Button size="sm" onClick={() => onHelp(b)}>I Can Help</Button>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DiscoveryPage = () => {
  const user = useSelector(selectCurrentUser);
  const qc = useQueryClient();
  const [tab, setTab] = useState("discover"); // "discover" | "broadcasts"
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [requestTarget, setRequestTarget] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [helpTarget, setHelpTarget] = useState(null);
  const [reqForm, setReqForm] = useState({ offeredSkillId: "", proposedTime: "", message: "" });
  const [reqLoading, setReqLoading] = useState(false);
  const debouncedQ = useDebounce(searchInput, 300);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["discovery", debouncedQ, category, level],
    queryFn: () => discoverSkills({ q: debouncedQ || undefined, category: category || undefined, level: level || undefined, limit: 12 }).then(r => r.data.data),
    keepPreviousData: true,
    enabled: tab === "discover",
  });

  const { data: myOffersData } = useQuery({ queryKey: ["skills", "offers"], queryFn: () => getMyOffers().then(r => r.data.data) });
  const myOffers = myOffersData?.offers || [];

  const { data: broadcastsData, isLoading: bLoading } = useQuery({
    queryKey: ["broadcasts"],
    queryFn: () => getBroadcasts({ limit: 20 }).then(r => r.data.data),
    enabled: tab === "broadcasts",
  });

  const { data: myBroadcastsData } = useQuery({
    queryKey: ["myBroadcasts"],
    queryFn: () => getMyBroadcasts().then(r => r.data.data),
    enabled: tab === "broadcasts",
  });

  const fulfillMut = useMutation({
    mutationFn: (id) => fulfillBroadcast(id),
    onSuccess: () => { toast.success("Marked as fulfilled!"); qc.invalidateQueries({ queryKey: ["broadcasts"] }); qc.invalidateQueries({ queryKey: ["myBroadcasts"] }); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const sendRequest = async () => {
    if (!reqForm.offeredSkillId) { toast.error("Select a skill you're offering"); return; }
    if (!reqForm.proposedTime) { toast.error("Select a proposed time"); return; }
    setReqLoading(true);
    try {
      await createExchangeRequest({ receiverId: requestTarget.user._id, offeredSkillId: reqForm.offeredSkillId, requestedSkillId: requestTarget.skillOffer._id, proposedTime: reqForm.proposedTime, message: reqForm.message });
      toast.success("Exchange request sent!"); setRequestTarget(null);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to send request"); }
    finally { setReqLoading(false); }
  };

  const results = data?.results || [];
  const facets = data?.facets || {};
  const broadcasts = broadcastsData?.broadcasts || [];
  const myBroadcasts = myBroadcastsData?.broadcasts || [];

  const openBroadcastHelp = (b) => {
    // Pre-fill requestTarget with broadcast poster for exchange request
    setHelpTarget(b);
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Discover</h1>
            <p className="text-text-secondary mt-1 text-sm">Find skill partners · Browse community needs</p>
          </div>
          {tab === "broadcasts" && (
            <Button id="post-broadcast-btn" onClick={() => setBroadcastOpen(true)}>
              📢 Post a Skill Need
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-background-card border border-border rounded-xl w-fit">
          {[["discover", "🔍 Skills"], ["broadcasts", "📢 Community Needs"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-brand text-white shadow-glow" : "text-text-secondary hover:text-text-primary"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── DISCOVER TAB ── */}
        {tab === "discover" && (
          <>
            <div className="sticky top-20 z-10">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input className="input pl-12 text-lg !py-3.5 shadow-card border-background-elevated focus:border-brand" placeholder="Search for any skill..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
                {isFetching && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />}
              </div>
            </div>
            <div className="flex gap-6">
              <aside className="hidden md:block w-52 flex-shrink-0 space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Category</h3>
                  <div className="space-y-1">
                    {CATEGORIES.map(c => {
                      const count = facets.categories?.find(f => f._id === c)?.count;
                      return (
                        <button key={c} onClick={() => setCategory(c)} className={`w-full flex justify-between text-left px-3 py-2 text-sm rounded-lg transition-colors border ${category === c ? "bg-brand-dim/20 text-text-primary border-brand/20" : "text-text-secondary border-transparent hover:bg-background-elevated hover:border-border"}`}>
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
                      <button key={v} onClick={() => setLevel(v)} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors border ${level === v ? "bg-brand-dim/20 text-text-primary border-brand/20" : "text-text-secondary border-transparent hover:bg-background-elevated hover:border-border"}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </aside>
              <div className="flex-1">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
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
          </>
        )}

        {/* ── BROADCASTS TAB ── */}
        {tab === "broadcasts" && (
          <div className="space-y-6">
            {/* My active broadcasts */}
            {myBroadcasts.filter(b => b.status === "open").length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Your Active Broadcasts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {myBroadcasts.filter(b => b.status === "open").map(b => (
                    <BroadcastCard key={b._id} b={{ ...b, userId: { _id: user._id, name: user.name, avatar: user.avatar, trustScore: user.trustScore, university: user.university } }} currentUserId={user._id} onFulfill={(id) => fulfillMut.mutate(id)} onHelp={openBroadcastHelp} />
                  ))}
                </div>
              </div>
            )}

            {/* Community broadcasts */}
            <div>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                Community Broadcasts {broadcastsData?.total ? `· ${broadcastsData.total} open` : ""}
              </h2>
              {bLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
              ) : broadcasts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📢</div>
                  <p className="text-xl font-display font-bold text-text-primary mb-2">No broadcasts yet</p>
                  <p className="text-text-secondary mb-6">Be the first to post a skill need!</p>
                  <Button onClick={() => setBroadcastOpen(true)}>Post a Skill Need</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
                  {broadcasts.map(b => (
                    <BroadcastCard key={b._id} b={b} currentUserId={user._id} onFulfill={(id) => fulfillMut.mutate(id)} onHelp={openBroadcastHelp} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
                <div className="px-3 py-2 bg-brand/10 border border-brand/20 rounded-lg text-sm text-brand font-medium">{requestTarget.skillOffer.displayName}</div>
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

      {/* Help with broadcast — simplified: show exchange modal */}
      <Modal isOpen={!!helpTarget} onClose={() => setHelpTarget(null)} title="Offer Help">
        {helpTarget && (
          <div className="space-y-4">
            <div className="p-4 bg-background-elevated rounded-xl">
              <p className="text-xs text-text-muted mb-1">They need help with</p>
              <p className="font-bold text-text-primary">{helpTarget.displayName}</p>
              {helpTarget.description && <p className="text-xs text-text-secondary mt-1">{helpTarget.description}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Your skill to offer</label>
              <select className="input text-sm" value={reqForm.offeredSkillId} onChange={e => setReqForm(f => ({ ...f, offeredSkillId: e.target.value }))}>
                <option value="">Select your skill</option>
                {myOffers.map(o => <option key={o._id} value={o._id}>{o.displayName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Proposed Time</label>
              <input type="datetime-local" className="input" value={reqForm.proposedTime} onChange={e => setReqForm(f => ({ ...f, proposedTime: e.target.value }))} min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Message</label>
              <textarea rows={2} className="input resize-none" placeholder="I can help you with this!" value={reqForm.message} onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))} maxLength={300} />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setHelpTarget(null)}>Cancel</Button>
              <Button className="flex-1" loading={reqLoading} onClick={async () => {
                if (!reqForm.offeredSkillId || !reqForm.proposedTime) { toast.error("Select a skill and proposed time"); return; }
                setReqLoading(true);
                try {
                  await createExchangeRequest({ receiverId: helpTarget.userId?._id || helpTarget.userId, offeredSkillId: reqForm.offeredSkillId, requestedSkillId: helpTarget._id, proposedTime: reqForm.proposedTime, message: reqForm.message || `I can help you with ${helpTarget.displayName}!` });
                  toast.success("Help offer sent!"); setHelpTarget(null); setReqForm({ offeredSkillId: "", proposedTime: "", message: "" });
                } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
                finally { setReqLoading(false); }
              }}>Send Offer</Button>
            </div>
          </div>
        )}
      </Modal>

      <PostBroadcastModal isOpen={broadcastOpen} onClose={() => setBroadcastOpen(false)} />
    </PageWrapper>
  );
};

export default DiscoveryPage;
