import { Router } from "express";
import { listCharges, createCharge, markChargePaid } from "../models/chargeModel.js";
import { db } from "../services/firestore.js";

const router = Router();

// GET /api/charges
router.get("/", async (req, res) => {
  const list = await listCharges(req.user.uid);
  res.json(list);
});

// POST /api/charges (manual)
router.post("/", async (req, res) => {
  const { customerId, dueDate, value } = req.body;
  if (!customerId || !dueDate) return res.status(400).json({ error: "missing_fields" });

  const cRef = db.doc(`users/${req.user.uid}/customers/${customerId}`);
  const cSnap = await cRef.get();
  if (!cSnap.exists) return res.status(404).json({ error: "customer_not_found" });
  const customer = cSnap.data();

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

export default router;
