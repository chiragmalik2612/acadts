// app/admin/test-series/new/page.tsx
"use client";

import { FormEvent, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { createTestSeries } from "@/lib/db/testSeries";
import { listTests } from "@/lib/db/tests";
import type { Test } from "@/lib/types/test";
import type { TestSeriesInput } from "@/lib/types/testSeries";
import { sanitizeInput } from "@/lib/utils/validation";

export default function NewTestSeriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useUserProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [loadingTests, setLoadingTests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tests from test bank
  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoadingTests(true);
        const data = await listTests();
        setTests(data);
      } catch (err) {
        console.error("[NewTestSeriesPage] Error loading tests:", err);
        setError("Failed to load tests. Please try again.");
      } finally {
        setLoadingTests(false);
      }
    };

    if (user && role === "admin") {
      loadTests();
    }
  }, [user, role]);

  // Handle test selection
  const handleTestToggle = useCallback((testId: string) => {
    setSelectedTestIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("[NewTestSeriesPage] Form submitted, attempting to create test series");

      if (!user) {
        setError("You must be logged in to create test series.");
        return;
      }

      // Basic validation
      const sanitizedTitle = sanitizeInput(title).trim();
      const sanitizedDescription = sanitizeInput(description).trim();
      const priceValue = parseFloat(price);

      if (!sanitizedTitle) {
        setError("Test series title is required.");
        return;
      }

      if (selectedTestIds.size === 0) {
        setError("Please select at least one test for the series.");
        return;
      }

      if (isNaN(priceValue) || priceValue < 0) {
        setError("Please enter a valid price (must be a positive number).");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const input: TestSeriesInput = {
          title: sanitizedTitle,
          description: sanitizedDescription,
          testIds: Array.from(selectedTestIds),
          price: priceValue,
        };

        console.log("[NewTestSeriesPage] Final TestSeriesInput:", input);

        const testSeriesId = await createTestSeries(input, user.uid);
        console.log("[NewTestSeriesPage] Test series created with id:", testSeriesId);

        router.push(`/admin/test-series/${testSeriesId}`);
      } catch (err) {
        console.error("[NewTestSeriesPage] Error creating test series:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create test series. Please try again.";
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [user, title, description, price, selectedTestIds, router]
  );

  const handleCancel = useCallback(() => {
    router.push("/admin/test-series");
  }, [router]);

  if (authLoading || profileLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="p-4 text-gray-600">Checking admin access...</p>
      </main>
    );
  }

  if (!user || role !== "admin") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="p-4 text-gray-600">Redirecting...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Create New Test Series
            </h1>
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-gray-600 hover:text-gray-800 underline focus:outline-none"
            >
              Back to test series
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Create a new test series by selecting tests from your test bank.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Basic Test Series Information */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Series Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Series Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. JEE Main Test Series 2024"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="# Test Series Title&#10;&#10;## Overview&#10;Comprehensive test series for JEE preparation...&#10;&#10;## Features&#10;- 50+ comprehensive mock tests&#10;- Full syllabus coverage with detailed solutions&#10;- Performance tracking and analytics&#10;- 24/7 doubt resolution support"
                    rows={12}
                  />
                  <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Markdown Formatting Guide:</p>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                      <li><code className="bg-gray-200 px-1 rounded"># Heading 1</code> - Large heading</li>
                      <li><code className="bg-gray-200 px-1 rounded">## Heading 2</code> - Medium heading</li>
                      <li><code className="bg-gray-200 px-1 rounded">### Heading 3</code> - Small heading</li>
                      <li><code className="bg-gray-200 px-1 rounded">- Item</code> or <code className="bg-gray-200 px-1 rounded">* Item</code> - Bullet point</li>
                      <li><code className="bg-gray-200 px-1 rounded">**bold**</code> - Bold text</li>
                      <li><code className="bg-gray-200 px-1 rounded">*italic*</code> - Italic text</li>
                      <li><code className="bg-gray-200 px-1 rounded">[Link](url)</code> - Hyperlink</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      You can also enter plain text - each line will become a bullet point automatically.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border border-gray-300 rounded px-3 py-2 pl-7 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Enter the price for this test series</p>
                </div>
              </div>
            </div>

            {/* Test Selection */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Select Tests ({selectedTestIds.size} selected)
              </h2>

              {loadingTests ? (
                <div className="text-center py-8 text-gray-600">
                  Loading tests...
                </div>
              ) : tests.length === 0 ? (
                <div className="text-center py-8 text-gray-600 border border-dashed border-gray-300 rounded">
                  No tests available. Please create tests first.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 w-12">
                          Select
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700">
                          Title
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700">
                          Description
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700">
                          Duration
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700">
                          Questions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map((test) => {
                        const isSelected = selectedTestIds.has(test.id);
                        return (
                          <tr
                            key={test.id}
                            className={`border-b last:border-b-0 ${
                              isSelected ? "bg-blue-50" : ""
                            }`}
                          >
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={isSelected}
                                onChange={() => handleTestToggle(test.id)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-gray-900 font-medium">
                                {test.title}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-gray-600 text-sm line-clamp-2">
                                {test.description || "—"}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              {test.durationMinutes} min
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              {test.questions.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-black hover:bg-gray-900 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                {submitting ? "Creating..." : "Create Test Series"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}



