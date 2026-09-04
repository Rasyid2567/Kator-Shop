require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 2567;

app.use(express.json({ limit: "10mb" }));

// Middleware CORS agar bisa diakses dari origin/port manapun (misal 127.0.0.1 vs localhost)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware untuk menghilangkan trailing slash di URL (misal /dashboard/ -> /dashboard)
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith("/")) {
    const newPath = req.path.slice(0, -1);
    const query = req.url.slice(req.path.length);
    return res.redirect(301, newPath + query);
  }
  next();
});

// Clean URL routes (tanpa .html dan tanpa trailing slash di address bar)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"));
});

app.use(express.static(__dirname));

const ALLOWED_ENTITIES = ["products", "kategori", "transaksi", "accounts"];

// Endpoint GET untuk membaca data dari Database PostgreSQL
app.get("/api/:entity", async (req, res) => {
  const { entity } = req.params;
  if (!ALLOWED_ENTITIES.includes(entity)) {
    return res.status(400).json({ error: "Entity tidak valid" });
  }

  try {
    const data = await db.getEntities(entity);
    return res.json(data);
  } catch (err) {
    console.error(`Error reading ${entity} from database:`, err);
    return res.status(500).json({ error: `Gagal membaca data ${entity} dari database` });
  }
});

// Endpoint POST untuk menyimpan/sinkronisasi data ke Database PostgreSQL
app.post("/api/:entity", async (req, res) => {
  const { entity } = req.params;
  if (!ALLOWED_ENTITIES.includes(entity)) {
    return res.status(400).json({ error: "Entity tidak valid" });
  }

  try {
    const result = await db.saveEntities(entity, req.body);
    console.log(`[SERVER] Database '${entity}' berhasil diperbarui! (${Array.isArray(req.body) ? req.body.length : 1} items)`);
    return res.json({ success: true, message: `Data ${entity} berhasil disimpan ke database PostgreSQL.` });
  } catch (err) {
    console.error(`Error writing ${entity} to database:`, err);
    return res.status(500).json({ error: `Gagal menyimpan data ${entity} ke database` });
  }
});

// Inisialisasi Database dan Jalankan Server
async function startServer() {
  try {
    await db.initDb();
    app.listen(PORT, () => {
      console.log(`================================================`);
      console.log(`Kastor Shop telah dibuka ✅️`);
      console.log(`Penyimpanan: PostgreSQL Database (${process.env.PGDATABASE || "kastorshop"})`);
      console.log(`Buka di Browser: http://localhost:${PORT}`);
      console.log(`================================================`);
    });
  } catch (err) {
    console.error("[FATAL] Gagal menghubungkan ke Database PostgreSQL:", err.message);
    process.exit(1);
  }
}

startServer();
