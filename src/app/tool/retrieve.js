/**
 * Retrieve Wallet Info Script
 *
 * This script loads saved wallet info and retrieves:
 * 1. Issuer wallet details and balances
 * 2. Treasury wallet details and balances
 * 3. Trust lines and token holdings
 *
 * Run: node src/app/tool/retrieve.js
 */

const fs = require('fs');
const path = require('path');
const xrplTool = require('./xrpl.js');

async function main() {
  console.log('='.repeat(60));
  console.log('XRPL Wallet Retrieval');
  console.log('='.repeat(60));

  // Load saved wallet info
  const walletPath = path.join(__dirname, 'bond_wallets.json');

  if (!fs.existsSync(walletPath)) {
    console.error('Error: bond_wallets.json not found.');
    console.error('Run issuer.js first to create wallets.');
    process.exit(1);
  }

  const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));

  console.log('\n[Loaded Wallet Info]');
  console.log('Created At:', walletInfo.createdAt);
  console.log('Bond Name:', walletInfo.bond.name);
  console.log('Currency Code:', walletInfo.bond.currencyCode);
  console.log('Total Tokens:', walletInfo.bond.totalTokens);

  let client;

  try {
    // Connect to XRPL
    console.log('\n[Connecting to XRPL Testnet...]');
    client = await xrplTool.connect();
    console.log('Connected:', xrplTool.TESTNET_URL);

    // Load wallets from seeds
    const issuerWallet = xrplTool.loadWallet(walletInfo.issuer.seed);
    const treasuryWallet = xrplTool.loadWallet(walletInfo.treasury.seed);

    // Retrieve Issuer Info
    console.log('\n' + '='.repeat(60));
    console.log('ISSUER WALLET');
    console.log('='.repeat(60));
    console.log('Address:', issuerWallet.address);
    console.log('Seed:', walletInfo.issuer.seed);

    const issuerBalances = await xrplTool.getBalances(client, issuerWallet.address);
    console.log('\nBalances:');
    issuerBalances.forEach(bal => {
      const issuerLabel = bal.issuer ? `(issuer: ${bal.issuer})` : '(native)';
      console.log(`  ${bal.value} ${bal.currency} ${issuerLabel}`);
    });

    const issuerTrustLines = await xrplTool.getTrustLines(client, issuerWallet.address);
    console.log('\nTrust Lines:', issuerTrustLines.length > 0 ? '' : 'None');
    issuerTrustLines.forEach(line => {
      console.log(`  ${line.currency}: limit=${line.limit}, balance=${line.balance}`);
    });

    // Retrieve Treasury Info
    console.log('\n' + '='.repeat(60));
    console.log('TREASURY WALLET');
    console.log('='.repeat(60));
    console.log('Address:', treasuryWallet.address);
    console.log('Seed:', walletInfo.treasury.seed);

    const treasuryBalances = await xrplTool.getBalances(client, treasuryWallet.address);
    console.log('\nBalances:');
    treasuryBalances.forEach(bal => {
      const issuerLabel = bal.issuer ? `(issuer: ${bal.issuer})` : '(native)';
      console.log(`  ${bal.value} ${bal.currency} ${issuerLabel}`);
    });

    const treasuryTrustLines = await xrplTool.getTrustLines(client, treasuryWallet.address);
    console.log('\nTrust Lines:');
    treasuryTrustLines.forEach(line => {
      console.log(`  ${line.currency}: limit=${line.limit}, balance=${line.balance}, issuer=${line.account}`);
    });

    // Retrieve Buyers Info
    let totalBuyerHoldings = 0;

    if (walletInfo.buyers && walletInfo.buyers.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('BUYER WALLETS');
      console.log('='.repeat(60));

      for (const buyerInfo of walletInfo.buyers) {
        const buyerWallet = xrplTool.loadWallet(buyerInfo.seed);

        console.log(`\n[${buyerInfo.id}]`);
        console.log('Address:', buyerWallet.address);
        console.log('Seed:', buyerInfo.seed);
        console.log('Created:', buyerInfo.createdAt || 'N/A');

        const buyerBalances = await xrplTool.getBalances(client, buyerWallet.address);
        console.log('\nBalances:');
        buyerBalances.forEach(bal => {
          const issuerLabel = bal.issuer ? `(issuer: ${bal.issuer})` : '(native)';
          console.log(`  ${bal.value} ${bal.currency} ${issuerLabel}`);
        });

        const buyerTrustLines = await xrplTool.getTrustLines(client, buyerWallet.address);
        console.log('\nTrust Lines:');
        buyerTrustLines.forEach(line => {
          console.log(`  ${line.currency}: limit=${line.limit}, balance=${line.balance}`);
        });

        // Track buyer token holdings
        const buyerTokenBalance = buyerBalances.find(
          b => b.currency === walletInfo.bond.currencyCode && b.issuer === issuerWallet.address
        );
        if (buyerTokenBalance) {
          totalBuyerHoldings += parseFloat(buyerTokenBalance.value);
        }
      }
    } else {
      console.log('\n[No buyers registered yet]');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const tokenBalance = treasuryBalances.find(
      b => b.currency === walletInfo.bond.currencyCode && b.issuer === issuerWallet.address
    );
    const treasuryHoldings = tokenBalance ? parseFloat(tokenBalance.value) : 0;

    console.log(`Bond: ${walletInfo.bond.name}`);
    console.log(`Currency Code: ${walletInfo.bond.currencyCode}`);
    console.log(`Total Issued: ${walletInfo.bond.totalTokens}`);
    console.log(`Treasury Holdings: ${treasuryHoldings}`);
    console.log(`Buyer Holdings: ${totalBuyerHoldings}`);
    console.log(`Tokens in Circulation: ${walletInfo.bond.totalTokens - treasuryHoldings}`);
    console.log(`Number of Buyers: ${walletInfo.buyers ? walletInfo.buyers.length : 0}`);

    // Explorer links
    console.log('\n[XRPL Testnet Explorer]');
    console.log(`Issuer: https://testnet.xrpl.org/accounts/${issuerWallet.address}`);
    console.log(`Treasury: https://testnet.xrpl.org/accounts/${treasuryWallet.address}`);
    if (walletInfo.buyers && walletInfo.buyers.length > 0) {
      walletInfo.buyers.forEach(buyer => {
        console.log(`${buyer.id}: https://testnet.xrpl.org/accounts/${buyer.address}`);
      });
    }

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
