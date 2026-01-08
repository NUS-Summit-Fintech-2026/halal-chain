/**
 * XRPL API Helper
 *
 * Clean functions that return JSON data for database storage.
 * Uses xrpl.js internally for all XRPL operations.
 */

import * as xrplTool from './xrpl.js';

/**
 * Create an Issuer wallet
 *
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function createIssuer(enableClawback = true) {
  let client;

  try {
    client = await xrplTool.connect();
    const wallet = await xrplTool.createWallet(client);
    const settings = await xrplTool.configureIssuerSettings(client, wallet.wallet, enableClawback);

    return {
      success: true,
      data: {
        type: 'issuer',
        address: wallet.address,
        seed: wallet.seed,
        balance: wallet.balance,
        configured: true,
        clawbackEnabled: settings.clawback,
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
 * Clawback tokens from a holder (bond redemption - reclaim tokens)
 *
 * @param {object} params
 * @param {string} params.issuerSeed - Issuer wallet seed
 * @param {string} params.holderAddress - Token holder's address
 * @param {string} params.currencyCode - Token currency code
 * @param {number} params.amount - Amount of tokens to clawback
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function clawbackTokens({ issuerSeed, holderAddress, currencyCode, amount }) {
  let client;

  try {
    client = await xrplTool.connect();
    const issuerWallet = xrplTool.loadWallet(issuerSeed);

    const result = await xrplTool.clawbackTokens(
      client,
      issuerWallet,
      holderAddress,
      currencyCode,
      amount
    );

    return {
      success: true,
      data: {
        type: 'clawback',
        issuer: issuerWallet.address,
        holder: holderAddress,
        currencyCode: currencyCode,
        amount: amount,
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
 * Send XRP payment (for bond redemption payout)
 *
 * @param {object} params
 * @param {string} params.senderSeed - Sender wallet seed
 * @param {string} params.destinationAddress - Recipient address
 * @param {number} params.xrpAmount - Amount of XRP to send
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function sendXrpPayment({ senderSeed, destinationAddress, xrpAmount }) {
  let client;

  try {
    client = await xrplTool.connect();
    const senderWallet = xrplTool.loadWallet(senderSeed);

    const result = await xrplTool.sendXrpPayment(
      client,
      senderWallet,
      destinationAddress,
      xrpAmount
    );

    return {
      success: true,
      data: {
        type: 'xrp_payment',
        sender: senderWallet.address,
        destination: destinationAddress,
        xrpAmount: xrpAmount,
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
 * Cancel all open offers for a wallet
 *
 * @param {string} walletSeed - Wallet seed
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function cancelAllOffers(walletSeed) {
  let client;

  try {
    client = await xrplTool.connect();
    const wallet = xrplTool.loadWallet(walletSeed);

    const results = await xrplTool.cancelAllOffers(client, wallet);

    return {
      success: true,
      data: {
        address: wallet.address,
        cancelledCount: results.filter(r => r.success).length,
        failedCount: results.filter(r => !r.success).length,
        results: results,
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
 * Redeem bond - Clawback tokens and pay XRP to holder
 * Complete bond redemption process for a single holder
 *
 * Flow:
 * 1. (Optional) Cancel holder's open offers
 * 2. Issuer claws back tokens from holder (only issuer can clawback)
 * 3. Treasury pays XRP to holder (treasury has the sales revenue)
 *
 * @param {object} params
 * @param {string} params.issuerSeed - Issuer wallet seed (for clawback)
 * @param {string} params.treasurySeed - Treasury wallet seed (for XRP payment)
 * @param {string} params.holderSeed - Token holder's seed (for cancelling orders)
 * @param {string} params.holderAddress - Token holder's address
 * @param {string} params.currencyCode - Token currency code
 * @param {number} params.tokenAmount - Amount of tokens to redeem
 * @param {number} params.xrpPayoutPerToken - XRP payout per token (principal + profit)
 * @param {boolean} params.cancelOpenOrders - Whether to cancel holder's open orders first (default: true)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function redeemBond({ issuerSeed, treasurySeed, holderSeed, holderAddress, currencyCode, tokenAmount, xrpPayoutPerToken, cancelOpenOrders = true }) {
  let client;

  try {
    client = await xrplTool.connect();
    const issuerWallet = xrplTool.loadWallet(issuerSeed);
    const treasuryWallet = xrplTool.loadWallet(treasurySeed);
    const totalPayout = tokenAmount * xrpPayoutPerToken;

    let cancelResults = null;

    // Step 1: Cancel holder's open orders (if requested and seed provided)
    if (cancelOpenOrders && holderSeed) {
      const holderWallet = xrplTool.loadWallet(holderSeed);
      cancelResults = await xrplTool.cancelAllOffers(client, holderWallet);
    }

    // Step 2: Issuer claws back tokens from holder
    const clawbackResult = await xrplTool.clawbackTokens(
      client,
      issuerWallet,
      holderAddress,
      currencyCode,
      tokenAmount
    );

    // Step 3: Treasury sends XRP payout to holder
    const paymentResult = await xrplTool.sendXrpPayment(
      client,
      treasuryWallet,
      holderAddress,
      totalPayout
    );

    return {
      success: true,
      data: {
        type: 'bond_redemption',
        issuer: issuerWallet.address,
        treasury: treasuryWallet.address,
        holder: holderAddress,
        currencyCode: currencyCode,
        tokensRedeemed: tokenAmount,
        xrpPayoutPerToken: xrpPayoutPerToken,
        totalXrpPayout: totalPayout,
        ordersCancelled: cancelResults ? cancelResults.filter(r => r.success).length : 0,
        clawbackTxHash: clawbackResult.txHash,
        paymentTxHash: paymentResult.txHash,
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
 * Redeem bond for ALL holders of a specific token
 * Finds all token holders and performs redemption for each
 *
 * @param {object} params
 * @param {string} params.issuerSeed - Issuer wallet seed (for clawback)
 * @param {string} params.treasurySeed - Treasury wallet seed (for XRP payment)
 * @param {string} params.currencyCode - Token currency code
 * @param {number} params.xrpPayoutPerToken - XRP payout per token (principal + profit)
 * @param {object} params.holderSeeds - Optional: map of holderAddress -> seed (for cancelling orders)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function redeemBondForAllHolders({ issuerSeed, treasurySeed, currencyCode, xrpPayoutPerToken, holderSeeds = {} }) {
  let client;

  try {
    client = await xrplTool.connect();
    const issuerWallet = xrplTool.loadWallet(issuerSeed);
    const treasuryWallet = xrplTool.loadWallet(treasurySeed);

    // Step 1: Get all trust lines to the issuer for this currency
    const trustLines = await xrplTool.getTrustLines(client, issuerWallet.address);

    // Step 2: Filter to find holders with positive balance for this currency
    const holders = trustLines
      .filter(line => {
        const lineBalance = parseFloat(line.balance);
        // Trust line balance is negative from issuer's perspective when holder has tokens
        // So we look for negative balance (meaning holder has tokens)
        return line.currency === currencyCode && lineBalance < 0;
      })
      .map(line => ({
        address: line.account,
        // Negate because from issuer view, negative = holder has tokens
        tokenBalance: Math.abs(parseFloat(line.balance)),
      }));

    if (holders.length === 0) {
      return {
        success: true,
        data: {
          type: 'bond_redemption_all',
          currencyCode: currencyCode,
          holdersProcessed: 0,
          message: 'No token holders found',
          executedAt: new Date().toISOString(),
        },
      };
    }

    // Step 3: Process each holder
    const results = [];
    let totalTokensRedeemed = 0;
    let totalXrpPaid = 0;

    for (const holder of holders) {
      try {
        const holderSeed = holderSeeds[holder.address] || null;
        let cancelResults = null;

        // Cancel open orders if we have the holder's seed
        if (holderSeed) {
          const holderWallet = xrplTool.loadWallet(holderSeed);
          cancelResults = await xrplTool.cancelAllOffers(client, holderWallet);
        }

        // Clawback tokens
        const clawbackResult = await xrplTool.clawbackTokens(
          client,
          issuerWallet,
          holder.address,
          currencyCode,
          holder.tokenBalance
        );

        // Pay XRP to holder
        const xrpPayout = holder.tokenBalance * xrpPayoutPerToken;
        const paymentResult = await xrplTool.sendXrpPayment(
          client,
          treasuryWallet,
          holder.address,
          xrpPayout
        );

        totalTokensRedeemed += holder.tokenBalance;
        totalXrpPaid += xrpPayout;

        results.push({
          holder: holder.address,
          success: true,
          tokensRedeemed: holder.tokenBalance,
          xrpPaid: xrpPayout,
          ordersCancelled: cancelResults ? cancelResults.filter(r => r.success).length : 0,
          clawbackTxHash: clawbackResult.txHash,
          paymentTxHash: paymentResult.txHash,
        });
      } catch (error) {
        results.push({
          holder: holder.address,
          success: false,
          tokensRedeemed: 0,
          xrpPaid: 0,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      data: {
        type: 'bond_redemption_all',
        issuer: issuerWallet.address,
        treasury: treasuryWallet.address,
        currencyCode: currencyCode,
        xrpPayoutPerToken: xrpPayoutPerToken,
        holdersProcessed: holders.length,
        holdersSuccessful: results.filter(r => r.success).length,
        holdersFailed: results.filter(r => !r.success).length,
        totalTokensRedeemed: totalTokensRedeemed,
        totalXrpPaid: totalXrpPaid,
        results: results,
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
 * Get order book for a token (all open buy and sell offers)
 *
 * @param {string} currencyCode - Token currency code
 * @param {string} issuerAddress - Token issuer address
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function getOrderBook(currencyCode, issuerAddress) {
  let client;

  try {
    client = await xrplTool.connect();
    const orderBook = await xrplTool.getOrderBook(client, currencyCode, issuerAddress);

    // Parse sell offers
    const sells = orderBook.sells.map(offer => {
      const tokenAmount = typeof offer.TakerGets === 'object'
        ? parseFloat(offer.TakerGets.value)
        : parseFloat(offer.TakerGets) / 1000000;
      const xrpAmount = typeof offer.TakerPays === 'object'
        ? parseFloat(offer.TakerPays.value)
        : parseFloat(offer.TakerPays) / 1000000;

      return {
        account: offer.Account,
        tokenAmount: tokenAmount,
        xrpAmount: xrpAmount,
        pricePerToken: xrpAmount / tokenAmount,
        sequence: offer.Sequence,
      };
    });

    // Parse buy offers
    const buys = orderBook.buys.map(offer => {
      const xrpAmount = typeof offer.TakerGets === 'object'
        ? parseFloat(offer.TakerGets.value)
        : parseFloat(offer.TakerGets) / 1000000;
      const tokenAmount = typeof offer.TakerPays === 'object'
        ? parseFloat(offer.TakerPays.value)
        : parseFloat(offer.TakerPays) / 1000000;

      return {
        account: offer.Account,
        tokenAmount: tokenAmount,
        xrpAmount: xrpAmount,
        pricePerToken: xrpAmount / tokenAmount,
        sequence: offer.Sequence,
      };
    });

    return {
      success: true,
      data: {
        currencyCode: currencyCode,
        issuer: issuerAddress,
        sells: sells,
        buys: buys,
        sellCount: sells.length,
        buyCount: buys.length,
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

const generateCurrencyCode = xrplTool.stringToHex;
const TESTNET_URL = xrplTool.TESTNET_URL;

export {
  createIssuer,
  createTreasury,
  createBuyer,
  tokenizeBond,
  getWalletBalances,
  getWalletTrustLines,
  buyTokens,
  sellTokens,
  getOpenOffers,
  getOrderBook,
  cancelAllOffers,
  clawbackTokens,
  sendXrpPayment,
  redeemBond,
  redeemBondForAllHolders,
  getExplorerUrl,
  getTransactionUrl,
  generateCurrencyCode,
  TESTNET_URL,
};
