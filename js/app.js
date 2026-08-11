const PRODUCTS_JSON_PATH = "data/products.json";
const KATEGORI_JSON_PATH = "data/kategori.json";
const TRANSAKSI_JSON_PATH = "data/transaksi.json";
const ACCOUNTS_JSON_PATH = "data/accounts.json";

const NAV_ACTIVE_CLASSES = ["bg-blue-200", "font-bold", "ring-2", "ring-blue-900", "ring-inset"];

let products = [];
let kategoriList = [];
let transaksiList = [];
let accountsList = [];
let cart = [];
let session = null;

function formatRupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

session = getSession();

const isAdmin = session && session.role === "admin";
const isPathDashboard =
  window.location.pathname.startsWith("/dashboard") ||
  window.location.pathname.startsWith("/admin") ||
  window.location.pathname.includes("dashboard.html") ||
  window.location.pathname.includes("admin.html");

// Dynamic Route Guard
if (isPathDashboard && !isAdmin) {
  window.location.href = "/login";
}

const currentUserEl = document.getElementById("currentUser");
const welcomePrefixEl = document.getElementById("welcomePrefix");
const headerLoginBtn = document.getElementById("headerLoginBtn");
const headerRegisterBtn = document.getElementById("headerRegisterBtn");
const logoutBtnEl = document.getElementById("logoutBtn");
const adminDashboardBtn = document.getElementById("adminDashboardBtn");
const profilNavBtn = document.getElementById("profilNavBtn");

if (session) {
  if (currentUserEl) currentUserEl.textContent = session.username;
  if (welcomePrefixEl) welcomePrefixEl.textContent = "Selamat Datang,";
  if (headerLoginBtn) headerLoginBtn.classList.add("hidden");
  if (headerRegisterBtn) headerRegisterBtn.classList.add("hidden");
  if (logoutBtnEl) logoutBtnEl.classList.remove("hidden");
  if (profilNavBtn) profilNavBtn.classList.remove("hidden");
  if (adminDashboardBtn) {
    if (isAdmin) {
      adminDashboardBtn.classList.remove("hidden");
    } else {
      adminDashboardBtn.classList.add("hidden");
    }
  }
} else {
  if (currentUserEl) currentUserEl.textContent = "Tamu";
  if (welcomePrefixEl) welcomePrefixEl.textContent = "Selamat Datang,";
  if (headerLoginBtn) headerLoginBtn.classList.remove("hidden");
  if (headerRegisterBtn) headerRegisterBtn.classList.remove("hidden");
  if (logoutBtnEl) logoutBtnEl.classList.add("hidden");
  if (profilNavBtn) profilNavBtn.classList.add("hidden");
  if (adminDashboardBtn) adminDashboardBtn.classList.add("hidden");
}

const currentRoleEl = document.getElementById("currentRole");
if (currentRoleEl) currentRoleEl.textContent = session ? session.role : "";

document.querySelectorAll("section[id^='section-']").forEach((s) => {
  s.classList.add("hidden");
});

const defaultNav = document.querySelector(".nav-item");
if (defaultNav) {
  defaultNav.classList.add(...NAV_ACTIVE_CLASSES);
  const targetSec = document.getElementById("section-" + defaultNav.dataset.section);
  if (targetSec) targetSec.classList.remove("hidden");
}

function handleLogout() {
  clearSession();
  window.location.href = "/";
}

if (logoutBtnEl) logoutBtnEl.addEventListener("click", handleLogout);

document.querySelectorAll(".nav-item[data-section]").forEach((item) => {
  item.addEventListener("click", () => {
    const section = item.dataset.section;
    if ((section === "riwayat" || section === "profil") && !session) {
      popupLoginPrompt(`Silakan masuk atau mendaftar akun terlebih dahulu untuk melihat ${section === "profil" ? "profil" : "riwayat transaksi"}.`);
      return;
    }

    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove(...NAV_ACTIVE_CLASSES));
    item.classList.add(...NAV_ACTIVE_CLASSES);

    document.querySelectorAll("section[id^='section-']").forEach((s) => s.classList.add("hidden"));
    const sec = document.getElementById("section-" + section);
    if (sec) sec.classList.remove("hidden");

    if (section === "dashboard" && typeof renderDashboard === "function") renderDashboard();
    if (section === "laporan" && typeof renderLaporan === "function") renderLaporan();
    if (section === "accounts" && typeof renderAccounts === "function") renderAccounts();
    if (section === "belanja" && typeof renderProductGrid === "function") renderProductGrid();
    if (section === "keranjang" && typeof renderCart === "function") renderCart();
    if (section === "riwayat" && typeof renderRiwayat === "function") renderRiwayat();
    if (section === "profil" && typeof renderProfil === "function") renderProfil();
  });
});

