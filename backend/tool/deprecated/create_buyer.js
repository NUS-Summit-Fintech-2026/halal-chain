/**
 * Create Buyer Wallet Script
 *
 * This script:
 * 1. Creates a new buyer wallet
 * 2. Sets up trust line to receive bond tokens
 * 3. Saves buyer info to bond_wallets.json
 *
 * Run: node src/app/tool/create_buyer.js
 * With custom ID: node src/app/tool/create_buyer.js --id=buyer_alice
 * Skip if exists: node src/app/tool/create_buyer.js --id=buyer_alice --skip-existing
 */

const fs = require("fs");
const path = require("path");
const xrplTool = require("../xrpl.js");

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--id=")) {
      args.id = arg.split("=")[1];
    }
    if (arg === "--skip-existing") {
      args.skipExisting = true;
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();

  console.log("=".repeat(60));
  console.log("Create Buyer Wallet");
  console.log("=".repeat(60));

  // Load saved wallet info
  const walletPath = path.join(__dirname, "bond_wallets.json");

  if (!fs.existsSync(walletPath)) {
    console.error("Error: bond_wallets.json not found.");
    console.error("Run issuer.js first to create the bond.");
    process.exit(1);
  }

  const walletInfo = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const { currencyCode, totalTokens } = walletInfo.bond;
  const issuerAddress = walletInfo.issuer.address;

  console.log("\nBond Info:");
  console.log("  Name:", walletInfo.bond.name);
  console.log("  Currency Code:", currencyCode);
  console.log("  Issuer:", issuerAddress);

  // Initialize buyers array if not exists
  if (!walletInfo.buyers) {
    walletInfo.buyers = [];
  }

  // Determine buyer ID early
  const buyerIndex = walletInfo.buyers.length + 1;
  const buyerId = args.id || `buyer_${buyerIndex}`;

  // Check if buyer ID already exists BEFORE creating wallet
  const existingBuyer = walletInfo.buyers.find((b) => b.id === buyerId);
  if (existingBuyer && args.skipExisting) {
    console.log(
      `\nBuyer "${buyerId}" already exists. Skipping (--skip-existing).`
    );
    console.log("Address:", existingBuyer.address);
    process.exit(0);
  }

  let client;

  try {
    // Connect to XRPL
    console.log("\n[1] Connecting to XRPL Testnet...");
    client = await xrplTool.connect();
    console.log("Connected:", xrplTool.TESTNET_URL);

    // Create buyer wallet
    console.log("\n[2] Creating Buyer Wallet...");
    const buyer = await xrplTool.createWallet(client);
    console.log("Buyer Address:", buyer.address);
    console.log("Buyer Seed:", buyer.seed);
    console.log("Buyer Balance:", buyer.balance, "XRP");

    // Setup trust line for buyer
    console.log("\n[3] Setting up trust line...");
    await xrplTool.setupTrustLine(
      client,
      buyer.wallet,
      currencyCode,
      issuerAddress,
      totalTokens
    );
    console.log("Trust line established");
    console.log(
      `  Can receive up to ${totalTokens} ${walletInfo.bond.name} tokens`
    );

    // Verify trust line
    const trustLines = await xrplTool.getTrustLines(client, buyer.address);
    console.log("\n[4] Trust Line Verification:");
    trustLines.forEach((line) => {
      console.log(`  Currency: ${line.currency}`);
      console.log(`  Issuer: ${line.account}`);
      console.log(`  Limit: ${line.limit}`);
    });

    // Determine final ID (handle collision if exists without --skip-existing)
    let finalId = buyerId;
    if (existingBuyer) {
      console.log(`\nWARNING: Buyer "${buyerId}" already exists!`);
      console.log("Creating with timestamp-based ID instead...");
      finalId = `buyer_${Date.now()}`;
    }

    const buyerEntry = {
      id: finalId,
      address: buyer.address,
      seed: buyer.seed,
      createdAt: new Date().toISOString(),
    };

    walletInfo.buyers.push(buyerEntry);
    fs.writeFileSync(walletPath, JSON.stringify(walletInfo, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("BUYER WALLET CREATED");
    console.log("=".repeat(60));
    console.log("Buyer ID:", finalId);
    console.log("Address:", buyer.address);
    console.log("Seed:", buyer.seed);
    console.log("\nSaved to bond_wallets.json");

    console.log("\n[XRPL Testnet Explorer]");
    console.log(`https://testnet.xrpl.org/accounts/${buyer.address}`);
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
  } finally {
    if (client) {
      await client.disconnect();
      console.log("\nDisconnected from XRPL");
    }
  }
}

main();
