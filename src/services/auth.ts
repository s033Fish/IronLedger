// src/services/auth.ts
import * as AppleAuth from "expo-apple-authentication";
import {
  createUserWithEmailAndPassword,
  OAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "./firebase";
import { ensureUserDocAndDefaults } from "./userProvisioning";

const TAG = "[auth.ts]";

// Generic alert helper that works in TestFlight (and falls back to console if needed)
function showAlert(title: string, message: string) {
  const text = `${title}: ${message}`;
  if (typeof alert === "function") {
    alert(text);
  } else {
    console.log("[alert-fallback]", text);
  }
}

function logUser(u: User | null) {
  if (!u) return "null";
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    providerData: u.providerData.map((p) => ({
      providerId: p.providerId,
      uid: p.uid,
      email: p.email,
    })),
  };
}

export async function resetPassword(email: string) {
  const e = email.trim();
  console.log(`${TAG}[resetPassword] called with:`, e || "(empty)");
  if (!e) {
    console.warn(`${TAG}[resetPassword] No email provided.`);
    throw new Error("Enter your email to reset the password.");
  }
  try {
    await sendPasswordResetEmail(auth, e);
    console.log(`${TAG}[resetPassword] Password reset email sent successfully.`);
  } catch (err) {
    console.error(`${TAG}[resetPassword] Failed to send reset email`, err);
    throw err;
  }
}

export function listenAuth(cb: (u: User | null) => void) {
  console.log(`${TAG}[listenAuth] Registering onAuthStateChanged listener.`);
  return onAuthStateChanged(auth, async (u) => {
    console.log(`${TAG}[listenAuth] onAuthStateChanged fired. User:`, logUser(u));

    try {
      cb(u);
      console.log(`${TAG}[listenAuth] Callback executed.`);
    } catch (err) {
      console.error(`${TAG}[listenAuth] Error in callback`, err);
    }

    if (u) {
      console.log(`${TAG}[listenAuth] User is signed in, starting ensureUserDocAndDefaults for uid=${u.uid}`);
      try {
        const res = await ensureUserDocAndDefaults();
        console.log(
          `${TAG}[listenAuth] ensureUserDocAndDefaults completed.`,
          res ?? "(no return value)"
        );
        showAlert("User provisioning", `ensureUserDocAndDefaults completed for ${u.uid}`);
      } catch (err: any) {
        console.error(
          `${TAG}[listenAuth] ensureUserDocAndDefaults failed for uid=${u.uid}`,
          err
        );
        showAlert(
          "Provisioning error",
          err instanceof Error ? err.message : String(err)
        );
      }
    } else {
      console.log(`${TAG}[listenAuth] User is null (signed out or not logged in).`);
      showAlert("listenAuth", "onAuthStateChanged: user signed out / null");
    }
  });
}

export async function emailSignUp(email: string, password: string) {
  console.log(`${TAG}[emailSignUp] Attempting sign up with email:`, email.trim());
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(
      `${TAG}[emailSignUp] Sign up success. uid=${cred.user.uid}, email=${cred.user.email}`
    );
    return cred;
  } catch (err) {
    console.error(`${TAG}[emailSignUp] Sign up failed`, err);
    throw err;
  }
}

export async function emailSignIn(email: string, password: string) {
  console.log(`${TAG}[emailSignIn] Attempting sign in with email:`, email.trim());
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(
      `${TAG}[emailSignIn] Sign in success. uid=${cred.user.uid}, email=${cred.user.email}`
    );
    return cred;
  } catch (err) {
    console.error(`${TAG}[emailSignIn] Sign in failed`, err);
    throw err;
  }
}

export async function appleSignIn() {
  console.log(`${TAG}[appleSignIn] Starting Apple sign-in flow.`);
  try {
    const result = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });
    console.log(
      `${TAG}[appleSignIn] Apple signInAsync result:`,
      JSON.stringify(
        {
          user: result.user,
          email: result.email,
          fullName: result.fullName,
          hasIdentityToken: !!result.identityToken,
        },
        null,
        2
      )
    );

    if (!result.identityToken) {
      console.error(`${TAG}[appleSignIn] No Apple identity token returned.`);
      throw new Error("No Apple identity token");
    }

    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: result.identityToken,
    });
    console.log(`${TAG}[appleSignIn] Created Apple OAuth credential. Signing in with Firebase...`);

    const cred = await signInWithCredential(auth, credential);
    console.log(
      `${TAG}[appleSignIn] Firebase Apple sign-in success. uid=${cred.user.uid}, email=${cred.user.email}`
    );
    return cred;
  } catch (err) {
    console.error(`${TAG}[appleSignIn] Apple sign-in failed`, err);
    throw err;
  }
}

export async function logOut() {
  console.log(`${TAG}[logOut] Attempting sign out. Current user:`, logUser(auth.currentUser));
  try {
    await signOut(auth);
    console.log(`${TAG}[logOut] Sign out success.`);
  } catch (err) {
    console.error(`${TAG}[logOut] Sign out failed`, err);
    throw err;
  }
}
