import React, { useEffect, useMemo, useState } from "react";
import { emailSignIn, emailSignUp, listenAuth, resetPassword } from "../services/auth";
import { mapAuthError } from "../services/authErrors";
import { Eye, EyeOff } from "lucide-react";

type Mode = "signin" | "signup";

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetHint, setShowResetHint] = useState(false);

  useEffect(() => listenAuth(setUser), []);
  
  const onEmailChange = (v: string) => { 
    setEmail(v); 
    if (err) setErr(""); 
    setShowResetHint(false); 
  };
  
  const onPwChange = (v: string) => { 
    setPw(v); 
    if (err) setErr(""); 
    setShowResetHint(false); 
  };
  
  useEffect(() => { 
    setErr(""); 
    setShowResetHint(false); 
  }, [mode]);

  const validEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const inputsValid = mode === "signup" ? (validEmail && pw.length >= 6) : (validEmail && pw.length > 0);
  const disabled = loading || !inputsValid;

  async function handleSubmit() {
    setErr(""); 
    setShowResetHint(false);
    if (!validEmail) { 
      setErr("Enter a valid email like name@domain.com."); 
      return; 
    }
    if (mode === "signup" && pw.length < 6) { 
      setErr("Password must be at least 6 characters."); 
      return; 
    }
    setLoading(true);
    try {
      const e = email.trim();
      if (mode === "signin") await emailSignIn(e, pw);
      else await emailSignUp(e, pw);
    } catch (e: any) {
      const code = e?.code as string | undefined;
      const msg = mapAuthError ? mapAuthError(code, mode) : (e?.message ?? String(e));
      setErr(msg);
      if (code === "auth/wrong-password") setShowResetHint(true);
      if (code === "auth/user-not-found") setMode("signup");
      if (code === "auth/email-already-in-use") { 
        setMode("signin"); 
        setShowResetHint(true); 
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setErr("");
    if (!validEmail) { 
      setErr("Enter your email above, then tap Reset."); 
      return; 
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setErr("Password reset email sent. Check your inbox.");
      setShowResetHint(false);
    } catch (e: any) {
      const code = e?.code as string | undefined;
      const msg = mapAuthError ? mapAuthError(code, "signin") : (e?.message ?? String(e));
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  if (user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-bebas text-5xl text-crimson tracking-wider mb-2">
              IRON LEDGER
            </h1>
            <p className="text-gray-600">Track. Level Up. Get Strong.</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                mode === "signin"
                  ? "bg-crimson text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                mode === "signup"
                  ? "bg-crimson text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={pwVisible ? "text" : "password"}
                value={pw}
                onChange={(e) => onPwChange(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setPwVisible(!pwVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {pwVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {mode === "signup" && (
              <p className="text-xs text-gray-500 mt-2">
                Use a strong password you don't use elsewhere.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className={`w-full py-3 px-4 rounded-lg font-bold uppercase tracking-wider transition-colors ${
              disabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-crimson text-white hover:bg-crimson/90"
            }`}
          >
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>

          {/* Reset Password */}
          {showResetHint && (
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full mt-3 text-sm text-crimson hover:underline font-medium"
            >
              Forgot password? Reset it
            </button>
          )}

          {/* Error Message */}
          {err && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{err}</p>
              {err.includes("Sign in instead") && (
                <p className="text-red-700 text-xs mt-2">
                  Tip: Use your password to sign in. If you forgot it, tap "Reset password".
                </p>
              )}
              {err.includes("Create an account first") && (
                <p className="text-red-700 text-xs mt-2">
                  Tip: Switch to "Create account" above and try again.
                </p>
              )}
              {err.toLowerCase().includes("network") && (
                <p className="text-red-700 text-xs mt-2">
                  Tip: Check Wi-Fi/cellular and try again.
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            By continuing you agree to the Terms & Privacy.
          </p>
        </div>
      </div>
    </div>
  );
};
