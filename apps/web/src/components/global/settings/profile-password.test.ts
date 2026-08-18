import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPasswordFormSchema,
  getPasswordErrorMessage,
} from "./profile-password.ts";

const validPasswordForm = {
  currentPassword: "old-password",
  newPassword: "new-password-123",
  confirmPassword: "new-password-123",
  signOutOtherSessions: true,
};

test("OAuth-only users can create a password without a current password", () => {
  const result = createPasswordFormSchema(false).safeParse({
    ...validPasswordForm,
    currentPassword: "",
  });

  assert.equal(result.success, true);
});

test("password users must provide their current password", () => {
  const result = createPasswordFormSchema(true).safeParse({
    ...validPasswordForm,
    currentPassword: "",
  });

  assert.equal(result.success, false);
  assert.equal(result.error?.issues[0]?.path[0], "currentPassword");
});

test("new password and confirmation must match", () => {
  const result = createPasswordFormSchema(false).safeParse({
    ...validPasswordForm,
    currentPassword: "",
    confirmPassword: "different-password",
  });

  assert.equal(result.success, false);
  assert.equal(result.error?.issues[0]?.path[0], "confirmPassword");
});

test("uses Clerk's detailed password validation message", () => {
  assert.equal(
    getPasswordErrorMessage({
      errors: [
        {
          message: "Password is invalid",
          longMessage: "Password was found in a data breach.",
        },
      ],
    }),
    "Password was found in a data breach.",
  );
});
