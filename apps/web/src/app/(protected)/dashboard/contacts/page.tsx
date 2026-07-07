import React from "react";
import ContactsView from "./_components/contacts-view";

const ContactsPage = () => {
  return (
    <div className="flex flex-col gap-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Everyone who has messaged your connected Instagram accounts.
        </p>
      </div>
      <ContactsView />
    </div>
  );
};

export default ContactsPage;
