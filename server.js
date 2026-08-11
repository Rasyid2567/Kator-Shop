const express = require("express");
const fs = require("fs");
const path = require("path");

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

// Endpoint GET untuk membaca file JSON dari data/
app.get("/api/:entity", (req, res) => {
  const { entity } = req.params;
  if (!ALLOWED_ENTITIES.includes(entity)) {
    return res.status(400).json({ error: "Entity tidak valid" });
  }

  const filePath = path.join(__dirname, "data", `${entity}.json`);
  if (!fs.existsSync(filePath)) {
    return res.json([]);
  }

  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(rawData || "[]");
    return res.json(data);
  } catch (err) {
    console.error(`Error reading ${entity}.json:`, err);
    return res.status(500).json({ error: "Gagal membaca file JSON" });
  }
});

// Endpoint POST untuk menyimpan data langsung ke file JSON di data/
app.post("/api/:entity", (req, res) => {
  const { entity } = req.params;
  if (!ALLOWED_ENTITIES.includes(entity)) {
    return res.status(400).json({ error: "Entity tidak valid" });
  }

  const filePath = path.join(__dirname, "data", `${entity}.json`);
  try {
    const jsonContent = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(filePath, jsonContent, "utf-8");
    console.log(`[SERVER] ${entity}.json berhasil diperbarui! (${req.body.length || 0} items)`);
    return res.json({ success: true, message: `File ${entity}.json berhasil disimpan.` });
  } catch (err) {
    console.error(`Error writing to ${entity}.json:`, err);
    return res.status(500).json({ error: "Gagal menyimpan ke file JSON" });
  }
});

app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`Toko telah dibuka ✅️`);
  console.log(`Buka di Browser http://localhost:${PORT}`);
  console.log(`================================================`);
});
