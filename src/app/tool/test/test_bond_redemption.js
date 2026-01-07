/**
 * Test Script: Bond Redemption
 *
 * Simulates bond maturity where:
 * 1. Issuer claws back tokens from buyer
 * 2. Issuer pays XRP to buyer (principal + profit)
 *
 * Run: node src/app/tool/test/test_bond_redemption.js
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
  console.log('Test: Bond Redemption (Maturity Payout)');
  console.log('='.repeat(60));
  console.log('Original Price:', PURCHASE_PRICE_PER_TOKEN, 'XRP/token');
  console.log('Redemption Price:', REDEMPTION_PRICE_PER_TOKEN, 'XRP/token');
  console.log('Profit:', ((REDEMPTION_PRICE_PER_TOKEN / PURCHASE_PRICE_PER_TOKEN - 1) * 100).toFixed(1) + '%');

  const wallets = loadWallets();

  if (!wallets.bond || !wallets.issuer || !wallets.buyers || wallets.buyers.length === 0) {
    console.error('Error: Missing required wallets.');
    process.exit(1);
  }

  const buyer = wallets.buyers[0];

  // Check buyer's token balance first
  console.log('\n[1] Checking buyer\'s current balance...');
  const balanceBefore = await apiHelper.getWalletBalances(buyer.address);

  if (!balanceBefore.success) {
    console.error('Failed to get balance:', balanceBefore.error);
    process.exit(1);
  }

  console.log('Buyer balances before redemption:');
  balanceBefore.data.balances.forEach(b => {
    console.log(`  ${b.value} ${b.currency}`);
  });

  // Find token balance
  const tokenBalance = balanceBefore.data.balances.find(
    b => b.currency === wallets.bond.currencyCode && b.issuer === wallets.issuer.address
  );

  if (!tokenBalance || parseFloat(tokenBalance.value) <= 0) {
    console.log('\nBuyer has no tokens to redeem.');
    console.log('Run test_buy_sell.js first to give buyer some tokens.');
    process.exit(0);
  }

  const tokensToRedeem = parseFloat(tokenBalance.value);
  const expectedPayout = tokensToRedeem * REDEMPTION_PRICE_PER_TOKEN;

  console.log('\n[2] Redemption details:');
  console.log('  Tokens to redeem:', tokensToRedeem);
  console.log('  XRP payout per token:', REDEMPTION_PRICE_PER_TOKEN);
  console.log('  Total XRP payout:', expectedPayout);

  // Check for open orders
  console.log('\n[3] Checking buyer\'s open orders...');
  const openOffers = await apiHelper.getOpenOffers(buyer.address);
  if (openOffers.success && openOffers.data.offers.length > 0) {
    console.log(`  Found ${openOffers.data.offers.length} open order(s) - will be cancelled`);
  } else {
    console.log('  No open orders');
  }

  // Perform redemption
  console.log('\n[4] Executing bond redemption...');
  console.log('    Step 1: Cancel buyer\'s open orders (if any)');
  console.log('    Step 2: Issuer claws back tokens from buyer');
  console.log('    Step 3: Treasury sends XRP payout to buyer');

  const result = await apiHelper.redeemBond({
    issuerSeed: wallets.issuer.seed,
    treasurySeed: wallets.treasury.seed,
    holderSeed: buyer.seed,
    holderAddress: buyer.address,
    currencyCode: wallets.bond.currencyCode,
    tokenAmount: tokensToRedeem,
    xrpPayoutPerToken: REDEMPTION_PRICE_PER_TOKEN,
    cancelOpenOrders: true,
  });

  if (!result.success) {
    console.error('\nRedemption FAILED:', result.error);
    console.log('\nNote: Clawback must be enabled on issuer BEFORE tokens are issued.');
    console.log('If you see "tecNO_PERMISSION", you need to recreate the issuer with clawback enabled.');
    process.exit(1);
  }

  console.log('\nRedemption SUCCESSFUL!');
  console.log('  Tokens reclaimed:', result.data.tokensRedeemed);
  console.log('  XRP paid:', result.data.totalXrpPayout);
  console.log('  Clawback Tx:', apiHelper.getTransactionUrl(result.data.clawbackTxHash));
  console.log('  Payment Tx:', apiHelper.getTransactionUrl(result.data.paymentTxHash));

  // Check buyer's balance after
  console.log('\n[4] Checking buyer\'s balance after redemption...');
  const balanceAfter = await apiHelper.getWalletBalances(buyer.address);

  console.log('Buyer balances after redemption:');
  balanceAfter.data.balances.forEach(b => {
    console.log(`  ${b.value} ${b.currency}`);
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('REDEMPTION SUMMARY');
  console.log('='.repeat(60));
  console.log('Buyer:', buyer.address);
  console.log('Tokens Redeemed:', tokensToRedeem);
  console.log('XRP Received:', expectedPayout);
  console.log('Profit per token:', (REDEMPTION_PRICE_PER_TOKEN - PURCHASE_PRICE_PER_TOKEN), 'XRP');
  console.log('Total Profit:', (tokensToRedeem * (REDEMPTION_PRICE_PER_TOKEN - PURCHASE_PRICE_PER_TOKEN)), 'XRP');
  console.log('\nBond redemption completed!');
}

main().catch(console.error);
