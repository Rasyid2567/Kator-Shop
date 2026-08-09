const ACCOUNTS_JSON_PATH = "data/accounts.json";

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("errorBox");
  errorBox.style.display = "none";

  const accounts = await loadStore(STORE.ACCOUNTS, ACCOUNTS_JSON_PATH);
  const found = accounts.find(
    (a) => a.username === username && a.password === password
  );

  if (!found) {
    errorBox.textContent = "Username atau password salah.";
    errorBox.style.display = "block";
    return;
  }

  setSession({ username: found.username, role: found.role || "customer" });
  window.location.href = "/";
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;
  const errorBox = document.getElementById("errorBox");
  const successBox = document.getElementById("successBox");
  errorBox.style.display = "none";
  successBox.style.display = "none";

  if (!username || !password) {
    errorBox.textContent = "Username dan password wajib diisi.";
    errorBox.style.display = "block";
    return;
  }
  if (password !== confirm) {
    errorBox.textContent = "Konfirmasi password tidak cocok.";
    errorBox.style.display = "block";
    return;
  }

  const accounts = await loadStore(STORE.ACCOUNTS, ACCOUNTS_JSON_PATH);
  if (accounts.some((a) => a.username === username)) {
    errorBox.textContent = "Username sudah dipakai, coba yang lain.";
    errorBox.style.display = "block";
    return;
  }

  accounts.push({ username, password, role: "customer" });
  saveStore(STORE.ACCOUNTS, accounts);
  
  setTimeout(() => {
    window.location.href = "/login";
  }, 1200);
}

function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = "/login";
  }
  return session;
}
