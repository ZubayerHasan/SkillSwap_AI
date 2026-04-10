import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getWallet, getTransactions, exportTransactions } from "../../api/walletApi";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatDate } from "../../components/common/formatters";
import toast from "react-hot-toast";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TX_ICONS = {
  exchange_credit: "💚",
  exchange_debit: "💸",
  gift_sent: "🎁",
  gift_received: "🎀",
  starter_bonus: "⭐",
};

const WalletPage = () => {
  const { data: walletData, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWallet().then(r => r.data.data),
  });
  const { data: txData } = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () => getTransactions().then(r => r.data.data),
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

  const chartData = walletData?.monthlyStats?.map(s => ({
    name: `${MONTH_LABELS[s._id.month - 1]} ${s._id.year}`,
    earned: s.earned,
    spent: s.spent,
  })) || [];

  const balance = walletData?.currentBalance ?? 0;
  const transactions = txData?.transactions || walletData?.recentTransactions || [];

  // Monthly totals
  const now = new Date();
  const thisMonthTx = transactions.filter(t => new Date(t.createdAt).getMonth() === now.getMonth());
  const monthEarned = thisMonthTx.filter(t => ["exchange_credit", "gift_received", "starter_bonus"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const monthSpent = thisMonthTx.filter(t => ["exchange_debit", "gift_sent"].includes(t.type)).reduce((s, t) => s + t.amount, 0);

  return (
    <PageWrapper>
      <div className="space-y-6 stagger-children">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-text-primary">Wallet</h1>
          <Button variant="ghost" size="sm" onClick={handleExport}>⬇ Export CSV</Button>
        </div>

        {/* Balance banner */}
        {balance === 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-warning text-sm font-medium">
            ⚠️ You have 0 credits. Complete exchanges to earn more.
          </div>
        )}

        {/* Hero balance card */}
        <Card className="p-8 text-center bg-gradient-to-br from-background-card to-background-elevated">
          <p className="text-text-secondary text-sm mb-2">Current Balance</p>
          <div className="text-6xl font-mono font-bold text-accent animate-count-up">{balance}</div>
          <p className="text-text-muted text-sm mt-1">time credits</p>
          <div className="flex justify-center gap-8 mt-6 text-sm">
            <div>
              <p className="text-success font-semibold font-mono">+{monthEarned}</p>
              <p className="text-text-muted text-xs">earned this month</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-danger font-semibold font-mono">-{monthSpent}</p>
              <p className="text-text-muted text-xs">spent this month</p>
            </div>
          </div>
        </Card>

        {/* Bar chart */}
        {chartData.length > 0 && (
          <Card className="p-6">
            <h2 className="font-display font-semibold text-text-primary mb-4">Credits History (6 months)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f40" />
                <XAxis dataKey="name" tick={{ fill: "#5c6275", fontSize: 11 }} />
                <YAxis tick={{ fill: "#5c6275", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1e2b", border: "1px solid #2a2f40", borderRadius: "8px", color: "#e8eaf0" }} />
                <Bar dataKey="earned" fill="#00d4aa" radius={4} name="Earned" />
                <Bar dataKey="spent" fill="#ff4d6d" radius={4} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Transactions */}
        <Card className="p-6">
          <h2 className="font-display font-semibold text-text-primary mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-center text-text-muted py-8 text-sm">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx._id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TX_ICONS[tx.type] || "💰"}</span>
                    <div>
                      <p className="text-sm text-text-primary capitalize">{tx.type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-text-muted">{tx.note || (tx.counterpartyId?.name ? `with ${tx.counterpartyId.name}` : "")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-semibold text-sm ${tx.amount > 0 ? "text-success" : "text-danger"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </p>
                    <p className="text-xs text-text-muted">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default WalletPage;
