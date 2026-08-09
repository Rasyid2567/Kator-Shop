const STORE = {
  ACCOUNTS: "toko_accounts",
  PRODUCTS: "toko_products",
  KATEGORI: "toko_kategori",
  TRANSAKSI: "toko_transaksi",
  SESSION: "toko_session",
  CART: "toko_cart",
};

function getEntityNameFromKey(key) {
  const map = {
    [STORE.ACCOUNTS]: "accounts",
    [STORE.PRODUCTS]: "products",
    [STORE.KATEGORI]: "kategori",
    [STORE.TRANSAKSI]: "transaksi",
  };
  return map[key] || null;
}

function getApiUrl(entity) {
  let origin = window.location.origin;
  if (!origin || origin === "null" || origin.startsWith("file:")) {
    origin = "http://localhost:2567";
  }
  return `${origin}/api/${entity}`;
}

async function loadStore(key, jsonPath) {
  const entity = getEntityNameFromKey(key);
  const apiPath = entity ? getApiUrl(entity) : jsonPath;

  try {
    const res = await fetch(apiPath);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(key, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn(`Gagal mengambil data dari API ${apiPath}, mencoba fallback...`, e);
  }

  const existing = localStorage.getItem(key);
  if (existing !== null) {
    try {
      return JSON.parse(existing);
    } catch (e) {}
  }

  if (jsonPath && apiPath !== jsonPath) {
    try {
      const res = await fetch(jsonPath);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
    } catch (e) {}
  }

  localStorage.setItem(key, JSON.stringify([]));
  return [];
}

async function saveStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));

  const entity = getEntityNameFromKey(key);
  if (entity) {
    const apiUrl = getApiUrl(entity);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        console.error(`[BACKEND SAVE ERROR] Status HTTP ${res.status} saat menyimpan ke ${apiUrl}`);
      }
    } catch (e) {
      console.error(`Gagal menyambung ke server backend di ${apiUrl}:`, e);
    }
  }
}

function getSession() {
  const s = localStorage.getItem(STORE.SESSION);
  return s ? JSON.parse(s) : null;
}

function setSession(user) {
  localStorage.setItem(STORE.SESSION, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(STORE.SESSION);
}

function genId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}
