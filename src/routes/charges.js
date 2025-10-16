const express = require("express");
const router = express.Router();
const { listCharges, createCharge, markChargePaid } = require("../models/chargeModel");
const { db } = require("../services/firestore");

// GET /api/charges
router.get("/", async (req, res) => {
  const list = await listCharges(req.user.uid);
  res.json(list);
});

// POST /api/charges (manual)
router.post("/", async (req, res) => {
  const { customerId, dueDate, value } = req.body;
  if (!customerId || !dueDate) return res.status(400).json({ error: "missing_fields" });

  // lê cliente para trazer o nome e valor default (se não enviado)
  const cRef = db.doc(`users/${req.user.uid}/customers/${customerId}`);
  const snap = await cRef.get();
  if (!snap.exists) return res.status(404).json({ error: "customer_not_found" });
  const customer = snap.data();

  const created = await createCharge(req.user.uid, {
    customerId,
    customerName: customer.name,
    dueDate,
    value: value ?? customer.value,
  });
  res.json(created);
});

// POST /api/charges/:id/mark-paid
router.post("/:id/mark-paid", async (req, res) => {
  await markChargePaid(req.user.uid, req.params.id);
  res.json({ success: true });
});

export default router
