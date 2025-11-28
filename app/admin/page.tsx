// app/admin/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function AdminHome() {
  const router = useRouter();

  const handleQuestionsClick = useCallback(() => {
    router.push("/admin/questions");
  }, [router]);

  const handleTestsClick = useCallback(() => {
    router.push("/admin/tests");
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900">Admin Panel</h1>

        <p className="text-sm mb-6 text-gray-600">
          Manage questions, tests, and platform data.
        </p>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleQuestionsClick}
            className="w-full bg-black hover:bg-gray-900 text-white px-4 py-2 rounded text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            aria-label="Manage questions"
          >
            Manage Questions
          </button>

          <button
            onClick={handleTestsClick}
            className="w-full bg-black hover:bg-gray-900 text-white px-4 py-2 rounded text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            aria-label="Manage tests"
          >
            Manage Tests
          </button>
        </div>
      </div>
    </div>
  );
}
