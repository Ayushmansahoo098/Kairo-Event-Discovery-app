const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/popup-blocked": "Pop-up was blocked. Trying redirect instead…",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/operation-not-allowed":
    "This sign-in method is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.",
  "auth/unauthorized-domain":
    "This domain is not authorized. Add it under Firebase Console → Authentication → Settings → Authorized domains.",
  "auth/invalid-credential": "Invalid credentials. Please try again.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
};

export function getAuthErrorMessage(error: unknown, fallback = "Authentication failed. Please try again."): string {
  if (!error || typeof error !== "object") return fallback;

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];

  if ("message" in error && typeof error.message === "string" && error.message) {
    return error.message;
  }

  return fallback;
}

export function isAuthCancellation(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = error.code;
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}
