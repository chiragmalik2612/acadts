"use client";

import { FormEvent, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { createTest } from "@/lib/db/tests";
import { listQuestions } from "@/lib/db/questions";
import type { Question } from "@/lib/types/question";
import type { TestInput, TestQuestion, TestSection, TestSubsection } from "@/lib/types/test";
import { sanitizeInput } from "@/lib/utils/validation";

export default function NewTestPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useUserProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("60");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<TestSection[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Map<string, { 
    marks: string; 
    negativeMarks: string;
    sectionId: string;
    subsectionId: string;
  }>>(new Map());
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCustomId, setSearchCustomId] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newSubsectionName, setNewSubsectionName] = useState<Map<string, string>>(new Map());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeSubsection, setActiveSubsection] = useState<{ sectionId: string; subsectionId: string } | null>(null);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  // Load questions from question bank
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const data = await listQuestions();
        setQuestions(data);
        setFilteredQuestions(data);
      } catch (err) {
        console.error("[NewTestPage] Error loading questions:", err);
        setError("Failed to load questions. Please try again.");
      } finally {
        setLoadingQuestions(false);
      }
    };

    if (user && role === "admin") {
      loadQuestions();
    }
  }, [user, role]);

  // Filter questions based on search
  useEffect(() => {
    if (!searchCustomId.trim()) {
      setFilteredQuestions(questions);
    } else {
      const searchLower = searchCustomId.toLowerCase().trim();
      setFilteredQuestions(
        questions.filter((q) => {
          const customIdLower = (q.customId || "").toLowerCase();
          return customIdLower.includes(searchLower);
        })
      );
    }
  }, [searchCustomId, questions]);

  // Generate unique ID
  const generateId = () => {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Add a new section
  const handleAddSection = useCallback(() => {
    if (!newSectionName.trim()) {
      setError("Section name is required.");
      return;
    }

    const newSection: TestSection = {
      id: generateId(),
      name: newSectionName.trim(),
      order: sections.length,
      subsections: [],
    };

    setSections((prev) => {
      const updated = [...prev, newSection];
      // Auto-expand new section
      setExpandedSections((prevSet) => new Set([...prevSet, newSection.id]));
      return updated;
    });
    setNewSectionName("");
    setError(null);
  }, [newSectionName, sections.length]);

  // Delete a section
  const handleDeleteSection = useCallback((sectionId: string) => {
    if (!window.confirm("Are you sure you want to delete this section? All subsections and assigned questions will be removed.")) {
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    // Remove questions assigned to this section
    setSelectedQuestions((prev) => {
      const newMap = new Map(prev);
      for (const [qId, data] of prev.entries()) {
        if (data.sectionId === sectionId) {
          newMap.delete(qId);
        }
      }
      return newMap;
    });
    if (activeSubsection?.sectionId === sectionId) {
      setActiveSubsection(null);
    }
  }, [activeSubsection]);

  // Add a subsection to a section
  const handleAddSubsection = useCallback((sectionId: string) => {
    const subsectionName = newSubsectionName.get(sectionId) || "";
    if (!subsectionName.trim()) {
      setError("Subsection name is required.");
      return;
    }

    setSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          const newSubsection: TestSubsection = {
            id: generateId(),
            name: subsectionName.trim(),
            order: section.subsections.length,
          };
          return {
            ...section,
            subsections: [...section.subsections, newSubsection],
          };
        }
        return section;
      })
    );

    setNewSubsectionName((prev) => {
      const newMap = new Map(prev);
      newMap.set(sectionId, "");
      return newMap;
    });
    setError(null);
    // Expand section if not already expanded
    setExpandedSections((prev) => new Set([...prev, sectionId]));
  }, [newSubsectionName]);

  // Delete a subsection
  const handleDeleteSubsection = useCallback((sectionId: string, subsectionId: string) => {
    if (!window.confirm("Are you sure you want to delete this subsection? All assigned questions will be removed.")) {
      return;
    }
    setSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            subsections: section.subsections.filter((sub) => sub.id !== subsectionId),
          };
        }
        return section;
      })
    );
    // Remove questions assigned to this subsection
    setSelectedQuestions((prev) => {
      const newMap = new Map(prev);
      for (const [qId, data] of prev.entries()) {
        if (data.sectionId === sectionId && data.subsectionId === subsectionId) {
          newMap.delete(qId);
        }
      }
      return newMap;
    });
    if (activeSubsection?.sectionId === sectionId && activeSubsection?.subsectionId === subsectionId) {
      setActiveSubsection(null);
    }
  }, [activeSubsection]);

  // Handle question selection - assign to active subsection
  const handleQuestionToggle = useCallback((questionId: string, question: Question) => {
    if (!activeSubsection) {
      setError("Please select a section and subsection first to assign questions.");
      return;
    }

    setSelectedQuestions((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(questionId)) {
        // Check if it's assigned to the active subsection
        const existing = newMap.get(questionId);
        if (existing?.sectionId === activeSubsection.sectionId && existing?.subsectionId === activeSubsection.subsectionId) {
          newMap.delete(questionId);
        } else {
          // Reassign to active subsection
          newMap.set(questionId, {
            marks: question.marks.toString(),
            negativeMarks: question.penalty.toString(),
            sectionId: activeSubsection.sectionId,
            subsectionId: activeSubsection.subsectionId,
          });
        }
      } else {
        // Initialize with question's default marks and penalty
        newMap.set(questionId, {
          marks: question.marks.toString(),
          negativeMarks: question.penalty.toString(),
          sectionId: activeSubsection.sectionId,
          subsectionId: activeSubsection.subsectionId,
        });
      }
      return newMap;
    });
    setError(null);
  }, [activeSubsection]);

  // Handle marks change for selected question
  const handleMarksChange = useCallback((questionId: string, field: "marks" | "negativeMarks", value: string) => {
    setSelectedQuestions((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(questionId);
      if (current) {
        newMap.set(questionId, {
          ...current,
          [field]: value,
        });
      }
      return newMap;
    });
  }, []);

  // Get question count for a subsection
  const getSubsectionQuestionCount = useCallback((sectionId: string, subsectionId: string) => {
    return Array.from(selectedQuestions.values()).filter(
      (data) => data.sectionId === sectionId && data.subsectionId === subsectionId
    ).length;
  }, [selectedQuestions]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("[NewTestPage] Form submitted, attempting to create test");

      if (!user) {
        setError("You must be logged in to create tests.");
        return;
      }

      // Basic validation
      const sanitizedTitle = sanitizeInput(title).trim();
      const sanitizedDescription = sanitizeInput(description).trim();
      const parsedDuration = Number(durationMinutes);

      if (!sanitizedTitle) {
        setError("Test title is required.");
        return;
      }

      if (parsedDuration <= 0 || Number.isNaN(parsedDuration)) {
        setError("Duration must be a positive number.");
        return;
      }

      if (sections.length === 0) {
        setError("Please add at least one section to the test.");
        return;
      }

      // Validate that each section has at least one subsection
      for (const section of sections) {
        if (section.subsections.length === 0) {
          setError(`Section "${section.name}" must have at least one subsection.`);
          return;
        }
      }

      if (selectedQuestions.size === 0) {
        setError("Please select at least one question for the test.");
        return;
      }

      // Validate marks for each selected question and build test questions
      const testQuestions: TestQuestion[] = [];
      let globalOrder = 0;

      // Group questions by section and subsection to maintain order
      const sortedSections = [...sections].sort((a, b) => a.order - b.order);
      
      for (const section of sortedSections) {
        const sortedSubsections = [...section.subsections].sort((a, b) => a.order - b.order);
        
        for (const subsection of sortedSubsections) {
          // Get all questions for this subsection
          const subsectionQuestions = Array.from(selectedQuestions.entries())
            .filter(([_, data]) => data.sectionId === section.id && data.subsectionId === subsection.id)
            .map(([questionId, data]) => ({ questionId, data }));

          for (const { questionId, data } of subsectionQuestions) {
            const marks = Number(data.marks);
            const negativeMarks = Number(data.negativeMarks);

            if (Number.isNaN(marks) || marks <= 0) {
              setError(`Question in ${section.name} > ${subsection.name} must have positive marks.`);
              return;
            }

            if (Number.isNaN(negativeMarks) || negativeMarks < 0) {
              setError(`Question in ${section.name} > ${subsection.name} cannot have negative marking less than 0.`);
              return;
            }

            testQuestions.push({
              questionId,
              marks,
              negativeMarks,
              order: globalOrder++,
              sectionId: section.id,
              subsectionId: subsection.id,
            });
          }
        }
      }

      if (testQuestions.length === 0) {
        setError("Please assign at least one question to a subsection.");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const input: TestInput = {
          title: sanitizedTitle,
          description: sanitizedDescription,
          durationMinutes: parsedDuration,
          sections: sortedSections,
          questions: testQuestions,
        };

        console.log("[NewTestPage] Final TestInput:", input);

        const id = await createTest(input, user.uid);
        console.log("[NewTestPage] Test created with id:", id);
        router.push("/admin/tests");
      } catch (err) {
        console.error("[NewTestPage] Error creating test:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create test. Please try again.";
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [user, title, description, durationMinutes, sections, selectedQuestions, router]
  );

  const handleCancel = useCallback(() => {
    router.push("/admin/tests");
  }, [router]);

  // Check admin access
  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      console.log("[NewTestPage] No user, redirecting to login");
      router.replace("/login");
      return;
    }

    if (role !== "admin") {
      console.log("[NewTestPage] Non-admin user, redirecting to dashboard");
      router.replace("/dashboard");
    }
  }, [authLoading, profileLoading, user, role, router]);

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

  const totalSelectedQuestions = selectedQuestions.size;
  const activeSubsectionInfo = activeSubsection
    ? (() => {
        const section = sections.find((s) => s.id === activeSubsection.sectionId);
        const subsection = section?.subsections.find((sub) => sub.id === activeSubsection.subsectionId);
        return section && subsection ? { section, subsection } : null;
      })()
    : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">Create New Test</h1>
              <button
                type="button"
                onClick={handleCancel}
                className="text-sm text-gray-600 hover:text-gray-800 underline focus:outline-none"
              >
                Back to tests
              </button>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            {/* Basic Test Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Test Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. JEE Main Mock Test 1"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min={1}
                    step="1"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex">
            {/* Left Sidebar - Sections & Subsections */}
            <div className="w-80 border-r border-gray-200 bg-gray-50 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Test Structure</h2>
                
                {/* Add Section */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="Section name (e.g., Physics)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSection();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                      title="Add Section"
                    >
                      + Section
                    </button>
                  </div>
                </div>

                {/* Sections List - Nested Format */}
                {sections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No sections yet. Add a section to get started.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => {
                        const isExpanded = expandedSections.has(section.id);
                        const isActive = activeSubsection?.sectionId === section.id;

                        return (
                          <div key={section.id} className="border border-gray-200 rounded-lg bg-white">
                            {/* Section Header */}
                            <div
                              className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                                isActive ? "bg-blue-50 border-blue-200" : ""
                              }`}
                              onClick={() => toggleSection(section.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <svg
                                    className={`w-4 h-4 text-gray-500 transition-transform ${
                                      isExpanded ? "rotate-90" : ""
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <span className="font-medium text-gray-900 text-sm">{section.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSection(section.id);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded"
                                  title="Delete Section"
                                >
                                  ×
                                </button>
                              </div>
                            </div>

                            {/* Subsections - Nested */}
                            {isExpanded && (
                              <div className="border-t border-gray-200 bg-gray-50">
                                {/* Add Subsection */}
                                <div className="p-2 border-b border-gray-200">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                                      value={newSubsectionName.get(section.id) || ""}
                                      onChange={(e) => {
                                        setNewSubsectionName((prev) => {
                                          const newMap = new Map(prev);
                                          newMap.set(section.id, e.target.value);
                                          return newMap;
                                        });
                                      }}
                                      placeholder="Subsection (e.g., MCQ)"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddSubsection(section.id);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddSubsection(section.id);
                                      }}
                                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                      title="Add Subsection"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                {/* Subsections List */}
                                {section.subsections.length === 0 ? (
                                  <div className="p-2 text-xs text-gray-500 italic text-center">
                                    No subsections yet
                                  </div>
                                ) : (
                                  <div className="p-2 space-y-1">
                                    {section.subsections
                                      .sort((a, b) => a.order - b.order)
                                      .map((subsection) => {
                                        const isActiveSubsection =
                                          activeSubsection?.sectionId === section.id &&
                                          activeSubsection?.subsectionId === subsection.id;
                                        const questionCount = getSubsectionQuestionCount(section.id, subsection.id);

                                        return (
                                          <div
                                            key={subsection.id}
                                            className={`p-2 rounded cursor-pointer transition-all ${
                                              isActiveSubsection
                                                ? "bg-blue-600 text-white"
                                                : "bg-white hover:bg-gray-100 text-gray-700"
                                            }`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveSubsection({
                                                sectionId: section.id,
                                                subsectionId: subsection.id,
                                              });
                                            }}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2 flex-1">
                                                <span className="text-xs font-medium ml-4">
                                                  {subsection.name}
                                                </span>
                                                {questionCount > 0 && (
                                                  <span
                                                    className={`text-xs px-1.5 py-0.5 rounded ${
                                                      isActiveSubsection
                                                        ? "bg-blue-700 text-white"
                                                        : "bg-gray-200 text-gray-700"
                                                    }`}
                                                  >
                                                    {questionCount}
                                                  </span>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteSubsection(section.id, subsection.id);
                                                }}
                                                className={`text-xs px-1.5 py-0.5 rounded hover:bg-opacity-80 ${
                                                  isActiveSubsection
                                                    ? "text-white hover:bg-blue-700"
                                                    : "text-red-600 hover:bg-red-50"
                                                }`}
                                                title="Delete Subsection"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Sections:</span>
                    <span className="font-semibold">{sections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <span className="font-semibold">{totalSelectedQuestions}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Area - Question Selection */}
            <div className="flex-1 p-6">
              {!activeSubsectionInfo ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Section & Subsection</h3>
                  <p className="text-sm text-gray-600">
                    Choose a section and subsection from the left panel to start adding questions.
                  </p>
                </div>
              ) : (
                <>
                  {/* Active Subsection Info */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Adding questions to:</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {activeSubsectionInfo.section.name} → {activeSubsectionInfo.subsection.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSubsection(null)}
                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Search by Custom ID
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      value={searchCustomId}
                      onChange={(e) => setSearchCustomId(e.target.value)}
                      placeholder="e.g. PHY-001, MATH-2024-01"
                    />
                  </div>

                  {/* Questions Table */}
                  {loadingQuestions ? (
                    <div className="text-center py-8 text-gray-600">Loading questions...</div>
                  ) : filteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 border border-dashed border-gray-300 rounded">
                      No questions found matching your search.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg max-h-[600px] overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-700 w-12">
                              Select
                            </th>
                            <th className="text-left px-4 py-2 font-medium text-gray-700">
                              Subject / Chapter / Topic
                            </th>
                            <th className="text-left px-4 py-2 font-medium text-gray-700">
                              Custom ID
                            </th>
                            <th className="text-left px-4 py-2 font-medium text-gray-700">
                              Type
                            </th>
                            <th className="text-left px-4 py-2 font-medium text-gray-700">
                              Difficulty
                            </th>
                            <th className="text-left px-4 py-2 font-medium text-gray-700">
                              Scoring (Marks / Penalty)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQuestions.map((q) => {
                            const questionData = selectedQuestions.get(q.id);
                            const isSelected = !!questionData && 
                              questionData.sectionId === activeSubsectionInfo.section.id &&
                              questionData.subsectionId === activeSubsectionInfo.subsection.id;
                            
                            return (
                              <tr
                                key={q.id}
                                className={`border-b last:border-b-0 ${
                                  isSelected ? "bg-blue-50" : ""
                                }`}
                              >
                                <td className="px-4 py-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={isSelected}
                                    onChange={() => handleQuestionToggle(q.id, q)}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="text-gray-900 font-medium">
                                    {q.subject}
                                    {q.chapter && ` / ${q.chapter}`}
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    {q.topic}
                                    {q.subtopic && ` / ${q.subtopic}`}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  {q.customId ? (
                                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                      {q.customId}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-gray-700">
                                  {q.type === "mcq_single"
                                    ? "MCQ (Single)"
                                    : q.type === "mcq_multiple"
                                    ? "MCQ (Multiple)"
                                    : "Numerical"}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      q.difficulty === "easy"
                                        ? "bg-green-50 text-green-700"
                                        : q.difficulty === "medium"
                                        ? "bg-yellow-50 text-yellow-700"
                                        : "bg-red-50 text-red-700"
                                    }`}
                                  >
                                    {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  {isSelected ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                        <input
                                          type="number"
                                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                          value={questionData.marks}
                                          onChange={(e) => handleMarksChange(q.id, "marks", e.target.value)}
                                          min={1}
                                          step="1"
                                          required
                                        />
                                      </div>
                                      <span className="text-xs text-gray-400">/</span>
                                      <div className="flex-1">
                                        <input
                                          type="number"
                                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                          value={questionData.negativeMarks}
                                          onChange={(e) => handleMarksChange(q.id, "negativeMarks", e.target.value)}
                                          min={0}
                                          step="1"
                                          required
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-green-600">+{q.marks}</span>
                                      {q.penalty > 0 ? (
                                        <span className="text-sm font-semibold text-red-600">-{q.penalty}</span>
                                      ) : (
                                        <span className="text-xs text-gray-400">(no penalty)</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || sections.length === 0 || totalSelectedQuestions === 0}
                className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                {submitting ? "Creating..." : "Create Test"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
