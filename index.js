// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import twilio from "twilio";
import { verifyIdToken } from "./src/services/firebaseAdmin.js";

// 👉 importe as rotas
import customersRoutes from "./src/routes/customers.js";
import chargesRoutes from "./src/routes/charges.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// 🔒 Nunca cachear respostas da API
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware de autenticação (aceita "Bearer <token>" ou token cru)
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
    if (!token) return res.status(401).json({ error: "missing_token" });

    const decoded = await verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    return next();
  } catch (e) {
    console.error("Auth error:", e?.message || e);
    return res.status(401).json({ error: "unauthorized" });
  }
}

// Health (útil pro Render)
app.get("/health", (_, res) => res.json({ ok: true }));

// Protege /send com Firebase Auth
app.post("/send", requireAuth, async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ success: false, error: "missing_to_or_message" });
  }
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM, // ex.: 'whatsapp:+14155238886'
      to: `whatsapp:${to}`,
      body: message,
    });
    return res.json({ success: true, sid: response.sid, user: req.user });
  } catch (e) {
    console.error("Twilio error:", e?.message || e);
    return res.status(400).json({ success: false, error: e.message });
  }
});

// ✅ Rotas REST (protegidas)
app.use("/api/customers", requireAuth, customersRoutes);
app.use("/api/charges", requireAuth, chargesRoutes);

// 404 simples
app.use((req, res, _next) => {
  res.status(404).json({ error: "not_found" });
});

// Handler de erro
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "internal_error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
