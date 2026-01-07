/**
 * Test Script: Place Buy Orders
 *
 * Places multiple buy orders at LOW prices so they won't be filled.
 * Orders will sit in the order book waiting for sellers.
 *
 * Run: node src/app/tool/test/test_place_buy_order.js
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
  console.log('Test: Place Buy Orders (Low Prices - Won\'t Fill)');
  console.log('='.repeat(60));

  const wallets = loadWallets();

  if (!wallets.bond || !wallets.buyers || wallets.buyers.length === 0 || !wallets.issuer) {
    console.error('Error: Missing bond, buyers, or issuer.');
    process.exit(1);
  }

  const buyer = wallets.buyers[0];

  console.log('Bond:', wallets.bond.bondCode);
  console.log('Buyer:', buyer.address);

  // Define buy orders at different LOW prices (won't be filled)
  const buyOrders = [
    { tokenAmount: 50, pricePerToken: 0.001 },   // 0.001 XRP per token (very low)
    { tokenAmount: 100, pricePerToken: 0.002 },  // 0.002 XRP per token (low)
    { tokenAmount: 30, pricePerToken: 0.003 },   // 0.003 XRP per token (still low)
  ];

  console.log('\nPlacing buy orders at LOW prices (won\'t fill immediately):');
  console.log('-----------------------------------------------------------');

  for (let i = 0; i < buyOrders.length; i++) {
    const order = buyOrders[i];
    console.log(`\n[${i + 1}] Placing buy order: ${order.tokenAmount} tokens @ ${order.pricePerToken} XRP each...`);

    const result = await apiHelper.buyTokens({
      buyerSeed: buyer.seed,
      currencyCode: wallets.bond.currencyCode,
      issuerAddress: wallets.issuer.address,
      tokenAmount: order.tokenAmount,
      pricePerToken: order.pricePerToken,
    });

    if (result.success) {
      console.log('    PLACED');
      console.log('    Total XRP offering:', result.data.totalXrp);
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
    if (orderBook.data.sellCount === 0) {
      console.log('  No open sell orders');
    } else {
      orderBook.data.sells.forEach((offer, i) => {
        console.log(`  [${i + 1}] ${offer.tokenAmount} tokens @ ${offer.pricePerToken.toFixed(4)} XRP/token`);
      });
    }

    console.log(`\nOpen Buy Orders: ${orderBook.data.buyCount}`);
    orderBook.data.buys.forEach((offer, i) => {
      console.log(`  [${i + 1}] ${offer.tokenAmount} tokens @ ${offer.pricePerToken.toFixed(4)} XRP/token`);
      console.log(`      Buyer: ${offer.account}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Buy orders placed at low prices.');
  console.log('These will NOT fill until a seller matches the price.');
  console.log('\nRun test_order_book.js to view all open orders.');
}

main().catch(console.error);
