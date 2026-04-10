import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { getNotifications, markAllNotificationsRead } from "../../api/walletApi";
import { setNotifications, markAllReadLocal } from "../../store/slices/notificationSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { formatDistanceToNow } from "../../components/common/formatters";

const ICONS = { new_match: "🔔", exchange_request: "📨", message: "💬", exchange_complete: "✅", review_reminder: "⭐", dispute: "⚠️" };

const NotificationsPage = () => {
  const dispatch = useDispatch();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await getNotifications({ limit: 50 });
      dispatch(setNotifications(res.data.data));
      return res.data.data;
    },
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => dispatch(markAllReadLocal()),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Notifications</h1>
            {unreadCount > 0 && <p className="text-text-muted text-sm mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllMut.mutate()} loading={markAllMut.isPending}>
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="card h-16 animate-shimmer" />)
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔕</div>
            <p className="text-xl font-display font-bold text-text-primary mb-2">All caught up!</p>
            <p className="text-text-secondary">No notifications yet</p>
          </div>
        ) : (
          <Card className="divide-y divide-border">
            {notifications.map(n => (
              <div key={n._id} className={`flex items-start gap-4 p-4 transition-colors ${!n.read ? "bg-brand-dim/20" : "hover:bg-background-elevated"}`}>
                <span className="text-xl mt-0.5">{ICONS[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{n.payload?.message || n.type}</p>
                  <p className="text-xs text-text-muted mt-0.5">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt)) : ""}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0" />}
              </div>
            ))}
          </Card>
        )}
      </div>
    </PageWrapper>
  );
};

export default NotificationsPage;
