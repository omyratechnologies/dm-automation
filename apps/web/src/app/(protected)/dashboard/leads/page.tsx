"use client";

import React, { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  CheckCircle,
  XCircle,
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
import PageHeader from "@/components/global/page-header";
import { cn } from "@/lib/utils";

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

const COLUMNS: {
  status: LeadStatus;
  label: string;
  accent: string;
}[] = [
  { status: "NEW", label: "New", accent: "text-primary" },
  { status: "CONTACTED", label: "Contacted", accent: "text-warning" },
  { status: "QUALIFIED", label: "Qualified", accent: "text-success" },
  { status: "DISQUALIFIED", label: "Disqualified", accent: "text-destructive" },
];

export default function LeadsPage() {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();

  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<
    "TEXT" | "NUMBER" | "BOOLEAN"
  >("TEXT");

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", workspaceId],
    queryFn: () => api<Lead[]>(wsPath("/leads")),
    enabled: !!workspaceId,
  });

  const { data: fields = [] } = useQuery<LeadField[]>({
    queryKey: ["lead-fields", workspaceId],
    queryFn: () => api<LeadField[]>(wsPath("/leads/fields")),
    enabled: !!workspaceId,
  });

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
      toast.error(
        err instanceof Error ? err.message : "Failed to create field"
      );
    },
  });

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
      toast.error(
        err instanceof Error ? err.message : "Failed to update lead"
      );
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
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Leads"
        description="Qualify and manage leads collected from automations."
        icon={<UserCheck className="h-5 w-5" />}
        actions={
          <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Define field
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Define custom lead field</DialogTitle>
                <DialogDescription>
                  Create a field (e.g. budget, interest) to collect from
                  prospects.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateField} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="key">Field key</Label>
                  <Input
                    id="key"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    placeholder="e.g. budget_limit"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="label">Display label</Label>
                  <Input
                    id="label"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="e.g. Budget Range Limit"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type">Value type</Label>
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
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFieldDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFieldMutation.isPending}>
                    {createFieldMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Define field
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-y-3 p-3 border border-border bg-card rounded-xl"
            >
              <Skeleton className="h-5 w-1/2 rounded" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
          {COLUMNS.map((col) => {
            const list = leads.filter((l) => l.status === col.status);
            return (
              <div
                key={col.status}
                className="flex flex-col gap-y-3 rounded-xl border border-border bg-card p-3 min-h-[480px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className={cn("text-sm font-semibold", col.accent)}>
                    {col.label}
                  </h3>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {list.length}
                  </span>
                </div>

                <div className="flex flex-col gap-y-2">
                  {list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                      <FolderOpen className="h-7 w-7 mb-2 opacity-50" />
                      <p className="text-xs">No leads in this stage</p>
                    </div>
                  ) : (
                    list.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-lg border border-border bg-background p-3 flex flex-col gap-y-2.5 transition-colors duration-quiet hover:border-hairline-strong"
                      >
                        <div className="flex items-center gap-x-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={lead.contact.profilePicUrl ?? undefined}
                            />
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
                              {lead.contact.name?.[0] ??
                                lead.contact.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-foreground">
                              {lead.contact.name ?? lead.contact.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{lead.contact.username}
                            </p>
                          </div>
                        </div>

                        {fields.length > 0 && (
                          <div className="flex flex-col gap-y-1 text-xs border-t border-border pt-2">
                            {fields.map((field) => {
                              const val = getFieldValue(lead, field.key);
                              if (!val) return null;
                              return (
                                <div
                                  key={field.id}
                                  className="flex justify-between items-center gap-x-2"
                                >
                                  <span className="text-muted-foreground truncate max-w-[100px]">
                                    {field.label}
                                  </span>
                                  <span className="font-medium text-foreground truncate">
                                    {val}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {lead.contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {lead.contact.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full text-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-border pt-2 gap-x-2">
                          <Select
                            value={lead.status}
                            onValueChange={(val: LeadStatus) =>
                              updateStatusMutation.mutate({
                                leadId: lead.id,
                                status: val,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Move" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NEW">New</SelectItem>
                              <SelectItem value="CONTACTED">
                                Contacted
                              </SelectItem>
                              <SelectItem value="QUALIFIED">Qualify</SelectItem>
                              <SelectItem value="DISQUALIFIED">
                                Disqualify
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex gap-x-0.5 shrink-0">
                            {lead.status !== "QUALIFIED" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-success"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    leadId: lead.id,
                                    status: "QUALIFIED",
                                  })
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {lead.status !== "DISQUALIFIED" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    leadId: lead.id,
                                    status: "DISQUALIFIED",
                                  })
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
