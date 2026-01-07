import xrpl from "xrpl";

/**
 * Step 1: Connect to XRPL Testnet + create/fund wallets
 * Network: XRPL Testnet
 * WS URL: wss://s.altnet.rippletest.net:51233
 */

const XRPL_RPC_URL = "wss://s.altnet.rippletest.net:51233";

async function makeFundedWallet(client, label) {
  // fundWallet hits the Testnet faucet and returns a funded wallet
  const { wallet, balance } = await client.fundWallet();

  return {
    label,
    address: wallet.address,
    seed: wallet.seed, // DEV/HACKATHON ONLY. Never expose in production.
    xrpBalance: balance,
  };
}

async function main() {
  const client = new xrpl.Client(XRPL_RPC_URL);
  await client.connect();

  console.log("✅ Connected to XRPL Testnet:", XRPL_RPC_URL);

  const issuer = await makeFundedWallet(client, "ISSUER");
  const treasury = await makeFundedWallet(client, "TREASURY");
  const investorA = await makeFundedWallet(client, "INVESTOR_A");
  const investorB = await makeFundedWallet(client, "INVESTOR_B");

  await client.disconnect();

  const wallets = [issuer, treasury, investorA, investorB];

  console.log("\n=== FUNDED WALLETS (SAVE THESE) ===");
  for (const w of wallets) {
    console.log(`\n[${w.label}]`);
    console.log("Address:", w.address);
    console.log("Seed:   ", w.seed);
    console.log("XRP:    ", w.xrpBalance);
  }

  console.log("\n=== ENV VARS (copy into your backend .env later) ===");
  console.log(`XRPL_RPC_URL=${XRPL_RPC_URL}`);
  console.log(`ISSUER_SEED=${issuer.seed}`);
  console.log(`TREASURY_SEED=${treasury.seed}`);
  console.log(`INVESTOR_A_SEED=${investorA.seed}`);
  console.log(`INVESTOR_B_SEED=${investorB.seed}`);

  // Optional: write to a local json file for convenience
  // (comment out if you don't want files)
  const fs = await import("node:fs");
  fs.writeFileSync(
    "wallets.testnet.json",
    JSON.stringify({ XRPL_RPC_URL, wallets }, null, 2),
    "utf8"
  );
  console.log("\n✅ Saved to wallets.testnet.json");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
