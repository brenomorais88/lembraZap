const { db, admin } = require("../services/firestore");

// Caminho base: users/{uid}/customers
function colPath(uid) {
  return `users/${uid}/customers`;
}

async function listCustomers(uid) {
  const snap = await db.collection(colPath(uid)).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function createCustomer(uid, data) {
  const ref = db.collection(colPath(uid)).doc();
  await ref.set({
    name: data.name,
    phone: data.phone,
    billingDay: data.billingDay,      // 1..31
    value: data.value,                // number (ex.: 200)
    paymentMethod: data.paymentMethod, // {type:'pix'|'bank', ...}
    isPaused: !!data.isPaused,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

async function updateCustomer(uid, id, patch) {
  const ref = db.doc(`${colPath(uid)}/${id}`);
  const toUpdate = { ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  await ref.update(toUpdate);
}

async function deleteCustomer(uid, id) {
  await db.doc(`${colPath(uid)}/${id}`).delete();
}

module.exports = { listCustomers, createCustomer, updateCustomer, deleteCustomer };
