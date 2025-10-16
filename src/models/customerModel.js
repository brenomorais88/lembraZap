import { db, admin } from "../services/firestore.js";

const colPath = (uid) => `users/${uid}/customers`;

// Lista clientes — id do doc por ÚLTIMO (não é sobrescrito pelos dados)
export async function listCustomers(uid) {
  const snap = await db.collection(colPath(uid)).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

// Cria cliente — não grava campo `id` dentro do doc; retorna o id do doc
export async function createCustomer(uid, data) {
  const ref = db.collection(colPath(uid)).doc();
  await ref.set({
    name: data.name,
    phone: data.phone,
    billingDay: Number(data.billingDay),
    value: Number(data.value),
    paymentMethod: data.paymentMethod,       // { type:'pix', key } | { type:'bank', agency, account }
    isPaused: !!data.isPaused,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

// Atualiza — ignora `id` vindo do front para não quebrar o doc
export async function updateCustomer(uid, id, patch) {
  const data = { ...patch };
  delete data.id;

  await db.doc(`${colPath(uid)}/${id}`).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Exclui
export async function deleteCustomer(uid, id) {
  await db.doc(`${colPath(uid)}/${id}`).delete();
}
