import { z } from "zod";

const basePasswordFormSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
    signOutOtherSessions: z.boolean(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function createPasswordFormSchema(passwordEnabled: boolean) {
  return basePasswordFormSchema.superRefine((values, context) => {
    if (passwordEnabled && !values.currentPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current password is required",
        path: ["currentPassword"],
      });
    }
  });
}

export type PasswordFormData = z.infer<
  ReturnType<typeof createPasswordFormSchema>
>;

type ClerkErrorLike = {
  errors?: Array<{
    longMessage?: string;
    message?: string;
  }>;
  message?: string;
};

export function getPasswordErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const clerkError = error as ClerkErrorLike;
    const firstError = clerkError.errors?.[0];

    if (firstError?.longMessage) return firstError.longMessage;
    if (firstError?.message) return firstError.message;
    if (clerkError.message) return clerkError.message;
  }

  if (error instanceof Error) return error.message;

  return "Unable to update your password. Please try again.";
}
