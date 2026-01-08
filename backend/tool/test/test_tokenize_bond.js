/**
 * Test Script: Tokenize Bond
 *
 * Tests apiHelper.tokenizeBond()
 * Requires issuer and treasury from test_wallets.json
 *
 * Run: node src/app/tool/test/test_tokenize_bond.js
 */

const fs = require('fs');
const path = require('path');
const apiHelper = require('../apiHelper.js');

const WALLET_FILE = path.join(__dirname, 'test_wallets.json');

function loadWallets() {
  if (!fs.existsSync(WALLET_FILE)) {
    console.error('Error: test_wallets.json not found.');
    console.error('Run test_create_issuer_treasury.js first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
}

function saveWallets(data) {
  fs.writeFileSync(WALLET_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Test: Tokenize Bond');
  console.log('='.repeat(60));

  const wallets = loadWallets();

  if (!wallets.issuer || !wallets.treasury) {
    console.error('Error: Issuer or Treasury not found in test_wallets.json');
    process.exit(1);
  }

  console.log('Issuer:', wallets.issuer.address);
  console.log('Treasury:', wallets.treasury.address);

  // Test: Tokenize Bond
  console.log('\n[1] Testing tokenizeBond()...');
  const bondResult = await apiHelper.tokenizeBond({
    bondCode: 'TEST01',
    totalTokens: 100000,
    issuerSeed: wallets.issuer.seed,
    treasurySeed: wallets.treasury.seed,
  });

  console.log('Response:', JSON.stringify(bondResult, null, 2));

  if (!bondResult.success) {
    console.error('FAILED: tokenizeBond()');
    process.exit(1);
  }
  console.log('PASSED: tokenizeBond()');

  // Save bond info
  wallets.bond = bondResult.data;
  wallets.updatedAt = new Date().toISOString();

  saveWallets(wallets);
  console.log('\n[2] Saved to:', WALLET_FILE);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Bond Code:', bondResult.data.bondCode);
  console.log('Currency Code:', bondResult.data.currencyCode);
  console.log('Total Tokens:', bondResult.data.totalTokens);
  console.log('\nAll tests PASSED!');
}

main().catch(console.error);
