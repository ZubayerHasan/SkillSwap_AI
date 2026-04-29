import React, { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getWallet, getTransactions, exportTransactions, sendCredits, searchWalletUsers } from "../../api/walletApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Avatar from "../../components/common/Avatar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatDate } from "../../components/common/formatters";
import toast from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TX_ICONS = {
  exchange_credit: "💚",
  exchange_debit: "💸",
  gift_sent: "🎁",
  gift_received: "🎀",
  starter_bonus: "⭐",
};

const TX_LABELS = {
  exchange_credit: "Credit earned",
  exchange_debit: "Credit spent",
  gift_sent: "Gift sent",
  gift_received: "Gift received",
  starter_bonus: "Starter bonus",
};

// ─── Send Credits Modal ───────────────────────────────────────────────────────
const SendCreditsModal = ({ isOpen, onClose, onSuccess }) => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const qc = useQueryClient();

  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ["wallet", "userSearch", debouncedSearch],
    queryFn: () => searchWalletUsers(debouncedSearch).then(r => r.data.data),
    enabled: debouncedSearch.length >= 2,
  });
  const users = searchData?.users || [];

  const sendMut = useMutation({
    mutationFn: () => sendCredits({ recipientId: selectedUser._id, amount: Number(amount), message }),
    onSuccess: () => {
      toast.success(`${amount} credit${amount !== 1 ? "s" : ""} sent to ${selectedUser.name}!`);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet", "txHistory"] });
      setSearch(""); setSelectedUser(null); setAmount(1); setMessage("");
      onSuccess?.();
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to send credits"),
  });

  const handleClose = () => {
    setSearch(""); setSelectedUser(null); setAmount(1); setMessage("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Credits">
      <div className="space-y-5">
        {/* Recipient search */}
        {!selectedUser ? (
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Search recipient</label>
            <div className="relative">
              <input
                id="send-credits-search"
                className="input pr-10"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {users.length > 0 && (
              <div className="mt-2 rounded-xl border border-border overflow-hidden divide-y divide-border">
                {users.map(u => (
                  <button
                    key={u._id}
                    onClick={() => setSelectedUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background-elevated transition-colors text-left"
                  >
                    <Avatar src={u.avatar?.url} name={u.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{u.name}</p>
                      <p className="text-xs text-text-muted truncate">{u.university}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {debouncedSearch.length >= 2 && !searching && users.length === 0 && (
              <p className="text-xs text-text-muted mt-2 text-center">No users found</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-background-elevated rounded-xl border border-border">
            <Avatar src={selectedUser.avatar?.url} name={selectedUser.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary">{selectedUser.name}</p>
              <p className="text-xs text-text-muted">{selectedUser.university}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-text-muted hover:text-text-primary text-xs px-2 py-1 rounded-lg hover:bg-background-card transition-colors">
              Change
            </button>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">
            Amount <span className="text-text-muted">(1–10 credits)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="send-credits-amount"
              type="number"
              min={1} max={10} step={1}
              value={amount}
              onChange={e => setAmount(Math.min(10, Math.max(1, Number(e.target.value))))}
              className="input w-24 text-center font-mono text-lg"
            />
            <div className="flex gap-1">
              {[1, 2, 3, 5, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setAmount(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    amount === n
                      ? "bg-brand text-white border-brand"
                      : "border-border text-text-secondary hover:border-brand hover:text-brand"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">Message <span className="text-text-muted">(optional)</span></label>
          <textarea
            rows={2}
            className="input resize-none"
            placeholder="Add a note..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-text-muted mt-1 text-right">{message.length}/200</p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>Cancel</Button>
          <Button
            id="send-credits-confirm"
            className="flex-1"
            loading={sendMut.isPending}
            onClick={() => sendMut.mutate()}
            disabled={!selectedUser || amount < 1}
          >
            Send {amount} Credit{amount !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background-card border border-border rounded-xl p-3 shadow-card text-sm">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-mono" style={{ color: p.fill }}>
          {p.name}: {p.value} credits
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const WalletPage = () => {
  const qc = useQueryClient();
  const [sendOpen, setSendOpen] = useState(false);

  const { data: walletData, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWallet().then(r => r.data.data),
  });

  // Infinite/paginated transaction history
  const {
    data: txPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["wallet", "txHistory"],
    queryFn: ({ pageParam }) =>
      getTransactions({ cursor: pageParam, limit: 20 }).then(r => r.data.data),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  const handleExport = async () => {
    try {
      const res = await exportTransactions();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "skillswap-transactions.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV downloaded!");
    } catch { toast.error("Export failed"); }
  };

  const chartData = (walletData?.monthlyStats || []).map(s => ({
    name: `${MONTH_LABELS[s._id.month - 1]} '${String(s._id.year).slice(2)}`,
    Earned: s.earned,
    Spent: s.spent,
  }));

  const balance = walletData?.currentBalance ?? 0;
  const allTransactions = txPages?.pages?.flatMap(p => p.transactions) || walletData?.recentTransactions || [];

  // Monthly totals from wallet summary
  const now = new Date();
  const recentTx = walletData?.recentTransactions || [];
  const thisMonthTx = recentTx.filter(t => new Date(t.createdAt).getMonth() === now.getMonth());
  const monthEarned = thisMonthTx
    .filter(t => ["exchange_credit", "gift_received", "starter_bonus"].includes(t.type))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const monthSpent = thisMonthTx
    .filter(t => ["exchange_debit", "gift_sent"].includes(t.type))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <PageWrapper>
      <div className="space-y-6 stagger-children">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Wallet</h1>
            <p className="text-text-secondary text-sm mt-1">Manage your time credits</p>
          </div>
          <div className="flex items-center gap-2">
            <Button id="send-credits-btn" variant="primary" size="sm" onClick={() => setSendOpen(true)}>
              🎁 Send Credits
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport}>⬇ Export CSV</Button>
          </div>
        </div>

        {/* Low balance warning */}
        {balance === 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-warning text-sm font-medium flex items-center gap-2">
            ⚠️ You have 0 credits. Complete exchanges to earn more.
          </div>
        )}

        {/* Hero balance card */}
        {isLoading ? (
          <div className="card h-48 animate-pulse bg-background-card" />
        ) : (
          <Card className="p-8 text-center bg-gradient-to-br from-background-card via-background-elevated to-background-card relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
            </div>
            <p className="text-text-secondary text-sm mb-2 relative z-10">Current Balance</p>
            <div className="text-7xl font-mono font-bold text-accent relative z-10 leading-none">{balance}</div>
            <p className="text-text-muted text-sm mt-2 relative z-10">time credits</p>
            <div className="flex justify-center gap-10 mt-6 text-sm relative z-10">
              <div>
                <p className="text-success font-semibold font-mono text-lg">+{monthEarned}</p>
                <p className="text-text-muted text-xs">earned this month</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-danger font-semibold font-mono text-lg">-{monthSpent}</p>
                <p className="text-text-muted text-xs">spent this month</p>
              </div>
            </div>
          </Card>
        )}

        {/* Bar chart */}
        {chartData.length > 0 && (
          <Card className="p-6">
            <h2 className="font-display font-semibold text-text-primary mb-5">Credits History (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#5c6275", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5c6275", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#9197a8", paddingTop: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="Earned" fill="#00d4aa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#ff4d6d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Transaction history */}
        <Card className="p-6">
          <h2 className="font-display font-semibold text-text-primary mb-5">Transaction History</h2>
          {allTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">💰</div>
              <p className="text-text-muted text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {allTransactions.map(tx => {
                const isPositive = tx.amount > 0;
                return (
                  <div
                    key={tx._id}
                    className="flex items-center gap-4 py-3.5 border-b border-border/60 last:border-0 hover:bg-background-elevated/50 transition-colors rounded-lg px-2 -mx-2"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                      isPositive ? "bg-success/10" : "bg-danger/10"
                    }`}>
                      {TX_ICONS[tx.type] || "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {TX_LABELS[tx.type] || tx.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {tx.note || (tx.counterpartyId?.name ? `with ${tx.counterpartyId.name}` : "—")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-mono font-bold text-sm ${isPositive ? "text-success" : "text-danger"}`}>
                        {isPositive ? "+" : ""}{tx.amount}
                      </p>
                      <p className="text-xs text-text-muted">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="mt-4 text-center">
              <Button
                id="wallet-load-more"
                variant="ghost"
                size="sm"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Load more transactions
              </Button>
            </div>
          )}
        </Card>
      </div>

      <SendCreditsModal isOpen={sendOpen} onClose={() => setSendOpen(false)} />
    </PageWrapper>
  );
};

export default WalletPage;
