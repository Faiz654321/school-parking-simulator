"use strict";

/* Penyimpanan akun dan sesi memakai localStorage. */
const GameHub = (() => {
  const USERS_KEY = "gamehub-users";
  const SESSION_KEY = "gamehub-session";
  const FRESH_KEY = "gamehub-fresh-login";

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  };

  const getUsers = () => {
    const u = read(USERS_KEY, []);
    return Array.isArray(u) ? u : [];
  };

  const register = ({ username, password }) => {
    const users = getUsers();
    const uname = username.trim().toLowerCase();
    if (users.some((u) => u.username === uname)) {
      return { ok: false, error: "Username sudah dipakai." };
    }
    users.push({
      username: uname,
      password,
    });
    if (!write(USERS_KEY, users)) {
      return { ok: false, error: "Penyimpanan browser tidak tersedia." };
    }
    return { ok: true };
  };

  const login = (username, password) => {
    const uname = username.trim().toLowerCase();
    const user = getUsers().find((u) => u.username === uname && u.password === password);
    if (!user) return { ok: false, error: "Username atau password salah." };
    if (!write(SESSION_KEY, { username: user.username })) {
      return { ok: false, error: "Penyimpanan browser tidak tersedia." };
    }
    try { sessionStorage.setItem(FRESH_KEY, "1"); } catch (e) { /* abaikan */ }
    return { ok: true, user };
  };

  const currentUser = () => {
    const s = read(SESSION_KEY, null);
    if (!s || !s.username) return null;
    return getUsers().find((u) => u.username === s.username) || null;
  };

  const logout = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* abaikan */ }
  };

  const requireLogin = () => {
    const user = currentUser();
    if (!user) {
      window.location.replace("login.html");
      return null;
    }
    return user;
  };

  const consumeFreshLogin = () => {
    try {
      const fresh = sessionStorage.getItem(FRESH_KEY) === "1";
      sessionStorage.removeItem(FRESH_KEY);
      return fresh;
    } catch (e) {
      return false;
    }
  };

  return { register, login, currentUser, logout, requireLogin, consumeFreshLogin };
})();
