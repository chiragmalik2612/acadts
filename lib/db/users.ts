// lib/db/users.ts
import { db } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";

export type UserRole = "student" | "admin";

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: UserRole;
  createdAt?: Timestamp | null;
};

export interface CreateUserDocumentParams {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: UserRole;
}

/**
 * Creates or updates a user document in Firestore
 * @param user - User data to create/update
 * @throws {Error} If uid is missing or Firestore operation fails
 */
export async function createUserDocument(
  user: CreateUserDocumentParams
): Promise<void> {
  console.log("[Users DB] createUserDocument called with:", {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  });

  if (!user.uid || typeof user.uid !== "string" || user.uid.trim() === "") {
    const error = new Error("User UID is required and must be a non-empty string");
    console.error("[Users DB] createUserDocument error:", error);
    throw error;
  }

  const userRef = doc(db, "users", user.uid);
  console.log("[Users DB] Creating/updating user document at path: users/", user.uid);

  try {
    await setDoc(
      userRef,
      {
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        role: (user.role ?? "student") as UserRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true } // safe to call multiple times
    );
    console.log("[Users DB] User document created/updated successfully");
  } catch (error) {
    const dbError =
      error instanceof Error
        ? error
        : new Error("Failed to create/update user document in Firestore");
    console.error("[Users DB] Error creating user document:", dbError);
    throw dbError;
  }
}
