"use strict";

(() => {
  const form = document.getElementById("loginform");
  const msg = document.getElementById("msg");
  if (!form) return;

  /* Kalau sudah login, langsung ke dashboard. */
  if (GameHub.currentUser()) {
    window.location.replace("dashboard.html");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const username = form.username.value.trim();
    const password = form.password.value;

    if (!username || !password) {
      msg.textContent = "Username dan password wajib diisi.";
      return;
    }

    const res = GameHub.login(username, password);
    if (!res.ok) {
      msg.textContent = res.error;
      return;
    }
    window.location.href = "dashboard.html";
  });
})();
