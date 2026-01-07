/**
 * Buyer Trading Script
 *
 * Simulates buying and selling tokens on XRPL DEX.
 * Requires: issuer.js and create_buyer.js to be run first.
 *
 * Run: node src/app/tool/buyer.js
 */

const fs = require("fs");
const path = require("path");
const xrplTool = require("../xrpl.js");

// Token price configuration
const TOKEN_PRICE_XRP = 0.01; // 1 token = 0.01 XRP

async function main() {
  console.log("=".repeat(60));
  console.log("XRPL Token Trading Simulation");
  console.log("=".repeat(60));
  console.log(`Token Price: ${TOKEN_PRICE_XRP} XRP per token`);

  // Load saved wallet info
  const walletPath = path.join(__dirname, "bond_wallets.json");

  if (!fs.existsSync(walletPath)) {
    console.error("Error: bond_wallets.json not found.");
    console.error("Run issuer.js first.");
    process.exit(1);
  }

  const walletInfo = JSON.parse(fs.readFileSync(walletPath, "utf8"));

  if (!walletInfo.buyers || walletInfo.buyers.length === 0) {
    console.error("Error: No buyers found.");
    console.error("Run create_buyer.js first.");
    process.exit(1);
  }

  const { currencyCode } = walletInfo.bond;
  const issuerAddress = walletInfo.issuer.address;

  // Use the first buyer for this simulation
  const buyerInfo = walletInfo.buyers[0];

  console.log("\nBond:", walletInfo.bond.name);
  console.log("Buyer:", buyerInfo.id, "-", buyerInfo.address);

  let client;

  try {
    // Connect to XRPL
    console.log("\n[1] Connecting to XRPL Testnet...");
    client = await xrplTool.connect();

    // Load wallets
    const treasuryWallet = xrplTool.loadWallet(walletInfo.treasury.seed);
    const buyerWallet = xrplTool.loadWallet(buyerInfo.seed);

    console.log("Treasury:", treasuryWallet.address);
    console.log("Buyer:", buyerWallet.address);

    // Show initial balances
    console.log("\n[2] Initial Balances:");
    await showBalances(
      client,
      treasuryWallet.address,
      buyerWallet.address,
      walletInfo.bond.name
    );

    // === BUYING SIMULATION ===
    const tokensToSell = 1000;
    const tokensToBuy = 500;

    console.log(
      `\n[3] Treasury creates SELL offer: ${tokensToSell} tokens @ ${TOKEN_PRICE_XRP} XRP each`
    );
    const sellOffer = await xrplTool.createSellOffer(
      client,
      treasuryWallet,
      currencyCode,
      issuerAddress,
      tokensToSell,
      TOKEN_PRICE_XRP
    );
    console.log(
      `  Offer created: ${sellOffer.tokenAmount} tokens for ${sellOffer.xrpTotal} XRP`
    );

    console.log(
      `\n[4] Buyer creates BUY offer: ${tokensToBuy} tokens @ ${TOKEN_PRICE_XRP} XRP each`
    );
    const buyOffer = await xrplTool.createBuyOffer(
      client,
      buyerWallet,
      currencyCode,
      issuerAddress,
      tokensToBuy,
      TOKEN_PRICE_XRP
    );
    console.log(
      `  Trade executed: ${buyOffer.tokenAmount} tokens for ${buyOffer.xrpTotal} XRP`
    );

    console.log("\n[5] Balances after PURCHASE:");
    await showBalances(
      client,
      treasuryWallet.address,
      buyerWallet.address,
      walletInfo.bond.name
    );

    // === SELLING SIMULATION ===
    const tokensToSellBack = 200;

    console.log(
      `\n[6] Buyer creates SELL offer: ${tokensToSellBack} tokens @ ${TOKEN_PRICE_XRP} XRP each`
    );
    const buyerSellOffer = await xrplTool.createSellOffer(
      client,
      buyerWallet,
      currencyCode,
      issuerAddress,
      tokensToSellBack,
      TOKEN_PRICE_XRP
    );
    console.log(`  Offer created: ${buyerSellOffer.tokenAmount} tokens`);

    console.log(
      `\n[7] Treasury creates BUY offer: ${tokensToSellBack} tokens @ ${TOKEN_PRICE_XRP} XRP each`
    );
    const treasuryBuyOffer = await xrplTool.createBuyOffer(
      client,
      treasuryWallet,
      currencyCode,
      issuerAddress,
      tokensToSellBack,
      TOKEN_PRICE_XRP
    );
    console.log(`  Trade executed: ${treasuryBuyOffer.tokenAmount} tokens`);

    console.log("\n[8] Final Balances:");
    await showBalances(
      client,
      treasuryWallet.address,
      buyerWallet.address,
      walletInfo.bond.name
    );

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("TRANSACTION SUMMARY");
    console.log("=".repeat(60));
    console.log(`1. Buyer purchased ${tokensToBuy} tokens`);
    console.log(`   Cost: ${tokensToBuy * TOKEN_PRICE_XRP} XRP`);
    console.log(`2. Buyer sold ${tokensToSellBack} tokens`);
    console.log(`   Received: ${tokensToSellBack * TOKEN_PRICE_XRP} XRP`);
    console.log(`\nNet: Buyer holds ${tokensToBuy - tokensToSellBack} tokens`);
    console.log(
      `Net XRP spent: ${(tokensToBuy - tokensToSellBack) * TOKEN_PRICE_XRP} XRP`
    );
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

async function showBalances(client, treasuryAddress, buyerAddress, bondName) {
  const treasuryBalances = await xrplTool.getBalances(client, treasuryAddress);
  const buyerBalances = await xrplTool.getBalances(client, buyerAddress);

  console.log("\n  Treasury:");
  treasuryBalances.forEach((bal) => {
    const label = bal.issuer ? bondName : "XRP";
    console.log(`    ${bal.value} ${label}`);
  });

  console.log("\n  Buyer:");
  buyerBalances.forEach((bal) => {
    const label = bal.issuer ? bondName : "XRP";
    console.log(`    ${bal.value} ${label}`);
  });
}

main();
