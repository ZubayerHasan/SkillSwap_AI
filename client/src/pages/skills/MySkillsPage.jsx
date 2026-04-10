import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyOffers, getMyNeeds, createOffer, createNeed, updateOffer, updateNeed, deleteOffer, deleteNeed, getTaxonomy } from "../../api/skillsApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import { ProficiencyBadge, UrgencyBadge } from "../../components/common/Badge";
import { useDebounce } from "../../hooks/useDebounce";
import toast from "react-hot-toast";

const CATEGORIES = ["Programming", "Design", "Music", "Languages", "Math/Science", "Video/Media", "Writing", "Business"];
const PROF_LABELS = { 1: "Beginner", 2: "Intermediate", 3: "Expert" };
const URG_LABELS = { 1: "Low", 2: "Medium", 3: "High" };

/* ── Reusable Skill Form (for create AND edit) ────────────────── */
const SkillForm = ({ type = "offer", onSubmit, loading, initial = null }) => {
  const [form, setForm] = useState({
    skillName: initial?.displayName || initial?.skillName || "",
    category: initial?.category || "",
    proficiencyLevel: initial?.proficiencyLevel ?? 2,
    urgency: initial?.urgency ?? 2,
    description: initial?.description || "",
    skillTaxonomyId: initial?.skillTaxonomyId || "",
  });
  const [query, setQuery] = useState(initial?.displayName || initial?.skillName || "");
  const debouncedQ = useDebounce(query, 300);
  const { data: taxonomyData } = useQuery({
    queryKey: ["taxonomy", debouncedQ],
    queryFn: () => getTaxonomy(debouncedQ).then(r => r.data.data),
    enabled: debouncedQ.length > 0 && !initial, // disable autocomplete when editing (skill name locked)
  });

  const isEditing = !!initial;

  const selectSkill = (skill) => {
    setForm(f => ({ ...f, skillName: skill.displayName, category: skill.category, skillTaxonomyId: skill._id }));
    setQuery(skill.displayName);
  };

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {/* Skill autocomplete — disabled when editing */}
      <div className="relative">
        <label className="text-sm font-medium text-text-secondary mb-1 block">Skill Name</label>
        <input
          className="input"
          placeholder="Search skills..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setForm(f => ({ ...f, skillName: e.target.value })); }}
          required
          disabled={isEditing}
          style={isEditing ? { opacity: 0.6, cursor: "not-allowed" } : {}}
        />
        {!isEditing && taxonomyData?.skills?.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-background-card border border-border rounded-lg shadow-card z-10 max-h-48 overflow-y-auto">
            {taxonomyData.skills.map(s => (
              <button key={s._id} type="button" onClick={() => selectSkill(s)} className="w-full text-left px-3 py-2 hover:bg-background-elevated text-sm flex justify-between">
                <span className="text-text-primary">{s.displayName}</span>
                <span className="text-text-muted text-xs">{s.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-text-secondary mb-1 block">Category</label>
        <select name="category" className="input" value={form.category} onChange={handle} required>
          <option value="">Select category</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Proficiency or Urgency */}
      {type === "offer" ? (
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">Proficiency Level</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(l => (
              <button key={l} type="button" onClick={() => setForm(f => ({ ...f, proficiencyLevel: l }))}
                className={`py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${form.proficiencyLevel === l ? "border-brand bg-brand text-white" : "border-border text-text-muted hover:border-brand/50"}`}>
                {PROF_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">Urgency</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(l => (
              <button key={l} type="button" onClick={() => setForm(f => ({ ...f, urgency: l }))}
                className={`py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${form.urgency === l ? "border-warning bg-warning text-white" : "border-border text-text-muted hover:border-warning/50"}`}>
                {URG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-text-secondary mb-1 block">Description (optional)</label>
        <textarea name="description" rows={3} className="input resize-none" placeholder="Describe your experience or what you're looking for..." value={form.description} onChange={handle} maxLength={1000} />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        {isEditing ? "Save Changes" : `Add ${type === "offer" ? "Skill Offer" : "Skill Need"}`}
      </Button>
    </form>
  );
};

/* ── Confirmation Dialog ──────────────────────────────────────── */
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm card p-6 animate-fade-slide-up">
        <h2 className="text-lg font-display font-bold text-text-primary mb-2">{title}</h2>
        <p className="text-sm text-text-secondary mb-5">{message}</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} type="button">Cancel</Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-danger text-white hover:bg-danger/80 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────── */
const MySkillsPage = () => {
  const [tab, setTab] = useState("offering");
  const [modal, setModal] = useState(null);  // "offer" | "need" | null
  const [editModal, setEditModal] = useState(null); // { type: "offer"|"need", item: {...} } | null
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: "offer"|"need", id, name } | null
  const qc = useQueryClient();

  const { data: offersData, isLoading: offerLoading } = useQuery({ queryKey: ["skills", "offers"], queryFn: () => getMyOffers().then(r => r.data.data) });
  const { data: needsData, isLoading: needLoading } = useQuery({ queryKey: ["skills", "needs"], queryFn: () => getMyNeeds().then(r => r.data.data) });

  // CREATE mutations
  const createOfferMut = useMutation({
    mutationFn: createOffer,
    onMutate: async (newOffer) => {
      await qc.cancelQueries({ queryKey: ["skills", "offers"] });
      const previous = qc.getQueryData(["skills", "offers"]);
      qc.setQueryData(["skills", "offers"], (current) => {
        const currentOffers = current?.offers || [];
        const optimisticOffer = { ...newOffer, _id: `optimistic-${Date.now()}`, endorsementCount: 0, isActive: true };
        return { ...(current || { offers: [], count: 0 }), offers: [optimisticOffer, ...currentOffers], count: (current?.count || currentOffers.length || 0) + 1 };
      });
      return { previous };
    },
    onError: (e, _newOffer, context) => {
      if (context?.previous) qc.setQueryData(["skills", "offers"], context.previous);
      toast.error(e.response?.data?.message || "Failed");
    },
    onSuccess: () => { setModal(null); toast.success("Skill offer added!"); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["skills", "offers"] }); },
  });

  const createNeedMut = useMutation({
    mutationFn: createNeed,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skills", "needs"] }); setModal(null); toast.success("Skill need added!"); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  // UPDATE mutations
  const updateOfferMut = useMutation({
    mutationFn: ({ id, data }) => updateOffer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills", "offers"] });
      setEditModal(null);
      toast.success("Skill offer updated!");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Update failed"),
  });

  const updateNeedMut = useMutation({
    mutationFn: ({ id, data }) => updateNeed(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills", "needs"] });
      setEditModal(null);
      toast.success("Skill need updated!");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Update failed"),
  });

  // DELETE mutations
  const delOfferMut = useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills", "offers"] });
      setDeleteConfirm(null);
      toast.success("Skill offer removed");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Delete failed"),
  });

  const delNeedMut = useMutation({
    mutationFn: deleteNeed,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills", "needs"] });
      setDeleteConfirm(null);
      toast.success("Skill need removed");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Delete failed"),
  });

  const offers = offersData?.offers || [];
  const needs = needsData?.needs || [];
  const MAX = 10;

  const handleEditSubmit = (formData) => {
    if (editModal.type === "offer") {
      updateOfferMut.mutate({
        id: editModal.item._id,
        data: {
          proficiencyLevel: Number(formData.proficiencyLevel),
          description: formData.description,
          category: formData.category,
        },
      });
    } else {
      updateNeedMut.mutate({
        id: editModal.item._id,
        data: {
          urgency: Number(formData.urgency),
          description: formData.description,
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.type === "offer") {
      delOfferMut.mutate(deleteConfirm.id);
    } else {
      delNeedMut.mutate(deleteConfirm.id);
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-text-primary">My Skills</h1>
          <Button onClick={() => setModal(tab === "offering" ? "offer" : "need")} size="sm">
            + Add {tab === "offering" ? "Offer" : "Need"}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-background-secondary p-1 rounded-xl w-fit">
          {["offering", "seeking"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${tab === t ? "bg-brand text-white" : "text-text-muted hover:text-text-primary"}`}>
              {t}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${tab === t ? "bg-white/20" : "bg-border"}`}>
                {t === "offering" ? offers.length : needs.length}/{MAX}
              </span>
            </button>
          ))}
        </div>

        {/* ────── OFFERING TAB ────── */}
        {tab === "offering" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {offerLoading ? Array(3).fill(0).map((_, i) => <div key={i} className="card p-5 h-40 animate-shimmer" />) :
              offers.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-text-muted">
                  <div className="text-5xl mb-4">🎯</div>
                  <p className="font-medium text-text-primary mb-1">No skills offered yet</p>
                  <p className="text-sm">Add skills you can teach others</p>
                </div>
              ) : offers.map(offer => (
                <Card key={offer._id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text-primary">{offer.displayName}</h3>
                    <ProficiencyBadge level={offer.proficiencyLevel} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-background-elevated text-text-muted">{offer.category}</span>
                  {offer.description && <p className="text-xs text-text-secondary line-clamp-2">{offer.description}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-text-muted">⭐ {offer.endorsementCount} endorsements</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditModal({ type: "offer", item: offer })}
                        className="text-xs text-brand hover:text-brand/80 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "offer", id: offer._id, name: offer.displayName })}
                        className="text-xs text-danger hover:text-danger/80 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            }
          </div>
        )}

        {/* ────── SEEKING TAB ────── */}
        {tab === "seeking" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {needLoading ? Array(3).fill(0).map((_, i) => <div key={i} className="card p-5 h-40 animate-shimmer" />) :
              needs.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-text-muted">
                  <div className="text-5xl mb-4">📚</div>
                  <p className="font-medium text-text-primary mb-1">No skill needs listed</p>
                  <p className="text-sm">Tell others what you want to learn</p>
                </div>
              ) : needs.map(need => (
                <Card key={need._id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text-primary">{need.displayName}</h3>
                    <UrgencyBadge level={need.urgency} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-background-elevated text-text-muted">{need.category}</span>
                  {need.description && <p className="text-xs text-text-secondary line-clamp-2">{need.description}</p>}
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      onClick={() => setEditModal({ type: "need", item: need })}
                      className="text-xs text-brand hover:text-brand/80 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: "need", id: need._id, name: need.displayName })}
                      className="text-xs text-danger hover:text-danger/80 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              ))
            }
          </div>
        )}

        {/* ────── CREATE MODALS ────── */}
        <Modal isOpen={modal === "offer"} onClose={() => setModal(null)} title="Add Skill Offer">
          <SkillForm type="offer" onSubmit={(f) => createOfferMut.mutate({ ...f, proficiencyLevel: Number(f.proficiencyLevel) })} loading={createOfferMut.isPending} />
        </Modal>
        <Modal isOpen={modal === "need"} onClose={() => setModal(null)} title="Add Skill Need">
          <SkillForm type="need" onSubmit={(f) => createNeedMut.mutate({ ...f, urgency: Number(f.urgency) })} loading={createNeedMut.isPending} />
        </Modal>

        {/* ────── EDIT MODALS ────── */}
        <Modal
          isOpen={!!editModal}
          onClose={() => setEditModal(null)}
          title={editModal?.type === "offer" ? "Edit Skill Offer" : "Edit Skill Need"}
        >
          {editModal && (
            <SkillForm
              type={editModal.type}
              initial={editModal.item}
              onSubmit={handleEditSubmit}
              loading={updateOfferMut.isPending || updateNeedMut.isPending}
            />
          )}
        </Modal>

        {/* ────── DELETE CONFIRMATION ────── */}
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Skill"
          message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
          loading={delOfferMut.isPending || delNeedMut.isPending}
        />
      </div>
    </PageWrapper>
  );
};

export default MySkillsPage;
