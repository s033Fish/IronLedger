// src/services/firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const TAG = "[firebase.ts]";

function showAlert(label: string, message: string) {
  const text = `${label} ${message}`;
  if (typeof alert === "function") {
    alert(text);
  }
}

// Build config from EXPO_PUBLIC_ env (all strings, correct)
const cfg = {
  apiKey: "AIzaSyByN4BK3Ji5bby9L5OFIi6VsIig6Gx_YVo",
  authDomain: "ironledger-44f34.firebaseapp.com",
  projectId: "ironledger-44f34",
  storageBucket: "ironledger-44f34.firebasestorage.app",
  messagingSenderId: "806494115439",
  appId: "1:806494115439:web:6899af473b36cd0fa29f9a"
};

// Surface what the production build is actually using
showAlert(
  TAG,
  [
    "Firebase config:",
    `projectId=${cfg.projectId}`,
    `authDomain=${cfg.authDomain}`,
    `storageBucket=${cfg.storageBucket}`,
    `messagingSenderId=${cfg.messagingSenderId}`,
    `appId=${cfg.appId}`,
    `apiKeyLen=${cfg.apiKey ? cfg.apiKey.length : 0}`,
  ].join("\n")
);

// 1) Initialize or reuse app
let appInternal;
try {
  if (getApps().length) {
    appInternal = getApp();
    showAlert(TAG, `Using existing Firebase app: ${appInternal.name}`);
  } else {
    showAlert(
      TAG,
      `Initializing Firebase app with projectId=${cfg.projectId}`
    );
    appInternal = initializeApp(cfg);
    showAlert(TAG, `Firebase app initialized: ${appInternal.name}`);
  }
} catch (err: any) {
  showAlert(
    TAG,
    `Failed to initialize Firebase app:\n${
      err?.message ?? String(err)
    }`
  );
  throw err;
}

export const app = appInternal;

// 2) Firestore: FORCE long polling (key for real devices/TestFlight with Web SDK)
let dbInternal;
try {
  if (!(global as any).__FIRESTORE_INIT__) {
    showAlert(
      `${TAG}[Firestore]`,
      "Initializing Firestore with experimentalForceLongPolling=true, useFetchStreams=false"
    );
    dbInternal = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    } as any);
    (global as any).__FIRESTORE_INIT__ = true;
    showAlert(`${TAG}[Firestore]`, "Firestore initialized (forced long polling).");
  } else {
    showAlert(
      `${TAG}[Firestore]`,
      "Reusing existing Firestore instance via getFirestore(app)."
    );
    dbInternal = getFirestore(app);
  }
} catch (err: any) {
  showAlert(
    `${TAG}[Firestore]`,
    `Firestore init FAILED:\n${err?.message ?? String(err)}`
  );
  throw err;
}

export const db = dbInternal;

// 3) Auth from same app
let authInternal;
try {
  authInternal = getAuth(app);
  showAlert(
    `${TAG}[Auth]`,
    `getAuth(app) succeeded. currentUser=${
      authInternal.currentUser?.uid || "none"
    }`
  );
} catch (err: any) {
  showAlert(
    `${TAG}[Auth]`,
    `getAuth(app) FAILED:\n${err?.message ?? String(err)}`
  );
  throw err;
}

export const auth = authInternal;
