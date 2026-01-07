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

// To delete bond by ID
app.delete("/bonds/:id", async (req, res) => {
  try {
    await prisma.bond.delete({ where: { id: req.params.id } });
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

// To create an order
app.post("/orders", async (req, res) => {
  try {
    const { bondId, buyerAddress, amountPay, amountReceive } = req.body;

    const bond = await prisma.bond.findUnique({ where: { id: bondId } });
    if (!bond) return res.status(404).json({ error: "Bond not found" });
    if (bond.status !== "PUBLISHED") return res.status(400).json({ error: "Bond not published" });

    const order = await prisma.order.create({
      data: {
        bondId,
        buyerAddress,
        amountPay: Number(amountPay),
        amountReceive: Number(amountReceive),
        status: "PENDING",
      },
      include: { bond: true, logs: true },
    });

    res.json(order);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// To log a transaction for an order
app.post("/orders/:id/tx", async (req, res) => {
  try {
    const { type, txHash, memoJson } = req.body;

    if (!["PAY", "DELIVER"].includes(type)) {
      return res.status(400).json({ error: "type must be PAY or DELIVER" });
    }
    if (!txHash) return res.status(400).json({ error: "txHash required" });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { bond: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const logType = type === "PAY" ? "SUKUK_BUY_PAY" : "SUKUK_BUY_DELIVER";

    await prisma.txLog.create({
      data: {
        orderId: order.id,
        type: logType,
        txHash,
        memoJson: memoJson ?? {},
      },
    });

    const updated =
      type === "PAY"
        ? await prisma.order.update({
            where: { id: order.id },
            data: { payTxHash: txHash, status: "PAID" },
            include: { bond: true, logs: true },
          })
        : await prisma.order.update({
            where: { id: order.id },
            data: { deliverTxHash: txHash, status: "DELIVERED" },
            include: { bond: true, logs: true },
          });

    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// To get order by ID
app.get("/orders/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { bond: true, logs: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// To get all orders, optionally filtered by buyer address
app.get("/orders", async (req, res) => {
  const buyer = req.query.buyer;
  const where = buyer ? { buyerAddress: String(buyer) } : {};
  const orders = await prisma.order.findMany({
    where,
    include: { bond: true, logs: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// To get portfolio info from XRPL
app.get("/portfolio/:address", async (req, res) => {
  try {
    const c = await getXrplClient();
    const r = await c.request({ command: "account_lines", account: req.params.address });

    const lines = (r.result.lines || []).filter(
      (l) => l.currency === RLUSD_HEX || l.currency === HSUKUK_HEX
    );

    res.json({
      address: req.params.address,
      tracked: { RLUSD_HEX, HSUKUK_HEX },
      lines,
    });
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
