# Halal Chain

A Shariah-compliant tokenization platform built on XRPL (XRP Ledger) for bonds and real assets.

**Live Demo:**
- **Buyer Portal:** [https://halal-chain-six.vercel.app//login](https://halal-chain-six.vercel.app//login)
- **Admin Portal:** [https://halal-chain-six.vercel.app//admin/login](https://halal-chain-six.vercel.app//admin/login)

## Overview

Halal Chain enables the tokenization and trading of Sukuk (Islamic bonds) and real-world assets on the XRPL blockchain. The platform provides a complete lifecycle management system from asset creation to trading and redemption/realization.

### Key Features

- **Bond Tokenization**: Create and manage Shariah-compliant Sukuk bonds
- **Real Asset Tokenization**: Tokenize real-world assets (real estate, commodities, etc.)
- **XRPL DEX Integration**: Buy and sell tokens using XRPL's native decentralized exchange
- **Clawback-Enabled Redemption**: Automated bond maturity and asset realization
- **DID (Decentralized Identifier)**: Unique identifiers for users following `did:halal:*` format
- **Charity Integration**: Zakat-compliant donation system with transparent tracking

---

## Setup Guide

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Supabase recommended)
- Supabase account (for file storage)

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/halal-chain.git
cd halal-chain
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=halal-chain
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. Supabase Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `halal-chain`
3. Set the bucket to **Public**
4. Configure bucket policies to allow public read access

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Production Build

```bash
npm run build
npm start
```

---

## User Guide

### Admin Portal

The admin portal (`/admin/*`) provides management interfaces for bonds and real assets.

#### Bond Management (`/admin/bonds`)

1. **Create Bond**
   - Click "Create Bond" button
   - Fill in bond details: Name, Description, Code, Total Tokens, Profit Rate, Maturity Date
   - Optionally upload a document (PDF/Image)
   - Submit to create a draft bond

2. **Publish Bond**
   - Click "Publish" on a draft bond
   - Enter the initial price per token (in XRP)
   - The system will:
     - Create the token on XRPL
     - Configure issuer account with clawback enabled
     - Transfer tokens to treasury wallet
     - Create initial sell offer on XRPL DEX

3. **Simulate Expiration**
   - Click "Simulate Expiration" on a published bond
   - Enter principal per token (XRP value per token at maturity)
   - The system will:
     - Find all token holders
     - Cancel their open orders
     - Clawback tokens from each holder
     - Pay out XRP (principal + profit) to each holder

4. **View Wallets**
   - "View Issuer" - Opens XRPL explorer for the issuer wallet
   - "View Treasury" - Opens XRPL explorer for the treasury wallet

#### Real Asset Management (`/admin/assets`)

1. **Create Asset**
   - Click "Create Asset" button
   - Fill in: Name, Description, Code, Total Tokens, Expected Return Rate, Valuation
   - Upload asset image
   - Submit to create draft

2. **Publish Asset**
   - Same flow as bonds - creates token and initial sell offer

3. **Simulate Realization**
   - Enter total selling price (simulating asset sale)
   - System distributes proceeds proportionally to all token holders

---

### Buyer Portal

The buyer portal provides marketplace and trading interfaces for investors.

#### Registration/Login

1. Navigate to `/login`
2. Enter email to register/login
3. System creates XRPL wallet funded with testnet XRP
4. A DID is generated: `did:halal:user:[hash]`

#### Bond Marketplace (`/marketplace`)

1. Browse available published bonds
2. Click "View & Trade" to access trading page
3. View:
   - Bond details (name, maturity date, expected return)
   - Price chart
   - Order book (buy/sell offers)
   - Document (if available)

#### Asset Marketplace (`/asset-marketplace`)

1. Browse tokenized real assets with images
2. Click "View & Trade" to access trading page
3. Similar interface to bonds with asset-specific details

#### Trading (`/trade/[bondId]` or `/asset-trade/[assetId]`)

**Buying Tokens:**
1. Select "Buy" tab
2. Enter token amount and price per token
3. Confirm purchase
4. System:
   - Checks XRP balance
   - Sets up trust line if needed
   - Creates buy offer on XRPL DEX

**Selling Tokens:**
1. Select "Sell" tab
2. Enter token amount and price per token
3. Confirm sale
4. System creates sell offer on XRPL DEX


#### Charity Donations (`/charity`)

1. Browse verified charities
2. Click "Donate"
3. Enter XRP amount
4. Transaction is recorded on XRPL
5. View donation history and charity totals

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, Ant Design 6
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Blockchain**: XRPL (XRP Ledger) Testnet
- **File Storage**: Supabase Storage
- **Deployment**: Vercel

---

## License

MIT License
