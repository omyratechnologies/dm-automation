"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutationData } from "@/hooks/use-mutation-data";
import { updateUserProfile } from "@/actions/user/settings";
import { useQueryUser } from "@/hooks/user-queries";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, Loader2, Mail, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useReverification, useUser } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { toast } from "sonner";
import {
  createPasswordFormSchema,
  getPasswordErrorMessage,
  type PasswordFormData,
} from "./profile-password";

const profileSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { data } = useQueryUser();
  const { isLoaded: isClerkLoaded, user } = useUser();
  const [isPasswordPending, setIsPasswordPending] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate, isPending } = useMutationData(
    ["update-profile"],
    updateUserProfile,
    "user-profile"
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordEnabled = Boolean(user?.passwordEnabled);
  const passwordSchema = useMemo(
    () => createPasswordFormSchema(passwordEnabled),
    [passwordEnabled],
  );
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      signOutOtherSessions: true,
    },
  });
  const signOutOtherSessions = useWatch({
    control: passwordForm.control,
    name: "signOutOtherSessions",
  });

  const updatePassword = useReverification(
    async ({
      currentPassword,
      newPassword,
      signOutOtherSessions,
    }: {
      currentPassword?: string;
      newPassword: string;
      signOutOtherSessions: boolean;
    }) => {
      if (!user) throw new Error("Your account is still loading. Please try again.");

      return user.updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
        signOutOfOtherSessions: signOutOtherSessions,
      });
    },
  );

  // Set default values when data is loaded
  useEffect(() => {
    if (data) {
      reset({
        firstname: data.firstname || "",
        lastname: data.lastname || "",
        email: data.email || "",
      });
    }
  }, [data, reset]);

  const onSubmit = (formData: ProfileFormData) => {
    mutate(formData);
  };

  const onPasswordSubmit = async (formData: PasswordFormData) => {
    const wasPasswordEnabled = passwordEnabled;
    setIsPasswordPending(true);

    try {
      await updatePassword({
        currentPassword: wasPasswordEnabled
          ? formData.currentPassword
          : undefined,
        newPassword: formData.newPassword,
        signOutOtherSessions: formData.signOutOtherSessions,
      });
      await user?.reload();
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        signOutOtherSessions: true,
      });
      toast.success(
        wasPasswordEnabled ? "Password changed" : "Password created",
        {
          description: wasPasswordEnabled
            ? "Your new password is ready to use."
            : "You can now sign in with your email address and password, or continue using OAuth.",
        },
      );
    } catch (error) {
      if (isReverificationCancelledError(error)) return;

      const message = getPasswordErrorMessage(error);
      passwordForm.setError("root", { message });
      toast.error("Password update failed", { description: message });
    } finally {
      setIsPasswordPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  placeholder="Enter your first name"
                  {...register("firstname")}
                  disabled={isPending}
                />
                {errors.firstname && (
                  <p className="text-sm text-red-500">{errors.firstname.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  placeholder="Enter your last name"
                  {...register("lastname")}
                  disabled={isPending}
                />
                {errors.lastname && (
                  <p className="text-sm text-red-500">{errors.lastname.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                {...register("email")}
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This email will be used for account notifications and updates
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-brand text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {passwordEnabled ? "Change Password" : "Create a Password"}
          </CardTitle>
          <CardDescription>
            {passwordEnabled
              ? "Update the password used to sign in to your account."
              : `Add password sign-in for ${user?.primaryEmailAddress?.emailAddress ?? "your email address"}. Your OAuth login will remain connected.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-5"
          >
            {passwordEnabled && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                    {...passwordForm.register("currentPassword")}
                    disabled={isPasswordPending}
                    aria-invalid={Boolean(passwordForm.formState.errors.currentPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-red-500">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    {...passwordForm.register("newPassword")}
                    disabled={!isClerkLoaded || isPasswordPending}
                    aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-500">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    {...passwordForm.register("confirmPassword")}
                    disabled={!isClerkLoaded || isPasswordPending}
                    aria-invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Use at least 8 characters. Clerk also checks password strength and known data breaches.
            </p>

            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <Checkbox
                id="signOutOtherSessions"
                checked={signOutOtherSessions}
                onCheckedChange={(checked) =>
                  passwordForm.setValue("signOutOtherSessions", checked === true, {
                    shouldDirty: true,
                  })
                }
                disabled={isPasswordPending}
              />
              <div className="space-y-1">
                <Label htmlFor="signOutOtherSessions">
                  Sign out other sessions
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recommended if you are changing an existing password.
                </p>
              </div>
            </div>

            {passwordForm.formState.errors.root?.message && (
              <p className="text-sm text-red-500" role="alert">
                {passwordForm.formState.errors.root.message}
              </p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isClerkLoaded || !user || isPasswordPending}
                className="bg-gradient-brand text-white"
              >
                {isPasswordPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {passwordEnabled ? "Changing..." : "Creating..."}
                  </>
                ) : passwordEnabled ? (
                  "Change Password"
                ) : (
                  "Create Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
