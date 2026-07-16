import React from "react";
import ContactsView from "./_components/contacts-view";
import PageHeader from "@/components/global/page-header";
import { Users } from "lucide-react";

const ContactsPage = () => {
  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Contacts"
        description="Everyone who has messaged your connected Instagram accounts."
        icon={<Users className="h-5 w-5" />}
      />
      <ContactsView />
    </div>
  );
};

export default ContactsPage;
