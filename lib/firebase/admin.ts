// src/lib/firebase/admin.ts
import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const apps = getApps();
console.log("[Firebase Admin] Existing admin apps count:", apps.length);

if (!apps.length) {
  console.log("[Firebase Admin] Initializing new admin app");
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  console.log("[Firebase Admin] Admin app initialized successfully");
} else {
  console.log("[Firebase Admin] Using existing admin app");
}

export const adminApp = getApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
console.log("[Firebase Admin] Admin services initialized (auth, firestore)");