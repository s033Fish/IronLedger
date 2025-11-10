// src/context/AuthGate.tsx (Light Theme)
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
} from "react-native";
import { emailSignIn, emailSignUp, listenAuth, resetPassword } from "../services/auth";
import { mapAuthError } from "../services/authErrors";
import { colors } from "../theme/colors";
import { type } from "../theme/typography";

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
  const [focused, setFocused] = useState<"email" | "pw" | null>(null);

  // Light palette
  const BG = "#F7F8FA";
  const CARD_BG = "#FFFFFF";
  const BORDER = "#E5E7EB";
  const BORDER_FOCUS = "#5A6FFF"; // subtle blue focus
  const TEXT = "#15171A";
  const SUBTEXT = "#5B6068";
  const PLACEHOLDER = "#9096A0";
  const ERROR_BG = "#FFF1F2"; // soft red
  const ERROR_BORDER = colors.crimson; // from your theme
  const ACCENT = colors.crimson;

  useEffect(() => listenAuth(setUser), []);
  const onEmailChange = (v: string) => { setEmail(v); if (err) setErr(""); setShowResetHint(false); };
  const onPwChange = (v: string) => { setPw(v); if (err) setErr(""); setShowResetHint(false); };
  useEffect(() => { setErr(""); setShowResetHint(false); }, [mode]);

  const validEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const inputsValid = mode === "signup" ? (validEmail && pw.length >= 6) : (validEmail && pw.length > 0);
  const disabled = loading || !inputsValid;

  async function handleSubmit() {
    setErr(""); setShowResetHint(false);
    if (!validEmail) { setErr("Enter a valid email like name@domain.com."); return; }
    if (mode === "signup" && pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
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
      if (code === "auth/email-already-in-use") { setMode("signin"); setShowResetHint(true); }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setErr("");
    if (!validEmail) { setErr("Enter your email above, then tap Reset."); return; }
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
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Header / Branding */}
          <View style={{ paddingTop: 64, paddingHorizontal: 20, alignItems: "center" }}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 140, height: undefined, aspectRatio: 1 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="Iron Ledger logo"
            />
            <Text style={[type.body, { color: SUBTEXT, marginTop: 4 }]}>
              Track your grind. Level up.
            </Text>
          </View>

          {/* Auth Card */}
          <View
            style={{
              marginTop: 28,
              marginHorizontal: 16,
              padding: 16,
              backgroundColor: CARD_BG,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: BORDER,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }}
          >
            {/* Mode toggle (light pill) */}
            <View
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: BORDER,
                padding: 4,
                flexDirection: "row",
                marginBottom: 14,
              }}
            >
              {(["signin","signup"] as Mode[]).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: "center",
                      borderRadius: 8,
                      backgroundColor: active ? "#FFFFFF" : "transparent",
                      borderWidth: active ? 1 : 0,
                      borderColor: active ? BORDER : "transparent",
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[type.bodyBold, { color: active ? TEXT : SUBTEXT }]}>
                      {m === "signin" ? "Sign in" : "Create"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Email */}
            <Text style={[type.caption, { color: SUBTEXT, marginBottom: 6 }]}>Email</Text>
            <TextInput
              placeholder="name@domain.com"
              placeholderTextColor={PLACEHOLDER}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={onEmailChange}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              returnKeyType="next"
              style={{
                borderWidth: 1,
                borderColor: err && !validEmail ? ERROR_BORDER : (focused === "email" ? BORDER_FOCUS : BORDER),
                backgroundColor: "#FFFFFF",
                color: TEXT,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 10,
                marginBottom: 12,
              }}
            />

            {/* Password */}
            <Text style={[type.caption, { color: SUBTEXT, marginBottom: 6 }]}>Password</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: err && pw.length === 0 ? ERROR_BORDER : (focused === "pw" ? BORDER_FOCUS : BORDER),
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                paddingHorizontal: 12,
              }}
            >
              <TextInput
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                placeholderTextColor={PLACEHOLDER}
                secureTextEntry={!pwVisible}
                value={pw}
                onChangeText={onPwChange}
                onFocus={() => setFocused("pw")}
                onBlur={() => setFocused(null)}
                textContentType="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                style={{ flex: 1, color: TEXT, paddingVertical: 12 }}
                returnKeyType="go"
                onSubmitEditing={() => { if (!disabled) handleSubmit(); }}
              />
              <Pressable onPress={() => setPwVisible(v => !v)} accessibilityRole="button">
                <Text style={[type.bodyBold, { color: SUBTEXT, paddingVertical: 10 }]}>
                  {pwVisible ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            {mode === "signup" && (
              <Text style={[type.caption, { color: SUBTEXT, marginTop: 6 }]}>
                Use a strong password you don’t use elsewhere.
              </Text>
            )}

            {/* Submit */}
            <Pressable
              disabled={disabled}
              onPress={handleSubmit}
              style={{
                marginTop: 16,
                opacity: disabled ? 0.6 : 1,
                paddingVertical: 14,
                backgroundColor: ACCENT,
                borderRadius: 10,
                alignItems: "center",
              }}
              accessibilityRole="button"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "800" }}>
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </Text>}
            </Pressable>

            {/* Row actions */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
              <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
                <Text style={[type.body, { color: "#374151" }]}>
                  {mode === "signin" ? "New here? Create account" : "Have an account? Sign in"}
                </Text>
              </Pressable>

              {showResetHint && (
                <Pressable onPress={handleReset}>
                  <Text style={[type.bodyBold, { color: ACCENT }]}>Reset password</Text>
                </Pressable>
              )}
            </View>

            {/* Error / info banner */}
            {!!err && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: ERROR_BORDER,
                  backgroundColor: ERROR_BG,
                  padding: 10,
                  borderRadius: 10,
                  marginTop: 12,
                }}
              >
                <Text style={[type.body, { color: "#7F1D1D" }]}>{err}</Text>
                {err.includes("Sign in instead") && (
                  <Text style={[type.caption, { color: "#7F1D1D", marginTop: 6 }]}>
                    Tip: Use your password to sign in. If you forgot it, tap “Reset password”.
                  </Text>
                )}
                {err.includes("Create an account first") && (
                  <Text style={[type.caption, { color: "#7F1D1D", marginTop: 6 }]}>
                    Tip: Switch to “Create account” above and try again.
                  </Text>
                )}
                {err.toLowerCase().includes("network") && (
                  <Text style={[type.caption, { color: "#7F1D1D", marginTop: 6 }]}>
                    Tip: Check Wi-Fi/cellular and try again.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={[type.caption, { color: SUBTEXT }]}>
              By continuing you agree to the Terms & Privacy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
