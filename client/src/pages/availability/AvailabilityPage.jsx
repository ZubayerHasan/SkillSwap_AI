import React, { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAvailability, updateAvailability } from "../../api/skillsApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

// Days in order: Mon–Sun (dayOfWeek: 1–6, 0)
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0]; // maps display column → dayOfWeek

// 30-minute slots: 0..47 → hours 0:00–23:30
const SLOTS_PER_DAY = 48;
const slotToLabel = (slot) => {
  const totalMin = slot * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return m === 0 ? "12:00 am" : "12:30 am";
  if (h < 12) return `${h}:${m === 0 ? "00" : "30"} am`;
  if (h === 12) return `12:${m === 0 ? "00" : "30"} pm`;
  return `${h - 12}:${m === 0 ? "00" : "30"} pm`;
};

// Show label only every 2 slots (every hour)
const showLabel = (slot) => slot % 2 === 0;

// Convert grid selection → slots array
const gridToSlots = (selected) => {
  // Group consecutive selected slots per day into ranges
  const dayMap = {};
  Object.entries(selected).forEach(([key, val]) => {
    if (!val) return;
    const [dayOfWeek, slot] = key.split("-").map(Number);
    if (!dayMap[dayOfWeek]) dayMap[dayOfWeek] = [];
    dayMap[dayOfWeek].push(slot);
  });

  const slots = [];
  Object.entries(dayMap).forEach(([dayOfWeek, slotList]) => {
    const sorted = slotList.sort((a, b) => a - b);
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      if (i === sorted.length || sorted[i] !== prev + 1) {
        slots.push({
          dayOfWeek: Number(dayOfWeek),
          startMinute: start * 30,
          endMinute: (prev + 1) * 30,
        });
        start = sorted[i];
        prev = sorted[i];
      } else {
        prev = sorted[i];
      }
    }
  });
  return slots;
};

// Convert slots → grid selection
const slotsToGrid = (slots) => {
  const grid = {};
  (slots || []).forEach(({ dayOfWeek, startMinute, endMinute }) => {
    for (let m = startMinute; m < endMinute; m += 30) {
      const slot = m / 30;
      grid[`${dayOfWeek}-${slot}`] = true;
    }
  });
  return grid;
};

// Get IANA timezones
const TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Asia/Dhaka", "America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"];
  }
})();

