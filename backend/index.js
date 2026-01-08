import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./db.js";
import { createRequire } from "module";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const require = createRequire(import.meta.url);
const apiHelper = require("../src/app/tool/apiHelper.js");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BONDS_BUCKET = process.env.SUPABASE_BONDS_BUCKET || "Bonds";
const ASSETS_BUCKET = process.env.SUPABASE_ASSETS_BUCKET || "Assets";

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

function requireUser(req, res, next) {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, error: "Authorization: Bearer <email> required" });
  }
  next();
}

app.use(attachUser);

app.get("/health", (_req, res) => res.json({ ok: true }));

async function ensureIssuerWallet() {
  let issuer = await prisma.wallet.findUnique({ where: { role: "ISSUER" } });
  if (issuer) return issuer;

  const r = await apiHelper.createIssuer();
  if (!r?.success) {
    throw new Error(`createIssuer failed: ${r?.error ?? "unknown error"}`);
  }

  issuer = await prisma.wallet.create({
    data: {
      role: "ISSUER",
      address: r.data.address,
      seed: r.data.seed,
    },
  });

  return issuer;
}

async function ensureTreasuryWallet() {
  let treasury = await prisma.wallet.findUnique({ where: { role: "TREASURY" } });
  if (treasury) return treasury;

  const r = await apiHelper.createTreasury();
  if (!r?.success) {
    throw new Error(`createTreasury failed: ${r?.error ?? "unknown error"}`);
  }

  treasury = await prisma.wallet.create({
    data: {
      role: "TREASURY",
      address: r.data.address,
      seed: r.data.seed,
    },
  });

  return treasury;
}

