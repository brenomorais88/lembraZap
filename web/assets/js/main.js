(function () {
  const auth = JSON.parse(localStorage.getItem("auth") || sessionStorage.getItem("auth") || "null");
  const loginNav = document.getElementById("loginNav");

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
