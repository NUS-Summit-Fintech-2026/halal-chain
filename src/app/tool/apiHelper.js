/**
 * XRPL API Helper
 *
 * Clean functions that return JSON data for database storage.
 * Uses xrpl.js internally for all XRPL operations.
 */

const xrplTool = require('./xrpl.js');

/**
 * Create an Issuer wallet
 *
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function createIssuer() {
  let client;

  try {
    client = await xrplTool.connect();
    const wallet = await xrplTool.createWallet(client);
    await xrplTool.configureIssuerSettings(client, wallet.wallet);

    return {
      success: true,
      data: {
        type: 'issuer',
        address: wallet.address,
        seed: wallet.seed,
        balance: wallet.balance,
        configured: true,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Create a Treasury wallet
 *
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function createTreasury() {
  let client;

  try {
    client = await xrplTool.connect();
    const wallet = await xrplTool.createWallet(client);

    return {
      success: true,
      data: {
        type: 'treasury',
        address: wallet.address,
        seed: wallet.seed,
        balance: wallet.balance,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Create a Buyer wallet with trust line
 *
 * @param {string} currencyCode - The token currency code
 * @param {string} issuerAddress - The issuer's address
 * @param {number} trustLimit - Maximum tokens buyer can hold
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function createBuyer(currencyCode, issuerAddress, trustLimit = 1000000) {
  let client;

  try {
    client = await xrplTool.connect();
    const wallet = await xrplTool.createWallet(client);
    await xrplTool.setupTrustLine(client, wallet.wallet, currencyCode, issuerAddress, trustLimit);

    return {
      success: true,
      data: {
        type: 'buyer',
        address: wallet.address,
        seed: wallet.seed,
        balance: wallet.balance,
        trustLine: {
          currencyCode: currencyCode,
          issuer: issuerAddress,
          limit: trustLimit,
        },
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Tokenize a bond - Issue tokens from issuer to treasury
 *
 * @param {object} params
 * @param {string} params.bondCode - Bond identifier (will become currency code)
 * @param {number} params.totalTokens - Number of tokens to create
 * @param {string} params.issuerSeed - Issuer wallet seed
 * @param {string} params.treasurySeed - Treasury wallet seed
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function tokenizeBond({ bondCode, totalTokens, issuerSeed, treasurySeed }) {
  let client;

  try {
    client = await xrplTool.connect();

    const issuerWallet = xrplTool.loadWallet(issuerSeed);
    const treasuryWallet = xrplTool.loadWallet(treasurySeed);

    const result = await xrplTool.tokenizeBond({
      client,
      issuerWallet,
      bondName: bondCode,
      totalTokens,
      treasuryWallet,
    });

    return {
      success: true,
      data: {
        bondCode: result.bondName,
        currencyCode: result.currencyCode,
        totalTokens: result.totalTokens,
        issuer: result.issuer,
        treasury: result.treasury,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Get wallet balances
 *
 * @param {string} address - Wallet address
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function getWalletBalances(address) {
  let client;

  try {
    client = await xrplTool.connect();
    const balances = await xrplTool.getBalances(client, address);

    return {
      success: true,
      data: {
        address: address,
        balances: balances.map(b => ({
          currency: b.currency,
          value: b.value,
          issuer: b.issuer || null,
        })),
        retrievedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Get wallet trust lines
 *
 * @param {string} address - Wallet address
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function getWalletTrustLines(address) {
  let client;

  try {
    client = await xrplTool.connect();
    const trustLines = await xrplTool.getTrustLines(client, address);

    return {
      success: true,
      data: {
        address: address,
        trustLines: trustLines.map(line => ({
          currency: line.currency,
          issuer: line.account,
          limit: line.limit,
          balance: line.balance,
        })),
        retrievedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Buy tokens - Create buy offer that matches against sell offers
 *
 * @param {object} params
 * @param {string} params.buyerSeed - Buyer wallet seed
 * @param {string} params.currencyCode - Token currency code
 * @param {string} params.issuerAddress - Token issuer address
 * @param {number} params.tokenAmount - Number of tokens to buy
 * @param {number} params.pricePerToken - Price in XRP per token
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function buyTokens({ buyerSeed, currencyCode, issuerAddress, tokenAmount, pricePerToken }) {
  let client;

  try {
    client = await xrplTool.connect();
    const buyerWallet = xrplTool.loadWallet(buyerSeed);

    const result = await xrplTool.createBuyOffer(
      client,
      buyerWallet,
      currencyCode,
      issuerAddress,
      tokenAmount,
      pricePerToken
    );

    return {
      success: true,
      data: {
        type: 'buy',
        buyer: buyerWallet.address,
        currencyCode: currencyCode,
        issuer: issuerAddress,
        tokenAmount: result.tokenAmount,
        pricePerToken: result.pricePerToken,
        totalXrp: result.xrpTotal,
        txHash: result.txHash,
        executedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Sell tokens - Create sell offer
 *
 * @param {object} params
 * @param {string} params.sellerSeed - Seller wallet seed
 * @param {string} params.currencyCode - Token currency code
 * @param {string} params.issuerAddress - Token issuer address
 * @param {number} params.tokenAmount - Number of tokens to sell
 * @param {number} params.pricePerToken - Price in XRP per token
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function sellTokens({ sellerSeed, currencyCode, issuerAddress, tokenAmount, pricePerToken }) {
  let client;

  try {
    client = await xrplTool.connect();
    const sellerWallet = xrplTool.loadWallet(sellerSeed);

    const result = await xrplTool.createSellOffer(
      client,
      sellerWallet,
      currencyCode,
      issuerAddress,
      tokenAmount,
      pricePerToken
    );

    return {
      success: true,
      data: {
        type: 'sell',
        seller: sellerWallet.address,
        currencyCode: currencyCode,
        issuer: issuerAddress,
        tokenAmount: result.tokenAmount,
        pricePerToken: result.pricePerToken,
        totalXrp: result.xrpTotal,
        txHash: result.txHash,
        executedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Get open offers for a wallet
 *
 * @param {string} address - Wallet address
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function getOpenOffers(address) {
  let client;

  try {
    client = await xrplTool.connect();
    const offers = await xrplTool.getOffers(client, address);

    return {
      success: true,
      data: {
        address: address,
        offers: offers,
        retrievedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) await client.disconnect();
  }
}

/**
 * Get XRPL Explorer URL for an address
 *
 * @param {string} address - Wallet address
 * @param {string} network - 'testnet' or 'mainnet' (default: 'testnet')
 * @returns {string} Explorer URL
 */