app.post("/bonds", async (req, res) => {
  try {
    const { name, description, code, totalTokens, profitRate } = req.body;

    if (!name || !description || !code) {
      return res
        .status(400)
        .json({ error: "name, description, code are required" });
    }
    if (totalTokens == null || Number(totalTokens) <= 0) {
      return res.status(400).json({ error: "totalTokens must be > 0" });
    }
    if (profitRate == null || Number.isNaN(Number(profitRate))) {
      return res.status(400).json({ error: "profitRate is required (number)" });
    }

    const issuer = await ensureIssuerWallet();
    const treasury = await ensureTreasuryWallet();

    const bond = await prisma.bond.create({
      data: {
        name,
        description,
        code,
        totalTokens: Number(totalTokens),
        profitRate: Number(profitRate),
        status: "DRAFT",
        issuerAddress: issuer.address,
        treasuryAddress: treasury.address,
        currencyCode: null,
      },
    });

    res.json({ ok: true, bond, issuer: { address: issuer.address }, treasury: { address: treasury.address } });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

app.get("/bonds", async (_req, res) => {
  const bonds = await prisma.bond.findMany({ orderBy: { createdAt: "desc" } });
  res.json(bonds);
});

app.get("/bonds/:id", async (req, res) => {
  const bond = await prisma.bond.findUnique({ where: { id: req.params.id } });
  if (!bond) return res.status(404).json({ error: "Bond not found" });
  res.json(bond);
});

app.get("/bonds/code/:code", async (req, res) => {
  const bond = await prisma.bond.findUnique({ where: { code: req.params.code } });
  if (!bond) return res.status(404).json({ error: "Bond not found" });
  res.json(bond);
});

app.post("/bonds/code/:code/publish", async (req, res) => {
  try {
    const bond = await prisma.bond.findUnique({ where: { code: req.params.code } });
    if (!bond) return res.status(404).json({ error: "Bond not found" });

    if (bond.status === "PUBLISHED") {
      return res.json({ ok: true, bond, note: "Already published" });
    }

    const { pricePerToken } = req.body;
    if (pricePerToken == null || Number(pricePerToken) <= 0) {
      return res.status(400).json({ error: "pricePerToken (in XRP) is required to list initial sell offer" });
    }

    const issuer = await prisma.wallet.findUnique({ where: { role: "ISSUER" } });
    const treasury = await prisma.wallet.findUnique({ where: { role: "TREASURY" } });
    if (!issuer || !treasury) {
      return res.status(500).json({ error: "ISSUER/TREASURY wallet not found. Create a bond first." });
    }

    const tok = await apiHelper.tokenizeBond({
      bondCode: bond.code,
      totalTokens: bond.totalTokens,
      issuerSeed: issuer.seed,
      treasurySeed: treasury.seed,
    });
    if (!tok?.success) return res.status(400).json(tok);

    const updated = await prisma.bond.update({
      where: { id: bond.id },
      data: {
        currencyCode: tok.data.currencyCode,
        status: "PUBLISHED",
      },
    });

    const sell = await apiHelper.sellTokens({
      sellerSeed: treasury.seed,
      currencyCode: updated.currencyCode,
      issuerAddress: updated.issuerAddress,
      tokenAmount: updated.totalTokens,
      pricePerToken: Number(pricePerToken),
    });
    if (!sell?.success) {
      return res.status(400).json({
        ok: false,
        error: "Tokenized and published, but failed to place treasury sell offer",
        bond: updated,
        tokenize: tok.data,
        sellError: sell,
      });
    }

    return res.json({
      ok: true,
      bond: updated,
      tokenize: tok.data,
      initialSellOffer: sell.data,
    });
  } catch (e) {
    return res.status(400).json({ error: String(e) });
  }
});


app.post("/auth/login", async (req, res) => {
  try {
    const { email, walletAddress, walletSeed } = req.body;

    if (!email || !walletAddress || !walletSeed) {
      return res
        .status(400)
        .json({ error: "email, walletAddress, walletSeed are required" });
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

app.get("/me", requireUser, async (req, res) => {
  res.json({ ok: true, user: { id: req.user.id, email: req.user.email, walletAddress: req.user.walletAddress } });
});

app.get("/xrpl/orderbook/:bondCode", async (req, res) => {
  try {
    const bond = await prisma.bond.findUnique({ where: { code: req.params.bondCode } });
    if (!bond) return res.status(404).json({ success: false, error: "Bond not found" });
    if (!bond.currencyCode) {
      return res.status(400).json({ success: false, error: "Bond not tokenized yet. Publish first." });
    }

    const r = await apiHelper.getOrderBook(bond.currencyCode, bond.issuerAddress);
    if (!r.success) return res.status(400).json(r);

    res.json(r);
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/xrpl/buy/:bondCode", requireUser, async (req, res) => {
  try {
    const { tokenAmount, pricePerToken } = req.body;
    if (tokenAmount == null || pricePerToken == null) {
      return res.status(400).json({ success: false, error: "tokenAmount and pricePerToken are required" });
    }

    const bond = await prisma.bond.findUnique({ where: { code: req.params.bondCode } });
    if (!bond) return res.status(404).json({ success: false, error: "Bond not found" });
    if (bond.status !== "PUBLISHED") return res.status(400).json({ success: false, error: "Bond not published" });
    if (!bond.currencyCode) return res.status(400).json({ success: false, error: "Bond missing currencyCode" });

    const r = await apiHelper.buyTokens({
      buyerSeed: req.user.walletSeed,
      currencyCode: bond.currencyCode,
      issuerAddress: bond.issuerAddress,
      tokenAmount: Number(tokenAmount),
      pricePerToken: Number(pricePerToken),
    });

    if (!r.success) return res.status(400).json(r);
    res.json(r);
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/xrpl/sell/:bondCode", requireUser, async (req, res) => {
  try {
    const { tokenAmount, pricePerToken } = req.body;
    if (tokenAmount == null || pricePerToken == null) {
      return res.status(400).json({ success: false, error: "tokenAmount and pricePerToken are required" });
    }

    const bond = await prisma.bond.findUnique({ where: { code: req.params.bondCode } });
    if (!bond) return res.status(404).json({ success: false, error: "Bond not found" });
    if (bond.status !== "PUBLISHED") return res.status(400).json({ success: false, error: "Bond not published" });
    if (!bond.currencyCode) return res.status(400).json({ success: false, error: "Bond missing currencyCode" });

    const r = await apiHelper.sellTokens({
      sellerSeed: req.user.walletSeed,
      currencyCode: bond.currencyCode,
      issuerAddress: bond.issuerAddress,
      tokenAmount: Number(tokenAmount),
      pricePerToken: Number(pricePerToken),
    });

    if (!r.success) return res.status(400).json(r);
    res.json(r);
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});

app.get("/xrpl/offers", requireUser, async (req, res) => {
  try {
    const r = await apiHelper.getOpenOffers(req.user.walletAddress);
    if (!r.success) return res.status(400).json(r);
    res.json(r);
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});

app.get("/xrpl/portfolio", requireUser, async (req, res) => {
  try {
    const r = await apiHelper.getWalletBalances(req.user.walletAddress);
    if (!r.success) return res.status(400).json(r);
    res.json(r);
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/bonds/code/:code/simulate-expired", async (req, res) => {
  try {
    const bond = await prisma.bond.findUnique({ where: { code: req.params.code } });
    if (!bond) return res.status(404).json({ success: false, error: "Bond not found" });
    if (bond.status !== "PUBLISHED") return res.status(400).json({ success: false, error: "Bond not published" });
    if (!bond.currencyCode) return res.status(400).json({ success: false, error: "Bond has no currencyCode. Publish first." });

    const issuer = await prisma.wallet.findUnique({ where: { role: "ISSUER" } });
    const treasury = await prisma.wallet.findUnique({ where: { role: "TREASURY" } });
    if (!issuer || !treasury) return res.status(500).json({ success: false, error: "ISSUER/TREASURY wallet missing" });

    const principalPerTokenXrp = Number(req.body?.principalPerTokenXrp ?? 1);
    const profitMultiplier = Number(req.body?.profitMultiplier ?? 1.2);
    const xrpPayoutPerToken = principalPerTokenXrp * profitMultiplier;

    const users = await prisma.user.findMany({ select: { walletAddress: true, walletSeed: true } });
    const holderSeeds = Object.fromEntries(users.map(u => [u.walletAddress, u.walletSeed]));

    const r = await apiHelper.redeemBondForAllHolders({
      issuerSeed: issuer.seed,
      treasurySeed: treasury.seed,
      currencyCode: bond.currencyCode,
      xrpPayoutPerToken,
      holderSeeds,
    });

    if (!r?.success) return res.status(400).json(r);

    return res.json({
      success: true,
      bond: { code: bond.code, currencyCode: bond.currencyCode },
      params: { principalPerTokenXrp, profitMultiplier, xrpPayoutPerToken },
      xrpl: r.data,
    });
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/bonds/code/:code/upload", upload.single("file"), async (req, res) => {
  try {
    const bond = await prisma.bond.findUnique({ where: { code: req.params.code } });
    if (!bond) return res.status(404).json({ success: false, error: "Bond not found" });
    if (!req.file) return res.status(400).json({ success: false, error: "file is required" });

    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: "Only pdf/png/jpg/webp allowed" });
    }

    const ext = (req.file.originalname.split(".").pop() || "bin").toLowerCase();
    const objectPath = `bonds/${bond.code}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BONDS_BUCKET)
      .upload(objectPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (upErr) return res.status(400).json({ success: false, error: upErr.message });

    const { data } = supabase.storage.from(BONDS_BUCKET).getPublicUrl(objectPath);
    const fileUrl = data.publicUrl;

    const updated = await prisma.bond.update({
      where: { id: bond.id },
      data: { fileUrl },
    });

    res.json({
      success: true,
      bond: updated,
      file: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        fileUrl,
        objectPath,
      },
    });
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/assets", async (req, res) => {
  try {
    const { name, description, code, totalTokens, profitRate } = req.body;

    if (!name || !description || !code) {
      return res.status(400).json({ success: false, error: "name, description, code are required" });
    }
    if (totalTokens == null || Number(totalTokens) <= 0) {
      return res.status(400).json({ success: false, error: "totalTokens must be > 0" });
    }
    if (profitRate == null || Number.isNaN(Number(profitRate))) {
      return res.status(400).json({ success: false, error: "profitRate is required (number)" });
    }

    const issuer = await ensureIssuerWallet();
    const treasury = await ensureTreasuryWallet();

    const asset = await prisma.realAsset.create({
      data: {
        name,
        description,
        code,
        totalTokens: Number(totalTokens),
        profitRate: Number(profitRate),
        status: "DRAFT",
        issuerAddress: issuer.address,
        treasuryAddress: treasury.address,
        currencyCode: null,
      },
    });

    return res.json({ success: true, asset });
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

app.get("/assets", async (_req, res) => {
  const assets = await prisma.realAsset.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, assets });
});

app.get("/assets/:id", async (req, res) => {
  const asset = await prisma.realAsset.findUnique({
    where: { id: req.params.id },
    include: { files: true },
  });
  if (!asset) return res.status(404).json({ success: false, error: "Asset not found" });
  res.json({ success: true, asset });
});

app.get("/assets/code/:code", async (req, res) => {
  const asset = await prisma.realAsset.findUnique({
    where: { code: req.params.code },
    include: { files: true },
  });
  if (!asset) return res.status(404).json({ success: false, error: "Asset not found" });
  res.json({ success: true, asset });
});

app.post("/assets/code/:code/publish", async (req, res) => {
  try {
    const asset = await prisma.realAsset.findUnique({ where: { code: req.params.code } });
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found" });

    if (asset.status === "PUBLISHED") {
      return res.json({ success: true, asset, note: "Already published" });
    }

    const { pricePerToken } = req.body;
    if (pricePerToken == null || Number(pricePerToken) <= 0) {
      return res.status(400).json({ success: false, error: "pricePerToken (in XRP) is required" });
    }

    const issuer = await prisma.wallet.findUnique({ where: { role: "ISSUER" } });
    const treasury = await prisma.wallet.findUnique({ where: { role: "TREASURY" } });
    if (!issuer || !treasury) {
      return res.status(500).json({ success: false, error: "ISSUER/TREASURY wallet not found. Create an asset first." });
    }

    const tok = await apiHelper.tokenizeBond({
      bondCode: asset.code,
      totalTokens: asset.totalTokens,
      issuerSeed: issuer.seed,
      treasurySeed: treasury.seed,
    });
    if (!tok?.success) return res.status(400).json(tok);

    const updated = await prisma.realAsset.update({
      where: { id: asset.id },
      data: {
        currencyCode: tok.data.currencyCode,
        status: "PUBLISHED",
      },
    });

    const sell = await apiHelper.sellTokens({
      sellerSeed: treasury.seed,
      currencyCode: updated.currencyCode,
      issuerAddress: updated.issuerAddress,
      tokenAmount: updated.totalTokens,
      pricePerToken: Number(pricePerToken),
    });

    if (!sell?.success) {
      return res.status(400).json({
        success: false,
        error: "Tokenized and published, but failed to place initial treasury sell offer",
        asset: updated,
        tokenize: tok.data,
        sellError: sell,
      });
    }

    return res.json({
      success: true,
      asset: updated,
      tokenize: tok.data,
      initialSellOffer: sell.data,
    });
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

app.get("/xrpl/orderbook/asset/:assetCode", async (req, res) => {
  try {
    const asset = await prisma.realAsset.findUnique({ where: { code: req.params.assetCode } });
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found" });
    if (!asset.currencyCode) return res.status(400).json({ success: false, error: "Asset not tokenized. Publish first." });

    const r = await apiHelper.getOrderBook(asset.currencyCode, asset.issuerAddress);
    if (!r.success) return res.status(400).json(r);

    return res.json(r);
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/xrpl/buy/asset/:assetCode", requireUser, async (req, res) => {
  try {
    const { tokenAmount, pricePerToken } = req.body;
    if (tokenAmount == null || pricePerToken == null) {
      return res.status(400).json({ success: false, error: "tokenAmount and pricePerToken are required" });
    }

    const asset = await prisma.realAsset.findUnique({ where: { code: req.params.assetCode } });
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found" });
    if (asset.status !== "PUBLISHED") return res.status(400).json({ success: false, error: "Asset not published" });
    if (!asset.currencyCode) return res.status(400).json({ success: false, error: "Asset missing currencyCode" });

    const r = await apiHelper.buyTokens({
      buyerSeed: req.user.walletSeed,
      currencyCode: asset.currencyCode,
      issuerAddress: asset.issuerAddress,
      tokenAmount: Number(tokenAmount),
      pricePerToken: Number(pricePerToken),
    });

    if (!r.success) return res.status(400).json(r);
    return res.json(r);
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/xrpl/sell/asset/:assetCode", requireUser, async (req, res) => {
  try {
    const { tokenAmount, pricePerToken } = req.body;
    if (tokenAmount == null || pricePerToken == null) {
      return res.status(400).json({ success: false, error: "tokenAmount and pricePerToken are required" });
    }

    const asset = await prisma.realAsset.findUnique({ where: { code: req.params.assetCode } });
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found" });
    if (asset.status !== "PUBLISHED") return res.status(400).json({ success: false, error: "Asset not published" });
    if (!asset.currencyCode) return res.status(400).json({ success: false, error: "Asset missing currencyCode" });

    const r = await apiHelper.sellTokens({
      sellerSeed: req.user.walletSeed,
      currencyCode: asset.currencyCode,
      issuerAddress: asset.issuerAddress,
      tokenAmount: Number(tokenAmount),
      pricePerToken: Number(pricePerToken),
    });

    if (!r.success) return res.status(400).json(r);
    return res.json(r);
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/assets/code/:code/simulate-realized", async (req, res) => {
  try {
    const asset = await prisma.realAsset.findUnique({ where: { code: req.params.code } });
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found" });
    if (asset.status !== "PUBLISHED") return res.status(400).json({ success: false, error: "Asset not published" });
    if (!asset.currencyCode) return res.status(400).json({ success: false, error: "Asset has no currencyCode. Publish first." });

    const issuer = await prisma.wallet.findUnique({ where: { role: "ISSUER" } });
    const treasury = await prisma.wallet.findUnique({ where: { role: "TREASURY" } });
    if (!issuer || !treasury) return res.status(500).json({ success: false, error: "ISSUER/TREASURY wallet missing" });

    const principalPerTokenXrp = Number(req.body?.principalPerTokenXrp ?? 1);

    const profitRate = (req.body?.profitRate != null) ? Number(req.body.profitRate) : Number(asset.profitRate);

    const xrpPayoutPerToken = principalPerTokenXrp * (1 + profitRate);

    const users = await prisma.user.findMany({ select: { walletAddress: true, walletSeed: true } });
    const holderSeeds = Object.fromEntries(users.map(u => [u.walletAddress, u.walletSeed]));

    const r = await apiHelper.redeemBondForAllHolders({
      issuerSeed: issuer.seed,
      treasurySeed: treasury.seed,
      currencyCode: asset.currencyCode,
      xrpPayoutPerToken,
      holderSeeds,
    });

    if (!r?.success) return res.status(400).json(r);

    return res.json({
      success: true,
      asset: { code: asset.code, currencyCode: asset.currencyCode },
      params: { principalPerTokenXrp, profitRate, xrpPayoutPerToken },
      xrpl: r.data,
    });
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

app.post("/assets/code/:code/upload", upload.single("file"), async (req, res) => {
  try {
    const asset = await prisma.realAsset.findUnique({ where: { code: req.params.code } });
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found" });
    if (!req.file) return res.status(400).json({ success: false, error: "file is required" });

    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: "Only pdf/png/jpg/webp allowed" });
    }

    const ext = (req.file.originalname.split(".").pop() || "bin").toLowerCase();
    const objectPath = `assets/${asset.code}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(ASSETS_BUCKET)
      .upload(objectPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (upErr) return res.status(400).json({ success: false, error: upErr.message });

    const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(objectPath);
    const fileUrl = data.publicUrl;

    const fileRow = await prisma.assetFile.create({
      data: {
        assetId: asset.id,
        url: fileUrl,
        mimeType: req.file.mimetype,
        fileName: req.file.originalname,
        size: req.file.size,
      },
    });

    return res.json({
      success: true,
      asset: { id: asset.id, code: asset.code },
      file: fileRow,
    });
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
