export type AuthMode = "signin" | "signup";

export function mapAuthError(code?: string, mode: AuthMode = "signin") {
  switch (code) {
    case "auth/invalid-email":
      return "That email doesn’t look right. Use a valid address like name@domain.com.";
    case "auth/missing-password":
      return "Enter your password.";
    case "auth/weak-password":
      return "Password too short. Use at least 6 characters.";
    case "auth/email-already-in-use":
      return "That email is already registered. Sign in instead.";
    case "auth/user-not-found":
      return "No account with that email. Create an account first.";
    case "auth/wrong-password":
      return "Incorrect password. Try again or reset your password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a minute and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/internal-error":
      return "Something went wrong. Try again in a moment.";
    default:
      // Fallback depending on flow
      return mode === "signup"
        ? "Couldn’t create the account. Double-check your email and password."
        : "Couldn’t sign in. Double-check your email and password.";
  }
}
