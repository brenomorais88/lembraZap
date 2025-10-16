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

  // Observa mudanças de login
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

  // Logout
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

    // Salva no Firestore
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