async function init() {
  products = await loadStore(STORE.PRODUCTS, PRODUCTS_JSON_PATH);
  kategoriList = await loadStore(STORE.KATEGORI, KATEGORI_JSON_PATH);
  transaksiList = await loadStore(STORE.TRANSAKSI, TRANSAKSI_JSON_PATH);
  accountsList = await loadStore(STORE.ACCOUNTS, ACCOUNTS_JSON_PATH);
  cart = JSON.parse(localStorage.getItem(STORE.CART) || "[]");

  if (session) {
    const userAvatarHeaderEl = document.getElementById("userAvatarHeader");
    if (userAvatarHeaderEl) {
      const currentAcc = accountsList.find((a) => a.username === session.username);
      const avatarUrl = (currentAcc && currentAcc.avatar) || session.avatar || "";
      if (avatarUrl) {
        userAvatarHeaderEl.src = avatarUrl;
      } else {
        const initial = session.username ? session.username.charAt(0).toUpperCase() : "U";
        userAvatarHeaderEl.src = `https://placehold.co/40x40?text=${initial}`;
      }
    }
  }

  if (isPathDashboard) {
    renderDashboard();
    renderProducts();
    renderKategoriSelect();
    renderKategoriTable();
    renderTransaksiAdmin();
    renderLaporan();
    renderAccounts();
  } else {
    renderProductGrid();
    renderCart();
    renderRiwayat();
    renderProfil();
    updateCartBadge();
  }
}
init();

