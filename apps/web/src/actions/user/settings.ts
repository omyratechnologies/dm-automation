"use server";

export async function updateUserProfile(data: { firstname?: string; lastname?: string }) {
  const { onUpdateProfile } = await import("./index");
  return onUpdateProfile(data);
}

export async function deleteUserAccount() {
  const { onDeleteAccount } = await import("./index");
  return onDeleteAccount();
}
