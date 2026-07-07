import type { ApiResult, AutomationData, AutomationListItem, UserProfile, InstagramMediaResponse } from "@/lib/api-result";
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
      if (result.status === 200) return result.data;
      if (result.status === 404) return [] as AutomationListItem[];
      throw new Error("Failed to fetch automations");
    },
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

export const useQueryAutomation = (id: string) => {
  return useQuery({
    queryKey: ["automation-info", id],
    queryFn: async (): Promise<AutomationData | null> => {
      const result = await getAutomationInfo(id);
      if (result.status === 200) return result.data;
      return null;
    },
  });
};

export const useQueryUser = () => {
  return useQuery<UserProfile | null>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const result = await onUserInfo();
      if (result.status === 200) return result.data as UserProfile;
      return null;
    },
  });
};

export const useQueryAutomationPosts = () => {
  return useQuery<InstagramMediaResponse | null>({
    queryKey: ["instagram-media"],
    queryFn: async () => {
      const result = await getProfilePosts();
      if (result.status === 200) return result.data as InstagramMediaResponse;
      return null;
    },
  });
};
