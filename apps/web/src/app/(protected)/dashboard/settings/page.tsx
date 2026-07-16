"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/global/settings/profile-settings";
import PrivacySettings from "@/components/global/settings/privacy-settings";
import AccountSettings from "@/components/global/settings/account-settings";
import BillingSettings from "@/components/global/settings/billing-settings";
import { User, CreditCard, Shield, Settings } from "lucide-react";
import PageHeader from "@/components/global/page-header";

const Page = () => {
  return (
    <div className="flex flex-col pb-10 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
        icon={<Settings className="h-5 w-5" />}
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2 py-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2 py-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2 py-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingSettings />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Page;
