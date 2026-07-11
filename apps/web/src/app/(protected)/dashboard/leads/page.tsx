"use client";

import React, { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Plus,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED";

interface LeadField {
  id: string;
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN";
}

interface LeadFieldValue {
  id: string;
  field: LeadField;
  value: string;
}

interface Contact {
  id: string;
  username: string;
  name: string | null;
  profilePicUrl: string | null;
  tags: string[];
  fieldValues: LeadFieldValue[];
}

interface Lead {
  id: string;
  contactId: string;
  contact: Contact;
  status: LeadStatus;
  score: number;
  notes: string | null;
  qualifiedAt: string | null;
  disqualifiedAt: string | null;
  createdAt: string;
}

const COLUMNS: { status: LeadStatus; label: string; bg: string; border: string; text: string }[] = [
  { status: "NEW", label: "New Leads", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500" },
  { status: "CONTACTED", label: "Contacted", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500" },
  { status: "QUALIFIED", label: "Qualified", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" },
  { status: "DISQUALIFIED", label: "Disqualified", bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-500" },
];

export default function LeadsPage() {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();

  // Dialog State
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"TEXT" | "NUMBER" | "BOOLEAN">("TEXT");

  // Fetch Leads
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", workspaceId],
    queryFn: () => api<Lead[]>(wsPath("/leads")),
    enabled: !!workspaceId,
  });

  // Fetch Lead Fields
  const { data: fields = [] } = useQuery<LeadField[]>({
    queryKey: ["lead-fields", workspaceId],
    queryFn: () => api<LeadField[]>(wsPath("/leads/fields")),
    enabled: !!workspaceId,
  });

  // Create Field Mutation
  const createFieldMutation = useMutation({
    mutationFn: (body: { key: string; label: string; type: string }) =>
      api(wsPath("/leads/fields"), {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      toast.success("Custom lead field defined");
      setFieldDialogOpen(false);
      setNewFieldKey("");
      setNewFieldLabel("");
      queryClient.invalidateQueries({ queryKey: ["lead-fields", workspaceId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create field");
    },
  });

  // Update Lead Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatus }) =>
      api(wsPath(`/leads/${leadId}`), {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: () => {
      toast.success("Lead status updated");
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update lead");
    },
  });

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    const key = newFieldKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || !newFieldLabel.trim()) return;
    createFieldMutation.mutate({
      key,
      label: newFieldLabel.trim(),
      type: newFieldType,
    });
  };

  const getFieldValue = (lead: Lead, key: string) => {
    const fv = lead.contact.fieldValues.find((v) => v.field.key === key);
    return fv ? fv.value : null;
  };

  return (
    <div className="flex flex-col gap-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-x-2">
            <UserCheck className="h-8 w-8 text-primary" />
            Lead Qualification Board
          </h1>
          <p className="text-muted-foreground">Manage and qualify automation leads collected from DMs</p>
        </div>

        {/* Create Custom Field Button */}
        <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-brand text-white rounded-xl text-sm font-semibold flex items-center gap-x-2">
              <Plus className="h-4 w-4" />
              Define Lead Field
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Define custom lead field</DialogTitle>
              <DialogDescription>
                Create a field database parameter (e.g. budget, interest) to collect from prospects.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateField} className="space-y-4 pt-4">
              <div className="space-y-1">
                <Label htmlFor="key">Field Key (alphanumeric/lowercase)</Label>
                <Input
                  id="key"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="e.g. budget_limit"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="label">Display Label</Label>
                <Input
                  id="label"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. Budget Range Limit"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Value Type</Label>
                <Select
                  value={newFieldType}
                  onValueChange={(val: any) => setNewFieldType(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="NUMBER">Number</SelectItem>
                    <SelectItem value="BOOLEAN">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setFieldDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFieldMutation.isPending} className="bg-gradient-brand text-white">
                  {createFieldMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Define Field
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-y-3 p-4 border border-border bg-card rounded-2xl">
              <Skeleton className="h-6 w-1/2 rounded" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const list = leads.filter((l) => l.status === col.status);
            return (
              <div
                key={col.status}
                className={`flex flex-col gap-y-4 p-4 border ${col.border} ${col.bg} rounded-2xl min-h-[500px]`}
              >
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <h3 className={`font-bold ${col.text}`}>{col.label}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background border border-border/50 text-muted-foreground">
                    {list.length}
                  </span>
                </div>

                <div className="flex flex-col gap-y-3">
                  {list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60">
                      <FolderOpen className="h-8 w-8 mb-2 stroke-[1.5]" />
                      <p className="text-xs">No leads in this stage</p>
                    </div>
                  ) : (
                    list.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow transition-shadow flex flex-col gap-y-3"
                      >
                        <div className="flex items-center gap-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={lead.contact.profilePicUrl ?? undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                              {lead.contact.name?.[0] ?? lead.contact.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate text-foreground">
                              {lead.contact.name ?? lead.contact.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">@{lead.contact.username}</p>
                          </div>
                        </div>

                        {/* Custom Fields Summary */}
                        <div className="flex flex-col gap-y-1.5 text-xs border-t border-border/40 pt-2.5">
                          {fields.map((field) => {
                            const val = getFieldValue(lead, field.key);
                            if (!val) return null;
                            return (
                              <div key={field.id} className="flex justify-between items-center gap-x-2">
                                <span className="text-muted-foreground truncate max-w-[100px]">{field.label}:</span>
                                <span className="font-semibold text-foreground truncate">{val}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tag/Badge display */}
                        {lead.contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.contact.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] bg-muted border border-border/80 px-2 py-0.5 rounded-full text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions wrapper */}
                        <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-1 gap-x-2">
                          <Select
                            value={lead.status}
                            onValueChange={(val: LeadStatus) =>
                              updateStatusMutation.mutate({ leadId: lead.id, status: val })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Move status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NEW">New</SelectItem>
                              <SelectItem value="CONTACTED">Contacted</SelectItem>
                              <SelectItem value="QUALIFIED">Qualify</SelectItem>
                              <SelectItem value="DISQUALIFIED">Disqualify</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex gap-x-1 shrink-0">
                            {lead.status !== "QUALIFIED" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-500 rounded-lg"
                                onClick={() =>
                                  updateStatusMutation.mutate({ leadId: lead.id, status: "QUALIFIED" })
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {lead.status !== "DISQUALIFIED" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg"
                                onClick={() =>
                                  updateStatusMutation.mutate({ leadId: lead.id, status: "DISQUALIFIED" })
                                }
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