if (isAdmin) {
  const toggleAddBtn = document.getElementById("toggleAddProduct");
  if (toggleAddBtn) {
    toggleAddBtn.addEventListener("click", () => {
      resetProductForm();
      const box = document.getElementById("addProductBox");
      if (box) box.classList.toggle("hidden");
    });
  }

  const cancelAddBtn = document.getElementById("cancelAddProduct");
  if (cancelAddBtn) {
    cancelAddBtn.addEventListener("click", () => {
      const box = document.getElementById("addProductBox");
      if (box) box.classList.add("hidden");
      resetProductForm();
    });
  }

  // --- Switch & Handle Image Input (Link vs Upload) ---
  const pImgSourceLink = document.getElementById("pImgSourceLink");
  const pImgSourceUpload = document.getElementById("pImgSourceUpload");
  const pImgLinkContainer = document.getElementById("pImgLinkContainer");
  const pImgUploadContainer = document.getElementById("pImgUploadContainer");
  const pGambarEl = document.getElementById("pGambar");
  const pGambarFileEl = document.getElementById("pGambarFile");
  const previewEl = document.getElementById("pPreview");

  function switchImageInputMode(mode) {
    if (mode === "upload") {
      if (pImgSourceUpload) pImgSourceUpload.checked = true;
      if (pImgLinkContainer) pImgLinkContainer.classList.add("hidden");
      if (pImgUploadContainer) pImgUploadContainer.classList.remove("hidden");
    } else {
      if (pImgSourceLink) pImgSourceLink.checked = true;
      if (pImgLinkContainer) pImgLinkContainer.classList.remove("hidden");
      if (pImgUploadContainer) pImgUploadContainer.classList.add("hidden");
    }
  }

  if (pImgSourceLink) {
    pImgSourceLink.addEventListener("change", () => switchImageInputMode("link"));
  }
  if (pImgSourceUpload) {
    pImgSourceUpload.addEventListener("change", () => switchImageInputMode("upload"));
  }

  if (pGambarEl) {
    pGambarEl.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url) {
        if (previewEl) {
          previewEl.src = url;
          previewEl.classList.remove("hidden");
        }
      } else {
        if (previewEl) previewEl.classList.add("hidden");
      }
    });
  }

  if (pGambarFileEl) {
    pGambarFileEl.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          popupAlert("Ukuran file gambar terlalu besar (maksimal 5MB).", "warning", "Ukuran Melebihi Batas");
          pGambarFileEl.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          const base64Str = evt.target.result;
          if (pGambarEl) pGambarEl.value = base64Str;
          if (previewEl) {
            previewEl.src = base64Str;
            previewEl.classList.remove("hidden");
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const productFormEl = document.getElementById("productForm");
  if (productFormEl) {
    productFormEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const editId = document.getElementById("pEditId") ? document.getElementById("pEditId").value : "";
      const gambarVal = pGambarEl ? pGambarEl.value.trim() : "";

      if (!gambarVal) {
        popupAlert("Harap masukkan link gambar atau upload file gambar!", "warning", "Gambar Diperlukan");
        return;
      }

      const data = {
        nama: document.getElementById("pNama").value.trim(),
        kategori: document.getElementById("pKategori").value,
        harga: Number(document.getElementById("pHarga").value),
        stok: Number(document.getElementById("pStok").value),
        gambar: gambarVal,
      };

      if (editId) {
        const idx = products.findIndex((p) => p.id === editId);
        if (idx !== -1) products[idx] = { ...products[idx], ...data };
        popupAlert(`Produk "${data.nama}" berhasil diperbarui!`, "success", "Berhasil");
      } else {
        products.push({ id: genId("p"), ...data });
        popupAlert(`Produk "${data.nama}" berhasil ditambahkan!`, "success", "Berhasil");
      }

      saveStore(STORE.PRODUCTS, products);

      const addBox = document.getElementById("addProductBox");
      if (addBox) addBox.classList.add("hidden");
      resetProductForm();
      renderProducts();
      renderDashboard();
    });
  }

  function resetProductForm() {
    const form = document.getElementById("productForm");
    if (form) form.reset();
    const pEditId = document.getElementById("pEditId");
    if (pEditId) pEditId.value = "";
    if (pGambarEl) pGambarEl.value = "";
    if (pGambarFileEl) pGambarFileEl.value = "";
    switchImageInputMode("link");
    if (previewEl) {
      previewEl.src = "";
      previewEl.classList.add("hidden");
    }
    const submitBtn = document.getElementById("productSubmitBtn");
    if (submitBtn) submitBtn.textContent = "Simpan Produk";
  }

  function editProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (document.getElementById("pEditId")) document.getElementById("pEditId").value = p.id;
    if (document.getElementById("pNama")) document.getElementById("pNama").value = p.nama;
    if (document.getElementById("pKategori")) document.getElementById("pKategori").value = p.kategori;
    if (document.getElementById("pHarga")) document.getElementById("pHarga").value = p.harga;
    if (document.getElementById("pStok")) document.getElementById("pStok").value = p.stok;
    if (pGambarEl) pGambarEl.value = p.gambar || "";
    if (pGambarFileEl) pGambarFileEl.value = "";

    if (p.gambar && p.gambar.startsWith("data:image/")) {
      switchImageInputMode("upload");
    } else {
      switchImageInputMode("link");
    }

    if (previewEl) {
      if (p.gambar) {
        previewEl.src = p.gambar;
        previewEl.classList.remove("hidden");
      } else {
        previewEl.classList.add("hidden");
      }
    }

    const submitBtn = document.getElementById("productSubmitBtn");
    if (submitBtn) submitBtn.textContent = "Update Produk";
    const addBox = document.getElementById("addProductBox");
    if (addBox) addBox.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.editProduct = editProduct;
  window.deleteProduct = async function (id) {
    if (!(await popupConfirm("Hapus produk ini?"))) return;
    products = products.filter((p) => p.id !== id);
    saveStore(STORE.PRODUCTS, products);
    renderProducts();
    renderDashboard();
    popupAlert("Produk berhasil dihapus.", "success", "Berhasil");
  };

  // ACCOUNTS MANAGEMENT FOR ADMIN
  const toggleAddAccountBtn = document.getElementById("toggleAddAccount");
  if (toggleAddAccountBtn) {
    toggleAddAccountBtn.addEventListener("click", () => {
      resetAccountForm();
      const box = document.getElementById("addAccountBox");
      if (box) box.classList.toggle("hidden");
    });
  }

  const cancelAccountBtn = document.getElementById("cancelAccountForm");
  if (cancelAccountBtn) {
    cancelAccountBtn.addEventListener("click", () => {
      const box = document.getElementById("addAccountBox");
      if (box) box.classList.add("hidden");
      resetAccountForm();
    });
  }

  const accountFormEl = document.getElementById("accountForm");
  if (accountFormEl) {
    accountFormEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const editOldUsername = document.getElementById("accEditId") ? document.getElementById("accEditId").value : "";
      const username = document.getElementById("accUsername").value.trim();
      const email = document.getElementById("accEmail") ? document.getElementById("accEmail").value.trim() : "";
      const nohp = document.getElementById("accNoHp") ? document.getElementById("accNoHp").value.trim() : "";
      const password = document.getElementById("accPassword").value;
      const role = document.getElementById("accRole").value;

      if (!username || !password) return;

      if (editOldUsername) {
        const idx = accountsList.findIndex((a) => a.username === editOldUsername);
        if (idx !== -1) {
          accountsList[idx] = { ...accountsList[idx], username, email, nohp, password, role };
          popupAlert(`Akun "${username}" berhasil diperbarui!`, "success", "Berhasil");
        }
      } else {
        if (accountsList.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
          popupAlert(`Username "${username}" sudah digunakan.`, "warning", "Peringatan");
          return;
        }
        accountsList.push({ username, email, nohp, password, role });
        popupAlert(`Akun "${username}" berhasil ditambahkan!`, "success", "Berhasil");
      }

      saveStore(STORE.ACCOUNTS, accountsList);

      const addBox = document.getElementById("addAccountBox");
      if (addBox) addBox.classList.add("hidden");
      resetAccountForm();
      renderAccounts();
    });
  }

  function resetAccountForm() {
    const form = document.getElementById("accountForm");
    if (form) form.reset();
    const accEditId = document.getElementById("accEditId");
    if (accEditId) accEditId.value = "";
    if (document.getElementById("accEmail")) document.getElementById("accEmail").value = "";
    if (document.getElementById("accNoHp")) document.getElementById("accNoHp").value = "";
  }

  function editAccount(username) {
    const acc = accountsList.find((a) => a.username === username);
    if (!acc) return;
    if (document.getElementById("accEditId")) document.getElementById("accEditId").value = acc.username;
    if (document.getElementById("accUsername")) document.getElementById("accUsername").value = acc.username;
    if (document.getElementById("accEmail")) document.getElementById("accEmail").value = acc.email || "";
    if (document.getElementById("accNoHp")) document.getElementById("accNoHp").value = acc.nohp || "";
    if (document.getElementById("accPassword")) document.getElementById("accPassword").value = acc.password;
    if (document.getElementById("accRole")) document.getElementById("accRole").value = acc.role || "customer";

    const addBox = document.getElementById("addAccountBox");
    if (addBox) addBox.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.editAccount = editAccount;
  window.deleteAccount = async function (username) {
    if (session && username === session.username) {
      popupAlert("Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan.", "warning", "Peringatan");
      return;
    }
    if (!(await popupConfirm(`Hapus akun "${username}"?`))) return;
    accountsList = accountsList.filter((a) => a.username !== username);
    saveStore(STORE.ACCOUNTS, accountsList);
    renderAccounts();
    popupAlert(`Akun "${username}" berhasil dihapus.`, "success", "Berhasil");
  };
}

