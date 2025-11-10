// src/services/userProvisioning.ts

import {
    collection,
    doc,
    enableNetwork,
    getDoc,
    serverTimestamp,
    setDoc,
    writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

const TAG = "[ensureUserDocAndDefaults]";

// Use global alert so it works in TestFlight builds
function showAlert(label: string, message: string) {
  const text = `${label} ${message}`;
  if (typeof alert === "function") {
    alert(text);
  }
}

export async function ensureUserDocAndDefaults() {
  showAlert(TAG, "START: function invoked");

  try {
    // 1) Auth check (from shared firebase.ts)
    const u = auth.currentUser;
    if (!u) {
      showAlert(
        TAG,
        "No authenticated user.\n" +
          "auth.currentUser is null.\n" +
          "This function must run from onAuthStateChanged AFTER sign-in."
      );
      throw new Error("No current user in ensureUserDocAndDefaults");
    }

    const uid = u.uid;
    const email = u.email ?? "null";
    showAlert(TAG, `Authenticated user:\nuid=${uid}\nemail=${email}`);

    // 2) Target path
    const userRef = doc(db, "users", uid);
    const path = `users/${uid}`;
    showAlert(TAG, `Checking user doc path: ${path}`);

    // 3) getDoc with retries + offline diagnostics
    const maxAttempts = 3;
    let snap: any = null;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      showAlert(TAG, `getDoc attempt ${attempt}...`);

      try {
        snap = await getDoc(userRef);
        showAlert(
          TAG,
          `getDoc SUCCESS on attempt ${attempt}.\nexists=${snap.exists()}`
        );
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        const code = err?.code ?? "no-code";
        const msg = err?.message ?? String(err);

        showAlert(
          TAG,
          `getDoc FAILED on attempt ${attempt}.\ncode=${code}\nmessage=${msg}`
        );

        const lowerMsg = String(msg).toLowerCase();
        const lowerCode = String(code).toLowerCase();

        const isOffline =
          lowerCode.includes("unavailable") ||
          lowerMsg.includes("offline") ||
          lowerMsg.includes("client is offline") ||
          lowerMsg.includes("failed to get document from server");

        if (isOffline && attempt < maxAttempts) {
          showAlert(
            TAG,
            "Detected OFFLINE/UNAVAILABLE:\n" +
              "- If this is a TestFlight build, confirm:\n" +
              "  • You are using the real Firebase project (not dev/emulator).\n" +
              "  • Firestore is ENABLED in that project.\n" +
              "  • EXPO_PUBLIC_* values match the Web Config in Firebase console.\n" +
              "- Retrying with enableNetwork..."
          );

          try {
            await enableNetwork(db);
            showAlert(TAG, "enableNetwork succeeded.");
          } catch (enErr: any) {
            showAlert(
              TAG,
              `enableNetwork ERROR:\n${
                enErr?.message ?? String(enErr)
              }`
            );
          }

          const backoff = 700 * attempt;
          showAlert(TAG, `Waiting ${backoff}ms before retrying getDoc...`);
          await sleep(backoff);
          continue;
        }

        // Non-offline error or last attempt: stop retrying
        break;
      }
    }

    if (!snap) {
      const code = lastError?.code ?? "no-code";
      const msg = lastError?.message ?? String(lastError);
      showAlert(
        TAG,
        `FATAL: getDoc never succeeded after ${maxAttempts} attempts.\n` +
          `code=${code}\nmessage=${msg}\npath=${path}\n\n` +
          `If this still says client is offline/unavailable:\n` +
          `- Open Firebase console → Firestore. Ensure it's enabled for this project.\n` +
          `- Verify all EXPO_PUBLIC_FIREBASE_* secrets EXACTLY match this project's Web Config.\n` +
          `- Ensure there is no emulator/localhost config in this build.`
      );
      throw lastError || new Error("Failed to fetch user doc after retries");
    }

    // 4) Provision if needed
    if (!snap.exists()) {
      showAlert(TAG, `User doc missing. Creating at ${path}...`);

      try {
        await setDoc(userRef, {
          email: u.email ?? null,
          plan: "free",
          createdAt: serverTimestamp(),
        });
        showAlert(TAG, `User doc CREATED at ${path}.`);
      } catch (err: any) {
        const code = err?.code ?? "no-code";
        const msg = err?.message ?? String(err);
        showAlert(
          TAG,
          `setDoc FAILED for ${path}.\ncode=${code}\nmessage=${msg}`
        );
        throw err;
      }

      const defaults = ["Bench Press", "Squat", "Deadlift"];
      showAlert(
        TAG,
        `Seeding default exercises (${defaults.length}) under ${path}/exercises...`
      );

      try {
        const batch = writeBatch(db);
        defaults.forEach((name) => {
          const exRef = doc(collection(db, "users", uid, "exercises"));
          batch.set(exRef, {
            name,
            createdAt: serverTimestamp(),
            source: "default-seed",
          });
        });

        await batch.commit();
        showAlert(
          TAG,
          `Default exercises SEEDED:\n${defaults.join(", ")}`
        );
      } catch (err: any) {
        const code = err?.code ?? "no-code";
        const msg = err?.message ?? String(err);
        showAlert(
          TAG,
          `Batch commit FAILED for default exercises.\ncode=${code}\nmessage=${msg}`
        );
        throw err;
      }
    } else {
      showAlert(TAG, `User doc already exists at ${path}. No seed required.`);
    }

    showAlert(TAG, "DONE: ensureUserDocAndDefaults completed successfully.");
  } catch (err: any) {
    const code = err?.code ?? "no-code";
    const msg = err?.message ?? String(err);
    showAlert(
      TAG,
      `FATAL ERROR in ensureUserDocAndDefaults.\ncode=${code}\nmessage=${msg}`
    );
    throw err;
  }
}
