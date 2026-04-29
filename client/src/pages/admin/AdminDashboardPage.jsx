import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { getAdminStats, getAdminUsers, changeUserRole, toggleSuspendUser } from "../../api/adminApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Avatar from "../../components/common/Avatar";
import toast from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";

const ROLES = ["student", "moderator", "admin"];

const StatCard = ({ label, value, icon, color }) => (
  <Card className="p-6 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-mono font-bold text-text-primary mt-0.5">{value ?? "—"}</p>
    </div>
  </Card>
);

const RoleBadge = ({ role }) => {
  const colors = { admin: "bg-danger/10 text-danger border-danger/20", moderator: "bg-warning/10 text-warning border-warning/20", student: "bg-brand/10 text-brand border-brand/20" };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${colors[role] || colors.student}`}>{role}</span>;
};

// ─── Suspend Modal ────────────────────────────────────────────────────────────
const SuspendModal = ({ user, isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  if (!user) return null;
  const isSuspended = user.isSuspended;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isSuspended ? "Unsuspend User" : "Suspend User"}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-background-elevated rounded-xl">
          <Avatar src={user.avatar?.url} name={user.name} size="md" />
          <div>
            <p className="font-semibold text-text-primary">{user.name}</p>
            <p className="text-xs text-text-muted">{user.email}</p>
          </div>
        </div>
        {!isSuspended && (
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Reason</label>
            <textarea rows={2} className="input resize-none" placeholder="State the reason for suspension..." value={reason} onChange={e => setReason(e.target.value)} maxLength={300} />
          </div>
        )}
        <p className="text-xs text-text-muted">
          {isSuspended ? "This will restore the user's access to the platform." : "The user will be blocked from logging in."}
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className={`flex-1 ${isSuspended ? "" : "!bg-danger hover:!bg-danger/80"}`} onClick={() => { onConfirm(reason); onClose(); }}>
            {isSuspended ? "Unsuspend" : "Suspend User"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
  const currentUser = useSelector(selectCurrentUser);
  const qc = useQueryClient();

  // Role guard
  if (currentUser && currentUser.role !== "admin") return <Navigate to="/dashboard" replace />;

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: statsData } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats().then(r => r.data.data),
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin", "users", debouncedSearch, sortBy, sortDir, page],
    queryFn: () => getAdminUsers({ search: debouncedSearch, sortBy, sortDir, page, limit: 20 }).then(r => r.data.data),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => changeUserRole(id, role),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const suspendMut = useMutation({
    mutationFn: ({ id, reason }) => toggleSuspendUser(id, reason),
    onSuccess: () => { toast.success("User status updated"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-text-muted opacity-40">↕</span>;
    return <span className="text-brand">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const users = usersData?.users || [];
  const stats = statsData || {};

  return (
    <PageWrapper>
      <div className="space-y-6 stagger-children">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Platform management &amp; moderation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="bg-brand/10" />
          <StatCard label="New This Week" value={stats.newUsersThisWeek} icon="🆕" color="bg-success/10" />
          <StatCard label="Active Exchanges" value={stats.activeExchanges} icon="🤝" color="bg-accent/10" />
          <StatCard label="Credit Volume" value={stats.creditCirculation} icon="⚡" color="bg-warning/10" />
        </div>

        {/* User table */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <h2 className="font-display font-semibold text-text-primary">User Management</h2>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                id="admin-user-search"
                className="input pl-9 !py-2 w-64 text-sm"
                placeholder="Search by name, email, university..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <div key={i} className="h-14 bg-background-elevated rounded-xl animate-pulse" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-text-muted">No users found</div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    {[["Name", "name"], ["Email", "email"], ["Role", "role"], ["Trust", "trustScore"], ["Balance", "currentBalance"], ["Joined", "createdAt"]].map(([label, field]) => (
                      <th key={field} className="text-left py-3 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort(field)}>
                        {label} <SortIcon field={field} />
                      </th>
                    ))}
                    <th className="py-3 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                    <th className="py-3 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className={`border-b border-border/50 hover:bg-background-elevated/50 transition-colors ${u.isSuspended ? "opacity-60" : ""}`}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={u.avatar?.url} name={u.name} size="xs" />
                          <span className="font-medium text-text-primary truncate max-w-[120px]">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-text-secondary truncate max-w-[160px]">{u.email}</td>
                      <td className="py-3 px-3">
                        <select
                          value={u.role}
                          onChange={e => roleMut.mutate({ id: u._id, role: e.target.value })}
                          className="text-xs bg-background-elevated border border-border rounded-lg px-2 py-1 text-text-primary focus:ring-1 focus:ring-brand focus:outline-none"
                          disabled={u._id === currentUser?._id}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="py-3 px-3 font-mono text-text-primary">{u.trustScore}</td>
                      <td className="py-3 px-3 font-mono text-text-primary">{u.currentBalance}</td>
                      <td className="py-3 px-3 text-text-muted text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="py-3 px-3">
                        {u.isSuspended
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">Suspended</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Active</span>}
                      </td>
                      <td className="py-3 px-3">
                        {u._id !== currentUser?._id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={u.isSuspended ? "text-success border-success/30" : "text-danger border-danger/30"}
                            onClick={() => setSuspendTarget(u)}
                          >
                            {u.isSuspended ? "Unsuspend" : "Suspend"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {usersData?.pages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
              <p className="text-xs text-text-muted">
                Page {page} of {usersData.pages} · {usersData.total} users
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <Button variant="ghost" size="sm" disabled={page >= usersData.pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <SuspendModal
        user={suspendTarget}
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={(reason) => suspendMut.mutate({ id: suspendTarget._id, reason })}
      />
    </PageWrapper>
  );
};

export default AdminDashboardPage;
