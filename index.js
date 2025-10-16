// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import twilio from "twilio";
import { verifyIdToken } from "./src/services/firebaseAdmin.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware simples para proteger rotas com Firebase Auth
async function requireAuth(req, res, next) {
  try {
    const decoded = await verifyIdToken(req.headers.authorization);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    return next();
  } catch (e) {
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
    return res.status(400).json({ success: false, error: e.message });
  }
});

// (no futuro) monte aqui as rotas REST de clientes e cobranças:
// import customersRoutes from "./src/routes/customers.js";
// import chargesRoutes from "./src/routes/charges.js";
// app.use("/api/customers", requireAuth, customersRoutes);
// app.use("/api/charges", requireAuth, chargesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
