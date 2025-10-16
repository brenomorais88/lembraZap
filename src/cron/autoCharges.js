// src/cron/autoCharges.js
import cron from "node-cron";
import { db } from "../services/firestore.js";
import { createCharge } from "../models/chargeModel.js";

export async function runCharges() {
  try {
    console.log("🕗 [cron] Gerando cobranças automáticas...");
    const usersSnap = await db.collection("users").get();
    const now = new Date();
    const day = now.getDate();
    const dueDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const customersSnap = await db.collection(`users/${uid}/customers`).get();

      for (const cDoc of customersSnap.docs) {
        const c = cDoc.data();
        if (!c.isPaused && Number(c.billingDay) === day) {
          await createCharge(uid, {
            customerId: cDoc.id,
            customerName: c.name,
            dueDate,
            value: c.value,
          });
          console.log(`💰 Cobrança gerada: uid=${uid} cliente=${c.name} dia=${day}`);
        }
      }
    }
    console.log("✅ [cron] Fim da execução.");
  } catch (e) {
    console.error("❌ [cron] erro:", e);
  }
}

// 🔔 Agenda todo dia às 15:20 no fuso de São Paulo
const job = cron.schedule("20 48 * * *", runCharges, {
  timezone: "America/Sao_Paulo",
});

// logs de próximas execuções (debug)
try {
  const nexts = job.getNextDates?.(3) ?? [];
  console.log("⏰ [cron] Agendado 15:20 America/Sao_Paulo. Próximas:", nexts.map(d => d.toISOString()));
} catch {}