function renderProducts() {
  const container = document.getElementById("productCards");
  if (!container) return;
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = '<div class="text-[13px] text-gray-400 py-3">Belum ada produk.</div>';
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-lg p-3.5 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow";
    card.innerHTML = `
      <img src="${p.gambar}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded border border-gray-200 shrink-0" onerror="this.src='https://placehold.co/80x80?text=No+Img'" />
      <div class="flex-1 min-w-0">
        <div class="text-sm md:text-base font-semibold text-gray-800 truncate">${p.nama}</div>
        <div class="text-xs text-gray-500 mt-0.5">${p.kategori} &bull; Stok: <b class="text-gray-700">${p.stok}</b></div>
        <div class="text-sm text-blue-900 font-bold mt-1">${formatRupiah(p.harga)}</div>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 shrink-0">
        <button onclick="editProduct('${p.id}')" class="px-3.5 py-1.5 bg-gray-500 text-white rounded text-xs cursor-pointer hover:bg-gray-600">Edit</button>
        <button onclick="deleteProduct('${p.id}')" class="px-3.5 py-1.5 bg-red-700 text-white rounded text-xs cursor-pointer hover:bg-red-800">Hapus</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderAccounts() {
  const container = document.getElementById("accountsCards");
  if (!container) return;
  container.innerHTML = "";

  if (accountsList.length === 0) {
    container.innerHTML = '<div class="text-[13px] text-gray-400 py-3">Belum ada akun.</div>';
    return;
  }

  accountsList.forEach((acc) => {
    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-lg p-3.5 flex justify-between items-center text-xs shadow-sm hover:shadow-md transition-shadow";
    const roleBadge = acc.role === "admin" 
      ? `<span class="bg-blue-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ml-2">Admin</span>`
      : `<span class="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ml-2">Customer</span>`;

    const emailText = acc.email ? `<div class="text-gray-500 text-xs mt-0.5">Email: <span class="text-gray-700 font-medium">${acc.email}</span></div>` : "";
    const nohpText = acc.nohp ? `<div class="text-gray-500 text-xs mt-0.5">No. HP: <span class="text-gray-700 font-medium">${acc.nohp}</span></div>` : "";
    const avatarSrc = acc.avatar || `https://placehold.co/40x40?text=${acc.username.charAt(0).toUpperCase()}`;

    card.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${avatarSrc}" class="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" onerror="this.src='https://placehold.co/40x40?text=U'" />
        <div>
          <div class="font-semibold text-gray-800 text-sm flex items-center">
            ${acc.username} ${roleBadge}
          </div>
          ${emailText}
          ${nohpText}
          <div class="text-gray-500 text-xs mt-0.5">Password: <span class="font-mono text-gray-700">${acc.password}</span></div>
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="editAccount('${acc.username}')" class="px-3.5 py-1.5 bg-gray-500 text-white rounded text-xs cursor-pointer hover:bg-gray-600">Edit</button>
        <button onclick="deleteAccount('${acc.username}')" class="px-3.5 py-1.5 bg-red-700 text-white rounded text-xs cursor-pointer hover:bg-red-800">Hapus</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderDashboard() {
  const cardProduk = document.getElementById("cardProduk");
  if (cardProduk) cardProduk.textContent = products.length;

  const cardKategori = document.getElementById("cardKategori");
  if (cardKategori) cardKategori.textContent = kategoriList.length;

  const cardTransaksi = document.getElementById("cardTransaksi");
  if (cardTransaksi) cardTransaksi.textContent = transaksiList.length;

  const Omset = transaksiList.reduce((sum, t) => sum + t.total, 0);
  const cardOmset = document.getElementById("cardOmset");
  if (cardOmset) cardOmset.textContent = formatRupiah(Omset);
}

if (isAdmin) {
  const kategoriFormEl = document.getElementById("kategoriForm");
  if (kategoriFormEl) {
    kategoriFormEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const kNama = document.getElementById("kNama");
      const nama = kNama ? kNama.value.trim() : "";
      if (!nama) return;
      kategoriList.push({ id: genId("k"), nama });
      saveStore(STORE.KATEGORI, kategoriList);
      e.target.reset();
      renderKategoriTable();
      renderKategoriSelect();
      renderDashboard();
      popupAlert(`Kategori "${nama}" berhasil ditambahkan!`, "success", "Berhasil");
    });
  }

  window.editKategori = function (id) {
    const k = kategoriList.find((x) => x.id === id);
    if (!k) return;
    const baru = prompt("Ubah nama kategori:", k.nama);
    if (baru === null) return;
    const namaBaru = baru.trim();
    if (!namaBaru) return;

    const lama = k.nama;
    k.nama = namaBaru;
    saveStore(STORE.KATEGORI, kategoriList);

    products.forEach((p) => {
      if (p.kategori === lama) p.kategori = namaBaru;
    });
    saveStore(STORE.PRODUCTS, products);

    renderKategoriTable();
    renderKategoriSelect();
    renderProducts();
    popupAlert(`Kategori berhasil diperbarui menjadi "${namaBaru}".`, "success", "Berhasil");
  };

  window.deleteKategori = async function (id) {
    if (!(await popupConfirm("Hapus kategori ini?"))) return;
    kategoriList = kategoriList.filter((x) => x.id !== id);
    saveStore(STORE.KATEGORI, kategoriList);
    renderKategoriTable();
    renderKategoriSelect();
    renderDashboard();
    popupAlert("Kategori berhasil dihapus.", "success", "Berhasil");
  };
}

