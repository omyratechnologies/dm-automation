"use client";
import { usePaths } from "@/hooks/user-nav";
import { cn, getMonth } from "@/lib/utils";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import GradientButton from "../gradient-button";
import { Button } from "@/components/ui/button";
import { useQueryAutomations } from "@/hooks/user-queries";
import CreateAutomation from "../create-automation";
import { useMutationDataState } from "@/hooks/use-mutation-data";
import type { AutomationListItem } from "@/lib/api-result";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Trash2 } from "lucide-react";
import { deleteAutomation } from "@/actions/automations";
import { useToast } from "@/hooks/use-toast";
import { useMutationData } from "@/hooks/use-mutation-data";

type Props = {};

const AutomationList = (props: Props) => {
  const { data, isLoading } = useQueryAutomations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const { toast } = useToast();

  const { latestVariable } = useMutationDataState(["create-automation"]);
  console.log(latestVariable);
  const { pathname } = usePaths();

  const { isPending: isDeleting, mutate: deleteAutomationMutation } = useMutationData(
    ["delete-automation"],
    (data: { id: string }) => deleteAutomation(data.id),
    "user-automations",
    () => {
      setDeleteDialogOpen(false);
      setSelectedAutomationId(null);
      toast({
        title: "Automation deleted",
        description: "The automation has been successfully deleted.",
      });
    }
  );

  const handleDeleteClick = (e: React.MouseEvent, automationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAutomationId(automationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAutomationId) {
      deleteAutomationMutation({ id: selectedAutomationId });
    }
  };

  const optimisticUiData: AutomationListItem[] = useMemo(() => {
    if (latestVariable && latestVariable?.variables && data) {
      return [latestVariable.variables as AutomationListItem, ...data];
    }
    return data ?? [];
  }, [latestVariable, data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-y-4">
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!data || data.length <= 0) {
    return (
      <div className="h-[70vh] flex justify-center items-center flex-col gap-y-4">
        <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-2">
          <div className="w-16 h-16 rounded-full bg-gradient-brand opacity-20" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">No automations yet</h3>
        <p className="text-sm text-muted-foreground mb-4">Create your first automation to get started</p>
        <CreateAutomation />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      {optimisticUiData.map((automation: AutomationListItem) => (
        <div key={automation.id} className="relative overflow-hidden bg-card backdrop-blur-sm hover:border-primary/50 transition-all duration-300 rounded-2xl p-6 border border-border flex gap-x-6 group hover:shadow-xl hover:shadow-primary/10">
          <Link
            href={`${pathname}/${automation.id}`}
            className="absolute inset-0 z-0"
          />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex flex-col flex-1 items-start relative z-10">
            <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{automation.name}</h2>
            <p className="text-muted-foreground text-sm font-light mb-3">
              Comment automation
            </p>

            {automation.keywords.length > 0 ? (
              <div className="flex gap-x-2 flex-wrap mt-2">
                {automation.keywords.map((keyword, key) => (
                    <div
                      key={keyword.id}
                      className={cn(
                        "rounded-full px-4 py-1.5 capitalize text-xs font-medium transition-transform hover:scale-105",
                        (0 + 1) % 1 == 0 &&
                          "bg-green-500/15 border border-green-500/50 text-green-400",
                        (1 + 1) % 2 == 0 &&
                          "bg-purple-500/15 border border-purple-500/50 text-purple-400",
                        (2 + 1) % 3 == 0 &&
                          "bg-yellow-500/15 border border-yellow-500/50 text-yellow-400",
                        (3 + 1) % 4 == 0 &&
                          "bg-red-500/15 border border-red-500/50 text-red-400"
                      )}
                    >
                      {keyword.word}
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="rounded-full border border-dashed border-border px-4 py-1.5 mt-2">
                <p className="text-xs text-muted-foreground">No Keywords</p>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between items-end relative z-10">
            <div className="flex items-center gap-2">
              <p className="capitalize text-xs font-light text-muted-foreground">
                {getMonth(automation.createdAt.getUTCMonth() + 1)}{" "}
                {automation.createdAt.getUTCDate() === 1
                  ? `${automation.createdAt.getUTCDate()}st`
                  : `${automation.createdAt.getUTCDate()}th`}{" "}
                {automation.createdAt.getUTCFullYear()}
              </p>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 p-0 hover:bg-accent relative z-20"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                  <DropdownMenuItem
                    onClick={(e) => handleDeleteClick(e, automation.id)}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Automation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {automation.listener?.listener === "SMARTAI" ? (
              <GradientButton
                type="BUTTON"
                className="px-6 py-2 bg-gradient-brand text-white hover:shadow-glow text-sm font-semibold rounded-xl"
              >
                Smart AI
              </GradientButton>
            ) : (
              <Button className="px-6 py-2 bg-muted border border-border hover:bg-accent text-foreground text-sm font-semibold rounded-xl">
                Standard
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Automation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the automation
              and all its associated data including keywords, triggers, and posts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AutomationList;
