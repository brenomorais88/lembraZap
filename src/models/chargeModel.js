import { db, admin } from "../services/firestore.js";

const colPath = (uid) => `users/${uid}/charges`;

export async function listCharges(uid) {
  const snap = await db.collection(colPath(uid)).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createCharge(uid, data) {
  const ref = db.collection(colPath(uid)).doc();
  await ref.set({
    customerId: data.customerId,
    customerName: data.customerName,
    dueDate: data.dueDate, // "YYYY-MM-DD"
    value: Number(data.value),
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

export async function markChargePaid(uid, chargeId) {
  await db.doc(`${colPath(uid)}/${chargeId}`).update({
    status: "paid",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
