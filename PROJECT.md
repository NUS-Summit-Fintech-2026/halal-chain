# Halal Chain - Project Documentation

## Deployment


**Live Application:**
- **Buyer Portal:** [https://halal-chain.vercel.app/login](https://halal-chain.vercel.app/login)
- **Admin Portal:** [https://halal-chain.vercel.app/admin/login](https://halal-chain.vercel.app/admin/login)

**XRPL Network:** Testnet (`wss://s.altnet.rippletest.net:51233`)

**XRPL Explorer:** [https://testnet.xrpl.org](https://testnet.xrpl.org)

---

## Project Overview

Halal Chain is a Shariah-compliant tokenization platform that leverages the XRP Ledger (XRPL) to enable fractional ownership and trading of Islamic bonds (Sukuk) and real-world assets. The platform provides a complete lifecycle from asset creation, tokenization, trading on XRPL's native DEX, to maturity redemption with automated clawback.

### Key Features

| Feature | Description | XRPL Technology Used |
|---------|-------------|---------------------|
| **Bond Tokenization** | Issue Sukuk bonds as fungible tokens | Token Issuance, TrustSet |
| **Real Asset Tokenization** | Tokenize real estate, commodities | Token Issuance, TrustSet |
| **Decentralized Trading** | Buy/sell tokens peer-to-peer | XRPL DEX (OfferCreate) |
| **Automated Redemption** | Bond maturity & asset realization | Clawback, Payment |
| **Wallet Management** | Auto-create funded wallets | Testnet Faucet |
| **Trust Lines** | Enable token holding | TrustSet Transaction |
| **Order Book** | Real-time market depth | book_offers API |
| **Charity Donations** | Zakat-compliant giving | XRP Payment |

---

## XRPL Features Implementation

### 1. Wallet Creation & Funding

**File:** `src/app/tool/xrpl.js` (lines 19-29)

**XRPL Feature:** Testnet Faucet (`client.fundWallet`)

```javascript
async function createWallet(client, amount = null) {
  const options = amount ? { amount: String(amount) } : undefined;
  const { wallet, balance } = await client.fundWallet(null, options);
  return {
    address: wallet.address,
    seed: wallet.seed,
    balance: balance,
    wallet: wallet,
  };
}
```

**How it works:**
- Uses XRPL testnet faucet to create and fund new wallets
- Issuer wallets receive 10,000 XRP for token operations
- Treasury wallets receive 1,000 XRP for holding tokens
- User wallets receive 1,000 XRP for trading

**Wallet Types:**
| Role | Purpose | Initial XRP |
|------|---------|-------------|
| ISSUER | Token issuance, clawback authority | 10,000 |
| TREASURY | Hold initial token supply, sell to buyers | 1,000 |
| USER | Trade tokens, receive redemption payouts | 1,000 |

---

### 2. Issuer Account Configuration

**File:** `src/app/tool/xrpl.js` (lines 43-80)

**XRPL Features:**
- `AccountSet` transaction
- `asfDefaultRipple` flag
- `asfAllowTrustLineClawback` flag

```javascript
async function configureIssuerSettings(client, issuerWallet, enableClawback = true) {
  // Enable DefaultRipple (required for token issuance)
  const defaultRippleSettings = {
    TransactionType: 'AccountSet',
    Account: issuerWallet.address,
    SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
  };

  // Enable Clawback (allows issuer to reclaim tokens at maturity)
  if (enableClawback) {
    const clawbackSettings = {
      TransactionType: 'AccountSet',
      Account: issuerWallet.address,
      SetFlag: xrpl.AccountSetAsfFlags.asfAllowTrustLineClawback,
    };
  }
}
```

**Why these flags:**
- **DefaultRipple**: Required for the issuer to send tokens to other accounts
- **AllowTrustLineClawback**: Enables bond redemption by allowing the issuer to reclaim tokens from holders

---

### 3. Token Issuance (Tokenization)

**File:** `src/app/tool/xrpl.js` (lines 169-246)

**XRPL Features:**
- Custom Currency Codes (3-char or 40-char hex)
- `TrustSet` transaction
- `Payment` transaction (token transfer)

```javascript
async function tokenizeBond(options) {
  const { client, issuerWallet, bondName, totalTokens, treasuryWallet } = options;

  // Create currency code (max 3 chars standard, or hex for longer names)
  let currencyCode;
  if (bondName.length <= 3) {
    currencyCode = bondName.toUpperCase().padEnd(3, 'X');
  } else {
    currencyCode = stringToHex(bondName.slice(0, 20));
  }

  // Treasury creates trust line to issuer
  const trustSet = {
    TransactionType: 'TrustSet',
    Account: treasuryWallet.address,
    LimitAmount: {
      currency: currencyCode,
      issuer: issuerWallet.address,
      value: String(totalTokens),
    },
  };

  // Issuer sends tokens to treasury
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
}
```

**Currency Code Format:**
- 3-character codes: `BND`, `SKK`, `AST` (standard format)
- Hex codes for longer names: 40-character hex string

**Tokenization Flow:**
```
1. Configure Issuer Account (DefaultRipple + Clawback)
           ↓
2. Treasury sets TrustLine to Issuer
           ↓
3. Issuer sends tokens to Treasury
           ↓
4. Treasury lists tokens for sale on DEX
```

---

### 4. Trust Line Management

**File:** `src/app/tool/apiHelper.js` (lines 89-137)

**XRPL Feature:** `TrustSet` transaction

```javascript
async function ensureTrustLine(walletSeed, currencyCode, issuerAddress, trustLimit = 1000000) {
  // Check if trust line already exists
  const trustLines = await xrplTool.getTrustLines(client, wallet.address);
  const existingTrustLine = trustLines.find(
    line => line.currency === currencyCode && line.account === issuerAddress
  );

  if (existingTrustLine) {
    return { success: true, data: { alreadyExists: true } };
  }

  // Set up new trust line
  await xrplTool.setupTrustLine(client, wallet, currencyCode, issuerAddress, trustLimit);
}
```

**Why Trust Lines:**
- XRPL requires explicit opt-in to hold non-XRP tokens
- Prevents spam tokens from being sent to unwilling recipients
- Sets maximum amount of tokens an account will hold

---

### 5. DEX Trading (OfferCreate)

**File:** `src/app/tool/xrpl.js` (lines 296-364)

**XRPL Feature:** `OfferCreate` transaction (XRPL's native DEX)

#### Sell Offer (Selling tokens for XRP)
```javascript
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
}
```

#### Buy Offer (Buying tokens with XRP)
```javascript
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
}
```

**DEX Mechanics:**
- Offers auto-match when prices overlap
- Partial fills are supported
- No intermediaries - trades execute on-ledger
- Order book is queried via `book_offers` command

---

### 6. Order Book Query

**File:** `src/app/tool/xrpl.js` (lines 425-456)

**XRPL Feature:** `book_offers` API command

```javascript
async function getOrderBook(client, currencyCode, issuerAddress) {
  // Get sell offers (Token → XRP)
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

  // Get buy offers (XRP → Token)
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
```

---

### 7. Clawback (Bond Redemption)

**File:** `src/app/tool/xrpl.js` (lines 86-111)

**XRPL Feature:** `Clawback` transaction

```javascript
async function clawbackTokens(client, issuerWallet, holderAddress, currencyCode, amount) {
  const clawback = {
    TransactionType: 'Clawback',
    Account: issuerWallet.address,
    Amount: {
      currency: currencyCode,
      issuer: holderAddress,  // Note: issuer field is the holder's address
      value: String(amount),
    },
  };

  const prepared = await client.autofill(clawback);
  const signed = issuerWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
}
```

**Why Clawback:**
- Enables bond maturity redemption
- Issuer reclaims tokens from all holders
- Followed by XRP payout to complete redemption

**Redemption Flow:**
```
1. Find all token holders (via account_lines)
           ↓
2. Cancel their open orders (OfferCancel)
           ↓
3. Clawback tokens from each holder
           ↓
4. Send XRP payout (principal + profit) to each holder
```

---

### 8. XRP Payment

**File:** `src/app/tool/xrpl.js` (lines 116-138)

**XRPL Feature:** `Payment` transaction

```javascript
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
}
```

**Used For:**
- Bond redemption payouts (principal + profit)
- Asset realization distributions
- Charity donations

---

### 9. Offer Cancellation

**File:** `src/app/tool/xrpl.js` (lines 380-419)

**XRPL Feature:** `OfferCancel` transaction

```javascript
async function cancelOffer(client, wallet, offerSequence) {
  const cancel = {
    TransactionType: 'OfferCancel',
    Account: wallet.address,
    OfferSequence: offerSequence,
  };
}

async function cancelAllOffers(client, wallet) {
  const offers = await getOffers(client, wallet.address);
  for (const offer of offers) {
    await cancelOffer(client, wallet, offer.seq);
  }
}
```

**Why Cancel Before Redemption:**
- Prevents holders from selling tokens during redemption
- Ensures all tokens can be clawed back
- Required before clawback for tokens in open orders

---

## Complete Workflow Examples

### Bond Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOND LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATE (Admin)                                               │
│     └── POST /api/bonds                                          │
│         ├── Creates Bond record in database                      │
│         ├── Creates ISSUER wallet (if not exists)               │
│         └── Creates TREASURY wallet (if not exists)             │
│                                                                  │
│  2. PUBLISH (Admin)                                              │
│     └── POST /api/bonds/code/[code]/publish                     │
│         ├── AccountSet: Enable DefaultRipple on Issuer          │
│         ├── AccountSet: Enable Clawback on Issuer               │
│         ├── TrustSet: Treasury trusts Issuer for token          │
│         ├── Payment: Issuer sends tokens to Treasury            │
│         └── OfferCreate: Treasury lists tokens for sale         │
│                                                                  │
│  3. TRADE (Buyers)                                               │
│     └── POST /api/xrpl/buy/[code]                               │
│         ├── TrustSet: Buyer trusts Issuer (if needed)           │
│         └── OfferCreate: Buyer places buy order                 │
│                                                                  │
│  4. REDEEM (Admin - Bond Maturity)                              │
│     └── POST /api/bonds/code/[code]/simulate-expired            │
│         ├── account_lines: Find all token holders               │
│         ├── OfferCancel: Cancel all holder open orders          │
│         ├── Clawback: Reclaim tokens from each holder           │
│         └── Payment: Send XRP payout to each holder             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Real Asset Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                   REAL ASSET LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATE → Same as Bond                                        │
│                                                                  │
│  2. PUBLISH → Same as Bond                                       │
│                                                                  │
│  3. TRADE → Same as Bond                                         │
│                                                                  │
│  4. REALIZE (Admin - Asset Sale)                                │
│     └── POST /api/realassets/code/[code]/simulate-realization   │
│         ├── Input: Total selling price of physical asset        │
│         ├── Calculate: XRP per token = sellingPrice / totalTokens│
│         ├── Clawback + Payment for each holder                  │
│         └── Update status to REALIZED                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contract Addresses (Wallet Addresses)

Since XRPL uses wallet addresses rather than smart contracts, here are the key system wallets:

| Role | Description | Network |
|------|-------------|---------|
| **ISSUER** | Token issuing authority with clawback rights | XRPL Testnet |
| **TREASURY** | Holds initial token supply, receives sales revenue | XRPL Testnet |

**Note:** Issuer and Treasury addresses are dynamically created when the first bond/asset is created. You can view them in the admin portal by clicking "View Issuer" or "View Treasury" buttons.

**View on XRPL Explorer:**
- Accounts: `https://testnet.xrpl.org/accounts/{address}`
- Transactions: `https://testnet.xrpl.org/transactions/{txHash}`

---

## XRPL Standards & Protocols Used

| Standard | Implementation | Purpose |
|----------|----------------|---------|
| **XLS-20d** | Token Issuance | Fungible token creation |
| **XLS-39d** | Clawback | Token recovery for redemption |
| **Native DEX** | OfferCreate/OfferCancel | Decentralized trading |
| **Trust Lines** | TrustSet | Token opt-in mechanism |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│                  (Next.js + React + Ant Design)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Admin Portal          │         Buyer Portal                  │
│   ─────────────         │         ────────────                  │
│   /admin/bonds          │         /marketplace                  │
│   /admin/assets         │         /asset-marketplace            │
│                         │         /trade/[id]                   │
│                         │         /portfolio                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                   │
│                  (Next.js API Routes)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   /api/bonds/*          │    /api/xrpl/*                        │
│   /api/realassets/*     │    /api/users/*                       │
│   /api/charity/*        │                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    DATABASE     │ │      XRPL       │ │    STORAGE      │
│   (PostgreSQL)  │ │    (Testnet)    │ │   (Supabase)    │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│                 │ │                 │ │                 │
│ - Bonds         │ │ - Wallet Ops    │ │ - Bond Docs     │
│ - Real Assets   │ │ - Token Ops     │ │ - Asset Images  │
│ - Users         │ │ - DEX Trading   │ │                 │
│ - Wallets       │ │ - Clawback      │ │                 │
│ - Charities     │ │                 │ │                 │
│                 │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Security Considerations

1. **Wallet Seeds**: Stored encrypted in database (production should use HSM/KMS)
2. **Clawback**: Only issuer can clawback, enabled at account creation
3. **Trust Lines**: Users must explicitly opt-in to hold tokens
4. **Reserve Requirements**: 10 XRP base reserve + 2 XRP per trust line/offer

---

## References

- [XRPL Documentation](https://xrpl.org/docs.html)
- [xrpl.js Library](https://js.xrpl.org/)
- [XRPL DEX Guide](https://xrpl.org/decentralized-exchange.html)
- [Token Issuance Guide](https://xrpl.org/issue-a-fungible-token.html)
- [Clawback Amendment](https://xrpl.org/clawback.html)
- [Trust Lines](https://xrpl.org/trust-lines-and-issuing.html)
