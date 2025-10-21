"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { deleteUserAccount } from "@/actions/user/settings";
import { Trash2, AlertTriangle, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AccountSettings() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteUserAccount();
      if (result.status === 200) {
        // Sign out from Clerk and redirect to home
        await signOut();
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Account Management
        </CardTitle>
        <CardDescription>
          Manage your account settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sign Out */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Session</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign out of your account on this device
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <Separator />

        {/* Danger Zone */}
        <div className="space-y-4">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-500 mb-1">
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These actions are irreversible. Please be certain before proceeding.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-5 w-5" />
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p>
                          This action <strong>cannot be undone</strong>. This will permanently delete your account and remove all of your data from our servers, including:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>All your automations and configurations</li>
                          <li>Integration settings and connected accounts</li>
                          <li>Subscription and billing information</li>
                          <li>Analytics and performance data</li>
                        </ul>
                        <div className="space-y-2 pt-4">
                          <Label htmlFor="confirm-delete">
                            Type <strong>DELETE</strong> to confirm
                          </Label>
                          <Input
                            id="confirm-delete"
                            placeholder="DELETE"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="border-red-500/50 focus-visible:ring-red-500"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setConfirmText("")}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={confirmText !== "DELETE"}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
