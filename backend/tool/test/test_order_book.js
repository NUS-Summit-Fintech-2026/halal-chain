/**
 * Test Script: Get Order Book
 *
 * Tests apiHelper.getOrderBook() to see open buy/sell offers
 *
 * Run: node src/app/tool/test/test_order_book.js
 */

const fs = require('fs');
const path = require('path');
const apiHelper = require('../apiHelper.js');

const WALLET_FILE = path.join(__dirname, 'test_wallets.json');

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
  console.log('Test: Get Order Book');
  console.log('='.repeat(60));

  const wallets = loadWallets();

  if (!wallets.bond || !wallets.issuer) {
    console.error('Error: Bond or Issuer not found.');
    process.exit(1);
  }

  console.log('Bond:', wallets.bond.bondCode);
  console.log('Currency:', wallets.bond.currencyCode);
  console.log('Issuer:', wallets.issuer.address);

  // Get order book
  console.log('\n[1] Fetching order book...');
  const result = await apiHelper.getOrderBook(
    wallets.bond.currencyCode,
    wallets.issuer.address
  );

  if (!result.success) {
    console.error('FAILED:', result.error);
    process.exit(1);
  }

  console.log('PASSED: getOrderBook()');

  // Display sell orders
  console.log('\n' + '='.repeat(60));
  console.log('SELL ORDERS (People selling tokens for XRP)');
  console.log('='.repeat(60));

  if (result.data.sells.length === 0) {
    console.log('No open sell orders');
  } else {
    console.log(`Found ${result.data.sellCount} sell order(s):\n`);
    result.data.sells.forEach((offer, i) => {
      console.log(`[${i + 1}] Seller: ${offer.account}`);
      console.log(`    Selling: ${offer.tokenAmount} tokens`);
      console.log(`    For: ${offer.xrpAmount} XRP`);
      console.log(`    Price: ${offer.pricePerToken.toFixed(6)} XRP/token`);
      console.log('');
    });
  }

  // Display buy orders
  console.log('='.repeat(60));
  console.log('BUY ORDERS (People buying tokens with XRP)');
  console.log('='.repeat(60));

  if (result.data.buys.length === 0) {
    console.log('No open buy orders');
  } else {
    console.log(`Found ${result.data.buyCount} buy order(s):\n`);
    result.data.buys.forEach((offer, i) => {
      console.log(`[${i + 1}] Buyer: ${offer.account}`);
      console.log(`    Buying: ${offer.tokenAmount} tokens`);
      console.log(`    Paying: ${offer.xrpAmount} XRP`);
      console.log(`    Price: ${offer.pricePerToken.toFixed(6)} XRP/token`);
      console.log('');
    });
  }

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Open Sell Orders:', result.data.sellCount);
  console.log('Open Buy Orders:', result.data.buyCount);
  console.log('Retrieved At:', result.data.retrievedAt);
}

main().catch(console.error);
