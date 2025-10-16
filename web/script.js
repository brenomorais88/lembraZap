// util: espera o Firebase estar pronto (até 3s)
function ensureAuth(timeoutMs = 3000) {
  if (window.fbAuth) return Promise.resolve(window.fbAuth);
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const id = setInterval(() => {
      if (window.fbAuth) { clearInterval(id); resolve(window.fbAuth); }
      else if (Date.now() - started > timeoutMs) {
        clearInterval(id);
        reject(new Error("Firebase não carregou"));
      }
    }, 100);
  });
}

// =======================
// 🔹 Observa login automático e logout
// =======================
(async function setupAuthObserver() {
  const { onAuthStateChanged, signOut } =
    await import("https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js");

  const auth = await ensureAuth();

  onAuthStateChanged(auth, (user) => {
    const authStatus = document.getElementById("authStatus");
    const sendBtn = document.getElementById("send");

    if (user) {
      authStatus.textContent = `✅ Logado: ${user.email}`;
      if (sendBtn) sendBtn.disabled = false;
    } else {
      authStatus.textContent = "⚠️ Não logado";
      if (sendBtn) sendBtn.disabled = true;
    }
  });

  document.getElementById("logout").addEventListener("click", async () => {
    try {
      await signOut(auth);
      document.getElementById("authStatus").textContent = "👋 Você saiu";
    } catch (e) {
      document.getElementById("authStatus").textContent = "❌ Erro ao sair: " + e.message;
    }
  });
})();

// =======================
// 🔹 Cadastro
// =======================
document.getElementById("signup").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const pass  = document.getElementById("password").value;
  const status = document.getElementById("authStatus");

  try {
    const auth = await ensureAuth();
    const { createUserWithEmailAndPassword } =
      await import("https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js");

    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    const uid = cred.user.uid;
    await window.dbSet(
      window.dbDoc(window.db, "users", uid),
      {
        email,
        createdAt: window.dbNow(),
        lastLoginAt: window.dbNow(),
        plan: "free",
      },
      { merge: true }
    );

    status.textContent = "✅ Conta criada e salva no Firestore!";
  } catch (e) {
    status.textContent = "❌ Erro: " + e.message;
  }
});

// =======================
// 🔹 Login
// =======================
document.getElementById("login").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const pass  = document.getElementById("password").value;
  const status = document.getElementById("authStatus");

  try {
    const auth = await ensureAuth();
    const { signInWithEmailAndPassword } =
      await import("https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js");

    const cred = await signInWithEmailAndPassword(auth, email, pass);

    await window.dbSet(
      window.dbDoc(window.db, "users", cred.user.uid),
      { lastLoginAt: window.dbNow() },
      { merge: true }
    );

    status.textContent = "✅ Logado com sucesso!";
  } catch (e) {
    status.textContent = "❌ Erro: " + e.message;
  }
});

// =======================
// 🔹 Enviar mensagem
// =======================
document.getElementById("send").addEventListener("click", async () => {
  const phone  = document.getElementById("phone").value;
  const msg    = document.getElementById("msg").value;
  const status = document.getElementById("status");

  try {
    const auth = await ensureAuth();
    const user = auth.currentUser;
    if (!user) {
      status.textContent = "⚠️ Faça login antes de enviar!";
      return;
    }
    const token = await user.getIdToken();

    const res = await fetch("https://lembrazap-n223.onrender.com/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: phone, message: msg }),
    });

    const data = await res.json();
    status.textContent = data.success
      ? "✅ Enviado!"
      : "❌ Erro: " + (data.error || "falha no envio");
  } catch (e) {
    status.textContent = "❌ Erro: " + e.message;
  }
});