function getExplorerUrl(address, network = 'testnet') {
  const baseUrls = {
    testnet: 'https://testnet.xrpl.org/accounts',
    mainnet: 'https://xrpl.org/accounts',
  };

  const baseUrl = baseUrls[network] || baseUrls.testnet;
  return `${baseUrl}/${address}`;
}

/**
 * Get transaction explorer URL
 *
 * @param {string} txHash - Transaction hash
 * @param {string} network - 'testnet' or 'mainnet' (default: 'testnet')
 * @returns {string} Explorer URL
 */
function getTransactionUrl(txHash, network = 'testnet') {
  const baseUrls = {
    testnet: 'https://testnet.xrpl.org/transactions',
    mainnet: 'https://xrpl.org/transactions',
  };

  const baseUrl = baseUrls[network] || baseUrls.testnet;
  return `${baseUrl}/${txHash}`;
}

module.exports = {
  createIssuer,
  createTreasury,
  createBuyer,
  tokenizeBond,
  getWalletBalances,
  getWalletTrustLines,
  buyTokens,
  sellTokens,
  getOpenOffers,
  getExplorerUrl,
  getTransactionUrl,
  // Re-export utility from xrpl.js
  generateCurrencyCode: xrplTool.stringToHex,
  TESTNET_URL: xrplTool.TESTNET_URL,
};
