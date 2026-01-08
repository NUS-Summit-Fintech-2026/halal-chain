/**
 * Run All Tests
 *
 * Executes all test scripts in sequence
 *
 * Run: node src/app/tool/test/run_all_tests.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const tests = [
  'test_create_issuer_treasury.js',
  'test_tokenize_bond.js',
  'test_create_buyer.js',
  'test_retrieve_info.js',
  'test_buy_sell.js',
];

async function main() {
  console.log('='.repeat(60));
  console.log('Running All API Helper Tests');
  console.log('='.repeat(60));

  // Clean up previous test data
  const walletFile = path.join(__dirname, 'test_wallets.json');
  if (fs.existsSync(walletFile)) {
    fs.unlinkSync(walletFile);
    console.log('Cleaned up previous test_wallets.json\n');
  }

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${tests.length}] Running: ${test}`);
    console.log('='.repeat(60));

    try {
      execSync(`node ${path.join(__dirname, test)}`, {
        stdio: 'inherit',
      });
      console.log(`\n✓ ${test} completed`);
    } catch (error) {
      console.error(`\n✗ ${test} failed`);
      process.exit(1);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\nTest data saved to: test_wallets.json');
}

main().catch(console.error);
