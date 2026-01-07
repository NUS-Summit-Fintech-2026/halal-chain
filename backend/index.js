import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import xrpl from "xrpl";
import { prisma } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

function getBearerToken(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  const [scheme, token] = h.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function attachUser(req, _res, next) {
  try {
    const email = getBearerToken(req);
    if (!email) {
      req.user = null;
      return next();
    }

    const user = await prisma.user.findUnique({ where: { email } });
    req.user = user ?? null;
    return next();
  } catch (e) {
    return next(e);
  }
}

app.use(attachUser);

const XRPL_RPC_URL = process.env.XRPL_RPC_URL;
const RLUSD_HEX = process.env.RLUSD_HEX;
const HSUKUK_HEX = process.env.HSUKUK_HEX;

let xrplClient;
async function getXrplClient() {
  if (!xrplClient) {
    xrplClient = new xrpl.Client(XRPL_RPC_URL);
    await xrplClient.connect();
  }
  return xrplClient;
}

app.get("/health", (_req, res) => res.json({ ok: true }));


// To create a bond
app.post("/bonds", async (req, res) => {
  try {
    const bond = await prisma.bond.create({ data: req.body });
    res.json(bond);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// To get all bonds
app.get("/bonds", async (_req, res) => {
  const bonds = await prisma.bond.findMany({ orderBy: { createdAt: "desc" } });
  res.json(bonds);
});

// To get bond by ID
app.get("/bonds/:id", async (req, res) => {
  const bond = await prisma.bond.findUnique({ where: { id: req.params.id } });
  if (!bond) return res.status(404).json({ error: "Bond not found" });
  res.json(bond);
});

// To get bond by code
app.get("/bonds/code/:code", async (req, res) => {
    const bond = await prisma.bond.findUnique({ where: { code: req.params.code } });
    if (!bond) return res.status(404).json({ error: "Bond not found" });
    res.json(bond);
});

// To update bond by ID
app.put("/bonds/:id", async (req, res) => {
  try {
    const bond = await prisma.bond.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(bond);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// To update bond by code
app.put("/bonds/code/:code", async (req, res) => {
  try {
    const bond = await prisma.bond.update({
      where: { code: req.params.code },
      data: req.body,
    });
    res.json(bond);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// To delete bond by ID
app.delete("/bonds/:id", async (req, res) => {
  try {
    await prisma.bond.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// To delete bond by code
app.delete("/bonds/code/:code", async (req, res) => {
    try {
        await prisma.bond.delete({ where: { code: req.params.code } });
        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
});

// To publish bond by ID (change status to PUBLISHED)
app.post("/bonds/:id/publish", async (req, res) => {
  try {
    const bond = await prisma.bond.update({
      where: { id: req.params.id },
      data: { status: "PUBLISHED" },
    });
    res.json(bond);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// To publish bond by code (change status to PUBLISHED)
app.post("/bonds/code/:code/publish", async (req, res) => {
  try {
    const bond = await prisma.bond.update({
      where: { code: req.params.code },
      data: { status: "PUBLISHED" },
    });
    res.json(bond);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// To login/register a user
app.post("/auth/login", async (req, res) => {
  try {
    const { email, walletAddress, walletSeed } = req.body;

    if (!email || !walletAddress || !walletSeed) {
      return res.status(400).json({ error: "email, walletAddress, walletSeed are required" });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { walletAddress, walletSeed },
      create: { email, walletAddress, walletSeed },
    });

    res.json({ ok: true, user });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
