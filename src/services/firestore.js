import { admin } from "./firebaseAdmin.js";

// Instância única do Firestore
const db = admin.firestore();

// Exporte ambos NOMEADOS
export { db, admin };
