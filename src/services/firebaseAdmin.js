// src/services/firebaseAdmin.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Render envia \n escapado; converte para quebras reais
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

/**
 * Aceita tanto "Bearer <token>" quanto "<token>".
 */
export async function verifyIdToken(authorizationHeaderOrToken = "") {
  const raw = String(authorizationHeaderOrToken || "");
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw; // <-- aceita os dois
  if (!token) throw new Error("missing_token");
  return admin.auth().verifyIdToken(token);
}

export { admin };
