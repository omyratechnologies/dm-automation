"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import ContactsTable from "./contacts-table";
import SegmentsSection from "./segments-section";

const ContactsView = () => {
  return (
    <Tabs defaultValue="contacts" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="segments">Segments</TabsTrigger>
      </TabsList>
      <TabsContent value="contacts">
        <ContactsTable />
      </TabsContent>
      <TabsContent value="segments">
        <SegmentsSection />
      </TabsContent>
    </Tabs>
  );
};

export default ContactsView;
