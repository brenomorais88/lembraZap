const cron = require("node-cron");
const { db } = require("../services/firestore");
const { createCharge } = require("../models/chargeModel");

// roda todo dia às 08:00 (timezone do container; simples)
cron.schedule("25 15 * * *", async () => {
  try {
    console.log("🕗 [cron] Gerando cobranças automáticas...");
    const usersSnap = await db.collection("users").get();
    const today = new Date();
    const day = today.getDate();
    const dueDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

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
  } catch (e) {
    console.error("cron error:", e);
  }
});
