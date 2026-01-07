/**
 * Test Script: Place Sell Orders
 *
 * Places multiple sell orders at HIGH prices so they won't be filled.
 * Orders will sit in the order book waiting for buyers.
 *
 * Run: node src/app/tool/test/test_place_sell_order.js
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
  console.log('Test: Place Sell Orders (High Prices - Won\'t Fill)');
  console.log('='.repeat(60));

  const wallets = loadWallets();

  if (!wallets.bond || !wallets.treasury || !wallets.issuer) {
    console.error('Error: Missing bond, treasury, or issuer.');
    process.exit(1);
  }

  console.log('Bond:', wallets.bond.bondCode);
  console.log('Treasury:', wallets.treasury.address);

  // Define sell orders at different HIGH prices (won't be filled)
  const sellOrders = [
    { tokenAmount: 100, pricePerToken: 0.10 },  // 0.10 XRP per token (high)
    { tokenAmount: 200, pricePerToken: 0.15 },  // 0.15 XRP per token (higher)
    { tokenAmount: 50, pricePerToken: 0.20 },   // 0.20 XRP per token (highest)
  ];

  console.log('\nPlacing sell orders at HIGH prices (won\'t fill immediately):');
  console.log('-----------------------------------------------------------');

  for (let i = 0; i < sellOrders.length; i++) {
    const order = sellOrders[i];
    console.log(`\n[${i + 1}] Placing sell order: ${order.tokenAmount} tokens @ ${order.pricePerToken} XRP each...`);

    const result = await apiHelper.sellTokens({
      sellerSeed: wallets.treasury.seed,
      currencyCode: wallets.bond.currencyCode,
      issuerAddress: wallets.issuer.address,
      tokenAmount: order.tokenAmount,
      pricePerToken: order.pricePerToken,
    });

    if (result.success) {
      console.log('    PLACED');
      console.log('    Total XRP wanted:', result.data.totalXrp);
      console.log('    Tx:', apiHelper.getTransactionUrl(result.data.txHash));
    } else {
      console.log('    FAILED:', result.error);
    }
  }

  // Verify order book
  console.log('\n' + '='.repeat(60));
  console.log('Verifying Order Book...');
  console.log('='.repeat(60));

  const orderBook = await apiHelper.getOrderBook(
    wallets.bond.currencyCode,
    wallets.issuer.address
  );

  if (orderBook.success) {
    console.log(`\nOpen Sell Orders: ${orderBook.data.sellCount}`);
    orderBook.data.sells.forEach((offer, i) => {
      console.log(`  [${i + 1}] ${offer.tokenAmount} tokens @ ${offer.pricePerToken.toFixed(4)} XRP/token`);
      console.log(`      Seller: ${offer.account}`);
    });

    console.log(`\nOpen Buy Orders: ${orderBook.data.buyCount}`);
    if (orderBook.data.buyCount === 0) {
      console.log('  No open buy orders');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Sell orders placed at high prices.');
  console.log('These will NOT fill until a buyer matches the price.');
  console.log('\nRun test_order_book.js to view all open orders.');
}

main().catch(console.error);