function renderKategoriTable() {
  const container = document.getElementById("kategoriCards");
  if (!container) return;
  container.innerHTML = "";

  if (kategoriList.length === 0) {
    container.innerHTML = '<div class="text-[13px] text-gray-400 py-3">Belum ada kategori.</div>';
    return;
  }
  kategoriList.forEach((k) => {
    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-lg p-3.5 flex justify-between items-center text-xs shadow-sm hover:shadow-md transition-shadow";
    card.innerHTML = `
      <span class="font-semibold text-gray-800 text-sm md:text-base">${k.nama}</span>
      <div class="flex gap-2">
        <button onclick="editKategori('${k.id}')" class="px-3.5 py-1.5 bg-gray-500 text-white rounded text-xs cursor-pointer hover:bg-gray-600">Edit</button>
        <button onclick="deleteKategori('${k.id}')" class="px-3.5 py-1.5 bg-red-700 text-white rounded text-xs cursor-pointer hover:bg-red-800">Hapus</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderKategoriSelect() {
  const select = document.getElementById("pKategori");
  if (!select) return;
  const current = select.value;
  select.innerHTML = "";
  kategoriList.forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k.nama;
    opt.textContent = k.nama;
    select.appendChild(opt);
  });
  if (current) select.value = current;
}

function renderTransaksiAdmin() {
  const container = document.getElementById("transaksiCards");
  if (!container) return;
  container.innerHTML = "";

  if (transaksiList.length === 0) {
    container.innerHTML = '<div class="text-[13px] text-gray-400 py-3">Belum ada transaksi.</div>';
    return;
  }
  transaksiList
    .slice()
    .reverse()
    .forEach((t) => {
      const card = document.createElement("div");
      card.className = "bg-white border border-gray-200 rounded-lg p-3.5 text-xs shadow-sm space-y-2 hover:shadow-md transition-shadow";
      card.innerHTML = `
        <div class="flex justify-between items-center text-gray-500 border-b pb-1.5">
          <span class="text-xs">${t.tanggal}</span>
          <span class="font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded text-xs">${t.username || "-"}</span>
        </div>
        <div class="font-semibold text-sm md:text-base text-gray-800">${t.produkNama}</div>
        <div class="flex justify-between items-center pt-1">
          <div class="text-xs md:text-sm text-gray-600">${t.jumlah} item &bull; <b class="text-blue-900 font-bold">${formatRupiah(t.total)}</b></div>
          <button onclick="deleteTransaksi('${t.id}')" class="px-3.5 py-1.5 bg-red-700 text-white rounded text-xs cursor-pointer hover:bg-red-800">Hapus</button>
        </div>
      `;
      container.appendChild(card);
    });
}

window.deleteTransaksi = async function (id) {
  if (!(await popupConfirm("Hapus transaksi ini?"))) return;
  transaksiList = transaksiList.filter((x) => x.id !== id);
  saveStore(STORE.TRANSAKSI, transaksiList);
  renderTransaksiAdmin();
  renderDashboard();
  renderLaporan();
  popupAlert("Transaksi berhasil dihapus.", "success", "Berhasil");
};

function renderLaporan() {
  const totalTrxEl = document.getElementById("lapTotalTransaksi");
  if (!totalTrxEl) return;

  const totalTrx = transaksiList.length;
  const totalOmset = transaksiList.reduce((sum, t) => sum + t.total, 0);
  totalTrxEl.textContent = totalTrx;
  const OmsetEl = document.getElementById("lapTotalOmset");
  if (OmsetEl) OmsetEl.textContent = formatRupiah(totalOmset);

  const perProduk = {};
  transaksiList.forEach((t) => {
    if (!perProduk[t.produkNama]) perProduk[t.produkNama] = { qty: 0, total: 0 };
    perProduk[t.produkNama].qty += t.jumlah;
    perProduk[t.produkNama].total += t.total;
  });

  const container = document.getElementById("laporanCards");
  if (!container) return;
  container.innerHTML = "";

  const entries = Object.entries(perProduk);
  if (entries.length === 0) {
    container.innerHTML = '<div class="text-[13px] text-gray-400 py-3">Belum ada data transaksi.</div>';
    return;
  }
  entries.forEach(([nama, d]) => {
    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-lg p-3.5 flex justify-between items-center text-xs shadow-sm hover:shadow-md transition-shadow";
    card.innerHTML = `
      <div>
        <div class="font-semibold text-gray-800 text-sm md:text-base">${nama}</div>
        <div class="text-gray-500 mt-0.5">Terjual: <b class="text-gray-700">${d.qty} item</b></div>
      </div>
      <div class="font-bold text-blue-900 text-sm md:text-base">${formatRupiah(d.total)}</div>
    `;
    container.appendChild(card);
  });
}

function renderProductGrid() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = '<div class="text-[13px] text-gray-400 py-2.5">Belum ada produk yang dijual.</div>';
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "bg-white border border-blue-100 rounded-md p-3 text-center";
    const habis = p.stok <= 0;
    card.innerHTML = `
      <img class="w-full h-[120px] object-cover rounded bg-gray-100 mb-2" src="${p.gambar}" onerror="this.src='https://placehold.co/180x120?text=No+Img'" />
      <div class="text-sm font-bold mb-0.5">${p.nama}</div>
      <div class="text-[11px] text-gray-400 mb-1">${p.kategori}</div>
      <div class="text-blue-900 font-bold mb-1">${formatRupiah(p.harga)}</div>
      <div class="text-[11px] text-gray-600 mb-2">Stok: ${p.stok}</div>
      <button class="w-full text-white border-none py-2 px-3.5 rounded text-[13px] cursor-pointer ${
        habis ? "bg-gray-300 cursor-not-allowed" : "bg-blue-900 hover:bg-blue-950"
      }" ${habis ? "disabled" : ""} onclick="addToCart('${p.id}')">
        ${habis ? "Stok Habis" : "Tambah ke Keranjang"}
      </button>
    `;
    grid.appendChild(card);
  });
}

function saveCart() {
  localStorage.setItem(STORE.CART, JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const totalItem = cart.reduce((sum, c) => sum + c.jumlah, 0);
  if (totalItem > 0) {
    badge.textContent = totalItem;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

window.addToCart = function (produkId) {
  const produk = products.find((p) => p.id === produkId);
  if (!produk || produk.stok <= 0) return;

  const item = cart.find((c) => c.produkId === produkId);
  if (item) {
    if (item.jumlah < produk.stok) item.jumlah += 1;
  } else {
    cart.push({ produkId, jumlah: 1 });
  }
  saveCart();
  popupAlert(`"${produk.nama}" ditambahkan ke keranjang.`, "success", "Keranjang");
};

window.changeCartQty = function (produkId, delta) {
  const item = cart.find((c) => c.produkId === produkId);
  const produk = products.find((p) => p.id === produkId);
  if (!item || !produk) return;

  item.jumlah += delta;
  if (item.jumlah <= 0) {
    cart = cart.filter((c) => c.produkId !== produkId);
  } else if (item.jumlah > produk.stok) {
    item.jumlah = produk.stok;
  }
  saveCart();
  renderCart();
};

window.removeFromCart = function (produkId) {
  cart = cart.filter((c) => c.produkId !== produkId);
  saveCart();
  renderCart();
};

function renderCart() {
  const container = document.getElementById("cartCards");
  if (!container) return;
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = '<div class="text-[13px] text-gray-400 py-6 text-center">Keranjang masih kosong.</div>';
    const cartTotalEl = document.getElementById("cartTotal");
    if (cartTotalEl) cartTotalEl.textContent = formatRupiah(0);
    return;
  }

  let total = 0;
  cart.forEach((c) => {
    const p = products.find((x) => x.id === c.produkId);
    if (!p) return;
    const subtotal = p.harga * c.jumlah;
    total += subtotal;

    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-lg p-3.5 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow";
    card.innerHTML = `
      <img src="${p.gambar}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded border border-gray-200 shrink-0" onerror="this.src='https://placehold.co/80x80?text=No+Img'" />
      <div class="flex-1 min-w-0">
        <div class="text-sm md:text-base font-semibold text-gray-800 truncate">${p.nama}</div>
        <div class="text-xs md:text-sm text-blue-900 font-bold mt-0.5">${formatRupiah(p.harga)} &bull; Subtotal: <span class="text-blue-950 font-bold">${formatRupiah(subtotal)}</span></div>
        <div class="flex items-center justify-between mt-3">
          <button onclick="removeFromCart('${p.id}')" class="text-xs md:text-sm text-red-600 font-medium hover:underline flex items-center gap-1 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Hapus
          </button>
          <div class="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
            <button onclick="changeCartQty('${p.id}', -1)" class="w-8 h-8 flex items-center justify-center text-base font-bold text-gray-600 hover:bg-gray-200 cursor-pointer">-</button>
            <span class="w-10 text-center text-xs md:text-sm font-semibold">${c.jumlah}</span>
            <button onclick="changeCartQty('${p.id}', 1)" class="w-8 h-8 flex items-center justify-center text-base font-bold text-gray-600 hover:bg-gray-200 cursor-pointer">+</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  const cartTotalEl = document.getElementById("cartTotal");
  if (cartTotalEl) cartTotalEl.textContent = formatRupiah(total);
}

const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
    if (!session) {
      popupLoginPrompt("Silakan masuk atau mendaftar akun terlebih dahulu untuk melakukan transaksi checkout.");
      return;
    }

    if (cart.length === 0) {
      popupAlert("Keranjang masih kosong.", "warning", "Keranjang Kosong");
      return;
    }

    let total = 0;
    cart.forEach((c) => {
      const p = products.find((x) => x.id === c.produkId);
      if (p) total += p.harga * c.jumlah;
    });

    const qrisHtml = `
      <div class="text-center space-y-2">
        <p class="text-xs text-gray-500">Silakan scan kode QRIS di bawah ini:</p>
        <div class="flex justify-center my-2">
          <img src="/QRIS.png" alt="QRIS" class="w-48 h-48 object-contain rounded-lg border border-gray-200 shadow-sm p-1.5 bg-white" onerror="this.onerror=null; this.src='/qris.png';" />
        </div>
        <div class="text-xs text-gray-500">Total Pembayaran:</div>
        <div class="text-lg font-bold text-blue-900">${formatRupiah(total)}</div>
      </div>
    `;

    const confirmed = await showPopup({
      type: "qris",
      title: "Pembayaran QRIS",
      html: qrisHtml,
      confirmText: "Sudah Bayar",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    cart.forEach((c) => {
      const p = products.find((x) => x.id === c.produkId);
      if (!p) return;
      const jumlah = Math.min(c.jumlah, p.stok);
      if (jumlah <= 0) return;

      transaksiList.push({
        id: genId("t"),
        tanggal: new Date().toLocaleString("id-ID"),
        username: session.username,
        produkId: p.id,
        produkNama: p.nama,
        jumlah,
        total: p.harga * jumlah,
      });

      p.stok -= jumlah;
    });

    saveStore(STORE.TRANSAKSI, transaksiList);
    saveStore(STORE.PRODUCTS, products);

    cart = [];
    saveCart();

    popupAlert("Checkout & Pembayaran Berhasil! Terima kasih sudah belanja.", "success", "Checkout Berhasil");
    renderCart();
    renderProductGrid();
    renderRiwayat();
  });
}

