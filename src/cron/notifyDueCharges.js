// src/cron/notifyDueCharges.js
import cron from "node-cron";
import twilio from "twilio";
import { db, admin } from "../services/firestore.js";

// Twilio client (usa as mesmas ENV do seu projeto)
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// helpers
const fmtBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));

function todayStr(tz = "America/Sao_Paulo") {
  // Usa a data local de SP para montar YYYY-MM-DD
  const now = new Date();
  // Ajuste simples: pega UTC e desloca para -03/-02 não-DST usando Intl
  // (para manter simples, só cortamos YYYY-MM-DD do ISO na hora local)
  const f = new Intl.DateTimeFormat("sv-SE", { timeZone: tz, dateStyle: "short" });
  // "2025-10-16" no locale sv-SE; garantidamente YYYY-MM-DD
  return f.format(now);
}

// ---- núcleo: notificar pendências do UID ----
export async function runNotifyDueChargesForUid(uid) {
  const dueDate = todayStr();

  console.log(`📣 [notify] uid=${uid} dueDate=${dueDate}`);

  // Busca cobranças pendentes com vencimento hoje
  const chargesSnap = await db
    .collection(`users/${uid}/charges`)
    .where("status", "==", "pending")
    .where("dueDate", "==", dueDate)
    .get();

  if (chargesSnap.empty) {
    console.log("📣 [notify] nenhuma cobrança pendente hoje para uid:", uid);
    return { sent: 0 };
  }

  let sent = 0;

  // Envia uma mensagem por cobrança
  for (const chDoc of chargesSnap.docs) {
    const ch = chDoc.data();

    // Evita duplicar envio: se já tem notifiedAt, pula
    if (ch.notifiedAt) {
      continue;
    }

    // Carrega o telefone do cliente
    const custRef = db.doc(`users/${uid}/customers/${ch.customerId}`);
    const custSnap = await custRef.get();
    if (!custSnap.exists) {
      console.warn("⚠️ [notify] cliente não encontrado:", ch.customerId);
      continue;
    }
    const cust = custSnap.data();

    const to = `whatsapp:${cust.phone}`; // telefone deve estar em E.164: +55...
    const msg = `Olá ${cust.name || ch.customerName}, cobrança de ${fmtBRL(ch.value)} a ser paga hoje.`;

    try {
      const resp = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM, // ex: 'whatsapp:+14155238886'
        to,
        body: msg,
      });

      console.log(`✅ [notify] msg enviada (sid=${resp.sid}) para`, cust.phone, "ch:", chDoc.id);

      // marca como notificado
      await chDoc.ref.update({
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      sent++;
    } catch (e) {
      console.error("❌ [notify] falha ao enviar para", cust.phone, e?.message || e);
    }
  }

  console.log(`📣 [notify] uid=${uid} finalizado. Enviadas: ${sent}`);
  return { sent };
}

// ---- varre todos os usuários (para o cron) ----
export async function runNotifyDueChargesAllUsers() {
  const usersSnap = await db.collection("users").get();
  let total = 0;
  for (const u of usersSnap.docs) {
    const { sent } = await runNotifyDueChargesForUid(u.id);
    total += sent;
  }
  console.log("📣 [notify] total enviadas para todos os usuários:", total);
  return { total };
}

// ---- agenda diária (ex.: 09:00 em São Paulo) ----
// Altere o horário conforme preferir (minuto hora * * *)
const job = cron.schedule("10 16 * * *", runNotifyDueChargesAllUsers, {
  timezone: "America/Sao_Paulo",
});

try {
  const nexts = job.getNextDates?.(3) ?? [];
  console.log(
    "⏰ [notify-cron] Agendado 10 16 America/Sao_Paulo. Próximas:",
    nexts.map((d) => d.toISOString())
  );
} catch {}
