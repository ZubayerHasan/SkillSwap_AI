import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated, selectAuthLoading, setCredentials, logout as logoutAction } from "../store/slices/authSlice";
import { clearProfile } from "../store/slices/profileSlice";
import { loginUser, logoutUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  const login = async (credentials) => {
    const { data } = await loginUser(credentials);
    dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }));
    return data.data;
  };

  const logout = async () => {
    try { await logoutUser(); } catch (_) {}
    dispatch(logoutAction());
    dispatch(clearProfile());
    navigate("/login");
    toast.success("Logged out successfully");
  };

  return { user, isAuthenticated, isLoading, login, logout };
};
