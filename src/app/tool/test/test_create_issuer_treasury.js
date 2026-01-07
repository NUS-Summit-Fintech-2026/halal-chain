/**
 * Test Script: Create Issuer and Treasury
 *
 * Tests apiHelper.createIssuer() and apiHelper.createTreasury()
 * Stores results in test_wallets.json
 *
 * Run: node src/app/tool/test/test_create_issuer_treasury.js
 */

const fs = require('fs');
const path = require('path');
const apiHelper = require('../apiHelper.js');

const WALLET_FILE = path.join(__dirname, 'test_wallets.json');

function loadWallets() {
  if (fs.existsSync(WALLET_FILE)) {
    return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
  }
  return {};
}

function saveWallets(data) {
  fs.writeFileSync(WALLET_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Test: Create Issuer and Treasury');
  console.log('='.repeat(60));

  const wallets = loadWallets();

  // Test 1: Create Issuer
  console.log('\n[1] Testing createIssuer()...');
  const issuerResult = await apiHelper.createIssuer();

  console.log('Response:', JSON.stringify(issuerResult, null, 2));

  if (!issuerResult.success) {
    console.error('FAILED: createIssuer()');
    process.exit(1);
  }
  console.log('PASSED: createIssuer()');

  // Test 2: Create Treasury
  console.log('\n[2] Testing createTreasury()...');
  const treasuryResult = await apiHelper.createTreasury();

  console.log('Response:', JSON.stringify(treasuryResult, null, 2));

  if (!treasuryResult.success) {
    console.error('FAILED: createTreasury()');
    process.exit(1);
  }
  console.log('PASSED: createTreasury()');

  // Save to JSON
  wallets.issuer = issuerResult.data;
  wallets.treasury = treasuryResult.data;
  wallets.updatedAt = new Date().toISOString();

  saveWallets(wallets);
  console.log('\n[3] Saved to:', WALLET_FILE);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Issuer Address:', issuerResult.data.address);
  console.log('Treasury Address:', treasuryResult.data.address);
  console.log('\nAll tests PASSED!');
}

main().catch(console.error);