function renderRiwayat() {
  const container = document.getElementById("riwayatCards");
  if (!container) return;
  container.innerHTML = "";

  const milikSaya = transaksiList.filter((t) => t.username === session.username);

  if (milikSaya.length === 0) {
    container.innerHTML = '<div class="text-[13px] text-gray-400 py-3">Belum ada riwayat transaksi.</div>';
    return;
  }

  milikSaya
    .slice()
    .reverse()
    .forEach((t) => {
      const card = document.createElement("div");
      card.className = "bg-white border border-gray-200 rounded-lg p-3.5 text-xs shadow-sm space-y-2 hover:shadow-md transition-shadow";
      card.innerHTML = `
        <div class="text-gray-400 text-xs">${t.tanggal}</div>
        <div class="font-semibold text-gray-800 text-sm md:text-base">${t.produkNama}</div>
        <div class="flex justify-between items-center pt-2 border-t border-gray-100">
          <span class="text-gray-600 text-xs md:text-sm">${t.jumlah} item</span>
          <span class="font-bold text-blue-900 text-sm md:text-base">${formatRupiah(t.total)}</span>
        </div>
      `;
      container.appendChild(card);
    });
}

function renderProfil() {
  if (!session) return;
  const usernameInput = document.getElementById("profileUsername");
  const emailInput = document.getElementById("profileEmail");
  const nohpInput = document.getElementById("profileNoHp");
  const avatarPreview = document.getElementById("profileAvatarPreview");
  const avatarHidden = document.getElementById("profileAvatarHidden");
  const avatarUrlInput = document.getElementById("profileAvatarUrl");

  if (!usernameInput || !emailInput || !nohpInput) return;

  const currentAcc = accountsList.find((a) => a.username === session.username);
  const avatar = (currentAcc && currentAcc.avatar) || session.avatar || "";

  usernameInput.value = session.username || "";
  emailInput.value = (currentAcc && currentAcc.email) || session.email || "";
  nohpInput.value = (currentAcc && currentAcc.nohp) || session.nohp || "";
  if (avatarHidden) avatarHidden.value = avatar;
  if (avatarUrlInput) avatarUrlInput.value = avatar.startsWith("http") ? avatar : "";

  if (avatarPreview) {
    if (avatar) {
      avatarPreview.src = avatar;
    } else {
      const initial = session.username ? session.username.charAt(0).toUpperCase() : "U";
      avatarPreview.src = `https://placehold.co/100x100?text=${initial}`;
    }
  }
}

