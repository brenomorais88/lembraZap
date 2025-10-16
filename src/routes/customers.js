const express = require("express");
const router = express.Router();
const {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../models/customerModel");

// GET /api/customers
router.get("/", async (req, res) => {
  const list = await listCustomers(req.user.uid);
  res.json(list);
});

// POST /api/customers
router.post("/", async (req, res) => {
  const { name, phone, billingDay, value, paymentMethod } = req.body;
  if (!name || !phone || !billingDay || !value || !paymentMethod)
    return res.status(400).json({ error: "missing_fields" });

  const created = await createCustomer(req.user.uid, {
    name,
    phone,
    billingDay: Number(billingDay),
    value: Number(value),
    paymentMethod,       // ex.: { type:'pix', key:'...' } ou { type:'bank', agency:'', account:'' }
    isPaused: false,
  });
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

module.exports = router;
