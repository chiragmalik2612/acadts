// app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useCallback } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useUserProfile();

  // All hooks must be called before any early returns (Rules of Hooks)
  const handleLogout = useCallback(async () => {
    if (!user) return;
    console.log("[DashboardPage] Logout initiated:", user.uid);
    try {
      await signOut(auth);
      console.log("[DashboardPage] Sign out successful, redirecting");
      router.replace("/login");
    } catch (err) {
      console.error("[DashboardPage] Logout error:", err);
      // Could show error toast here in the future
    }
  }, [user, router]);

  const handleAdminClick = useCallback(() => {
    router.push("/admin");
  }, [router]);

  console.log("[DashboardPage] Component rendered:", {
    authLoading,
    profileLoading,
    hasUser: !!user,
    userId: user?.uid,
    userEmail: user?.email,
    role,
  });

  // Wait for BOTH auth + role to load
  if (authLoading || profileLoading) {
    console.log("[DashboardPage] Loading auth/profile...");
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="p-4 text-gray-600">Checking session...</p>
      </main>
    );
  }

  if (!user) {
    console.log("[DashboardPage] No user, redirecting to login");
    if (typeof window !== "undefined") {
      router.replace("/login");
    }
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="p-4 text-gray-600">Redirecting...</p>
      </main>
    );
  }

  console.log("[DashboardPage] User authenticated, rendering dashboard");

  const displayName = user.displayName || user.email || "User";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="border border-gray-200 rounded-lg p-6 shadow-sm min-w-[300px] max-w-md w-full bg-white">
        <h1 className="text-xl font-semibold mb-2 text-gray-900">
          Welcome, {displayName}
        </h1>

        <p className="text-sm mb-4 text-gray-600">
          You are logged in as{" "}
          <span className="font-semibold">
            {role === "admin" ? "Admin" : "Student"}
          </span>
          .
        </p>

        {role === "admin" && (
          <button
            onClick={handleAdminClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm mb-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Go to admin panel"
          >
            Go to Admin Panel
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="Log out"
        >
          Log out
        </button>
      </div>
    </main>
  );
}
