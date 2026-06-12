import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useQuery, useMutation } from "@tanstack/react-query";
import { updateUser } from "../../store/slices/authSlice";
import { createOffer, createNeed, getTaxonomy, updateAvailability } from "../../api/skillsApi";
import { updateProfile } from "../../api/profileApi";
import Button from "../common/Button";
import ProgressBar from "../common/ProgressBar";
import toast from "react-hot-toast";

const CATEGORIES = ["Programming", "Design", "Music", "Languages", "Math", "Science", "Writing", "Business", "Other"];
const PROFICIENCY = [{ value: 1, label: "Beginner" }, { value: 2, label: "Intermediate" }, { value: 3, label: "Expert" }];
const URGENCY = [{ value: 1, label: "Low" }, { value: 2, label: "Medium" }, { value: 3, label: "High" }];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PERIODS = [
  { label: "Morning", startMinute: 480, endMinute: 720 },
  { label: "Afternoon", startMinute: 720, endMinute: 1020 },
  { label: "Evening", startMinute: 1020, endMinute: 1320 },
];

const OnboardingWizard = ({ onComplete }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  // Step 1 — Skill offer
  const [offer, setOffer] = useState({ skillName: "", category: "Programming", proficiencyLevel: 2, description: "" });
  const [taxQuery, setTaxQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Step 2 — Skill need
  const [need, setNeed] = useState({ skillName: "", category: "Programming", urgency: 2, description: "" });

  // Step 3 — Availability
  const [availability, setAvailability] = useState({});

  // Taxonomy autocomplete
  useEffect(() => {
    if (taxQuery.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      getTaxonomy(taxQuery).then((r) => setSuggestions(r.data.data.skills || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [taxQuery]);

  const offerMut = useMutation({
    mutationFn: () => createOffer(offer),
    onSuccess: () => { toast.success("Skill offer added!"); setStep(2); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to add skill"),
  });

  const needMut = useMutation({
    mutationFn: () => createNeed(need),
    onSuccess: () => { toast.success("Skill need added!"); setStep(3); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to add skill"),
  });

  const finishMut = useMutation({
    mutationFn: async (skipAvailability = false) => {
      // Save availability if not skipping
      if (!skipAvailability) {
        const slots = [];
        Object.entries(availability).forEach(([key, checked]) => {
          if (checked) {
            const [day, periodIdx] = key.split("-").map(Number);
            if (isNaN(day) || isNaN(periodIdx)) return;
            const period = PERIODS[periodIdx];
            if (!period) return;
            slots.push({ dayOfWeek: day, startMinute: period.startMinute, endMinute: period.endMinute });
          }
        });
        if (slots.length > 0) {
          await updateAvailability({ slots });
        }
      }

      // Mark onboarding complete
      await updateProfile({ hasCompletedOnboarding: true });
    },
    onSuccess: () => {
      dispatch(updateUser({ hasCompletedOnboarding: true }));
      setShowConfetti(true);
      setTimeout(() => {
        onComplete?.();
        navigate("/discovery/matches");
      }, 2500);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  if (showConfetti) {
    return (
      <div className="fixed inset-0 z-[100] bg-background-primary/95 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-slide-up">
          <div className="text-7xl">🎊</div>
          <h2 className="text-3xl font-display font-bold text-text-primary">You're Ready!</h2>
          <p className="text-text-secondary">Finding your first matches...</p>
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background-primary/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg card p-8 animate-fade-slide-up">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-text-muted mb-3">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <ProgressBar value={step} max={3} showPercent={false} colorClass="bg-brand" />
        </div>

        {/* ─── Step 1: What can you teach? ──────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">What can you teach?</h2>
              <p className="text-sm text-text-secondary mt-1">Add at least one skill you can offer</p>
            </div>

            <div className="relative">
              <label className="text-sm font-medium text-text-secondary mb-1 block">Skill Name</label>
              <input
                className="input"
                placeholder="e.g. JavaScript, Guitar, Spanish..."
                value={offer.skillName}
                onChange={(e) => { setOffer({ ...offer, skillName: e.target.value }); setTaxQuery(e.target.value); }}
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 card max-h-32 overflow-y-auto divide-y divide-border">
                  {suggestions.map((s) => (
                    <button
                      key={s._id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-background-elevated text-text-primary"
                      onClick={() => { setOffer({ ...offer, skillName: s.displayName, category: s.category || offer.category }); setSuggestions([]); setTaxQuery(""); }}
                    >
                      {s.displayName} <span className="text-text-muted">· {s.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Category</label>
              <select className="input" value={offer.category} onChange={(e) => setOffer({ ...offer, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Proficiency</label>
              <div className="flex gap-2">
                {PROFICIENCY.map((p) => (
                  <button key={p.value} onClick={() => setOffer({ ...offer, proficiencyLevel: p.value })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${offer.proficiencyLevel === p.value ? "bg-brand text-white border-brand" : "border-border text-text-secondary hover:border-brand"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Skip</Button>
              <Button className="flex-1" loading={offerMut.isPending} disabled={!offer.skillName.trim()} onClick={() => offerMut.mutate()}>
                Add & Continue
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 2: What do you want to learn? ──────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">What do you want to learn?</h2>
              <p className="text-sm text-text-secondary mt-1">Tell us what skills you're looking for</p>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Skill Name</label>
              <input className="input" placeholder="e.g. Python, Piano, French..." value={need.skillName} onChange={(e) => setNeed({ ...need, skillName: e.target.value })} />
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Category</label>
              <select className="input" value={need.category} onChange={(e) => setNeed({ ...need, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Urgency</label>
              <div className="flex gap-2">
                {URGENCY.map((u) => (
                  <button key={u.value} onClick={() => setNeed({ ...need, urgency: u.value })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${need.urgency === u.value ? "bg-brand text-white border-brand" : "border-border text-text-secondary hover:border-brand"}`}>
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(3)}>Skip</Button>
              <Button className="flex-1" loading={needMut.isPending} disabled={!need.skillName.trim()} onClick={() => needMut.mutate()}>
                Add & Continue
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: When are you available? ─────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">When are you available?</h2>
              <p className="text-sm text-text-secondary mt-1">Check the times that work for you</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-text-muted text-left py-2 pr-3"></th>
                    {DAYS.map((d) => <th key={d} className="text-text-muted text-center py-2 px-1">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period, pIdx) => (
                    <tr key={period.label}>
                      <td className="text-text-secondary py-2 pr-3 font-medium">{period.label}</td>
                      {DAYS.map((_, dIdx) => {
                        const key = `${dIdx}-${pIdx}`;
                        return (
                          <td key={key} className="text-center py-2 px-1">
                            <button
                              onClick={() => setAvailability((a) => ({ ...a, [key]: !a[key] }))}
                              className={`w-8 h-8 rounded-lg transition-all duration-200 ${availability[key] ? "bg-brand text-white shadow-glow" : "bg-background-elevated border border-border hover:border-brand text-text-muted"}`}
                            >
                              {availability[key] ? "✓" : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => finishMut.mutate(true)}>
                I'll set this later
              </Button>
              <Button className="flex-1" loading={finishMut.isPending} onClick={() => finishMut.mutate(false)}>
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
