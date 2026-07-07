"use client";
import { ChevronRight, PencilIcon, Trash2 } from "lucide-react";
import React, { useState } from "react";
import ActivateAutomationButton from "../../activate-automation-button";
import { useQueryAutomation } from "@/hooks/user-queries";
import { useEditAutomation } from "@/hooks/use-automations";
import { useMutationDataState, useMutationData } from "@/hooks/use-mutation-data";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { deleteAutomation } from "@/actions/automations";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { usePaths } from "@/hooks/user-nav";

type Props = {
  id: string;
};

const AutomationsBreadCrumb = ({ id }: Props) => {
  const { data } = useQueryAutomation(id);
  const { edit, enableEdit, inputRef, isPending } = useEditAutomation(id);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { pathname } = usePaths();

  const { latestVariable } = useMutationDataState<{ name: string }>(["update-automation"]);

  const { isPending: isDeleting, mutate: deleteAutomationMutation } = useMutationData(
    ["delete-automation"],
    (data: { id: string }) => deleteAutomation(data.id),
    "user-automations",
    () => {
      setDeleteDialogOpen(false);
      toast({
        title: "Automation deleted",
        description: "The automation has been successfully deleted.",
      });
      // Navigate back to automations page
      const automationsPath = pathname.split('/').slice(0, -1).join('/');
      router.push(automationsPath);
    }
  );

  const confirmDelete = () => {
    deleteAutomationMutation({ id });
  };

  return (
    <div className="rounded-full w-full p-5 bg-muted/30 dark:bg-[#18181B1A] flex items-center border border-border/50">
      <div className="flex items-center gap-x-3 min-w-0">
        {/* <Link href={`/dashboard/${}/automations`}> */}
        <p className="text-muted-foreground truncate">Automations</p>
        {/* </Link> */}
        <ChevronRight className="flex-shrink-0 text-muted-foreground" />
        <span className="flex gap-x-3 items-center min-w-0">
          {edit ? (
            <Input
              ref={inputRef}
              placeholder={
                isPending ? latestVariable.variables.name : "Add a new name"
              }
              className="bg-transparent h-auto outline-none text-base border-none p-0"
            />
          ) : (
            <p className="text-muted-foreground truncate">
              {latestVariable?.variables
                ? latestVariable?.variables.name
                : data?.name}
            </p>
          )}
          {edit ? (
            <></>
          ) : (
            <span
              className="cursor-pointer hover:opacity-75 duration-100 transition flex-shrink-0 mr-4"
              onClick={enableEdit}
            >
              <PencilIcon size={14} />
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-x-5 ml-auto">
        <p className="hidden md:block text-text-secondary/60 text-sm truncate min-w-0">
          All states are automatically saved
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteDialogOpen(true)}
          className="h-9 w-9 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ActivateAutomationButton id={id} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-bg-secondary border-slate-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-text-primary">
              Delete Automation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-text-secondary">
              This action cannot be undone. This will permanently delete the automation
              &quot;{data?.name}&quot; and all its associated data including keywords, triggers, and posts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-bg-tertiary border-slate-primary/20 text-slate-text-primary hover:bg-slate-bg-tertiary/80">
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

export default AutomationsBreadCrumb;
