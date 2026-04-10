import { useQuery } from "@tanstack/react-query";
import { getMyOffers, getMyNeeds } from "../api/skillsApi";

export const useSkills = () => {
  const offers = useQuery({
    queryKey: ["skills", "offers"],
    queryFn: () => getMyOffers().then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const needs = useQuery({
    queryKey: ["skills", "needs"],
    queryFn: () => getMyNeeds().then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  return { offers, needs };
};
