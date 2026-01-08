const xrpl = require('xrpl');

// XRPL Testnet
const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

/**
 * Connect to XRPL Testnet
 */
async function connect() {
  const client = new xrpl.Client(TESTNET_URL);
  await client.connect();
  return client;
}

/**
 * Create and fund a new wallet on testnet
 * @param {Client} client - XRPL client
 * @param {string} amount - Ignored (faucet uses default amount ~100 XRP)
 */
async function createWallet(client, amount = null) {
  // Note: XRPL testnet faucet no longer accepts custom amounts
  // It provides ~100 XRP by default which is sufficient for testing
  const { wallet, balance } = await client.fundWallet();
  return {
    address: wallet.address,
    seed: wallet.seed,
    balance: balance,
    wallet: wallet,
  };
}

/**
 * Load wallet from seed
 */
function loadWallet(seed) {
  return xrpl.Wallet.fromSeed(seed);
}

/**
 * Configure issuer account settings for token issuance
 * Enables DefaultRipple flag which is required for token issuance
 * Optionally enables Clawback for bond redemption
 */
async function configureIssuerSettings(client, issuerWallet, enableClawback = true) {
  // Step 1: Enable DefaultRipple (required for token issuance)
  const defaultRippleSettings = {
    TransactionType: 'AccountSet',
    Account: issuerWallet.address,
    SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
  };

  const prepared1 = await client.autofill(defaultRippleSettings);
  const signed1 = issuerWallet.sign(prepared1);
  const result1 = await client.submitAndWait(signed1.tx_blob);

  if (result1.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Failed to enable DefaultRipple: ${result1.result.meta.TransactionResult}`);
  }
  console.log('DefaultRipple enabled');

  // Step 2: Enable Clawback (allows issuer to reclaim tokens at bond maturity)
  if (enableClawback) {
    const clawbackSettings = {
      TransactionType: 'AccountSet',
      Account: issuerWallet.address,
      SetFlag: xrpl.AccountSetAsfFlags.asfAllowTrustLineClawback,
    };

    const prepared2 = await client.autofill(clawbackSettings);
    const signed2 = issuerWallet.sign(prepared2);
    const result2 = await client.submitAndWait(signed2.tx_blob);

    if (result2.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Failed to enable Clawback: ${result2.result.meta.TransactionResult}`);
    }
    console.log('Clawback enabled (issuer can reclaim tokens at bond maturity)');
  }

  console.log('Issuer account configured for token issuance');
  return { defaultRipple: true, clawback: enableClawback };
}

/**
 * Clawback tokens from a holder (for bond redemption)
 * Issuer reclaims tokens from a specific holder
 */
