// src/lib/firebase/admin.ts
import { getApps, initializeApp, cert, getApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Validate required environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing required Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
  );
}

const apps = getApps();
console.log("[Firebase Admin] Existing admin apps count:", apps.length);

if (!apps.length) {
  console.log("[Firebase Admin] Initializing new admin app");
  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    console.log("[Firebase Admin] Admin app initialized successfully");
  } catch (error) {
    console.error("[Firebase Admin] Failed to initialize admin app:", error);
    throw error;
  }
} else {
  console.log("[Firebase Admin] Using existing admin app");
}

export const adminApp: App = getApp();
export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
console.log("[Firebase Admin] Admin services initialized (auth, firestore)");