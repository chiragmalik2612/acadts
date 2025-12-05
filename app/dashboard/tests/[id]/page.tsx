// app/dashboard/tests/[id]/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useEffect, useState, useCallback } from "react";
import { getTestById } from "@/lib/db/tests";
import { getQuestionById } from "@/lib/db/questions";
import type { Test } from "@/lib/types/test";
import type { Question } from "@/lib/types/question";
import type { TestQuestion } from "@/lib/types/test";

interface QuestionWithTestData extends Question {
  testMarks: number;
  testNegativeMarks: number;
  order: number;
}

export default function TestTakingPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useUserProfile();
  const testId = params?.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<QuestionWithTestData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load test and questions
  useEffect(() => {
    if (authLoading || profileLoading || !testId) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "admin") {
      router.replace("/admin");
      return;
    }

    const loadTestData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load test
        const testData = await getTestById(testId);
        if (!testData) {
          setError("Test not found.");
          setLoading(false);
          return;
        }

        setTest(testData);

        // Load all questions for the test
        if (!testData.questions || testData.questions.length === 0) {
          setError("This test has no questions.");
          setLoading(false);
          return;
        }

        // Sort questions by order
        const sortedTestQuestions = [...testData.questions].sort(
          (a, b) => a.order - b.order
        );

        // Fetch all question details
        const questionPromises = sortedTestQuestions.map(async (testQ: TestQuestion) => {
          const question = await getQuestionById(testQ.questionId);
          if (!question) return null;

          return {
            ...question,
            testMarks: testQ.marks,
            testNegativeMarks: testQ.negativeMarks,
            order: testQ.order,
          } as QuestionWithTestData;
        });

        const loadedQuestions = await Promise.all(questionPromises);
        const validQuestions = loadedQuestions.filter(
          (q): q is QuestionWithTestData => q !== null
        );

        if (validQuestions.length === 0) {
          setError("No valid questions found in this test.");
          setLoading(false);
          return;
        }

        setQuestions(validQuestions);
        setCurrentQuestionIndex(0);
      } catch (err) {
        console.error("[TestTakingPage] Error loading test:", err);
        setError(err instanceof Error ? err.message : "Failed to load test.");
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, [authLoading, profileLoading, user, role, testId, router]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex, questions.length]);

  const handleGoToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [questions.length]);

  // Loading state
  if (authLoading || profileLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading test...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !test) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-sm text-red-600 mb-4">{error || "Test not found"}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-[#ff6b35] hover:bg-yellow-400 text-white rounded-lg font-medium transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">No Questions</h1>
            <p className="text-sm text-gray-600 mb-4">This test has no questions available.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-[#ff6b35] hover:bg-yellow-400 text-white rounded-lg font-medium transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-all"
            >
              Exit Test
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="bg-[#ff6b35] text-white text-sm font-semibold px-3 py-1 rounded-full">
                    Q{currentQuestionIndex + 1}
                  </span>
                  <div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {currentQuestion.type === "mcq_single"
                        ? "Single Choice"
                        : currentQuestion.type === "mcq_multiple"
                        ? "Multiple Choice"
                        : "Numerical"}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-600">
                    +{currentQuestion.testMarks}
                  </span>
                  {currentQuestion.testNegativeMarks > 0 && (
                    <span className="text-sm font-semibold text-red-600">
                      -{currentQuestion.testNegativeMarks}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <div
                  className="prose prose-sm max-w-none text-gray-900 question-content"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
                />
              </div>

              {/* Question Image */}
              {currentQuestion.imageUrl && (
                <div className="mb-6">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question"
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Options (for MCQ) */}
              {currentQuestion.type !== "numerical" && currentQuestion.options && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Options:</h3>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => {
                      const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-700 min-w-[24px]">
                            {optionLabel}.
                          </span>
                          <div
                            className="prose prose-sm max-w-none text-gray-900 flex-1 question-content"
                            dangerouslySetInnerHTML={{ __html: option }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Answer Input (for Numerical) */}
              {currentQuestion.type === "numerical" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Answer:
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35]"
                    placeholder="Enter numerical answer"
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={isFirstQuestion}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    isFirstQuestion
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={isLastQuestion}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    isLastQuestion
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#ff6b35] hover:bg-yellow-400 text-white"
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-20">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Question Navigator
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleGoToQuestion(index)}
                    className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                      index === currentQuestionIndex
                        ? "bg-[#ff6b35] text-white ring-2 ring-[#ff6b35] ring-offset-1"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                    title={`Question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#ff6b35]"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
                    <span>Unanswered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

