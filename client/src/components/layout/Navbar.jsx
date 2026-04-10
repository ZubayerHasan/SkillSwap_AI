import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "../../store/slices/authSlice";
import { selectUnreadCount, selectNotifications } from "../../store/slices/notificationSlice";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../common/Avatar";
import { markAllNotificationsRead, markNotificationRead } from "../../api/walletApi";
import { useDispatch } from "react-redux";
import { markAllReadLocal, markOneReadLocal } from "../../store/slices/notificationSlice";
import { formatDistanceToNow } from "../common/formatters";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/discover", label: "Discover", icon: "🔍" },
  { to: "/skills", label: "Skills", icon: "🎯" },
  { to: "/exchanges", label: "Exchanges", icon: "🤝" },
  { to: "/availability", label: "Availability", icon: "📅" },
  { to: "/wallet", label: "Wallet", icon: "⚡" },
];

const NOTIFICATION_ICONS = {
  new_match: "🔔",
  exchange_request: "📨",
  message: "💬",
  exchange_complete: "✅",
  review_reminder: "⭐",
  dispute: "⚠️",
};

const Navbar = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const unreadCount = useSelector(selectUnreadCount);
  const notifications = useSelector(selectNotifications);
  const { logout } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("skillswap-theme") || "dark");
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const mobileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("skillswap-theme", theme);
    document.documentElement.classList.toggle("theme-light", theme === "light");
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const isLight = theme === "light";

  const handleMarkAllRead = async () => {
    dispatch(markAllReadLocal());
    await markAllNotificationsRead().catch(() => { });
  };

  const handleMarkOneRead = async (id) => {
    dispatch(markOneReadLocal(id));
    await markNotificationRead(id).catch(() => { });
  };

  const themeLabel = useMemo(() => (isLight ? "Light mode" : "Dark mode"), [isLight]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-border/80 bg-background-primary/80 backdrop-blur-xl">
      <div className="w-full h-full px-3 sm:px-5 lg:px-8 flex items-center gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-xl flex-shrink-0">
            <img src="/favicon.svg" alt="SkillSwap AI" className="w-8 h-8 rounded-xl object-contain" />
            <span className="text-text-primary">SkillSwap <span className="text-brand">AI</span></span>
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-background-card text-text-primary hover:bg-background-elevated transition-colors"
              aria-label="Toggle navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {isAuthenticated && (
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-background-card shadow-card">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-brand text-white shadow-glow"
                      : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className="flex items-center gap-2 rounded-full border border-border bg-background-card px-2 py-1.5 hover:bg-background-elevated transition-colors"
              aria-label={themeLabel}
              title={themeLabel}
            >
              <span className={`text-[11px] font-semibold px-1.5 ${isLight ? "text-text-muted" : "text-text-primary"}`}>B</span>
              <span className="relative w-11 h-6 rounded-full border border-border bg-background-elevated flex items-center px-0.5 transition-colors">
                <span className={`w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${isLight ? "translate-x-5 bg-text-primary" : "translate-x-0 bg-white"}`} />
              </span>
              <span className={`text-[11px] font-semibold px-1.5 ${isLight ? "text-text-primary" : "text-text-muted"}`}>W</span>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                id="notification-bell"
                onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
                className="relative p-2.5 text-text-secondary hover:text-text-primary hover:bg-background-elevated rounded-xl transition-all duration-200 border border-transparent hover:border-border"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full animate-pulse-soft" />
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 card shadow-card border border-border overflow-hidden z-50 animate-fade-slide-up">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-semibold text-sm text-text-primary">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-brand hover:text-brand-hover">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-text-muted text-sm">No notifications yet</div>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleMarkOneRead(n._id)}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-background-elevated transition-colors cursor-pointer ${!n.read ? "bg-brand-dim/30" : ""}`}
                        >
                          <span className="text-lg mt-0.5">{NOTIFICATION_ICONS[n.type] || "🔔"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary truncate">{n.payload?.message || n.type}</p>
                            <p className="text-xs text-text-muted mt-0.5">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt)) : ""}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border">
                    <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block text-center text-xs text-brand hover:text-brand-hover py-2.5">
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 p-1.5 rounded-full border border-border bg-background-card hover:bg-background-elevated transition-all duration-200"
              >
                <Avatar src={user?.avatar?.url} name={user?.name} size="sm" />
                <svg className="w-3.5 h-3.5 text-text-muted hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-52 card shadow-card border border-border overflow-hidden z-50 animate-fade-slide-up">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-semibold text-sm text-text-primary truncate">{user?.name}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  </div>
                  {[
                    { to: "/profile/me", label: "My Profile" },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-border">
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div ref={mobileRef} className="relative lg:hidden">
              {mobileOpen && (
                <div className="absolute right-0 top-12 w-64 rounded-2xl border border-border bg-background-card shadow-card overflow-hidden animate-fade-slide-up">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Quick Menu</p>
                  </div>
                  <div className="p-2 grid gap-1">
                    {NAV_ITEMS.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                            ? "bg-brand text-white"
                            : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                          }`
                        }
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                    <div className="mt-1 rounded-xl border border-border bg-background-elevated px-3 py-2 text-xs text-text-muted">
                      Credits: <span className="font-mono text-text-primary">{user?.currentBalance ?? 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className="flex items-center gap-2 rounded-full border border-border bg-background-card px-2 py-1.5 hover:bg-background-elevated transition-colors"
              aria-label={themeLabel}
              title={themeLabel}
            >
              <span className={`text-[11px] font-semibold px-1.5 ${isLight ? "text-text-muted" : "text-text-primary"}`}>B</span>
              <span className="relative w-11 h-6 rounded-full border border-border bg-background-elevated flex items-center px-0.5 transition-colors">
                <span className={`w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${isLight ? "translate-x-5 bg-text-primary" : "translate-x-0 bg-white"}`} />
              </span>
              <span className={`text-[11px] font-semibold px-1.5 ${isLight ? "text-text-primary" : "text-text-muted"}`}>W</span>
            </button>
            <Link to="/login" className="btn-ghost !py-2 !px-4 text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
