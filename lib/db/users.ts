// lib/db/users.ts
import { db } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt?: any;
};

export async function createUserDocument(user: AppUser) {
  console.log("[Users DB] createUserDocument called with:", {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  });

  if (!user.uid) {
    console.warn("[Users DB] createUserDocument skipped: missing uid");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  console.log("[Users DB] Creating/updating user document at path: users/", user.uid);

  try {
    await setDoc(
      userRef,
      {
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
      },
      { merge: true } // safe to call multiple times
    );
    console.log("[Users DB] User document created/updated successfully");
  } catch (error: any) {
    console.error("[Users DB] Error creating user document:", error);
    throw error;
  }
}
