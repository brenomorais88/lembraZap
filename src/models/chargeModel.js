const { db, admin } = require("../services/firestore");

// Caminho: users/{uid}/charges
function colPath(uid) {
  return `users/${uid}/charges`;
}

async function listCharges(uid) {
  const snap = await db.collection(colPath(uid)).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function createCharge(uid, data) {
  const ref = db.collection(colPath(uid)).doc();
  await ref.set({
    customerId: data.customerId,
    customerName: data.customerName,
    value: data.value,
    dueDate: data.dueDate,                  // "YYYY-MM-DD"
    status: "pending",                      // pending | paid | canceled
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

async function markChargePaid(uid, chargeId) {
  await db.doc(`${colPath(uid)}/${chargeId}`).update({
    status: "paid",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = { listCharges, createCharge, markChargePaid, createCharge };
