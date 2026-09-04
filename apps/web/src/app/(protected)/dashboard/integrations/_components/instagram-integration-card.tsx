"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { onDisconnect, onOAuthInstagram } from "@/actions/integrations";
import { InstagramDuoToneBlue } from "@/icons";
import { useQueryUser } from "@/hooks/user-queries";
import { logger } from "@/lib/logger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstagramIntegrationCard() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const queryClient = useQueryClient();
  const user = useQueryUser();
  const integration = user.data?.integrations.find(
    (candidate) => candidate.name === "INSTAGRAM",
  );

  const connect = async () => {
    setIsConnecting(true);
    try {
      const result = await onOAuthInstagram();
      if (result?.error) {
        toast.error(result.error);
        setIsConnecting(false);
      }
    } catch (error) {
      logger.error("Could not start Instagram connection", { error });
      toast.error("Could not start Instagram connection. Please try again.");
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!integration) return;
    setIsDisconnecting(true);
    try {
      const result = await onDisconnect(integration.id);
      if (result.status !== 200) {
        toast.error(result.error ?? "Could not disconnect Instagram");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Instagram account disconnected");
    } catch (error) {
      logger.error("Could not disconnect Instagram", { error });
      toast.error("Could not disconnect Instagram. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
            <InstagramDuoToneBlue />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">Instagram</CardTitle>
            <CardDescription className="max-w-3xl leading-5">
              Connect a Business or Creator account to automate DMs, comment
              replies, and story interactions.
            </CardDescription>
          </div>
        </div>
        {!user.isLoading && (
          <Badge variant={integration ? "default" : "secondary"}>
            {user.isError
              ? "Status unavailable"
              : integration
                ? "Connected"
                : "Not connected"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {user.isLoading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : integration ? (
          <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="flex items-start gap-2 text-sm font-medium">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span className="break-all">
                  {integration.username
                    ? `@${integration.username}`
                    : "Instagram account"}
                </span>
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Active for messaging and automation in this workspace.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 cursor-pointer text-destructive hover:text-destructive"
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Unplug className="h-4 w-4" aria-hidden="true" />
                  )}
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Instagram?</AlertDialogTitle>
                  <AlertDialogDescription>
                    New Instagram messages will stop entering Gemai and active
                    Instagram automations will stop running.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep connected</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={disconnect}
                  >
                    Disconnect Instagram
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : user.isError ? (
          <div className="flex flex-col justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 sm:flex-row sm:items-center">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Instagram connection status could not be loaded.
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-11 cursor-pointer"
              onClick={() => user.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-dashed border-border p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">No Instagram account connected</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Meta will ask you to choose an eligible professional account and
                approve access.
              </p>
            </div>
            <Button
              type="button"
              className="h-11 shrink-0 cursor-pointer"
              disabled={isConnecting}
              onClick={connect}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  Opening Meta…
                </>
              ) : (
                "Connect Instagram"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
