/**
 * Test Script: Retrieve Info
 *
 * Tests apiHelper.getWalletBalances() and apiHelper.getWalletTrustLines()
 * Retrieves info for all wallets in test_wallets.json
 *
 * Run: node src/app/tool/test/test_retrieve_info.js
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
  console.log('Test: Retrieve Wallet Info');
  console.log('='.repeat(60));

  const wallets = loadWallets();
  let allPassed = true;

  // Test 1: Get Issuer Balances
  if (wallets.issuer) {
    console.log('\n[1] Testing getWalletBalances() - Issuer...');
    const result = await apiHelper.getWalletBalances(wallets.issuer.address);

    if (result.success) {
      console.log('PASSED');
      console.log('Issuer Balances:', JSON.stringify(result.data.balances, null, 2));
    } else {
      console.log('FAILED:', result.error);
      allPassed = false;
    }
  }

  // Test 2: Get Treasury Balances
  if (wallets.treasury) {
    console.log('\n[2] Testing getWalletBalances() - Treasury...');
    const result = await apiHelper.getWalletBalances(wallets.treasury.address);

    if (result.success) {
      console.log('PASSED');
      console.log('Treasury Balances:', JSON.stringify(result.data.balances, null, 2));
    } else {
      console.log('FAILED:', result.error);
      allPassed = false;
    }

    console.log('\n[3] Testing getWalletTrustLines() - Treasury...');
    const trustResult = await apiHelper.getWalletTrustLines(wallets.treasury.address);

    if (trustResult.success) {
      console.log('PASSED');
      console.log('Treasury Trust Lines:', JSON.stringify(trustResult.data.trustLines, null, 2));
    } else {
      console.log('FAILED:', trustResult.error);
      allPassed = false;
    }
  }

  // Test 3: Get Buyer Balances
  if (wallets.buyers && wallets.buyers.length > 0) {
    for (let i = 0; i < wallets.buyers.length; i++) {
      const buyer = wallets.buyers[i];

      console.log(`\n[${4 + i * 2}] Testing getWalletBalances() - ${buyer.id}...`);
      const result = await apiHelper.getWalletBalances(buyer.address);

      if (result.success) {
        console.log('PASSED');
        console.log(`${buyer.id} Balances:`, JSON.stringify(result.data.balances, null, 2));
      } else {
        console.log('FAILED:', result.error);
        allPassed = false;
      }

      console.log(`\n[${5 + i * 2}] Testing getWalletTrustLines() - ${buyer.id}...`);
      const trustResult = await apiHelper.getWalletTrustLines(buyer.address);

      if (trustResult.success) {
        console.log('PASSED');
        console.log(`${buyer.id} Trust Lines:`, JSON.stringify(trustResult.data.trustLines, null, 2));
      } else {
        console.log('FAILED:', trustResult.error);
        allPassed = false;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  if (wallets.bond) {
    console.log('Bond Code:', wallets.bond.bondCode);
    console.log('Currency Code:', wallets.bond.currencyCode);
    console.log('Total Tokens:', wallets.bond.totalTokens);
  }

  console.log('\nWallets:');
  if (wallets.issuer) console.log('  Issuer:', wallets.issuer.address);
  if (wallets.treasury) console.log('  Treasury:', wallets.treasury.address);
  if (wallets.buyers) {
    wallets.buyers.forEach(b => console.log(`  ${b.id}:`, b.address));
  }

  // Explorer Links
  console.log('\n' + '='.repeat(60));
  console.log('EXPLORER LINKS');
  console.log('='.repeat(60));

  if (wallets.issuer) {
    console.log('\nIssuer:');
    console.log('  ', apiHelper.getExplorerUrl(wallets.issuer.address));
  }

  if (wallets.treasury) {
    console.log('\nTreasury:');
    console.log('  ', apiHelper.getExplorerUrl(wallets.treasury.address));
  }

  if (wallets.buyers) {
    wallets.buyers.forEach(b => {
      console.log(`\n${b.id}:`);
      console.log('  ', apiHelper.getExplorerUrl(b.address));
    });
  }

  console.log('\n' + (allPassed ? 'All tests PASSED!' : 'Some tests FAILED!'));
}

main().catch(console.error);
