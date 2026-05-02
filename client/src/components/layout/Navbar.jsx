import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  { to: "/matches", label: "Matches", icon: "✨" },
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
  const [theme, setTheme] = useState(() => localStorage.getItem("skillswap-theme") || "system");
  const [themeOpen, setThemeOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const mobileRef = useRef(null);
  const themeRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyTheme = useCallback((chosen) => {
    let resolved = chosen;
    if (chosen === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.classList.toggle("theme-light", resolved === "light");
    document.documentElement.dataset.theme = resolved;
  }, []);

  useEffect(() => {
    localStorage.setItem("skillswap-theme", theme);
    applyTheme(theme);

    // Watch system preference changes when in system mode
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const onChange = () => applyTheme("system");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, [theme, applyTheme]);

  const isLight = theme === "light" || (theme === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);

  const handleMarkAllRead = async () => {
    dispatch(markAllReadLocal());
    await markAllNotificationsRead().catch(() => { });
  };

  const handleMarkOneRead = async (id) => {
    dispatch(markOneReadLocal(id));
    await markNotificationRead(id).catch(() => { });
  };

  const THEME_OPTIONS = [
    { value: "dark", label: "Dark", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )},
    { value: "light", label: "Light", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    )},
    { value: "system", label: "System", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )},
  ];
  const currentThemeOpt = THEME_OPTIONS.find(o => o.value === theme) || THEME_OPTIONS[0];
  const themeLabel = useMemo(() => `Theme: ${currentThemeOpt.label}`, [currentThemeOpt]);

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
            {/* 3-way Theme Picker */}
            <div className="relative" ref={themeRef}>
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={() => setThemeOpen(v => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background-card px-2.5 py-2 hover:bg-background-elevated transition-colors text-text-secondary hover:text-text-primary"
                aria-label={themeLabel}
                title={themeLabel}
              >
                {currentThemeOpt.icon}
                <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {themeOpen && (
                <div className="absolute right-0 top-11 w-36 card shadow-card border border-border overflow-hidden z-50 animate-fade-slide-up">
                  {THEME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      id={`theme-opt-${opt.value}`}
                      onClick={() => { setTheme(opt.value); setThemeOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        theme === opt.value
                          ? "bg-brand/10 text-brand font-semibold"
                          : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                      {theme === opt.value && (
                        <svg className="w-3.5 h-3.5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                    ...(user?.role === "admin" ? [{ to: "/admin", label: "⚙️ Admin Dashboard" }] : []),
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
            {/* 3-way Theme Picker (unauthenticated) */}
            <div className="relative" ref={themeRef}>
              <button
                id="theme-toggle-btn-guest"
                type="button"
                onClick={() => setThemeOpen(v => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background-card px-2.5 py-2 hover:bg-background-elevated transition-colors text-text-secondary hover:text-text-primary"
                aria-label={themeLabel}
                title={themeLabel}
              >
                {currentThemeOpt.icon}
                <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {themeOpen && (
                <div className="absolute right-0 top-11 w-36 card shadow-card border border-border overflow-hidden z-50 animate-fade-slide-up">
                  {THEME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setTheme(opt.value); setThemeOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        theme === opt.value
                          ? "bg-brand/10 text-brand font-semibold"
                          : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/login" className="btn-ghost !py-2 !px-4 text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
