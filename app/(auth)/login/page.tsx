// app/(auth)/login/page.tsx
"use client";

import { FormEvent, useState, useCallback } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthErrorMessage } from "@/lib/utils/errors";
import { isValidEmail } from "@/lib/utils/validation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("[LoginPage] Form submitted, attempting login");
      
      // Client-side validation
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      setError(null);
      setSubmitting(true);

      try {
        console.log("[LoginPage] Calling signInWithEmailAndPassword for:", email);
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        console.log("[LoginPage] Login successful:", {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
        });
        console.log("[LoginPage] Redirecting to dashboard");
        router.push("/dashboard");
      } catch (err) {
        console.error("[LoginPage] Login error:", err);
        const errorMessage = getAuthErrorMessage(err);
        console.log("[LoginPage] Error message:", errorMessage);
        setError(errorMessage);
      } finally {
        console.log("[LoginPage] Login attempt completed, setting submitting to false");
        setSubmitting(false);
      }
    },
    [email, password, router]
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold mb-4 text-center text-gray-900">
          Log in
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          {error && (
            <div
              id="error-message"
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black hover:bg-gray-900 text-white py-2 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            aria-label={submitting ? "Logging in..." : "Log in"}
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
