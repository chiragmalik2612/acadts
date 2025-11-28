// app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log("[DashboardPage] Component rendered:", {
    loading,
    hasUser: !!user,
    userId: user?.uid,
    userEmail: user?.email,
  });

  if (loading) {
    console.log("[DashboardPage] Still loading auth state, showing loading message");
    return <p className="p-4">Checking session...</p>;
  }

  if (!user) {
    // Not logged in → redirect to login
    console.log("[DashboardPage] No user found, redirecting to login");
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return <p className="p-4">Redirecting...</p>;
  }

  console.log("[DashboardPage] User authenticated, rendering dashboard");

  async function handleLogout() {
    console.log("[DashboardPage] Logout initiated for user:", user.uid);
    try {
      await signOut(auth);
      console.log("[DashboardPage] Sign out successful, redirecting to login");
      router.push("/login");
    } catch (err: any) {
      console.error("[DashboardPage] Logout error:", err);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="border rounded-lg p-6 shadow-sm min-w-[300px] text-center">
        <h1 className="text-xl font-semibold mb-2">
          Welcome, {user.displayName || user.email}
        </h1>
        <p className="text-sm mb-4">You are logged in.</p>

        <button
          onClick={handleLogout}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm"
        >
          Log out
        </button>
      </div>
    </main>
  );
}
