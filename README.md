# 🛒 Kator Shop - Aplikasi Kasir & Manajemen Toko

Aplikasi Kasir dan Manajemen Toko berbasis Web sederhana, responsif, dan ringan. Dilengkapi dengan backend **Node.js & Express** yang secara otomatis menyimpan data transaksi, produk, kategori, dan akun pengguna langsung ke file JSON lokal.

---

## ✨ Fitur Utama

- 📦 **Manajemen Produk & Kategori**: Tambah, ubah, dan hapus data produk serta kategori toko dengan mudah.
- 💳 **Transaksi Kasir & Pembayaran**: Pencatatan transaksi penjualan secara real-time lengkap dengan opsi pembayaran QRIS.
- 📜 **Riwayat Transaksi**: Catatan riwayat penjualan yang tersimpan rapi.
- 🔐 **Sistem Akun (Auth)**: Halaman Login & Register untuk mengelola akses pengguna/admin.
- 💾 **Penyimpanan JSON Otomatis**: Tanpa perlu database rumit, seluruh data langsung disimpan secara permanen di folder `data/*.json`.
- 📱 **Desain Responsive**: Tampilan antarmuka yang nyaman diakses dari perangkat Desktop maupun Smartphone.

---

## 🛠️ Teknologi yang Digunakan

- **Backend**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **Frontend**: HTML5, JavaScript (ES6+), [Tailwind CSS](https://tailwindcss.com/)
- **Penyimpanan Data**: JSON File Storage

---

## 📁 Struktur Folder Project

```text
toko/
├── auth/
│   ├── login/           # Halaman Login
│   └── register/        # Halaman Register
├── data/                # File penyimpanan data JSON
│   ├── accounts.json    # Data pengguna/admin
│   ├── kategori.json    # Data kategori produk
│   ├── products.json    # Data produk toko
│   └── transaksi.json   # Data riwayat transaksi
├── js/                  # Logic JavaScript Frontend
├── index.html           # Dashboard utama & POS Kasir
├── server.js            # Server Express.js & REST API
├── QRIS.png             # Gambar QRIS Pembayaran
├── logo.png             # Logo Aplikasi
└── package.json         # Konfigurasi proyek & dependency
```

---

## 🚀 Cara Menjalankan Project

### 1. Prasyarat
Pastikan Anda telah menginstal **[Node.js](https://nodejs.org/)** di komputer Anda.

### 2. Clone Repository
```bash
git clone https://github.com/USERNAME-ANDA/toko.git
cd toko
```

### 3. Install Dependency
Jalankan perintah ini untuk mengunduh dependency yang dibutuhkan (`express`):
```bash
npm install
```

### 4. Jalankan Aplikasi
Jalankan server Node.js:
```bash
npm start
```

### 5. Akses di Browser
Buka browser Anda dan akses tautan berikut:
```text
http://localhost:2567
```

---

## 📝 Lisensi

Project ini dibuat untuk kebutuhan pembelajaran dan pengembangan aplikasi web sederhana. Silakan digunakan dan dikembangkan lebih lanjut!