async function clawbackTokens(client, issuerWallet, holderAddress, currencyCode, amount) {
  const clawback = {
    TransactionType: 'Clawback',
    Account: issuerWallet.address,
    Amount: {
      currency: currencyCode,
      issuer: holderAddress,  // Note: issuer field is the holder's address in clawback
      value: String(amount),
    },
  };

  const prepared = await client.autofill(clawback);
  const signed = issuerWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Clawback failed: ${result.result.meta.TransactionResult}`);
  }

  return {
    success: true,
    holder: holderAddress,
    amount: amount,
    txHash: result.result.hash,
  };
}

/**
 * Send XRP payment (for bond redemption payout)
 */
async function sendXrpPayment(client, senderWallet, destinationAddress, xrpAmount) {
  const payment = {
    TransactionType: 'Payment',
    Account: senderWallet.address,
    Destination: destinationAddress,
    Amount: xrpl.xrpToDrops(xrpAmount),
  };

  const prepared = await client.autofill(payment);
  const signed = senderWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`XRP payment failed: ${result.result.meta.TransactionResult}`);
  }

  return {
    success: true,
    destination: destinationAddress,
    xrpAmount: xrpAmount,
    txHash: result.result.hash,
  };
}

/**
 * Convert string to hex currency code (for custom tokens)
 * XRPL requires 40-character hex for custom currency codes
 */
function stringToHex(str) {
  let hex = Buffer.from(str, 'utf8').toString('hex').toUpperCase();
  // Pad to 40 characters (20 bytes)
  while (hex.length < 40) {
    hex += '0';
  }
  return hex;
}

/**
 * Tokenize a bond - creates a token on XRPL
 *
 * In XRPL, tokens are issued by:
 * 1. Setting up the issuer account
 * 2. Creating a currency code for the bond
 * 3. The total supply is controlled by how many tokens the issuer sends out
 *
 * @param {object} options
 * @param {xrpl.Client} options.client - Connected XRPL client
 * @param {xrpl.Wallet} options.issuerWallet - Issuer's wallet
 * @param {string} options.bondName - Name of the bond (will be converted to currency code)
 * @param {number} options.totalTokens - Total number of tokens to create
 * @param {string} options.treasuryAddress - Address to hold the initial tokens (optional, uses issuer if not provided)
 * @param {xrpl.Wallet} options.treasuryWallet - Treasury wallet to receive tokens
 */
async function tokenizeBond(options) {
  const { client, issuerWallet, bondName, totalTokens, treasuryWallet } = options;

  // Create currency code from bond name (max 3 chars for standard, or use hex for longer)
  let currencyCode;
  if (bondName.length <= 3) {
    currencyCode = bondName.toUpperCase().padEnd(3, 'X');
  } else {
    currencyCode = stringToHex(bondName.slice(0, 20)); // Max 20 chars for hex
  }

  console.log(`\nTokenizing bond: ${bondName}`);
  console.log(`Currency code: ${currencyCode}`);
  console.log(`Total tokens: ${totalTokens}`);
  console.log(`Issuer: ${issuerWallet.address}`);

  // Step 1: Configure issuer account if not already done
  try {
    await configureIssuerSettings(client, issuerWallet);
  } catch (e) {
    console.log('Issuer settings may already be configured:', e.message);
  }

  // Step 2: If treasury wallet provided, set up trust line and send tokens
  if (treasuryWallet) {
    console.log(`\nSetting up treasury: ${treasuryWallet.address}`);

    // Treasury needs to trust the issuer first
    const trustSet = {
      TransactionType: 'TrustSet',
      Account: treasuryWallet.address,
      LimitAmount: {
        currency: currencyCode,
        issuer: issuerWallet.address,
        value: String(totalTokens),
      },
    };

    const preparedTrust = await client.autofill(trustSet);
    const signedTrust = treasuryWallet.sign(preparedTrust);
    const trustResult = await client.submitAndWait(signedTrust.tx_blob);

    if (trustResult.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Trust line failed: ${trustResult.result.meta.TransactionResult}`);
    }
    console.log('Trust line established');

    // Send tokens from issuer to treasury
    const payment = {
      TransactionType: 'Payment',
      Account: issuerWallet.address,
      Destination: treasuryWallet.address,
      Amount: {
        currency: currencyCode,
        issuer: issuerWallet.address,
        value: String(totalTokens),
      },
    };

    const preparedPayment = await client.autofill(payment);
    const signedPayment = issuerWallet.sign(preparedPayment);
    const paymentResult = await client.submitAndWait(signedPayment.tx_blob);

    if (paymentResult.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Token transfer failed: ${paymentResult.result.meta.TransactionResult}`);
    }
    console.log(`${totalTokens} tokens sent to treasury`);
  }

  return {
    success: true,
    bondName,
    currencyCode,
    totalTokens,
    issuer: issuerWallet.address,
    treasury: treasuryWallet?.address || issuerWallet.address,
  };
}

/**
 * Get account balances including issued tokens
 */
async function getBalances(client, address) {
  const balances = await client.getBalances(address);
  return balances;
}

/**
 * Get trust lines for an account
 */
async function getTrustLines(client, address) {
  const response = await client.request({
    command: 'account_lines',
    account: address,
  });
  return response.result.lines;
}

/**
 * Set up trust line for an account to receive tokens
 */
async function setupTrustLine(client, wallet, currencyCode, issuerAddress, limit) {
  const trustSet = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: {
      currency: currencyCode,
      issuer: issuerAddress,
      value: String(limit),
    },
  };

  const prepared = await client.autofill(trustSet);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Trust line failed: ${result.result.meta.TransactionResult}`);
  }

  return result;
}

/**
 * Create a sell offer on XRPL DEX
 * Seller offers tokens in exchange for XRP
 */
