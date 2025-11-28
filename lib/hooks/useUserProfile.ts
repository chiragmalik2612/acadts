// lib/hooks/useUserProfile.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";

export type UserRole = "student" | "admin";

export function useUserProfile() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      setError(null);
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      
      if (!snap.exists()) {
        console.warn("[useUserProfile] User document not found for uid:", uid);
        setRole("student"); // Default role
        return;
      }

      const data = snap.data();
      const userRole = (data?.role as UserRole) ?? "student";
      setRole(userRole);
      console.log("[useUserProfile] User profile loaded:", { uid, role: userRole });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user profile");
      console.error("[useUserProfile] Error fetching user profile:", error);
      setError(error);
      setRole("student"); // Safe fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      setError(null);
      return;
    }

    fetchUserProfile(user.uid);
  }, [user, fetchUserProfile]);

  return { role, loading, error };
}
