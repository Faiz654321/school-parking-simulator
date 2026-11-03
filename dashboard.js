"use strict";

(() => {
  const user = GameHub.requireLogin();
  if (!user) return;

  const who = document.getElementById("who");
  if (who) who.textContent = user.username;

  const loginMark = document.querySelector(".notice mark");
  if (loginMark && !GameHub.consumeFreshLogin()) {
    loginMark.hidden = true;
  }

  document.querySelectorAll('a[href="index.html"][title="Keluar dari akun"], #loqout, .drawer-foot a[href="index.html"]')
    .forEach((a) => a.addEventListener("click", () => GameHub.logout()));
})();
