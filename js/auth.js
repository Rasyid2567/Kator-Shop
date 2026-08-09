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

const EYE_CLOSED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 6.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
</svg>`;

const EYE_OPEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>`;

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = EYE_OPEN_SVG;
    btn.setAttribute("aria-label", "Sembunyikan password");
  } else {
    input.type = "password";
    btn.innerHTML = EYE_CLOSED_SVG;
    btn.setAttribute("aria-label", "Tampilkan password");
  }
}

