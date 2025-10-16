// src/services/firebaseAdmin.js
import admin from "firebase-admin";

// inicializa uma única vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // IMPORTANTE: no Render, a chave deve estar com \n escapado; aqui voltamos para quebras reais
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

/**
 * Extrai e verifica o ID Token do header Authorization: Bearer <token>
 * Retorna o payload decodificado (uid, email, etc.)
 */
export async function verifyIdToken(authorizationHeader) {
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : null;
  if (!token) throw new Error("missing_token");
  return admin.auth().verifyIdToken(token);
}

export { admin };
