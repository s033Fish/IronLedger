// src/services/firebase.ts
import { FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore"; // MTF added memoryLocalCache

const TAG = "[firebase.ts]";

function showAlert(label: string, message: string) {
  const text = `${label} ${message}`;
  if (typeof alert === "function") {
    alert(text);
  }
}

// Build config from EXPO_PUBLIC_ env (all strings, correct)
const cfg: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
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
     // "Initializing Firestore with experimentalForceLongPolling=true, useFetchStreams=false"
       "Initializing Firestore with memoryLocalCache and auto transport detection"
    );
    dbInternal = initializeFirestore(app, {
      // MTF commented lines 76 & 77 out...added line 78
      // experimentalForceLongPolling: true, 
      // useFetchStreams: false,
      localCache: memoryLocalCache(),
    } as any);
    (global as any).__FIRESTORE_INIT__ = true;
    // MTF commented out line 82 added 83
    // showAlert(`${TAG}[Firestore]`, "Firestore initialized (forced long polling).");
    showAlert(`${TAG}[Firestore]`, "Firestore initialized (memory cache).");

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
