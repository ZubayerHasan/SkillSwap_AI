import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { store } from "./store";
import AppRouter from "./routes/AppRouter";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, setLoading } from "./store/slices/authSlice";
import { selectCurrentUser, selectIsAuthenticated } from "./store/slices/authSlice";
import { setProfile } from "./store/slices/profileSlice";
import { useSocket } from "./hooks/useSocket";
import axiosInstance from "./api/axiosInstance";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
    mutations: { retry: 0 },
  },
});

// Inner component to access Redux dispatch
const AppInner = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    const theme = localStorage.getItem("skillswap-theme") || "dark";
    document.documentElement.classList.toggle("theme-light", theme === "light");
    document.documentElement.dataset.theme = theme;
  }, []);

  // Auto-init: try to refresh token on app load
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await axiosInstance.post("/auth/refresh", {});
        if (data?.data?.accessToken) {
          // Get user profile
          const profileRes = await axiosInstance.get("/profile/me", {
            headers: { Authorization: `Bearer ${data.data.accessToken}` },
          });
          dispatch(setCredentials({
            accessToken: data.data.accessToken,
            user: profileRes.data.data.user,
          }));
          dispatch(setProfile(profileRes.data.data));
        } else {
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    };
    init();
  }, [dispatch]);

  // Connect Socket.io when authenticated
  useSocket(isAuthenticated ? user?._id : null);

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1e2b",
            color: "#e8eaf0",
            border: "1px solid #2a2f40",
            borderRadius: "10px",
          },
          success: { iconTheme: { primary: "#22c77a", secondary: "#1a1e2b" } },
          error: { iconTheme: { primary: "#ff4d6d", secondary: "#1a1e2b" } },
        }}
      />
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  </Provider>
);

export default App;
