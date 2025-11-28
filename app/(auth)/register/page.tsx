// app/(auth)/register/page.tsx
"use client";

import { FormEvent, useState, useCallback } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createUserDocument } from "@/lib/db/users";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthErrorMessage } from "@/lib/utils/errors";
import { isValidEmail, isValidPassword, sanitizeInput } from "@/lib/utils/validation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("[RegisterPage] Form submitted, attempting registration");
      
      // Client-side validation
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = email.trim().toLowerCase();

      if (sanitizedName.length < 2) {
        setError("Name must be at least 2 characters long.");
        return;
      }

      if (!isValidEmail(sanitizedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }

      if (!isValidPassword(password)) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      setError(null);
      setSubmitting(true);

      try {
        // 1) Create Firebase Auth user
        console.log("[RegisterPage] Step 1: Creating Firebase Auth user for:", sanitizedEmail);
        const cred = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
        console.log("[RegisterPage] Firebase Auth user created:", {
          userId: cred.user.uid,
          email: cred.user.email,
        });

        // 2) Set displayName in Auth profile
        if (sanitizedName) {
          console.log("[RegisterPage] Step 2: Updating profile with displayName:", sanitizedName);
          await updateProfile(cred.user, { displayName: sanitizedName });
          console.log("[RegisterPage] Profile updated successfully");
        }

        // 3) Create Firestore user document
        console.log("[RegisterPage] Step 3: Creating Firestore user document");
        await createUserDocument({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: sanitizedName,
        });
        console.log("[RegisterPage] Firestore user document created successfully");

        // 4) Redirect after successful signup
        console.log("[RegisterPage] Registration successful, redirecting to dashboard");
        router.push("/dashboard");
      } catch (err) {
        console.error("[RegisterPage] Registration error:", err);
        const errorMessage = getAuthErrorMessage(err);
        console.log("[RegisterPage] Error message:", errorMessage);
        setError(errorMessage);
      } finally {
        console.log("[RegisterPage] Registration attempt completed, setting submitting to false");
        setSubmitting(false);
      }
    },
    [name, email, password, router]
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold mb-4 text-center text-gray-900">
          Create account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

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
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "error-message" : undefined}
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 6 characters
            </p>
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
            aria-label={submitting ? "Creating account..." : "Sign up"}
          >
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
