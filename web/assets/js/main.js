<script>
(function () {
  const auth = JSON.parse(localStorage.getItem("auth") || sessionStorage.getItem("auth") || "null");
  const loginNav = document.getElementById("loginNav");

  // 🔹 Redireciona para login.html se não estiver logado e não estiver já nele
  const isOnLoginPage = window.location.pathname.endsWith("login.html");
  if (!auth?.email && !isOnLoginPage) {
    window.location.href = "./login.html";
    return; // evita executar o restante do script
  }

  // 🔹 Atualiza o link do menu
  if (loginNav) {
    if (auth?.email) {
      loginNav.textContent = "Sair";
      loginNav.href = "#";
      loginNav.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
        window.location.href = "./index.html";
      });
    } else {
      loginNav.textContent = "Entrar";
      loginNav.href = "./login.html";
    }
  }
})();
</script>
