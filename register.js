"use strict";

(() => {
  const form = document.getElementById("regForm");
  const msg = document.getElementById("msg");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const username = form.username.value.trim();
    const password = form.password.value;
    const konfirmasi = form.konfirmasi.value;

    if (!username) {
      msg.textContent = "Username wajib diisi.";
      return;
    }
    if (password.length < 6) {
      msg.textContent = "Password minimal 6 karakter.";
      return;
    }
    if (password !== konfirmasi) {
      msg.textContent = "Konfirmasi password tidak sama.";
      return;
    }

    const res = GameHub.register({ username, password });
    if (!res.ok) {
      msg.textContent = res.error;
      return;
    }
    window.location.href = "login.html";
  });
})();
