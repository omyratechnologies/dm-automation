"use server";

import { client } from "@/lib/prisma";
import { onCurrentUser } from "./index";
import { invalidateUserCache } from "@/lib/cache";

export const updateUserProfile = async (data: {
  firstname?: string;
  lastname?: string;
  email?: string;
}) => {
  const user = await onCurrentUser();
  
  try {
    const updated = await client.user.update({
      where: {
        clerkId: user.id,
      },
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
      },
      select: {
        firstname: true,
        lastname: true,
        email: true,
      },
    });

    // Invalidate cache after profile update
    await invalidateUserCache(user.id);

    return {
      status: 200,
      data: updated,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      status: 500,
      message: "Failed to update profile",
    };
  }
};

export const deleteUserAccount = async () => {
  const user = await onCurrentUser();
  
  try {
    // Delete user and all related data (cascades handled by Prisma schema)
    await client.user.delete({
      where: {
        clerkId: user.id,
      },
    });

    // Invalidate cache
    await invalidateUserCache(user.id);

    return {
      status: 200,
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      status: 500,
      message: "Failed to delete account",
    };
  }
};
