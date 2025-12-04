// app/admin/layout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useUserProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">TestPrep Pro</h1>
          
          {/* Mobile Hamburger Button - Right side, same level as logo */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {sidebarOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 pt-16">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed left-0 z-40 transition-transform duration-300 ease-in-out`}
          style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        >
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto w-full md:ml-64">{children}</main>
      </div>
    </div>
  );
}
