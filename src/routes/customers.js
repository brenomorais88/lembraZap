import { Router } from "express";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../models/customerModel.js";

const router = Router();

// GET /api/customers
router.get("/", async (req, res) => {
  const list = await listCustomers(req.user.uid);
  console.log("GET /api/customers ->", list.length, "itens para uid", req.user.uid);
  res.json(list);
});

// POST /api/customers
router.post("/", async (req, res) => {
  console.log("📩 POST /api/customers", req.user?.uid, req.body);
  const { name, phone, billingDay, value, paymentMethod } = req.body;
  if (!name || !phone || !billingDay || !value || !paymentMethod) {
    return res.status(400).json({ error: "missing_fields" });
  }

  const created = await createCustomer(req.user.uid, {
    name,
    phone,
    billingDay: Number(billingDay),
    value: Number(value),
    paymentMethod,
    isPaused: false,
  });

  // retorna { id } para o front já usar em cobranças
  res.json(created);
});

// PATCH /api/customers/:id
router.patch("/:id", async (req, res) => {
  await updateCustomer(req.user.uid, req.params.id, req.body);
  res.json({ success: true });
});

// DELETE /api/customers/:id
router.delete("/:id", async (req, res) => {
  await deleteCustomer(req.user.uid, req.params.id);
  res.json({ success: true });
});

export default router;
