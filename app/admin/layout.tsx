// app/admin/layout.tsx
"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useUserProfile();

  console.log("[AdminLayout] Render:", {
    authLoading,
    profileLoading,
    hasUser: !!user,
    userId: user?.uid,
    role,
  });

  // Perform redirect on client when not admin
  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      console.log("[AdminLayout] No user, redirecting to /login");
      router.replace("/login");
      return;
    }

    if (role !== "admin") {
      console.log("[AdminLayout] Non-admin user, redirecting to /dashboard");
      router.replace("/dashboard");
    }
  }, [authLoading, profileLoading, user, role, router]);

  if (authLoading || profileLoading) {
    console.log("[AdminLayout] Still loading auth/profile");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="p-4 text-gray-600">Checking admin access...</p>
      </div>
    );
  }

  if (!user || role !== "admin") {
    // While redirecting, show a simple message (prevents flashing admin UI)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="p-4 text-gray-600">Redirecting...</p>
      </div>
    );
  }

  console.log("[AdminLayout] Admin verified, rendering children");

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