// Avatar Source Toggle & Event Listeners
const avatarSourceUpload = document.getElementById("avatarSourceUpload");
const avatarSourceLink = document.getElementById("avatarSourceLink");
const avatarUploadContainer = document.getElementById("avatarUploadContainer");
const avatarLinkContainer = document.getElementById("avatarLinkContainer");
const profileAvatarFile = document.getElementById("profileAvatarFile");
const profileAvatarUrl = document.getElementById("profileAvatarUrl");
const profileAvatarHidden = document.getElementById("profileAvatarHidden");
const profileAvatarPreview = document.getElementById("profileAvatarPreview");

if (avatarSourceUpload && avatarSourceLink) {
  avatarSourceUpload.addEventListener("change", () => {
    if (avatarUploadContainer) avatarUploadContainer.classList.remove("hidden");
    if (avatarLinkContainer) avatarLinkContainer.classList.add("hidden");
  });
  avatarSourceLink.addEventListener("change", () => {
    if (avatarUploadContainer) avatarUploadContainer.classList.add("hidden");
    if (avatarLinkContainer) avatarLinkContainer.classList.remove("hidden");
  });
}

if (profileAvatarFile) {
  profileAvatarFile.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        popupAlert("Ukuran foto terlalu besar (maksimal 5MB).", "warning", "Ukuran Melebihi Batas");
        profileAvatarFile.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64Str = evt.target.result;
        if (profileAvatarHidden) profileAvatarHidden.value = base64Str;
        if (profileAvatarPreview) profileAvatarPreview.src = base64Str;
      };
      reader.readAsDataURL(file);
    }
  });
}

