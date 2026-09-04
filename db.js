const { Pool, types } = require("pg");
const fs = require("fs");
const path = require("path");

// Parse Postgres numeric/decimal as JavaScript float
types.setTypeParser(1700, (val) => (val === null ? 0 : parseFloat(val)));
// Parse int8 (bigint) as int
types.setTypeParser(20, (val) => (val === null ? 0 : parseInt(val, 10)));

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || "localhost",
      port: parseInt(process.env.PGPORT || "5432", 10),
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
      database: process.env.PGDATABASE || "kastorshop",
    };

const pool = new Pool(poolConfig);

const TABLES = {
  accounts: "accounts",
  kategori: "kategori",
  products: "products",
  transaksi: "transaksi",
};

/**
 * Inisialisasi skema tabel dan migrasi data awal dari JSON jika tabel kosong.
 */
async function initDb() {
  const client = await pool.connect();
  try {
    console.log("[DATABASE] Terhubung ke PostgreSQL...");

    // 1. Buat tabel accounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        username VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255),
        nohp VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer'
      );
    `);

    // 2. Buat tabel kategori
    await client.query(`
      CREATE TABLE IF NOT EXISTS kategori (
        id VARCHAR(100) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL
      );
    `);

    // 3. Buat tabel products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        kategori VARCHAR(100),
        harga NUMERIC(15, 2) NOT NULL DEFAULT 0,
        stok INTEGER NOT NULL DEFAULT 0,
        gambar TEXT
      );
    `);

    // 4. Buat tabel transaksi
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaksi (
        id VARCHAR(100) PRIMARY KEY,
        tanggal VARCHAR(100),
        username VARCHAR(100),
        "produkId" VARCHAR(100),
        "produkNama" VARCHAR(255),
        jumlah INTEGER NOT NULL DEFAULT 0,
        total NUMERIC(15, 2) NOT NULL DEFAULT 0
      );
    `);

    console.log("[DATABASE] Struktur tabel PostgreSQL siap.");

    // Seeding awal dari data/*.json jika tabel masih kosong
    await seedFromJsonIfEmpty(client);
  } catch (err) {
    console.error("[DATABASE ERROR] Gagal inisialisasi database PostgreSQL:", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Mengimpor data lama dari file JSON jika tabel PostgreSQL masih kosong.
 */
async function seedFromJsonIfEmpty(client) {
  const dataDir = path.join(__dirname, "data");

  // Seed Accounts
  const accCount = (await client.query("SELECT COUNT(*) FROM accounts")).rows[0].count;
  if (parseInt(accCount, 10) === 0) {
    const accFile = path.join(dataDir, "accounts.json");
    if (fs.existsSync(accFile)) {
      try {
        const raw = fs.readFileSync(accFile, "utf-8");
        const list = JSON.parse(raw || "[]");
        for (const item of list) {
          if (item.username && item.password) {
            await client.query(
              `INSERT INTO accounts (username, email, nohp, password, role)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (username) DO NOTHING`,
              [item.username, item.email || "", item.nohp || "", item.password, item.role || "customer"]
            );
          }
        }
        console.log(`[DATABASE SEED] ${list.length} accounts berhasil diimpor ke PostgreSQL.`);
      } catch (e) {
        console.warn("[DATABASE SEED] Gagal membaca accounts.json:", e.message);
      }
    }
  }

  // Seed Kategori
  const katCount = (await client.query("SELECT COUNT(*) FROM kategori")).rows[0].count;
  if (parseInt(katCount, 10) === 0) {
    const katFile = path.join(dataDir, "kategori.json");
    if (fs.existsSync(katFile)) {
      try {
        const raw = fs.readFileSync(katFile, "utf-8");
        const list = JSON.parse(raw || "[]");
        for (const item of list) {
          if (item.id && item.nama) {
            await client.query(
              `INSERT INTO kategori (id, nama)
               VALUES ($1, $2)
               ON CONFLICT (id) DO NOTHING`,
              [item.id, item.nama]
            );
          }
        }
        console.log(`[DATABASE SEED] ${list.length} kategori berhasil diimpor ke PostgreSQL.`);
      } catch (e) {
        console.warn("[DATABASE SEED] Gagal membaca kategori.json:", e.message);
      }
    }
  }

  // Seed Products
  const prodCount = (await client.query("SELECT COUNT(*) FROM products")).rows[0].count;
  if (parseInt(prodCount, 10) === 0) {
    const prodFile = path.join(dataDir, "products.json");
    if (fs.existsSync(prodFile)) {
      try {
        const raw = fs.readFileSync(prodFile, "utf-8");
        const list = JSON.parse(raw || "[]");
        for (const item of list) {
          if (item.id && item.nama) {
            await client.query(
              `INSERT INTO products (id, nama, kategori, harga, stok, gambar)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (id) DO NOTHING`,
              [
                item.id,
                item.nama,
                item.kategori || "",
                Number(item.harga) || 0,
                parseInt(item.stok, 10) || 0,
                item.gambar || "",
              ]
            );
          }
        }
        if (list.length > 0) {
          console.log(`[DATABASE SEED] ${list.length} products berhasil diimpor ke PostgreSQL.`);
        }
      } catch (e) {
        console.warn("[DATABASE SEED] Gagal membaca products.json:", e.message);
      }
    }
  }

  // Seed Transaksi
  const trxCount = (await client.query("SELECT COUNT(*) FROM transaksi")).rows[0].count;
  if (parseInt(trxCount, 10) === 0) {
    const trxFile = path.join(dataDir, "transaksi.json");
    if (fs.existsSync(trxFile)) {
      try {
        const raw = fs.readFileSync(trxFile, "utf-8");
        const list = JSON.parse(raw || "[]");
        for (const item of list) {
          if (item.id) {
            await client.query(
              `INSERT INTO transaksi (id, tanggal, username, "produkId", "produkNama", jumlah, total)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO NOTHING`,
              [
                item.id,
                item.tanggal || "",
                item.username || "",
                item.produkId || item.produk_id || "",
                item.produkNama || item.produk_nama || "",
                parseInt(item.jumlah, 10) || 0,
                Number(item.total) || 0,
              ]
            );
          }
        }
        if (list.length > 0) {
          console.log(`[DATABASE SEED] ${list.length} transaksi berhasil diimpor ke PostgreSQL.`);
        }
      } catch (e) {
        console.warn("[DATABASE SEED] Gagal membaca transaksi.json:", e.message);
      }
    }
  }
}

/**
 * Mengambil semua baris dari tabel entitas yang diminta.
 */
async function getEntities(entity) {
  const tableName = TABLES[entity];
  if (!tableName) throw new Error(`Entity ${entity} tidak dikenal`);

  const res = await pool.query(`SELECT * FROM ${tableName}`);
  // Mapping tipe data numeric/integer jika perlu
  return res.rows.map((row) => {
    if (entity === "products") {
      return {
        ...row,
        harga: Number(row.harga),
        stok: parseInt(row.stok, 10),
      };
    }
    if (entity === "transaksi") {
      return {
        ...row,
        jumlah: parseInt(row.jumlah, 10),
        total: Number(row.total),
      };
    }
    return row;
  });
}

/**
 * Menyimpan / menyinkronkan seluruh daftar data entitas ke tabel PostgreSQL secara transaksional.
 */
async function saveEntities(entity, items) {
  const tableName = TABLES[entity];
  if (!tableName) throw new Error(`Entity ${entity} tidak dikenal`);
  if (!Array.isArray(items)) throw new Error("Data yang dikirim harus berupa array");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Hapus data lama di tabel untuk sinkronisasi penuh
    await client.query(`DELETE FROM ${tableName}`);

    if (entity === "accounts") {
      for (const item of items) {
        if (!item.username || !item.password) continue;
        await client.query(
          `INSERT INTO accounts (username, email, nohp, password, role)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.username, item.email || "", item.nohp || "", item.password, item.role || "customer"]
        );
      }
    } else if (entity === "kategori") {
      for (const item of items) {
        if (!item.id || !item.nama) continue;
        await client.query(
          `INSERT INTO kategori (id, nama)
           VALUES ($1, $2)`,
          [item.id, item.nama]
        );
      }
    } else if (entity === "products") {
      for (const item of items) {
        if (!item.id || !item.nama) continue;
        await client.query(
          `INSERT INTO products (id, nama, kategori, harga, stok, gambar)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            item.id,
            item.nama,
            item.kategori || "",
            Number(item.harga) || 0,
            parseInt(item.stok, 10) || 0,
            item.gambar || "",
          ]
        );
      }
    } else if (entity === "transaksi") {
      for (const item of items) {
        if (!item.id) continue;
        await client.query(
          `INSERT INTO transaksi (id, tanggal, username, "produkId", "produkNama", jumlah, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            item.id,
            item.tanggal || "",
            item.username || "",
            item.produkId || item.produk_id || "",
            item.produkNama || item.produk_nama || "",
            parseInt(item.jumlah, 10) || 0,
            Number(item.total) || 0,
          ]
        );
      }
    }

    await client.query("COMMIT");
    return { success: true, count: items.length };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[DATABASE ERROR] Gagal menyimpan entitas ${entity}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDb,
  getEntities,
  saveEntities,
};
