/**
 * Test Script: Create Buyer
 *
 * Tests apiHelper.createBuyer()
 * Requires bond info from test_wallets.json
 *
 * Run: node src/app/tool/test/test_create_buyer.js
 */

const fs = require('fs');
const path = require('path');
const apiHelper = require('../apiHelper.js');

const WALLET_FILE = path.join(__dirname, 'test_wallets.json');

function loadWallets() {
  if (!fs.existsSync(WALLET_FILE)) {
    console.error('Error: test_wallets.json not found.');
    console.error('Run test_create_issuer_treasury.js and test_tokenize_bond.js first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
}

function saveWallets(data) {
  fs.writeFileSync(WALLET_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Test: Create Buyer');
  console.log('='.repeat(60));

  const wallets = loadWallets();

  if (!wallets.bond || !wallets.issuer) {
    console.error('Error: Bond or Issuer not found in test_wallets.json');
    console.error('Run test_tokenize_bond.js first.');
    process.exit(1);
  }

  console.log('Bond Code:', wallets.bond.bondCode);
  console.log('Currency Code:', wallets.bond.currencyCode);
  console.log('Issuer:', wallets.issuer.address);

  // Test: Create Buyer
  console.log('\n[1] Testing createBuyer()...');
  const buyerResult = await apiHelper.createBuyer(
    wallets.bond.currencyCode,
    wallets.issuer.address,
    wallets.bond.totalTokens
  );

  console.log('Response:', JSON.stringify(buyerResult, null, 2));

  if (!buyerResult.success) {
    console.error('FAILED: createBuyer()');
    process.exit(1);
  }
  console.log('PASSED: createBuyer()');

  // Save buyer info
  if (!wallets.buyers) {
    wallets.buyers = [];
  }

  const buyerEntry = {
    ...buyerResult.data,
    id: `buyer_${wallets.buyers.length + 1}`,
  };

  wallets.buyers.push(buyerEntry);
  wallets.updatedAt = new Date().toISOString();

  saveWallets(wallets);
  console.log('\n[2] Saved to:', WALLET_FILE);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Buyer ID:', buyerEntry.id);
  console.log('Buyer Address:', buyerResult.data.address);
  console.log('Trust Line:', JSON.stringify(buyerResult.data.trustLine));
  console.log('\nAll tests PASSED!');
}

main().catch(console.error);
