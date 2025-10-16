document.querySelector("#send").addEventListener("click", async () => {
  const phone = document.querySelector("#phone").value;
  const msg = document.querySelector("#msg").value;
  const res = await fetch("http://localhost:3000/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: phone, message: msg })
  });
  const data = await res.json();
  document.querySelector("#status").textContent = data.success ? "✅ Enviado!" : "❌ Erro: " + data.error;
});
