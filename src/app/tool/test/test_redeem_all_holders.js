/**
 * Test Script: Redeem Bond for All Holders
 *
 * Simulates bond maturity where issuer redeems tokens from ALL holders at once.
 * 1. Finds all token holders automatically
 * 2. Claws back tokens from each holder
 * 3. Pays XRP to each holder (principal + profit)
 *
 * Run: node src/app/tool/test/test_redeem_all_holders.js
 */

const fs = require('fs');
const path = require('path');
const apiHelper = require('../apiHelper.js');

const WALLET_FILE = path.join(__dirname, 'test_wallets.json');

// Bond terms
const PURCHASE_PRICE_PER_TOKEN = 0.01;  // Original price: 0.01 XRP/token
const REDEMPTION_PRICE_PER_TOKEN = 0.012; // Maturity payout: 0.012 XRP/token (20% profit)

function loadWallets() {
  if (!fs.existsSync(WALLET_FILE)) {
    console.error('Error: test_wallets.json not found.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Test: Redeem Bond for ALL Holders');
  console.log('='.repeat(60));
  console.log('Original Price:', PURCHASE_PRICE_PER_TOKEN, 'XRP/token');
  console.log('Redemption Price:', REDEMPTION_PRICE_PER_TOKEN, 'XRP/token');
  console.log('Profit:', ((REDEMPTION_PRICE_PER_TOKEN / PURCHASE_PRICE_PER_TOKEN - 1) * 100).toFixed(1) + '%');

  const wallets = loadWallets();

  if (!wallets.bond || !wallets.issuer || !wallets.treasury) {
    console.error('Error: Missing required wallets (bond, issuer, treasury).');
    process.exit(1);
  }

  console.log('\nBond:', wallets.bond.bondCode);
  console.log('Currency Code:', wallets.bond.currencyCode);
  console.log('Issuer:', wallets.issuer.address);
  console.log('Treasury:', wallets.treasury.address);

  // Build holderSeeds map (optional - for cancelling open orders)
  const holderSeeds = {};
  if (wallets.buyers) {
    wallets.buyers.forEach(buyer => {
      holderSeeds[buyer.address] = buyer.seed;
    });
  }

  console.log(holderSeeds)

  console.log('\n[1] Executing bond redemption for all holders...');
  console.log('    This will:');
  console.log('    - Find all token holders automatically');
  console.log('    - Cancel their open orders (if seeds provided)');
  console.log('    - Clawback tokens from each holder');
  console.log('    - Pay XRP to each holder');

  const result = await apiHelper.redeemBondForAllHolders({
    issuerSeed: wallets.issuer.seed,
    treasurySeed: wallets.treasury.seed,
    currencyCode: wallets.bond.currencyCode,
    xrpPayoutPerToken: REDEMPTION_PRICE_PER_TOKEN,
    holderSeeds: holderSeeds,
  });

  if (!result.success) {
    console.error('\nRedemption FAILED:', result.error);
    process.exit(1);
  }

  console.log('\n[2] Redemption Results:');
  console.log('='.repeat(60));

  if (result.data.holdersProcessed === 0) {
    console.log('No token holders found. Nothing to redeem.');
    console.log('Run test_buy_sell.js first to give buyers some tokens.');
    process.exit(0);
  }

  console.log('Holders processed:', result.data.holdersProcessed);
  console.log('Successful:', result.data.holdersSuccessful);
  console.log('Failed:', result.data.holdersFailed);
  console.log('Total tokens redeemed:', result.data.totalTokensRedeemed);
  console.log('Total XRP paid:', result.data.totalXrpPaid);

  console.log('\n[3] Individual Results:');
  result.data.results.forEach((r, i) => {
    console.log(`\n  Holder ${i + 1}: ${r.holder}`);
    if (r.success) {
      console.log(`    Status: SUCCESS`);
      console.log(`    Tokens: ${r.tokensRedeemed}`);
      console.log(`    XRP Paid: ${r.xrpPaid}`);
      console.log(`    Orders Cancelled: ${r.ordersCancelled}`);
      console.log(`    Clawback Tx: ${apiHelper.getTransactionUrl(r.clawbackTxHash)}`);
      console.log(`    Payment Tx: ${apiHelper.getTransactionUrl(r.paymentTxHash)}`);
    } else {
      console.log(`    Status: FAILED`);
      console.log(`    Error: ${r.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Bond:', wallets.bond.bondCode);
  console.log('Total Holders Redeemed:', result.data.holdersSuccessful);
  console.log('Total Tokens Reclaimed:', result.data.totalTokensRedeemed);
  console.log('Total XRP Distributed:', result.data.totalXrpPaid);
  console.log('\nBond redemption for all holders completed!');
}

main().catch(console.error);
