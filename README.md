# 🛒 Kastor Shop - Aplikasi Kasir & Manajemen Toko (PostgreSQL)

Aplikasi Kasir dan Manajemen Toko berbasis Web sederhana, responsif, dan ringan. Dilengkapi dengan backend **Node.js, Express.js**, dan database relasional **PostgreSQL** untuk menyimpan data transaksi, produk, kategori, dan akun pengguna secara aman dan terstruktur.

---

## ✨ Fitur Utama

- 📦 **Manajemen Produk & Kategori**: Tambah, ubah, dan hapus data produk serta kategori toko dengan mudah.
- 💳 **Transaksi Kasir & Pembayaran**: Pencatatan transaksi penjualan secara real-time lengkap dengan opsi pembayaran QRIS.
- 📜 **Riwayat Transaksi**: Catatan riwayat penjualan yang tersimpan langsung di database PostgreSQL.
- 🔐 **Sistem Akun (Auth)**: Halaman Login & Register untuk mengelola akses pengguna/admin.
- 🐘 **Database PostgreSQL**: Menggunakan basis data relasional PostgreSQL dengan transaksi ACID, migrasi skema otomatis, dan integrasi `.env`.
- 📱 **Desain Responsive**: Tampilan antarmuka yang nyaman diakses dari perangkat Desktop maupun Smartphone.

---

## 🛠️ Teknologi yang Digunakan

- **Backend**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Driver: `pg`)
- **Frontend**: HTML5, JavaScript (ES6+), [Tailwind CSS](https://tailwindcss.com/)

---

## 📁 Struktur Folder Project

```text
Kator-shop/
├── auth/
│   ├── login/           # Halaman Login
│   └── register/        # Halaman Register
├── data/                # Data cadangan / initial seed
│   ├── accounts.json    # Data awal akun pengguna
│   ├── kategori.json    # Data awal kategori produk
│   ├── products.json    # Data awal produk
│   └── transaksi.json   # Data awal transaksi
├── js/                  # Logic JavaScript Frontend
│   ├── app.js
│   ├── auth.js
│   ├── popup.js
│   └── storage.js
├── .env                 # Konfigurasi database & port
├── .env.example         # Contoh konfigurasi environment
├── db.js                # Koneksi PostgreSQL & inisialisasi tabel
├── index.html           # Dashboard utama & POS Kasir
├── dashboard.html       # Halaman Admin Dashboard
├── server.js            # Server Express.js & REST API
├── QRIS.png             # Gambar QRIS Pembayaran
├── logo.png             # Logo Aplikasi
└── package.json         # Konfigurasi proyek & dependency
```

---

## 🚀 Cara Menjalankan Project

### 1. Prasyarat
- **[Node.js](https://nodejs.org/)** (v18+)
- **[PostgreSQL](https://www.postgresql.org/)** sudah terinstal dan berjalan di komputer Anda.

### 2. Buat Database PostgreSQL
Pastikan database `kastorshop` telah dibuat di PostgreSQL:
```bash
psql -U postgres -c "CREATE DATABASE kastorshop;"
```

### 3. Konfigurasi `.env`
Salin file `.env.example` menjadi `.env` dan sesuaikan kredensial PostgreSQL Anda:
```env
PORT=2567
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=kastorshop
```

### 4. Install Dependency
```bash
npm install
```

### 5. Jalankan Aplikasi
Jalankan server Node.js:
```bash
npm start
```
Saat pertama kali dijalankan, server akan secara otomatis membuat tabel yang diperlukan dan mengisi data awal dari file JSON.

### 6. Akses di Browser
Buka browser Anda dan akses:
```text
http://localhost:2567
```

---

## 🔑 Akun Default (Demo)

- **Admin**:
  - Username: `admin`
  - Password: `admin123`
- **Customer**:
  - Username: `user`
  - Password: `user123`

---

## 📝 Lisensi

Project ini dibuat untuk kebutuhan pembelajaran dan pengembangan aplikasi web. Silakan digunakan dan dikembangkan lebih lanjut!
