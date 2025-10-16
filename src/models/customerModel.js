import { db, admin } from "../services/firestore.js";

const colPath = (uid) => `users/${uid}/customers`;

export async function listCustomers(uid) {
  const snap = await db.collection(colPath(uid)).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createCustomer(uid, data) {
  const ref = db.collection(colPath(uid)).doc();
  await ref.set({
    name: data.name,
    phone: data.phone,
    billingDay: Number(data.billingDay),
    value: Number(data.value),
    paymentMethod: data.paymentMethod,
    isPaused: !!data.isPaused,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

export async function updateCustomer(uid, id, patch) {
  await db.doc(`${colPath(uid)}/${id}`).update({
    ...patch,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteCustomer(uid, id) {
  await db.doc(`${colPath(uid)}/${id}`).delete();
}
