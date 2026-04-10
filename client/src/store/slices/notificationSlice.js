import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload.notifications || [];
      state.unreadCount = action.payload.unreadCount || 0;
    },
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAllReadLocal: (state) => {
      state.items = state.items.map((n) => ({ ...n, read: true }));
      state.unreadCount = 0;
    },
    markOneReadLocal: (state, action) => {
      const idx = state.items.findIndex((n) => n._id === action.payload);
      if (idx !== -1 && !state.items[idx].read) {
        state.items[idx].read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
});

export const { setNotifications, addNotification, markAllReadLocal, markOneReadLocal } = notificationSlice.actions;
export default notificationSlice.reducer;
export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
