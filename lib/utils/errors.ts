// lib/utils/errors.ts

/**
 * Firebase Auth error codes mapped to user-friendly messages
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Invalid email or password. Please check your credentials and try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password should be at least 6 characters long.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/operation-not-allowed": "This operation is not allowed.",
};

/**
 * Get user-friendly error message from Firebase error
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = error.code as string;
    if (code in AUTH_ERROR_MESSAGES) {
      return AUTH_ERROR_MESSAGES[code];
    }
    // Fallback to error message if available
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if error is a Firebase Auth error
 */
export function isFirebaseAuthError(error: unknown): error is { code: string; message: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("auth/")
  );
}

