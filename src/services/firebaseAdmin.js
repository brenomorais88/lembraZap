// src/services/firebaseAdmin.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

async function verifyIdToken(authorizationHeader) {
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : null;
  if (!token) throw new Error("missing_token");

  return admin.auth().verifyIdToken(token); // retorna { uid, email, ... }
}

module.exports = { verifyIdToken };
