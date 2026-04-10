import { createSlice } from "@reduxjs/toolkit";

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    data: null,
    completeness: 0,
  },
  reducers: {
    setProfile: (state, action) => {
      state.data = action.payload.user || action.payload;
      state.completeness = action.payload.profileCompleteness || action.payload?.user?.profileCompleteness || 0;
    },
    updateProfile: (state, action) => {
      state.data = { ...state.data, ...action.payload };
      if (action.payload.profileCompleteness !== undefined) {
        state.completeness = action.payload.profileCompleteness;
      }
    },
    clearProfile: (state) => {
      state.data = null;
      state.completeness = 0;
    },
  },
});

export const { setProfile, updateProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
export const selectProfile = (state) => state.profile.data;
export const selectProfileCompleteness = (state) => state.profile.data?.profileCompleteness ?? state.auth.user?.profileCompleteness ?? state.profile.completeness ?? 0;