async function createSellOffer(client, sellerWallet, currencyCode, issuerAddress, tokenAmount, xrpPricePerToken) {
  const totalXrp = tokenAmount * xrpPricePerToken;

  const offer = {
    TransactionType: 'OfferCreate',
    Account: sellerWallet.address,
    // What we're selling (tokens)
    TakerGets: {
      currency: currencyCode,
      issuer: issuerAddress,
      value: String(tokenAmount),
    },
    // What we want in return (XRP in drops)
    TakerPays: xrpl.xrpToDrops(totalXrp),
  };

  const prepared = await client.autofill(offer);
  const signed = sellerWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Sell offer failed: ${result.result.meta.TransactionResult}`);
  }

  return {
    type: 'SELL',
    tokenAmount,
    xrpTotal: totalXrp,
    pricePerToken: xrpPricePerToken,
    txHash: result.result.hash,
  };
}

/**
 * Create a buy offer on XRPL DEX
 * Buyer offers XRP in exchange for tokens
 */
async function createBuyOffer(client, buyerWallet, currencyCode, issuerAddress, tokenAmount, xrpPricePerToken) {
  const totalXrp = tokenAmount * xrpPricePerToken;

  const offer = {
    TransactionType: 'OfferCreate',
    Account: buyerWallet.address,
    // What we're paying (XRP in drops)
    TakerGets: xrpl.xrpToDrops(totalXrp),
    // What we want (tokens)
    TakerPays: {
      currency: currencyCode,
      issuer: issuerAddress,
      value: String(tokenAmount),
    },
  };

  const prepared = await client.autofill(offer);
  const signed = buyerWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Buy offer failed: ${result.result.meta.TransactionResult}`);
  }

  return {
    type: 'BUY',
    tokenAmount,
    xrpTotal: totalXrp,
    pricePerToken: xrpPricePerToken,
    txHash: result.result.hash,
  };
}

/**
 * Get open offers for an account
 */
async function getOffers(client, address) {
  const response = await client.request({
    command: 'account_offers',
    account: address,
  });
  return response.result.offers || [];
}

/**
 * Cancel an open offer
 */
async function cancelOffer(client, wallet, offerSequence) {
  const cancel = {
    TransactionType: 'OfferCancel',
    Account: wallet.address,
    OfferSequence: offerSequence,
  };

  const prepared = await client.autofill(cancel);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Cancel offer failed: ${result.result.meta.TransactionResult}`);
  }

  return {
    success: true,
    offerSequence: offerSequence,
    txHash: result.result.hash,
  };
}

/**
 * Cancel all open offers for an account
 */
async function cancelAllOffers(client, wallet) {
  const offers = await getOffers(client, wallet.address);
  const results = [];

  for (const offer of offers) {
    try {
      const result = await cancelOffer(client, wallet, offer.seq);
      results.push({ sequence: offer.seq, success: true, txHash: result.txHash });
    } catch (error) {
      results.push({ sequence: offer.seq, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Get order book for a token pair (Token <-> XRP)
 * Returns both buy and sell offers
 */
async function getOrderBook(client, currencyCode, issuerAddress) {
  // Get sell offers (people selling tokens for XRP)
  const sellResponse = await client.request({
    command: 'book_offers',
    taker_gets: {
      currency: currencyCode,
      issuer: issuerAddress,
    },
    taker_pays: {
      currency: 'XRP',
    },
    limit: 50,
  });

  // Get buy offers (people buying tokens with XRP)
  const buyResponse = await client.request({
    command: 'book_offers',
    taker_gets: {
      currency: 'XRP',
    },
    taker_pays: {
      currency: currencyCode,
      issuer: issuerAddress,
    },
    limit: 50,
  });

  return {
    sells: sellResponse.result.offers || [],
    buys: buyResponse.result.offers || [],
  };
}

module.exports = {
  connect,
  createWallet,
  loadWallet,
  configureIssuerSettings,
  tokenizeBond,
  getBalances,
  getTrustLines,
  setupTrustLine,
  createSellOffer,
  createBuyOffer,
  getOffers,
  getOrderBook,
  cancelOffer,
  cancelAllOffers,
  clawbackTokens,
  sendXrpPayment,
  stringToHex,
  TESTNET_URL,
};
