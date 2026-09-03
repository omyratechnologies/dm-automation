"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarPlus, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type InvitationOptions = {
  messagingEligible: boolean;
  messagingReason: "NO_PRIOR_INBOUND_MESSAGE" | "HUMAN_AGENT_WINDOW_EXPIRED" | null;
  leads: Array<{ id: string; pipelineName: string; stageName: string }>;
  meetingTypes: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    timezone: string;
  }>;
};

type Props = {
  conversationId: string;
  contactName: string;
};

const DEFAULT_INTRODUCTION = "I'd be happy to meet. Choose a time that works for you.";

export default function MeetingInviteDialog({ conversationId, contactName }: Props) {
  const { api, workspaceId, wsPath } = useApi();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [meetingTypeId, setMeetingTypeId] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [introduction, setIntroduction] = useState(DEFAULT_INTRODUCTION);

  const optionsQuery = useQuery({
    queryKey: ["meeting-invitation-options", workspaceId, conversationId],
    queryFn: () =>
      api<InvitationOptions>(
        wsPath(`/calendar/meeting-invitation-options?conversationId=${encodeURIComponent(conversationId)}`),
      ),
    enabled: open && Boolean(workspaceId),
  });

  useEffect(() => {
    if (!optionsQuery.data) return;
    setLeadId((current) => current || optionsQuery.data.leads[0]?.id || "");
    setMeetingTypeId((current) => current || optionsQuery.data.meetingTypes[0]?.id || "");
  }, [optionsQuery.data]);

  const sendMutation = useMutation({
    mutationFn: () =>
      api(wsPath("/calendar/meeting-invitations"), {
        method: "POST",
        body: {
          conversationId,
          leadId,
          meetingTypeId,
          expiresInDays: Number(expiresInDays),
          introduction: introduction.trim(),
        },
      }),
    onSuccess: () => {
      toast.success(`Meeting invitation sent to ${contactName}`);
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send meeting invitation");
    },
  });

  const options = optionsQuery.data;
  const hasConfiguration = Boolean(options?.leads.length && options?.meetingTypes.length);
  const canSend = Boolean(
    options?.messagingEligible && hasConfiguration && leadId && meetingTypeId && introduction.trim(),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Send meeting invite"
          title="Send meeting invite"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send meeting invite</DialogTitle>
          <DialogDescription>
            Send {contactName} a private, seven-day booking link in this Instagram conversation.
          </DialogDescription>
        </DialogHeader>

        {optionsQuery.isLoading ? (
          <div className="space-y-4 py-2" aria-label="Loading meeting options">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : optionsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Meeting options unavailable</AlertTitle>
            <AlertDescription>
              {optionsQuery.error instanceof Error ? optionsQuery.error.message : "Try again in a moment."}
            </AlertDescription>
          </Alert>
        ) : options ? (
          <div className="space-y-5">
            {!options.messagingEligible && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Invitation cannot be sent</AlertTitle>
                <AlertDescription>
                  {options.messagingReason === "NO_PRIOR_INBOUND_MESSAGE"
                    ? "A customer must message this account before an invitation can be sent."
                    : "Meta's seven-day human-agent messaging window has expired. Create an agent follow-up task instead."}
                </AlertDescription>
              </Alert>
            )}

            {!hasConfiguration && (
              <Alert>
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Calendar setup required</AlertTitle>
                <AlertDescription>
                  No active meeting types with an eligible host are available, or this conversation has no active lead. Configure Calendar and a host before sending an invitation.{" "}
                  <Link href={`/dashboard/${workspaceId}/integrations`} className="font-medium text-primary underline underline-offset-4">
                    Open integrations
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {options.leads.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="meeting-invite-lead">Lead</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger id="meeting-invite-lead" className="h-11">
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.pipelineName} · {lead.stageName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {options.meetingTypes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="meeting-invite-type">Meeting type</Label>
                <Select value={meetingTypeId} onValueChange={setMeetingTypeId}>
                  <SelectTrigger id="meeting-invite-type" className="h-11">
                    <SelectValue placeholder="Select a meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.meetingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {options.meetingTypes.find((type) => type.id === meetingTypeId) && (
                  <p className="text-xs text-muted-foreground">
                    {options.meetingTypes.find((type) => type.id === meetingTypeId)!.durationMinutes} minutes · {options.meetingTypes.find((type) => type.id === meetingTypeId)!.timezone}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="meeting-invite-message">Message</Label>
              <Textarea
                id="meeting-invite-message"
                value={introduction}
                onChange={(event) => setIntroduction(event.target.value)}
                maxLength={600}
                rows={3}
                className="min-h-24 resize-y"
              />
              <p className="text-xs text-muted-foreground">The secure booking link and expiry date are appended automatically.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-invite-expiry">Link expiry</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="meeting-invite-expiry" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="h-11" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="h-11"
            disabled={!canSend || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
