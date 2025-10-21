"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutationData } from "@/hooks/use-mutation-data";
import { updateUserProfile } from "@/actions/user/settings";
import { useQueryUser } from "@/hooks/user-queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Loader2 } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { data } = useQueryUser();
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

  // Set default values when data is loaded
  useEffect(() => {
    if (data?.data) {
      reset({
        firstname: data.data.firstname || "",
        lastname: data.data.lastname || "",
        email: data.data.email || "",
      });
    }
  }, [data, reset]);

  const onSubmit = (formData: ProfileFormData) => {
    mutate(formData);
  };

  return (
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
  );
}
