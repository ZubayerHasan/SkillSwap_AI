import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../api/profileApi";
import { useDispatch } from "react-redux";
import { setProfile } from "../store/slices/profileSlice";
import { useEffect } from "react";

export const useProfile = () => {
  const dispatch = useDispatch();
  const query = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => getMyProfile().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) dispatch(setProfile(query.data));
  }, [query.data, dispatch]);

  return query;
};
