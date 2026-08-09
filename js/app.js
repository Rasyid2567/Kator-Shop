const PRODUCTS_JSON_PATH = "data/products.json";
const KATEGORI_JSON_PATH = "data/kategori.json";
const TRANSAKSI_JSON_PATH = "data/transaksi.json";

const NAV_ACTIVE_CLASSES = ["bg-blue-200", "font-bold", "ring-2", "ring-blue-900", "ring-inset"];

let products = [];
let kategoriList = [];
let transaksiList = [];
let cart = [];
let session = null;

function formatRupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

session = getSession();
if (!session) {
  window.location.href = "/login";
}

const isAdmin = session && session.role === "admin";

document.getElementById("currentUser").textContent = session ? session.username : "";
document.getElementById("currentRole").textContent = session ? session.role : "";

document.querySelectorAll(".nav-item.admin-only").forEach((el) => {
  el.classList.toggle("hidden", !isAdmin);
});
document.querySelectorAll(".nav-item.customer-only").forEach((el) => {
  el.classList.toggle("hidden", isAdmin);
});

document.querySelectorAll("section.admin-only, section.customer-only").forEach((s) => {
  s.classList.add("hidden");
});
const defaultNav = document.querySelector(
  ".nav-item" + (isAdmin ? ".admin-only" : ".customer-only")
);
if (defaultNav) {
  defaultNav.classList.add(...NAV_ACTIVE_CLASSES);
  const targetSec = document.getElementById("section-" + defaultNav.dataset.section);
  if (targetSec) targetSec.classList.remove("hidden");
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "/login";
});

document.querySelectorAll(".nav-item[data-section]").forEach((item) => {
  item.addEventListener("click", () => {
    const scope = isAdmin ? ".admin-only" : ".customer-only";

    document.querySelectorAll(".nav-item" + scope).forEach((i) => i.classList.remove(...NAV_ACTIVE_CLASSES));
    item.classList.add(...NAV_ACTIVE_CLASSES);

    document.querySelectorAll("section" + scope).forEach((s) => s.classList.add("hidden"));
    document.getElementById("section-" + item.dataset.section).classList.remove("hidden");

    if (item.dataset.section === "dashboard") renderDashboard();
    if (item.dataset.section === "laporan") renderLaporan();
    if (item.dataset.section === "belanja") renderProductGrid();
    if (item.dataset.section === "keranjang") renderCart();
    if (item.dataset.section === "riwayat") renderRiwayat();
  });
});

async function init() {
  products = await loadStore(STORE.PRODUCTS, PRODUCTS_JSON_PATH);
  kategoriList = await loadStore(STORE.KATEGORI, KATEGORI_JSON_PATH);
  transaksiList = await loadStore(STORE.TRANSAKSI, TRANSAKSI_JSON_PATH);
  cart = JSON.parse(localStorage.getItem(STORE.CART) || "[]");

  if (isAdmin) {
    renderDashboard();
    renderProducts();
    renderKategoriSelect();
    renderKategoriTable();
    renderTransaksiAdmin();
    renderLaporan();
  } else {
    renderProductGrid();
    renderCart();
    renderRiwayat();
    updateCartBadge();
  }
}
init();

if (isAdmin) {
  document.getElementById("toggleAddProduct").addEventListener("click", () => {
    resetProductForm();
    document.getElementById("addProductBox").classList.toggle("hidden");
  });

  document.getElementById("cancelAddProduct").addEventListener("click", () => {
    document.getElementById("addProductBox").classList.add("hidden");
    resetProductForm();
  });

  document.getElementById("pGambar").addEventListener("input", (e) => {
    const preview = document.getElementById("pPreview");
    const url = e.target.value.trim();
    if (url) {
      preview.src = url;
      preview.classList.remove("hidden");
    } else {
      preview.classList.add("hidden");
    }
  });

  document.getElementById("productForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const editId = document.getElementById("pEditId").value;

    const data = {
      nama: document.getElementById("pNama").value.trim(),
      kategori: document.getElementById("pKategori").value,
      harga: Number(document.getElementById("pHarga").value),
      stok: Number(document.getElementById("pStok").value),
      gambar: document.getElementById("pGambar").value.trim(),
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

    document.getElementById("addProductBox").classList.add("hidden");
    resetProductForm();
    renderProducts();
    renderDashboard();
  });

  function resetProductForm() {
    document.getElementById("productForm").reset();
    document.getElementById("pEditId").value = "";
    document.getElementById("pPreview").classList.add("hidden");
    document.getElementById("productSubmitBtn").textContent = "Simpan Produk";
  }

  function editProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    document.getElementById("pEditId").value = p.id;
    document.getElementById("pNama").value = p.nama;
    document.getElementById("pKategori").value = p.kategori;
    document.getElementById("pHarga").value = p.harga;
    document.getElementById("pStok").value = p.stok;
    document.getElementById("pGambar").value = p.gambar;
    const preview = document.getElementById("pPreview");
    preview.src = p.gambar;
    preview.classList.remove("hidden");
    document.getElementById("productSubmitBtn").textContent = "Update Produk";
    document.getElementById("addProductBox").classList.remove("hidden");
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

function renderDashboard() {
  document.getElementById("cardProduk").textContent = products.length;
  document.getElementById("cardKategori").textContent = kategoriList.length;
  document.getElementById("cardTransaksi").textContent = transaksiList.length;
  const Omset = transaksiList.reduce((sum, t) => sum + t.total, 0);
  document.getElementById("cardOmset").textContent = formatRupiah(Omset);
}

if (isAdmin) {
  document.getElementById("kategoriForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("kNama").value.trim();
    if (!nama) return;
    kategoriList.push({ id: genId("k"), nama });
    saveStore(STORE.KATEGORI, kategoriList);
    e.target.reset();
    renderKategoriTable();
    renderKategoriSelect();
    renderDashboard();
    popupAlert(`Kategori "${nama}" berhasil ditambahkan!`, "success", "Berhasil");
  });

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

    // ikut update kategori di semua produk yang memakai nama lama
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
  document.getElementById("lapTotalOmset").textContent = formatRupiah(totalOmset);

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
    document.getElementById("cartTotal").textContent = formatRupiah(0);
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

  document.getElementById("cartTotal").textContent = formatRupiah(total);
}

const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
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
          <img src="QRIS.png" alt="QRIS" class="w-48 h-48 object-contain rounded-lg border border-gray-200 shadow-sm p-1.5 bg-white" onerror="this.onerror=null; this.src='qris.png';" />
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