if (profileAvatarUrl) {
  profileAvatarUrl.addEventListener("input", (e) => {
    const url = e.target.value.trim();
    if (url) {
      if (profileAvatarHidden) profileAvatarHidden.value = url;
      if (profileAvatarPreview) profileAvatarPreview.src = url;
    }
  });
}

// Profile Form Submit (Update Email, No HP & Avatar)
const profileFormEl = document.getElementById("profileForm");
if (profileFormEl) {
  profileFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!session) return;

    const email = document.getElementById("profileEmail").value.trim();
    const nohp = document.getElementById("profileNoHp").value.trim();
    const avatar = profileAvatarHidden ? profileAvatarHidden.value.trim() : "";

    if (!email || !nohp) {
      popupAlert("Email dan Nomor HP wajib diisi.", "warning", "Peringatan");
      return;
    }

    if (accountsList.some((a) => a.username !== session.username && a.email && a.email.toLowerCase() === email.toLowerCase())) {
      popupAlert("Email sudah digunakan oleh akun lain.", "warning", "Gagal Diperbarui");
      return;
    }

    if (accountsList.some((a) => a.username !== session.username && a.nohp && a.nohp === nohp)) {
      popupAlert("Nomor HP sudah digunakan oleh akun lain.", "warning", "Gagal Diperbarui");
      return;
    }

    const idx = accountsList.findIndex((a) => a.username === session.username);
    if (idx !== -1) {
      accountsList[idx].email = email;
      accountsList[idx].nohp = nohp;
      accountsList[idx].avatar = avatar;
      saveStore(STORE.ACCOUNTS, accountsList);

      session.email = email;
      session.nohp = nohp;
      session.avatar = avatar;
      setSession(session);

      const userAvatarHeaderEl = document.getElementById("userAvatarHeader");
      if (userAvatarHeaderEl) {
        userAvatarHeaderEl.src = avatar || `https://placehold.co/40x40?text=${session.username.charAt(0).toUpperCase()}`;
      }

      popupAlert("Profil Anda berhasil diperbarui!", "success", "Berhasil");
    }
  });
}

// Change Password Form Submit
const changePasswordFormEl = document.getElementById("changePasswordForm");
if (changePasswordFormEl) {
  changePasswordFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!session) return;

    const oldPass = document.getElementById("oldPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirmNewPass = document.getElementById("confirmNewPassword").value;

    const idx = accountsList.findIndex((a) => a.username === session.username);
    if (idx === -1) return;

    if (accountsList[idx].password !== oldPass) {
      popupAlert("Password saat ini tidak sesuai.", "warning", "Gagal Ubah Password");
      return;
    }

    if (newPass !== confirmNewPass) {
      popupAlert("Konfirmasi password baru tidak cocok.", "warning", "Gagal Ubah Password");
      return;
    }

    accountsList[idx].password = newPass;
    saveStore(STORE.ACCOUNTS, accountsList);

    document.getElementById("changePasswordForm").reset();
    popupAlert("Password Anda berhasil diperbarui!", "success", "Berhasil Ubah Password");
  });
}