// ─── Timezone Selector ────────────────────────────────────────────────────────
const TimezoneSelector = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? TIMEZONES.filter(tz => tz.toLowerCase().includes(search.toLowerCase())).slice(0, 40)
    : TIMEZONES.slice(0, 40);

  return (
    <div className="relative" ref={ref}>
      <button
        id="timezone-selector"
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background-card text-sm text-text-primary hover:bg-background-elevated transition-colors max-w-xs truncate"
      >
        <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
        <span className="truncate">{value}</span>
        <svg className="w-3.5 h-3.5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-72 card shadow-card border border-border overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              className="input !py-2 text-sm"
              placeholder="Search timezone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(tz => (
              <button
                key={tz}
                onClick={() => { onChange(tz); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  tz === value
                    ? "bg-brand/10 text-brand font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                }`}
              >
                {tz}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AvailabilityPage = () => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  const { isLoading } = useQuery({
    queryKey: ["availability"],
    queryFn: async () => {
      const res = await getMyAvailability();
      const d = res.data.data;
      if (d.timezone) setTimezone(d.timezone);
      setSelected(slotsToGrid(d.availability));
      return d;
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const slots = gridToSlots(selected);
      return updateAvailability({ slots, timezone });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Availability saved!");
    },
    onError: e => toast.error(e.response?.data?.message || "Failed to save"),
  });

  const toggleCell = useCallback((dayOfWeek, slot, force) => {
    const key = `${dayOfWeek}-${slot}`;
    setSelected(prev => ({ ...prev, [key]: force !== undefined ? force : !prev[key] }));
  }, []);

  const handleMouseDown = (dayOfWeek, slot) => {
    const key = `${dayOfWeek}-${slot}`;
    const next = !selected[key];
    setIsDragging(true);
    setDragValue(next);
    toggleCell(dayOfWeek, slot, next);
  };

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const clearAll = () => { setSelected({}); toast.success("All slots cleared"); };

  const copyToWeekdays = () => {
    // Find what is selected on Monday (col index 0, dayOfWeek 1)
    // and copy to Tue–Fri (dayOfWeek 2-5)
    const mondaySlots = Array.from({ length: SLOTS_PER_DAY }, (_, s) => s).filter(s => selected[`1-${s}`]);
    const newSelected = { ...selected };
    for (let d = 2; d <= 5; d++) {
      for (let s = 0; s < SLOTS_PER_DAY; s++) {
        newSelected[`${d}-${s}`] = mondaySlots.includes(s);
      }
    }
    setSelected(newSelected);
    toast.success("Monday copied to Tue–Fri");
  };

  const totalHours = Object.values(selected).filter(Boolean).length * 0.5;
  const selectedSlots = gridToSlots(selected).length;

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Availability Schedule</h1>
            <p className="text-text-secondary text-sm mt-1">
              {totalHours}h/week selected · {selectedSlots} time block{selectedSlots !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-danger hover:border-danger/40">
              Clear All
            </Button>
            <Button variant="ghost" size="sm" onClick={copyToWeekdays}>
              Copy Mon → Tue–Fri
            </Button>
            <Button id="save-availability" size="sm" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>
              Save Schedule
            </Button>
          </div>
        </div>

        {/* Timezone selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-text-muted">Timezone:</span>
          <TimezoneSelector value={timezone} onChange={setTimezone} />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-brand" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-background-elevated border border-border" />
            <span>Unavailable</span>
          </div>
          <p className="text-text-muted text-xs ml-auto hidden sm:block">
            Click or drag to select time blocks
          </p>
        </div>

        {/* Weekly grid */}
        {isLoading ? (
          <div className="card h-96 animate-pulse bg-background-card" />
        ) : (
          <Card className="p-4 overflow-x-auto">
            <div
              className="select-none"
              style={{
                display: "grid",
                gridTemplateColumns: "52px repeat(7, 1fr)",
                minWidth: 520,
              }}
            >
              {/* Header row */}
              <div />
              {DAY_LABELS.map((d, i) => (
                <div key={d} className="text-center text-xs font-semibold text-text-secondary pb-2 px-0.5">
                  <span className={`inline-block px-2 py-1 rounded-lg ${
                    i < 5 ? "text-text-secondary" : "text-warning/80"
                  }`}>{d}</span>
                </div>
              ))}

              {/* Slot rows */}
              {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => (
                <React.Fragment key={slot}>
                  {/* Time label */}
                  <div className="pr-2 text-right flex items-center justify-end" style={{ height: 20 }}>
                    {showLabel(slot) && (
                      <span className="text-[10px] text-text-muted leading-none whitespace-nowrap">
                        {slotToLabel(slot)}
                      </span>
                    )}
                  </div>

                  {/* Day cells */}
                  {DAY_INDICES.map((dayOfWeek, colIdx) => {
                    const isOn = !!selected[`${dayOfWeek}-${slot}`];
                    const isWeekend = colIdx >= 5;
                    return (
                      <div
                        key={dayOfWeek}
                        style={{ height: 20 }}
                        className={`mx-0.5 my-px rounded-sm cursor-pointer transition-colors duration-75 ${
                          isOn
                            ? "bg-brand hover:bg-brand-hover"
                            : isWeekend
                            ? "bg-warning/5 border border-border/30 hover:bg-brand/20"
                            : "bg-background-elevated border border-border/30 hover:bg-brand/20"
                        }`}
                        onMouseDown={() => handleMouseDown(dayOfWeek, slot)}
                        onMouseEnter={() => { if (isDragging) toggleCell(dayOfWeek, slot, dragValue); }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </Card>
        )}

        {/* Summary footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DAY_LABELS.slice(0, 5).map((d, i) => {
            const dayOfWeek = DAY_INDICES[i];
            const count = Array.from({ length: SLOTS_PER_DAY }, (_, s) => s).filter(s => selected[`${dayOfWeek}-${s}`]).length;
            return (
              <div key={d} className="card p-3 text-center">
                <p className="text-xs text-text-muted">{d}</p>
                <p className="text-sm font-mono font-bold text-text-primary mt-0.5">{(count * 0.5).toFixed(1)}h</p>
              </div>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
};

export default AvailabilityPage;
