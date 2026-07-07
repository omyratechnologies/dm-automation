import { getAllAutomations, getAutomationInfo } from "@/actions/automations";
import { onUserInfo } from "@/actions/user";
import type { AutomationListItem, UserProfile } from "@/lib/api-result";
import { QueryClient } from "@tanstack/react-query";

export const prefetchUserProfile = async (client: QueryClient) => {
  return await client.prefetchQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const result = await onUserInfo();
      if (result.status === 200) return result.data as UserProfile;
      return null;
    },
    staleTime: 60000,
  });
};

export const prefetchUserAutomations = async (client: QueryClient) => {
  return await client.prefetchQuery({
    queryKey: ["user-automations"],
    queryFn: async () => {
      const result = await getAllAutomations();
      if (result.status === 200) return result.data;
      if (result.status === 404) return [] as AutomationListItem[];
      throw new Error("Failed to fetch automations");
    },
    staleTime: 60000,
  });
};

export const prefetchUserAutomation = async (
  client: QueryClient,
  automationId: string
) => {
  return await client.prefetchQuery({
    queryKey: ["automation-info", automationId],
    queryFn: async () => {
      const result = await getAutomationInfo(automationId);
      if (result.status === 200) return result.data;
      return null;
    },
    staleTime: 60000,
  });
};
