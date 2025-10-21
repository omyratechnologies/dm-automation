import {
  getAllAutomations,
  getAutomationInfo,
  getProfilePosts,
} from "@/actions/automations";
import { onUserInfo } from "@/actions/user";
import { useQuery } from "@tanstack/react-query";

export const useQueryAutomations = () => {
  return useQuery({
    queryKey: ["user-automations"],
    queryFn: async () => {
      const result = await getAllAutomations();
      
      // Check if the result has an error status
      if (result.status === 500) {
        throw new Error("Failed to fetch automations");
      }
      
      return result;
    },
    retry: 2, // Retry failed requests twice
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

export const useQueryAutomation = (id: string) => {
  return useQuery({
    queryKey: ["automation-info"],
    queryFn: () => getAutomationInfo(id),
  });
};

export const useQueryUser = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
  });
};

export const useQueryAutomationPosts = () => {
  const fetchPosts = async () => await getProfilePosts();
  return useQuery({
    queryKey: ["instagram-media"],
    queryFn: fetchPosts,
  });
};
