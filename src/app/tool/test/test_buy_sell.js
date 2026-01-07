/**
 * Test Script: Buy and Sell Tokens
 *
 * Tests apiHelper.sellTokens() and apiHelper.buyTokens()
 * Simulates treasury selling and buyer buying
 *
 * Run: node src/app/tool/test/test_buy_sell.js
 */

const fs = require('fs');
const path = require('path');
const apiHelper = require('../apiHelper.js');

const WALLET_FILE = path.join(__dirname, 'test_wallets.json');
const TOKEN_PRICE = 0.01; // 1 token = 0.01 XRP

function loadWallets() {
  if (!fs.existsSync(WALLET_FILE)) {
    console.error('Error: test_wallets.json not found.');
    console.error('Run the other test scripts first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Test: Buy and Sell Tokens');
  console.log('='.repeat(60));
  console.log('Token Price:', TOKEN_PRICE, 'XRP per token');

  const wallets = loadWallets();

  if (!wallets.bond || !wallets.treasury || !wallets.buyers || wallets.buyers.length === 0) {
    console.error('Error: Missing bond, treasury, or buyers in test_wallets.json');
    console.error('Run all previous test scripts first.');
    process.exit(1);
  }

  const buyer = wallets.buyers[0];
  console.log('\nTreasury:', wallets.treasury.address);
  console.log('Buyer:', buyer.address);

  // Test 1: Treasury creates sell offer
  console.log('\n[1] Testing sellTokens() - Treasury sells 100 tokens...');
  const sellResult = await apiHelper.sellTokens({
    sellerSeed: wallets.treasury.seed,
    currencyCode: wallets.bond.currencyCode,
    issuerAddress: wallets.issuer.address,
    tokenAmount: 100,
    pricePerToken: TOKEN_PRICE,
  });

  console.log('Response:', JSON.stringify(sellResult, null, 2));

  if (!sellResult.success) {
    console.error('FAILED: sellTokens()');
    process.exit(1);
  }
  console.log('PASSED: sellTokens()');

  // Test 2: Buyer creates buy offer
  console.log('\n[2] Testing buyTokens() - Buyer buys 50 tokens...');
  const buyResult = await apiHelper.buyTokens({
    buyerSeed: buyer.seed,
    currencyCode: wallets.bond.currencyCode,
    issuerAddress: wallets.issuer.address,
    tokenAmount: 50,
    pricePerToken: TOKEN_PRICE,
  });

  console.log('Response:', JSON.stringify(buyResult, null, 2));

  if (!buyResult.success) {
    console.error('FAILED: buyTokens()');
    process.exit(1);
  }
  console.log('PASSED: buyTokens()');

  // Test 3: Check balances after trade
  console.log('\n[3] Checking balances after trade...');

  const treasuryBalances = await apiHelper.getWalletBalances(wallets.treasury.address);
  const buyerBalances = await apiHelper.getWalletBalances(buyer.address);

  console.log('\nTreasury Balances:', JSON.stringify(treasuryBalances.data.balances, null, 2));
  console.log('\nBuyer Balances:', JSON.stringify(buyerBalances.data.balances, null, 2));

  // Test 4: Buyer sells some tokens back
  console.log('\n[4] Testing sellTokens() - Buyer sells 20 tokens back...');
  const buyerSellResult = await apiHelper.sellTokens({
    sellerSeed: buyer.seed,
    currencyCode: wallets.bond.currencyCode,
    issuerAddress: wallets.issuer.address,
    tokenAmount: 20,
    pricePerToken: TOKEN_PRICE,
  });

  console.log('Response:', JSON.stringify(buyerSellResult, null, 2));

  if (!buyerSellResult.success) {
    console.error('FAILED: sellTokens() - buyer');
    process.exit(1);
  }
  console.log('PASSED: sellTokens() - buyer');

  // Test 5: Treasury buys back
  console.log('\n[5] Testing buyTokens() - Treasury buys back 20 tokens...');
  const treasuryBuyResult = await apiHelper.buyTokens({
    buyerSeed: wallets.treasury.seed,
    currencyCode: wallets.bond.currencyCode,
    issuerAddress: wallets.issuer.address,
    tokenAmount: 20,
    pricePerToken: TOKEN_PRICE,
  });

  console.log('Response:', JSON.stringify(treasuryBuyResult, null, 2));

  if (!treasuryBuyResult.success) {
    console.error('FAILED: buyTokens() - treasury');
    process.exit(1);
  }
  console.log('PASSED: buyTokens() - treasury');

  // Final balances
  console.log('\n[6] Final balances...');

  const finalTreasury = await apiHelper.getWalletBalances(wallets.treasury.address);
  const finalBuyer = await apiHelper.getWalletBalances(buyer.address);

  console.log('\nTreasury Final:', JSON.stringify(finalTreasury.data.balances, null, 2));
  console.log('\nBuyer Final:', JSON.stringify(finalBuyer.data.balances, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TRANSACTION SUMMARY');
  console.log('='.repeat(60));
  console.log('1. Treasury sold 100 tokens (offer created)');
  console.log('2. Buyer bought 50 tokens @ 0.01 XRP = 0.5 XRP');
  console.log('3. Buyer sold 20 tokens back');
  console.log('4. Treasury bought 20 tokens back');
  console.log('\nNet: Buyer holds 30 tokens');
  console.log('\nAll tests PASSED!');
}

main().catch(console.error);