// =======================
// 🔹 Helpers de API autenticada
// =======================
async function api(path, options = {}) {
  const auth = await ensureAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("not_logged");
  const token = await user.getIdToken();

  const res = await fetch(`https://lembrazap-n223.onrender.com${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// =======================
// 🔹 Clientes
// =======================
async function fetchCustomers() {
  return api("/api/customers");
}

function renderCustomers(customers) {
  const tbody = document.querySelector("#customersTable tbody");
  tbody.innerHTML = "";

  for (const c of customers) {
    const tr = document.createElement("tr");
    const pm = c.paymentMethod?.type === "pix"
      ? `PIX (${c.paymentMethod?.key || "-"})`
      : `Banco (Ag: ${c.paymentMethod?.agency || "-"} / Ct: ${c.paymentMethod?.account || "-"})`;

    tr.innerHTML = `
      <td>${c.id || "(sem id)"}</td>
      <td>${c.name}</td>
      <td>${c.phone}</td>
      <td>${c.billingDay}</td>
      <td>${Number(c.value).toFixed(2)}</td>
      <td>${pm}</td>
      <td>${c.isPaused ? "Sim" : "Não"}</td>
      <td>
        <button data-id="${c.id}" class="btn-id">Copiar ID</button>
        <button data-id="${c.id}" class="btn-fill-charge">Cobrar</button>
        <button data-id="${c.id}" class="btn-charge-today">Cobrar hoje</button>
        <button data-id="${c.id}" class="btn-pause">${c.isPaused ? "Retomar" : "Pausar"}</button>
        <button data-id="${c.id}" class="btn-edit">Editar</button>
        <button data-id="${c.id}" class="btn-del">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  // copiar ID
  tbody.querySelectorAll(".btn-id").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      try {
        await navigator.clipboard.writeText(id);
        alert("ID copiado!");
      } catch {
        alert("Falha ao copiar. ID: " + id);
      }
    };
  });

  // preencher formulário de cobrança manual
  tbody.querySelectorAll(".btn-fill-charge").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      document.getElementById("ch_customerId").value = id;
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("ch_dueDate").value = today;
      document.getElementById("ch_value").focus();
    };
  });

  // cobrar direto (hoje)
  tbody.querySelectorAll(".btn-charge-today").forEach((btn) => {
    btn.onclick = async () => {
      const customerId = btn.dataset.id;
      const dueDate = new Date().toISOString().split("T")[0];
      await api("/api/charges", {
        method: "POST",
        body: JSON.stringify({ customerId, dueDate }),
      });
      await loadCharges();
    };
  });

  // pausar/retomar
  tbody.querySelectorAll(".btn-pause").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      const row = customers.find((x) => x.id === id);
      await api(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPaused: !row.isPaused }),
      });
      await loadCustomers();
    };
  });

  // editar
  tbody.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      const row = customers.find((x) => x.id === id);
      const newName = prompt("Novo nome:", row.name);
      if (!newName) return;
      await api(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      await loadCustomers();
    };
  });

  // excluir
  tbody.querySelectorAll(".btn-del").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("Excluir cliente?")) return;
      await api(`/api/customers/${id}`, { method: "DELETE" });
      await loadCustomers();
    };
  });
}

async function loadCustomers() {
  const customers = await fetchCustomers();
  renderCustomers(customers);
}

// criar cliente
document.getElementById("createCustomerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("c_name").value.trim();
  const phone = document.getElementById("c_phone").value.trim();
  const billingDay = Number(document.getElementById("c_billingDay").value);
  const value = Number(document.getElementById("c_value").value);
  const type = document.getElementById("c_method_type").value;

  let paymentMethod;
  if (type === "pix") {
    const key = document.getElementById("c_pix_key").value.trim();
    paymentMethod = { type: "pix", key };
  } else {
    paymentMethod = {
      type: "bank",
      agency: document.getElementById("c_bank_agency").value.trim(),
      account: document.getElementById("c_bank_account").value.trim(),
    };
  }

  const created = await api("/api/customers", {
    method: "POST",
    body: JSON.stringify({ name, phone, billingDay, value, paymentMethod }),
  });

  // opcional: já preencher o form de cobrança com o novo ID
  if (created?.id) {
    document.getElementById("ch_customerId").value = created.id;
    document.getElementById("ch_dueDate").value = new Date().toISOString().split("T")[0];
  }

  e.target.reset();
  await loadCustomers();
});

// =======================
// 🔹 Cobranças
// =======================
async function fetchCharges() {
  return api("/api/charges");
}

function renderCharges(charges) {
  const tbody = document.querySelector("#chargesTable tbody");
  tbody.innerHTML = "";

  for (const ch of charges) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ch.id}</td>
      <td>${ch.customerName || ch.customerId}</td>
      <td>${ch.dueDate}</td>
      <td>${Number(ch.value).toFixed(2)}</td>
      <td>${ch.status}</td>
      <td>
        ${ch.status !== "paid" ? `<button data-id="${ch.id}" class="btn-paid">Marcar pago</button>` : "-"}
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll(".btn-paid").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      await api(`/api/charges/${id}/mark-paid`, { method: "POST" });
      await loadCharges();
    };
  });
}

async function loadCharges() {
  const charges = await fetchCharges();
  renderCharges(charges);
}

// gerar cobrança manual
document.getElementById("createChargeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const customerId = document.getElementById("ch_customerId").value.trim();
  const dueDate = document.getElementById("ch_dueDate").value;
  const valueStr = document.getElementById("ch_value").value;
  const value = valueStr ? Number(valueStr) : undefined;

  await api("/api/charges", {
    method: "POST",
    body: JSON.stringify({ customerId, dueDate, value }),
  });

  e.target.reset();
  await loadCharges();
});
