import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAvailability, updateAvailability } from "../../api/skillsApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const AvailabilityPage = () => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState({}); // { "day-hour": true }
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { data, isLoading } = useQuery({
    queryKey: ["availability"],
    queryFn: async () => {
      const res = await getMyAvailability();
      // Convert slots back to grid cells
      const grid = {};
      (res.data.data.availability || []).forEach(slot => {
        for (let m = slot.startMinute; m < slot.endMinute; m += 60) {
          const h = Math.floor(m / 60);
          grid[`${slot.dayOfWeek}-${h}`] = true;
        }
      });
      setSelected(grid);
      return res.data.data;
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      // Convert grid to slots
      const slotsMap = {};
      Object.entries(selected).forEach(([key, val]) => {
        if (!val) return;
        const [day, hour] = key.split("-").map(Number);
        const k = `${day}-${hour}`;
        if (!slotsMap[k]) slotsMap[k] = { dayOfWeek: day, startMinute: hour * 60, endMinute: (hour + 1) * 60 };
      });
      const slots = Object.values(slotsMap);
      return updateAvailability({ slots, timezone });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["availability"] }); toast.success("Availability saved!"); },
    onError: e => toast.error(e.response?.data?.message || "Failed to save"),
  });

  const toggleCell = useCallback((day, hour, force) => {
    const key = `${day}-${hour}`;
    setSelected(prev => ({ ...prev, [key]: force !== undefined ? force : !prev[key] }));
  }, []);

  const copyToWeekdays = () => {
    // Copy Sunday's selection to Mon-Fri
    const sundayHours = HOURS.filter(h => selected[`0-${h}`]);
    const newSelected = { ...selected };
    for (let d = 1; d <= 5; d++) {
      HOURS.forEach(h => { newSelected[`${d}-${h}`] = sundayHours.includes(h); });
    }
    setSelected(newSelected);
    toast.success("Copied to Mon-Fri");
  };

  const totalHours = Object.values(selected).filter(Boolean).length;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Availability</h1>
            <p className="text-text-secondary text-sm mt-1">Timezone: <span className="text-brand">{timezone}</span> · {totalHours}h/week selected</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={copyToWeekdays}>Copy to Mon–Fri</Button>
            <Button size="sm" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save Schedule</Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-brand" /> Available</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-background-elevated border border-border" /> Unavailable</div>
        </div>

        {/* Weekly grid */}
        {isLoading ? <div className="card h-96 animate-shimmer" /> : (
          <Card className="p-4 overflow-x-auto">
            <div className="grid" style={{ gridTemplateColumns: `60px repeat(7, 1fr)`, minWidth: 560 }}>
              {/* Header */}
              <div className="text-text-muted text-xs text-center" />
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-text-secondary py-2">{d}</div>
              ))}
              {/* Rows */}
              {HOURS.map(h => (
                <React.Fragment key={h}>
                  <div className="text-right pr-3 text-xs text-text-muted py-0.5 flex items-center justify-end">
                    {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                  </div>
                  {DAYS.map((_, d) => {
                    const isOn = !!selected[`${d}-${h}`];
                    return (
                      <div
                        key={d}
                        className={`h-7 mx-0.5 my-0.5 rounded cursor-pointer select-none transition-colors duration-100 ${isOn ? "bg-brand hover:bg-brand-hover" : "bg-background-elevated border border-border/50 hover:bg-brand/20"}`}
                        onMouseDown={() => { setIsDragging(true); setDragValue(!isOn); toggleCell(d, h, !isOn); }}
                        onMouseEnter={() => { if (isDragging) toggleCell(d, h, dragValue); }}
                        onMouseUp={() => setIsDragging(false)}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
};

export default AvailabilityPage;
