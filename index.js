// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import twilio from "twilio";
import { verifyIdToken } from "./src/services/firebaseAdmin.js";

// Rotas
import customersRoutes from "./src/routes/customers.js";
import chargesRoutes from "./src/routes/charges.js";

import { runCharges } from "./src/cron/autoCharges.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Nunca cachear respostas da API
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Vary", "Authorization"); // <-- MUITO IMPORTANTE
  next();
});

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Auth middleware — passa o header bruto; o verifyIdToken aceita Bearer ou cru
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader) return res.status(401).json({ error: "missing_token" });
    const decoded = await verifyIdToken(authHeader);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch (e) {
    console.error("Auth error:", e?.message || e);
    res.status(401).json({ error: "unauthorized" });
  }
}

// Health (útil pro Render)
app.get("/health", (_, res) => res.json({ ok: true }));

// Envio WhatsApp protegido
app.post("/send", requireAuth, async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ success: false, error: "missing_to_or_message" });
  }
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM, // ex: 'whatsapp:+14155238886'
      to: `whatsapp:${to}`,
      body: message,
    });
    return res.json({ success: true, sid: response.sid, user: req.user });
  } catch (e) {
    console.error("Twilio error:", e?.message || e);
    return res.status(400).json({ success: false, error: e.message });
  }
});

// Rotas REST protegidas
app.use("/api/customers", requireAuth, customersRoutes);
app.use("/api/charges",   requireAuth, chargesRoutes);

// ✅ Endpoint para disparar manualmente as cobranças
app.post("/tasks/run-charges", requireAuth, async (req, res) => {
  try {
    await runCharges();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 404
app.use((req, res) => res.status(404).json({ error: "not_found" }));

// Handler de erro
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "internal_error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
