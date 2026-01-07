/**
 * Issuer Test Script
 *
 * This script demonstrates how to:
 * 1. Create an issuer wallet
 * 2. Create a treasury wallet
 * 3. Tokenize a bond into tokens
 * 4. Verify the tokens are on XRPL testnet
 *
 * Run: node src/app/tool/issuer.js
 */

const xrplTool = require('./xrpl.js');

async function main() {
  console.log('='.repeat(60));
  console.log('XRPL Bond Tokenization Demo');
  console.log('='.repeat(60));

  let client;

  try {
    // Step 1: Connect to XRPL Testnet
    console.log('\n[1] Connecting to XRPL Testnet...');
    client = await xrplTool.connect();
    console.log('Connected to:', xrplTool.TESTNET_URL);

    // Step 2: Create Issuer Wallet
    console.log('\n[2] Creating Issuer Wallet...');
    const issuer = await xrplTool.createWallet(client);
    console.log('Issuer Address:', issuer.address);
    console.log('Issuer Seed:', issuer.seed);
    console.log('Issuer Balance:', issuer.balance, 'XRP');

    // Step 3: Create Treasury Wallet (holds the tokens for sale)
    console.log('\n[3] Creating Treasury Wallet...');
    const treasury = await xrplTool.createWallet(client);
    console.log('Treasury Address:', treasury.address);
    console.log('Treasury Seed:', treasury.seed);
    console.log('Treasury Balance:', treasury.balance, 'XRP');

    // Step 4: Tokenize a Bond
    console.log('\n[4] Tokenizing Bond...');
    const bondResult = await xrplTool.tokenizeBond({
      client,
      issuerWallet: issuer.wallet,
      bondName: 'HALAL01', // Bond name - will become currency code
      totalTokens: 1000000, // 1 million tokens
      treasuryWallet: treasury.wallet,
    });

    console.log('\n' + '='.repeat(60));
    console.log('TOKENIZATION COMPLETE');
    console.log('='.repeat(60));
    console.log('Bond Name:', bondResult.bondName);
    console.log('Currency Code:', bondResult.currencyCode);
    console.log('Total Tokens:', bondResult.totalTokens);
    console.log('Issuer:', bondResult.issuer);
    console.log('Treasury:', bondResult.treasury);

    // Step 5: Verify Balances
    console.log('\n[5] Verifying Balances...');

    const treasuryBalances = await xrplTool.getBalances(client, treasury.address);
    console.log('\nTreasury Balances:');
    treasuryBalances.forEach(bal => {
      console.log(`  ${bal.value} ${bal.currency} (issuer: ${bal.issuer || 'XRP'})`);
    });

    // Step 6: Save wallet info for future use
    const walletInfo = {
      testnetUrl: xrplTool.TESTNET_URL,
      bond: {
        name: bondResult.bondName,
        currencyCode: bondResult.currencyCode,
        totalTokens: bondResult.totalTokens,
      },
      issuer: {
        address: issuer.address,
        seed: issuer.seed,
      },
      treasury: {
        address: treasury.address,
        seed: treasury.seed,
      },
      createdAt: new Date().toISOString(),
    };

    console.log('\n[6] Wallet Info (save this for buyer.js):');
    console.log(JSON.stringify(walletInfo, null, 2));

    // Write to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'bond_wallets.json');
    fs.writeFileSync(outputPath, JSON.stringify(walletInfo, null, 2));
    console.log(`\nSaved to: ${outputPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('View on XRPL Testnet Explorer:');
    console.log(`Issuer: https://testnet.xrpl.org/accounts/${issuer.address}`);
    console.log(`Treasury: https://testnet.xrpl.org/accounts/${treasury.address}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    if (client) {
      await client.disconnect();
      console.log('\nDisconnected from XRPL');
    }
  }
}

main();
